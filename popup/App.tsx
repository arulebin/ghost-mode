"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Shield, Eye, Settings, TrendingUp, AlertTriangle } from "lucide-react"
import type { PrivacyScore, TrackerData } from "../types/privacy"
import PrivacyDashboard from "./components/PrivacyDashboard"
import TrackerList from "./components/TrackerList"
import SettingsPanel from "./components/SettingsPanel"
import ThreatVisualizer from "./components/ThreatVisualizer"

function App() {
  const [privacyScore, setPrivacyScore] = useState<PrivacyScore>({
    score: 100,
    trackersBlocked: 0,
    fingerprintingAttempts: 0,
    dataPointsProtected: 0,
  })

  const [trackerData, setTrackerData] = useState<TrackerData[]>([])
  const [apiResult, setApiResult] = useState<any>(null)
  const [isEnabled, setIsEnabled] = useState(true)
  const [currentTab, setCurrentTab] = useState("dashboard")

  useEffect(() => {
    loadPrivacyData()
    const interval = setInterval(loadPrivacyData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadPrivacyData = async () => {
    try {
      if (typeof window.chrome !== "undefined" && window.chrome.tabs && window.chrome.runtime) {
        const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })
        if (tab?.id) {
          const score = await window.chrome.runtime.sendMessage({ type: "GET_PRIVACY_SCORE", tabId: tab.id })
          const trackers = await window.chrome.runtime.sendMessage({ type: "GET_TRACKER_DATA", tabId: tab.id })
          chrome.storage.local.get(`privacyResult-${tab.id}`, (data) => {
            const result = data[`privacyResult-${tab.id}`]
            if (result) setApiResult(result)
          })
          setPrivacyScore(score || privacyScore)
          setTrackerData(trackers || [])
        }
      } else {
        console.log("Chrome APIs not available - using mock data")
        setPrivacyScore({ score: 85, trackersBlocked: 12, fingerprintingAttempts: 3, dataPointsProtected: 45 })
        setTrackerData([
          {
            domain: "google-analytics.com",
            type: "analytics",
            riskLevel: "medium",
            timestamp: Date.now() - 1000,
            details: { method: "track" },
            estimatedRevenue: 0.05,
          },
          {
            domain: "facebook.com",
            type: "fingerprint",
            riskLevel: "high",
            timestamp: Date.now() - 2000,
            details: { method: "canvas" },
            estimatedRevenue: 0.12,
          },
        ])
        setApiResult({
          privacy_risk_score: 68.32,
          malicious_probability: 0.63,
          confidence_level: 0.87,
          tracking_intensity: "medium",
          primary_threats: ["tracking", "malware"],
        })
      }
    } catch (error) {
      console.error("Failed to load privacy data:", error)
    }
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score > 80) return "default"
    if (score > 50) return "secondary"
    return "destructive"
  }

  return (
    <div className="w-96 max-h-screen bg-background overflow-auto">
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-lg font-bold">GhostMode</h1>
          </div>
          <Badge variant={getScoreBadgeVariant(privacyScore.score)} className="text-sm">
            {privacyScore.score}/100
          </Badge>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Privacy Protection</span>
            <span>{privacyScore.score}%</span>
          </div>
          <Progress value={privacyScore.score} className="mt-1 h-2 bg-white/20" />
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-4 m-2">
          <TabsTrigger value="dashboard" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="trackers" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Trackers
          </TabsTrigger>
          <TabsTrigger value="visualizer" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="px-4 pb-4 overflow-y-auto max-h-[500px]">
          <TabsContent value="dashboard" className="mt-2">
            <PrivacyDashboard
              privacyScore={privacyScore}
              trackerData={trackerData}
              apiResult={apiResult}
              isEnabled={isEnabled}
              onToggle={setIsEnabled}
            />
          </TabsContent>

          <TabsContent value="trackers" className="mt-2">
            <TrackerList trackerData={trackerData} />
          </TabsContent>

          <TabsContent value="visualizer" className="mt-2">
            <ThreatVisualizer trackerData={trackerData} />
          </TabsContent>

          <TabsContent value="settings" className="mt-2">
            <SettingsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default App
