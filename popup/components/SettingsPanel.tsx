"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Brain, Shield, Eye, Download, Upload } from "lucide-react"
import { chrome } from "global-chrome" // Declare the chrome variable

interface SettingsState {
  canvasNoise: boolean
  webglSpoofing: boolean
  audioDistortion: boolean
  userAgentRotation: boolean
  timezoneRandomization: boolean
  mlSensitivity: number
  blockingMode: "passive" | "aggressive"
  visualizationMode: boolean
}

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    canvasNoise: true,
    webglSpoofing: true,
    audioDistortion: true,
    userAgentRotation: false,
    timezoneRandomization: true,
    mlSensitivity: 70,
    blockingMode: "passive",
    visualizationMode: true,
  })

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.sync.get("ghostModeSettings")
        if (result.ghostModeSettings) {
          setSettings({ ...settings, ...result.ghostModeSettings })
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const saveSettings = async (newSettings: Partial<SettingsState>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.runtime) {
        await chrome.storage.sync.set({ ghostModeSettings: updatedSettings })

        // Notify background script of settings change
        chrome.runtime.sendMessage({
          type: "UPDATE_SETTINGS",
          settings: updatedSettings,
        })
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = "ghostmode-settings.json"
    link.click()

    URL.revokeObjectURL(url)
  }

  const importSettings = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedSettings = JSON.parse(e.target?.result as string)
            saveSettings(importedSettings)
          } catch (error) {
            console.error("Failed to import settings:", error)
          }
        }
        reader.readAsText(file)
      }
    }

    input.click()
  }

  const resetToDefaults = () => {
    const defaultSettings: SettingsState = {
      canvasNoise: true,
      webglSpoofing: true,
      audioDistortion: true,
      userAgentRotation: false,
      timezoneRandomization: true,
      mlSensitivity: 70,
      blockingMode: "passive",
      visualizationMode: true,
    }

    saveSettings(defaultSettings)
  }

  const updateMLModel = async () => {
    setIsLoading(true)
    try {
      // Simulate ML model update
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("ML model updated successfully")
    } catch (error) {
      console.error("Failed to update ML model:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Fingerprint Spoofing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Fingerprint Spoofing</CardTitle>
          </div>
          <CardDescription>Randomize browser fingerprints to prevent tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Canvas Noise</div>
              <div className="text-xs text-gray-600">Add noise to canvas rendering</div>
            </div>
            <Switch
              checked={settings.canvasNoise}
              onCheckedChange={(checked) => saveSettings({ canvasNoise: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">WebGL Spoofing</div>
              <div className="text-xs text-gray-600">Randomize GPU identifiers</div>
            </div>
            <Switch
              checked={settings.webglSpoofing}
              onCheckedChange={(checked) => saveSettings({ webglSpoofing: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Audio Distortion</div>
              <div className="text-xs text-gray-600">Alter audio fingerprints</div>
            </div>
            <Switch
              checked={settings.audioDistortion}
              onCheckedChange={(checked) => saveSettings({ audioDistortion: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">User Agent Rotation</div>
              <div className="text-xs text-gray-600">Rotate browser identity</div>
            </div>
            <Switch
              checked={settings.userAgentRotation}
              onCheckedChange={(checked) => saveSettings({ userAgentRotation: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Timezone Randomization</div>
              <div className="text-xs text-gray-600">Spoof timezone information</div>
            </div>
            <Switch
              checked={settings.timezoneRandomization}
              onCheckedChange={(checked) => saveSettings({ timezoneRandomization: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* ML Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">AI Detection</CardTitle>
          </div>
          <CardDescription>Configure machine learning detection sensitivity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Detection Sensitivity</span>
              <Badge variant="outline">{settings.mlSensitivity}%</Badge>
            </div>
            <Slider
              value={[settings.mlSensitivity]}
              onValueChange={([value]) => saveSettings({ mlSensitivity: value })}
              max={100}
              min={10}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Blocking Mode</div>
              <div className="text-xs text-gray-600">How aggressively to block trackers</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={settings.blockingMode === "passive" ? "default" : "outline"}
                size="sm"
                onClick={() => saveSettings({ blockingMode: "passive" })}
              >
                Passive
              </Button>
              <Button
                variant={settings.blockingMode === "aggressive" ? "default" : "outline"}
                size="sm"
                onClick={() => saveSettings({ blockingMode: "aggressive" })}
              >
                Aggressive
              </Button>
            </div>
          </div>

          <Button onClick={updateMLModel} disabled={isLoading} className="w-full bg-transparent" variant="outline">
            <Brain className="h-4 w-4 mr-2" />
            {isLoading ? "Updating Model..." : "Update ML Model"}
          </Button>
        </CardContent>
      </Card>

      {/* Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base">Visualization</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Real-time Visualization</div>
              <div className="text-xs text-gray-600">Show tracking attempts in real-time</div>
            </div>
            <Switch
              checked={settings.visualizationMode}
              onCheckedChange={(checked) => saveSettings({ visualizationMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={exportSettings} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={importSettings} variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>

          <Button onClick={resetToDefaults} variant="destructive" size="sm" className="w-full">
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPanel
