export interface TrackingEvent {
  type: "canvas" | "webgl" | "audio" | "fingerprint" | "analytics" | "advertising" | "pixel" | "script"
  url: string
  frequency: number
  details: any
  confidence: number
  timestamp?: number
}

export interface PrivacyScore {
  score: number
  trackersBlocked: number
  fingerprintingAttempts: number
  dataPointsProtected: number
}

export interface TrackerData {
  domain: string
  type: string
  riskLevel: "low" | "medium" | "high"
  timestamp: number
  details: any
  estimatedRevenue: number
}

export interface MLModelData {
  weights: number[][]
  biases: number[]
  architecture: {
    inputSize: number
    hiddenLayers: number[]
    outputSize: number
  }
}

export interface DetectionStats {
  totalDetections: number
  apiCallCounts: Record<string, number>
  recentDetections: any[]
}
