"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { TrackerData } from "../../types/privacy"
import * as d3 from "d3"

interface ThreatVisualizerProps {
  trackerData: TrackerData[]
}

const ThreatVisualizer: React.FC<ThreatVisualizerProps> = ({ trackerData }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || trackerData.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 320
    const height = 200
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }

    // Process data for network visualization
    const nodes = Array.from(new Set(trackerData.map((d) => d.domain))).map((domain) => {
      const domainTrackers = trackerData.filter((t) => t.domain === domain)
      const riskScore = domainTrackers.reduce((sum, t) => {
        const riskValues = { high: 3, medium: 2, low: 1 }
        return sum + riskValues[t.riskLevel]
      }, 0)

      return {
        id: domain,
        group: domainTrackers[0]?.type || "unknown",
        riskScore,
        count: domainTrackers.length,
      }
    })

    const links = trackerData.map((d, i) => ({
      source: d.domain,
      target: "user",
      value: d.estimatedRevenue,
    }))

    // Add user node
    nodes.push({ id: "user", group: "user", riskScore: 0, count: 0 })

    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3.forceLink(links).id((d: any) => d.id),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.value * 100))

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d: any) => (d.id === "user" ? 8 : Math.max(4, d.count * 2)))
      .attr("fill", (d: any) => {
        if (d.id === "user") return "#3b82f6"
        if (d.riskScore > 6) return "#ef4444"
        if (d.riskScore > 3) return "#f59e0b"
        return "#22c55e"
      })
      .call(d3.drag<any, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended))

    node.append("title").text((d: any) => `${d.id}\nRisk Score: ${d.riskScore}\nTrackers: ${d.count}`)

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)
    })

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
  }, [trackerData])

  // Create timeline chart
  const createTimelineChart = () => {
    if (trackerData.length === 0) return null

    const timelineData = trackerData.sort((a, b) => a.timestamp - b.timestamp).slice(-20) // Last 20 events

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Recent Activity Timeline</h4>
        <div className="space-y-1">
          {timelineData.map((tracker, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  tracker.riskLevel === "high"
                    ? "bg-red-500"
                    : tracker.riskLevel === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
              />
              <span className="flex-1 truncate">{tracker.domain}</span>
              <span className="text-gray-500">{new Date(tracker.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Threat Network</CardTitle>
          <CardDescription>Visualization of tracking relationships and risk levels</CardDescription>
        </CardHeader>
        <CardContent>
          {trackerData.length > 0 ? (
            <svg ref={svgRef} width="320" height="200" className="border rounded" />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🛡️</div>
              <div className="text-sm">No threats detected</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {trackerData.filter((t) => t.riskLevel === "high").length}
              </div>
              <div className="text-xs text-gray-600">High Risk</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {trackerData.filter((t) => t.riskLevel === "medium").length}
              </div>
              <div className="text-xs text-gray-600">Medium Risk</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {trackerData.filter((t) => t.riskLevel === "low").length}
              </div>
              <div className="text-xs text-gray-600">Low Risk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {createTimelineChart()}
    </div>
  )
}

export default ThreatVisualizer
