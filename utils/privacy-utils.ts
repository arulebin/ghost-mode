export function generateSessionId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

export function hashFingerprint(data: unknown): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    /* eslint-disable-next-line no-bitwise */
    hash = (hash << 5) - hash + chr
    /* eslint-disable-next-line no-bitwise */
    hash |= 0 // Convert to 32-bit integer
  }
  return hash.toString(36)
}

export function calculateEntropy(values: number[]): number {
  const counts = new Map<number, number>()
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1))

  let entropy = 0
  const total = values.length

  counts.forEach((count) => {
    const p = count / total
    entropy -= p * Math.log2(p)
  })

  return entropy
}

export function isTrackingDomain(domain: string): boolean {
  const trackers = [
    "doubleclick.net",
    "google-analytics.com",
    "googletagmanager.com",
    "facebook.com",
    "connect.facebook.net",
    "amazon-adsystem.com",
    "googlesyndication.com",
    "adsystem.amazon.com",
  ]
  return trackers.some((t) => domain.includes(t))
}

export function estimatePrivacyRisk(trackerData: any[]): number {
  if (trackerData.length === 0) return 0

  const factors: Record<string, number> = {
    canvas: 0.8,
    webgl: 0.7,
    audio: 0.6,
    fingerprint: 0.9,
    analytics: 0.3,
    advertising: 0.5,
  }

  let totalRisk = 0
  let totalWeight = 0

  trackerData.forEach((t) => {
    const base = factors[t.type] ?? 0.5
    const freq = Math.min(t.frequency ?? 1, 10)
    totalRisk += base * freq
    totalWeight += freq
  })

  return totalWeight ? (totalRisk / totalWeight) * 100 : 0
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

/**
 * Aggregate export so existing `PrivacyUtils.*` usage keeps working
 * without requiring instantiation.
 */
export const PrivacyUtils = {
  generateSessionId,
  hashFingerprint,
  calculateEntropy,
  isTrackingDomain,
  estimatePrivacyRisk,
  formatBytes,
  debounce,
} as const
