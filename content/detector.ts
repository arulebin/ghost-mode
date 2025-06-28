import * as tf from "@tensorflow/tfjs"

declare const chrome: any;

interface DetectionResult {
  type: string
  confidence: number
  details: any
  timestamp: number
}

class TrackingDetector {
  private model: tf.LayersModel | null = null
  private detectionBuffer: DetectionResult[] = []
  private apiCallCounts: Map<string, number> = new Map()

  constructor() {
    this.initializeDetector()
    this.setupAPIInterception()
  }

  private async initializeDetector() {
    try {
      // Load ML model from storage
      const result = await chrome.storage.local.get("ml-model")
      if (result["ml-model"]) {
        // Create a simple neural network for behavior analysis
        this.model = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [10], units: 16, activation: "relu" }),
            tf.layers.dense({ units: 8, activation: "relu" }),
            tf.layers.dense({ units: 4, activation: "sigmoid" }),
          ],
        })

        console.log("Tracking detection model initialized")
      }
    } catch (error) {
      console.error("Failed to initialize ML model:", error)
    }
  }

  private setupAPIInterception() {
    // Intercept Canvas API calls
    this.interceptCanvasAPI()

    // Intercept WebGL API calls
    this.interceptWebGLAPI()

    // Intercept Audio API calls
    this.interceptAudioAPI()

    // Monitor DOM manipulation
    this.monitorDOMManipulation()
  }

  private interceptCanvasAPI() {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData

    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const detection = {
        type: "canvas",
        confidence: 0.8,
        details: {
          method: "toDataURL",
          dimensions: `${this.width}x${this.height}`,
          url: window.location.href,
        },
        timestamp: Date.now(),
      }

      trackingDetector.recordDetection(detection)
      return originalToDataURL.apply(this, args)
    }

    CanvasRenderingContext2D.prototype.getImageData = function (...args) {
      const detection = {
        type: "canvas",
        confidence: 0.7,
        details: {
          method: "getImageData",
          coordinates: args.slice(0, 4),
          url: window.location.href,
        },
        timestamp: Date.now(),
      }

      trackingDetector.recordDetection(detection)
      return originalGetImageData.apply(this, args)
    }
  }

  private interceptWebGLAPI() {
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter

    WebGLRenderingContext.prototype.getParameter = function (pname) {
      // Get the debug extension to access renderer info constants
      const debugInfo = this.getExtension('WEBGL_debug_renderer_info');
      
      const suspiciousParams = [
        this.RENDERER,
        this.VENDOR,
        this.VERSION,
        this.SHADING_LANGUAGE_VERSION,
        debugInfo?.UNMASKED_RENDERER_WEBGL,
        debugInfo?.UNMASKED_VENDOR_WEBGL,
      ] as number[]

      if (suspiciousParams.includes(pname as number)) {
        const detection = {
          type: "webgl",
          confidence: 0.9,
          details: {
            parameter: pname,
            url: window.location.href,
          },
          timestamp: Date.now(),
        }

        trackingDetector.recordDetection(detection)
      }

      return originalGetParameter.call(this, pname)
    }
  }

  private interceptAudioAPI() {
    const originalCreateOscillator = AudioContext.prototype.createOscillator
    const originalCreateAnalyser = AudioContext.prototype.createAnalyser

    AudioContext.prototype.createOscillator = function () {
      const detection = {
        type: "audio",
        confidence: 0.6,
        details: {
          method: "createOscillator",
          sampleRate: this.sampleRate,
          url: window.location.href,
        },
        timestamp: Date.now(),
      }

      trackingDetector.recordDetection(detection)
      return originalCreateOscillator.call(this)
    }

    AudioContext.prototype.createAnalyser = function () {
      const detection = {
        type: "audio",
        confidence: 0.7,
        details: {
          method: "createAnalyser",
          url: window.location.href,
        },
        timestamp: Date.now(),
      }

      trackingDetector.recordDetection(detection)
      return originalCreateAnalyser.call(this)
    }
  }

  private monitorDOMManipulation() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element

              // Check for tracking pixels
              if (
                element.tagName === "IMG" &&
                (element.getAttribute("width") === "1" || element.getAttribute("height") === "1")
              ) {
                const detection = {
                  type: "pixel",
                  confidence: 0.8,
                  details: {
                    src: element.getAttribute("src"),
                    url: window.location.href,
                  },
                  timestamp: Date.now(),
                }

                this.recordDetection(detection)
              }

              // Check for suspicious scripts
              if (element.tagName === "SCRIPT") {
                const src = element.getAttribute("src")
                if (src && this.isSuspiciousScript(src)) {
                  const detection = {
                    type: "script",
                    confidence: 0.6,
                    details: {
                      src,
                      url: window.location.href,
                    },
                    timestamp: Date.now(),
                  }

                  this.recordDetection(detection)
                }
              }
            }
          })
        }
      })
    })

    observer.observe(document, {
      childList: true,
      subtree: true,
    })
  }

  private isSuspiciousScript(src: string): boolean {
    const suspiciousPatterns = [
      /google-analytics/,
      /googletagmanager/,
      /facebook\.net/,
      /doubleclick/,
      /adsystem/,
      /amazon-adsystem/,
    ]

    return suspiciousPatterns.some((pattern) => pattern.test(src))
  }

  private recordDetection(detection: DetectionResult) {
    this.detectionBuffer.push(detection)

    // Update API call counts
    const key = `${detection.type}-${detection.details.method || "unknown"}`
    this.apiCallCounts.set(key, (this.apiCallCounts.get(key) || 0) + 1)

    // Analyze with ML model if available
    if (this.model) {
      this.analyzeWithML(detection)
    }

    // Send to background script
    chrome.runtime.sendMessage({
      type: "TRACKING_DETECTED",
      data: {
        type: detection.type,
        url: window.location.href,
        frequency: this.apiCallCounts.get(key) || 1,
        details: detection.details,
        confidence: detection.confidence,
      },
    })

    // Keep buffer size manageable
    if (this.detectionBuffer.length > 100) {
      this.detectionBuffer = this.detectionBuffer.slice(-50)
    }
  }

  private async analyzeWithML(detection: DetectionResult) {
    if (!this.model) return

    try {
      // Create feature vector from detection data
      const features = this.createFeatureVector(detection)
      const prediction = this.model.predict(tf.tensor2d([features])) as tf.Tensor
      const result = await prediction.data()

      // Update confidence based on ML prediction
      detection.confidence = Math.max(detection.confidence, result[0])

      prediction.dispose()
    } catch (error) {
      console.error("ML analysis failed:", error)
    }
  }

  private createFeatureVector(detection: DetectionResult): number[] {
    // Create a 10-dimensional feature vector
    const features = new Array(10).fill(0)

    // Feature 0: Detection type (encoded)
    const typeMap = { canvas: 0.1, webgl: 0.2, audio: 0.3, pixel: 0.4, script: 0.5 }
    features[0] = typeMap[detection.type as keyof typeof typeMap] || 0

    // Feature 1: Time of day (normalized)
    features[1] = new Date().getHours() / 24

    // Feature 2: API call frequency
    const key = `${detection.type}-${detection.details.method || "unknown"}`
    features[2] = Math.min((this.apiCallCounts.get(key) || 1) / 10, 1)

    // Feature 3: Domain reputation (simplified)
    features[3] = this.getDomainReputation(window.location.hostname)

    // Features 4-9: Additional context features
    features[4] = detection.confidence
    features[5] = this.detectionBuffer.length / 100
    features[6] = window.location.protocol === "https:" ? 1 : 0
    features[7] = document.cookie.length / 1000
    features[8] = navigator.plugins.length / 10
    features[9] = (screen.width * screen.height) / 1000000

    return features
  }

  private getDomainReputation(domain: string): number {
    // Simplified domain reputation scoring
    const trustedDomains = ["google.com", "microsoft.com", "apple.com"]
    const suspiciousDomains = ["doubleclick.net", "facebook.com"]

    if (trustedDomains.some((d) => domain.includes(d))) return 0.9
    if (suspiciousDomains.some((d) => domain.includes(d))) return 0.1
    return 0.5
  }

  public getDetectionStats() {
    return {
      totalDetections: this.detectionBuffer.length,
      apiCallCounts: Object.fromEntries(this.apiCallCounts),
      recentDetections: this.detectionBuffer.slice(-10),
    }
  }
}

// Initialize detector
const trackingDetector = new TrackingDetector()

// Export for use in other content scripts
;(window as any).trackingDetector = trackingDetector
