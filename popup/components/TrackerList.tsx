"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Search, DollarSign, Clock } from "lucide-react"
import type { TrackerData } from "../../types/privacy"

interface TrackerListProps {
  trackerData: TrackerData[]
}

const TrackerList: React.FC<TrackerListProps> = ({ trackerData }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"timestamp" | "risk" | "revenue">("timestamp")

  const filteredTrackers = trackerData
    .filter(
      (tracker) =>
        tracker.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tracker.type.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "risk":
          const riskOrder = { high: 3, medium: 2, low: 1 }
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
        case "revenue":
          return b.estimatedRevenue - a.estimatedRevenue
        default:
          return b.timestamp - a.timestamp
      }
    })

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "canvas":
      case "webgl":
      case "audio":
        return "🎨"
      case "fingerprint":
        return "👤"
      case "analytics":
        return "📊"
      case "advertising":
        return "📢"
      default:
        return "🔍"
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search trackers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortBy === "timestamp" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("timestamp")}
          >
            <Clock className="h-3 w-3 mr-1" />
            Recent
          </Button>
          <Button variant={sortBy === "risk" ? "default" : "outline"} size="sm" onClick={() => setSortBy("risk")}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            Risk
          </Button>
          <Button variant={sortBy === "revenue" ? "default" : "outline"} size="sm" onClick={() => setSortBy("revenue")}>
            <DollarSign className="h-3 w-3 mr-1" />
            Revenue
          </Button>
        </div>
      </div>

      {/* Tracker List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTrackers.length > 0 ? (
          filteredTrackers.map((tracker, index) => (
            <Card key={index} className="hover:bg-gray-50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(tracker.type)}</span>
                      <div className="font-medium text-sm truncate">{tracker.domain}</div>
                      <Badge variant={getRiskColor(tracker.riskLevel)} className="text-xs">
                        {tracker.riskLevel}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-600 mb-2">
                      <span className="capitalize">{tracker.type}</span> • {formatTimestamp(tracker.timestamp)}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Revenue blocked: ${tracker.estimatedRevenue.toFixed(3)}
                      </div>

                      {tracker.details && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <CardTitle className="text-base mb-2">No Trackers Found</CardTitle>
              <CardDescription>
                {searchTerm ? "No trackers match your search." : "No tracking attempts detected yet."}
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {filteredTrackers.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-red-600">
                  {filteredTrackers.filter((t) => t.riskLevel === "high").length}
                </div>
                <div className="text-xs text-gray-600">High Risk</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {filteredTrackers.filter((t) => t.riskLevel === "medium").length}
                </div>
                <div className="text-xs text-gray-600">Medium Risk</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {filteredTrackers.filter((t) => t.riskLevel === "low").length}
                </div>
                <div className="text-xs text-gray-600">Low Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TrackerList
