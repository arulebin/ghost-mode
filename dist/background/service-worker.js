var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class GhostModeBackground {
  constructor() {
    __publicField(this, "privacyScores", /* @__PURE__ */ new Map());
    __publicField(this, "trackerDatabase", /* @__PURE__ */ new Map());
    this.initializeListeners();
    this.loadMLModels();
  }
  initializeListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "TRACKING_DETECTED":
          this.handleTrackingEvent(message.data, sender.tab?.id);
          break;
        case "GET_PRIVACY_SCORE":
          this.getPrivacyScore(message.tabId).then(sendResponse);
          return true;
        case "GET_TRACKER_DATA":
          sendResponse(this.getTrackerData(message.tabId));
          break;
        case "UPDATE_SETTINGS":
          this.updateSettings(message.settings);
          break;
      }
    });
    chrome.webRequest.onBeforeRequest.addListener(this.analyzeRequest.bind(this), { urls: ["<all_urls>"] }, [
      "requestBody"
    ]);
    chrome.tabs.onActivated.addListener(async ({ tabId }) => {
      this.updateBadge(tabId);
      this.fetchPrivacyRiskScore(tabId);
    });
  }
  async loadMLModels() {
    try {
      const modelResponse = await fetch(chrome.runtime.getURL("ml/models/tracker-detector.json"));
      const modelData = await modelResponse.json();
      await chrome.storage.local.set({ "ml-model": modelData });
      console.log("ML models loaded successfully");
    } catch (error) {
      console.error("Failed to load ML models:", error);
    }
  }
  handleTrackingEvent(event, tabId) {
    if (!tabId) return;
    const domain = new URL(event.url).hostname;
    if (!this.trackerDatabase.has(domain)) {
      this.trackerDatabase.set(domain, []);
    }
    const trackerData = {
      domain,
      type: event.type,
      riskLevel: this.calculateRiskLevel(event),
      timestamp: Date.now(),
      details: event.details,
      estimatedRevenue: this.estimateAdRevenue(event)
    };
    this.trackerDatabase.get(domain)?.push(trackerData);
    this.updatePrivacyScore(tabId, trackerData);
    this.updateBadge(tabId);
  }
  calculateRiskLevel(event) {
    const riskFactors = {
      canvas: 0.8,
      webgl: 0.7,
      audio: 0.6,
      fingerprint: 0.9,
      analytics: 0.3,
      advertising: 0.5
    };
    const baseRisk = riskFactors[event.type] || 0.5;
    const frequencyMultiplier = Math.min(event.frequency / 10, 2);
    const finalRisk = baseRisk * frequencyMultiplier;
    if (finalRisk > 0.7) return "high";
    if (finalRisk > 0.4) return "medium";
    return "low";
  }
  estimateAdRevenue(event) {
    const baseValues = {
      canvas: 0.05,
      webgl: 0.03,
      audio: 0.02,
      fingerprint: 0.08,
      analytics: 0.01,
      advertising: 0.12
    };
    return (baseValues[event.type] || 0.01) * event.frequency;
  }
  updatePrivacyScore(tabId, trackerData) {
    const current = this.privacyScores.get(tabId.toString()) || {
      score: 100,
      trackersBlocked: 0,
      fingerprintingAttempts: 0,
      dataPointsProtected: 0
    };
    const penalty = trackerData.riskLevel === "high" ? 15 : trackerData.riskLevel === "medium" ? 8 : 3;
    current.score = Math.max(0, current.score - penalty);
    current.trackersBlocked += 1;
    if (trackerData.type === "fingerprint") {
      current.fingerprintingAttempts += 1;
    }
    current.dataPointsProtected += this.calculateDataPoints(trackerData);
    this.privacyScores.set(tabId.toString(), current);
  }
  calculateDataPoints(trackerData) {
    const dataPointValues = {
      canvas: 5,
      webgl: 4,
      audio: 3,
      fingerprint: 8,
      analytics: 2,
      advertising: 3
    };
    return dataPointValues[trackerData.type] || 1;
  }
  async getPrivacyScore(tabId) {
    return this.privacyScores.get(tabId.toString()) || {
      score: 100,
      trackersBlocked: 0,
      fingerprintingAttempts: 0,
      dataPointsProtected: 0
    };
  }
  getTrackerData(tabId) {
    const allTrackers = [];
    this.trackerDatabase.forEach((trackers) => {
      allTrackers.push(...trackers);
    });
    return allTrackers.slice(-50);
  }
  async updateBadge(tabId) {
    const score = await this.getPrivacyScore(tabId);
    const badgeText = score.score.toString();
    const badgeColor = score.score > 80 ? "#22c55e" : score.score > 50 ? "#f59e0b" : "#ef4444";
    chrome.action.setBadgeText({ text: badgeText, tabId });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
  }
  analyzeRequest(details) {
    new URL(details.url);
    const suspiciousPatterns = [
      /track|analytics|pixel|beacon/i,
      /facebook\.com\/tr/,
      /google-analytics\.com/,
      /doubleclick\.net/
    ];
    if (suspiciousPatterns.some((pattern) => pattern.test(details.url))) {
      chrome.tabs.sendMessage(details.tabId, {
        type: "SUSPICIOUS_REQUEST",
        data: {
          url: details.url,
          type: "network-tracking",
          timestamp: Date.now()
        }
      });
    }
    return void 0;
  }
  async updateSettings(settings) {
    await chrome.storage.sync.set({ ghostModeSettings: settings });
  }
  // 🔍 Collect metrics for ML API
  async collectMetrics(tabId) {
    const trackers = this.getTrackerData(tabId);
    const fingerprintingAttempts = trackers.filter((t) => t.type === "fingerprint").length;
    const popupFrequency = trackers.filter((t) => t.type === "popup").length;
    const encryptedRequestsRatio = 0.75;
    const externalScriptLoads = 3;
    const thirdPartyRequests = 10;
    const hiddenElementsCount = 2;
    const autoRedirects = 1;
    const evalUsageCount = 1;
    const suspiciousApiCalls = 2;
    const obfuscatedCodePercentage = 45.7;
    const dataSentSizeKb = 180.5;
    return {
      obfuscated_code_percentage: obfuscatedCodePercentage,
      suspicious_api_calls: suspiciousApiCalls,
      eval_usage_count: evalUsageCount,
      external_script_loads: externalScriptLoads,
      third_party_requests: thirdPartyRequests,
      tracking_domains_count: new Set(trackers.map((t) => t.domain)).size,
      data_sent_size_kb: dataSentSizeKb,
      encrypted_requests_ratio: encryptedRequestsRatio,
      hidden_elements_count: hiddenElementsCount,
      fingerprinting_attempts: fingerprintingAttempts,
      auto_redirects: autoRedirects,
      popup_frequency: popupFrequency
    };
  }
  // 🌐 Send metrics to ML API and save result
  async fetchPrivacyRiskScore(tabId) {
    const metrics = await this.collectMetrics(tabId);
    try {
      const response = await fetch("https://privacy-browser-api.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics)
      });
      const result = await response.json();
      await chrome.storage.local.set({ [`privacyResult-${tabId}`]: result });
      console.log("Fetched and stored ML privacy result:", result);
    } catch (error) {
      console.error("Failed to fetch privacy score from API:", error);
    }
  }
}
new GhostModeBackground();
