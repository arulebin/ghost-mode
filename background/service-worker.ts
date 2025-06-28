import type { TrackingEvent, PrivacyScore, TrackerData } from "../types/privacy"
// Chrome API is available globally in extension context

class GhostModeBackground {
  private privacyScores: Map<string, PrivacyScore> = new Map()
  private trackerDatabase: Map<string, TrackerData[]> = new Map()

  constructor() {
    this.initializeListeners()
    this.loadMLModels()
  }

  private initializeListeners() {
    // Listen for tracking events from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "TRACKING_DETECTED":
          this.handleTrackingEvent(message.data, sender.tab?.id)
          break
        case "GET_PRIVACY_SCORE":
          this.getPrivacyScore(message.tabId).then(sendResponse)
          return true
        case "GET_TRACKER_DATA":
          sendResponse(this.getTrackerData(message.tabId))
          break
        case "UPDATE_SETTINGS":
          this.updateSettings(message.settings)
          break
      }
    })

    // Monitor web requests for additional tracking detection
    chrome.webRequest.onBeforeRequest.addListener(this.analyzeRequest.bind(this), { urls: ["<all_urls>"] }, [
      "requestBody",
    ])

    // Update badge with privacy score
    chrome.tabs.onActivated.addListener(({ tabId }) => {
      this.updateBadge(tabId)
    })
  }

  private async loadMLModels() {
    try {
      // Load pre-trained models for tracking detection
      const modelResponse = await fetch(chrome.runtime.getURL("ml/models/tracker-detector.json"))
      const modelData = await modelResponse.json()

      // Store model in chrome.storage for content scripts
      await chrome.storage.local.set({ "ml-model": modelData })
      console.log("ML models loaded successfully")
    } catch (error) {
      console.error("Failed to load ML models:", error)
    }
  }

  private handleTrackingEvent(event: TrackingEvent, tabId?: number) {
    if (!tabId) return

    const domain = new URL(event.url).hostname

    // Update tracker database
    if (!this.trackerDatabase.has(domain)) {
      this.trackerDatabase.set(domain, [])
    }

    const trackerData: TrackerData = {
      domain,
      type: event.type,
      riskLevel: this.calculateRiskLevel(event),
      timestamp: Date.now(),
      details: event.details,
      estimatedRevenue: this.estimateAdRevenue(event),
    }

    this.trackerDatabase.get(domain)?.push(trackerData)

    // Update privacy score
    this.updatePrivacyScore(tabId, trackerData)

    // Update badge
    this.updateBadge(tabId)
  }

  private calculateRiskLevel(event: TrackingEvent): "low" | "medium" | "high" {
    const riskFactors = {
      canvas: 0.8,
      webgl: 0.7,
      audio: 0.6,
      fingerprint: 0.9,
      analytics: 0.3,
      advertising: 0.5,
    }

    const baseRisk = riskFactors[event.type as keyof typeof riskFactors] || 0.5
    const frequencyMultiplier = Math.min(event.frequency / 10, 2)
    const finalRisk = baseRisk * frequencyMultiplier

    if (finalRisk > 0.7) return "high"
    if (finalRisk > 0.4) return "medium"
    return "low"
  }

  private estimateAdRevenue(event: TrackingEvent): number {
    // Simple ML-based revenue estimation
    const baseValues = {
      canvas: 0.05,
      webgl: 0.03,
      audio: 0.02,
      fingerprint: 0.08,
      analytics: 0.01,
      advertising: 0.12,
    }

    return (baseValues[event.type as keyof typeof baseValues] || 0.01) * event.frequency
  }

  private updatePrivacyScore(tabId: number, trackerData: TrackerData) {
    const current = this.privacyScores.get(tabId.toString()) || {
      score: 100,
      trackersBlocked: 0,
      fingerprintingAttempts: 0,
      dataPointsProtected: 0,
    }

    const penalty = trackerData.riskLevel === "high" ? 15 : trackerData.riskLevel === "medium" ? 8 : 3

    current.score = Math.max(0, current.score - penalty)
    current.trackersBlocked += 1

    if (trackerData.type === "fingerprint") {
      current.fingerprintingAttempts += 1
    }

    current.dataPointsProtected += this.calculateDataPoints(trackerData)

    this.privacyScores.set(tabId.toString(), current)
  }

  private calculateDataPoints(trackerData: TrackerData): number {
    const dataPointValues = {
      canvas: 5,
      webgl: 4,
      audio: 3,
      fingerprint: 8,
      analytics: 2,
      advertising: 3,
    }

    return dataPointValues[trackerData.type as keyof typeof dataPointValues] || 1
  }

  private async getPrivacyScore(tabId: number): Promise<PrivacyScore> {
    return (
      this.privacyScores.get(tabId.toString()) || {
        score: 100,
        trackersBlocked: 0,
        fingerprintingAttempts: 0,
        dataPointsProtected: 0,
      }
    )
  }

  private getTrackerData(tabId: number): TrackerData[] {
    const allTrackers: TrackerData[] = []
    this.trackerDatabase.forEach((trackers) => {
      allTrackers.push(...trackers)
    })
    return allTrackers.slice(-50) // Return last 50 tracking attempts
  }

  private async updateBadge(tabId: number) {
    const score = await this.getPrivacyScore(tabId)
    const badgeText = score.score.toString()
    const badgeColor = score.score > 80 ? "#22c55e" : score.score > 50 ? "#f59e0b" : "#ef4444"

    chrome.action.setBadgeText({ text: badgeText, tabId })
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId })
  }

  private analyzeRequest(details: chrome.webRequest.OnBeforeRequestDetails) {
    // Analyze web requests for tracking patterns
    const url = new URL(details.url)
    const suspiciousPatterns = [
      /track|analytics|pixel|beacon/i,
      /facebook\.com\/tr/,
      /google-analytics\.com/,
      /doubleclick\.net/,
    ]

    if (suspiciousPatterns.some((pattern) => pattern.test(details.url))) {
      chrome.tabs.sendMessage(details.tabId, {
        type: "SUSPICIOUS_REQUEST",
        data: {
          url: details.url,
          type: "network-tracking",
          timestamp: Date.now(),
        },
      })
    }
    
    // Return undefined to indicate we're not blocking the request
    return undefined;
  }

  private async updateSettings(settings: any) {
    await chrome.storage.sync.set({ ghostModeSettings: settings })
  }
}

// Initialize background service
new GhostModeBackground()
