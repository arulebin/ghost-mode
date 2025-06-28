import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Shield, Eye, Brain, DollarSign } from "lucide-react"
import type { PrivacyScore, TrackerData } from "../../types/privacy"

interface PrivacyDashboardProps {
  privacyScore: PrivacyScore
  trackerData: TrackerData[]
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ privacyScore, trackerData, isEnabled, onToggle }) => {
  const totalRevenueSaved = trackerData.reduce((sum, tracker) => sum + tracker.estimatedRevenue, 0)
  const recentTrackers = trackerData.slice(-5)

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      default:
        return "text-green-600 bg-green-50"
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Protection Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${isEnabled ? "text-green-600" : "text-gray-400"}`} />
              <CardTitle className="text-base">Protection Status</CardTitle>
            </div>
            <Switch checked={isEnabled} onCheckedChange={onToggle} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">{privacyScore.trackersBlocked}</div>
              <div className="text-gray-600">Trackers Blocked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{privacyScore.dataPointsProtected}</div>
              <div className="text-gray-600">Data Points Protected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Detection Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">AI Detection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fingerprinting Attempts</span>
              <Badge variant="outline">{privacyScore.fingerprintingAttempts}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Blocked</span>
              <Badge variant="outline" className="text-green-600">
                <DollarSign className="h-3 w-3 mr-1" />${totalRevenueSaved.toFixed(2)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTrackers.length > 0 ? (
              recentTrackers.map((tracker, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{tracker.domain}</div>
                    <div className="text-xs text-gray-500 capitalize">{tracker.type}</div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getRiskColor(tracker.riskLevel)}`}>
                    {tracker.riskLevel}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">No tracking attempts detected</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
          <CardContent className="p-3 text-center">
            <Shield className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <div className="text-xs font-medium">Boost Protection</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
          <CardContent className="p-3 text-center">
            <Brain className="h-6 w-6 mx-auto mb-1 text-purple-600" />
            <div className="text-xs font-medium">Train AI</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PrivacyDashboard
