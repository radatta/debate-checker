"use client";

import { useMemo } from "react";
import { Group } from "@visx/group";
import { scaleTime, scaleLinear } from "@visx/scale";
import { Circle, Line } from "@visx/shape";
import { Text } from "@visx/text";
import { ClaimWithRelations, VerdictType } from "@/lib/types";

interface ClaimTimelineProps {
  claims: ClaimWithRelations[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

interface TimelinePoint {
  timestamp: Date;
  claim: ClaimWithRelations;
  verdict?: VerdictType;
}

export function ClaimTimeline({
  claims,
  width,
  height,
  margin = { top: 40, right: 40, bottom: 60, left: 60 },
}: ClaimTimelineProps) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const timelineData: TimelinePoint[] = useMemo(() => {
    return claims.map((claim) => ({
      timestamp: new Date(claim.timestamp),
      claim,
      verdict: claim.verdicts[0]?.verdict,
    }));
  }, [claims]);

  const { xScale, yScale } = useMemo(() => {
    if (!timelineData.length) {
      return {
        xScale: scaleTime().range([0, innerWidth]),
        yScale: scaleLinear().range([innerHeight, 0]),
      };
    }

    const timestamps = timelineData.map((d) => d.timestamp);
    const minTime = new Date(Math.min(...timestamps.map((d) => d.getTime())));
    const maxTime = new Date(Math.max(...timestamps.map((d) => d.getTime())));

    // Add padding to time range
    const timePadding = (maxTime.getTime() - minTime.getTime()) * 0.1;
    const paddedMinTime = new Date(minTime.getTime() - timePadding);
    const paddedMaxTime = new Date(maxTime.getTime() + timePadding);

    // Group claims by time slots to avoid overlap
    const timeSlots = new Map<string, number>();
    const sortedData = [...timelineData].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    let maxSlot = 0;
    sortedData.forEach((point) => {
      const timeKey = Math.floor(point.timestamp.getTime() / (5 * 60 * 1000)); // 5-minute slots
      const currentSlot = timeSlots.get(timeKey.toString()) || 0;
      timeSlots.set(timeKey.toString(), currentSlot + 1);
      maxSlot = Math.max(maxSlot, currentSlot);
    });

    return {
      xScale: scaleTime()
        .domain([paddedMinTime, paddedMaxTime])
        .range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([0, Math.max(maxSlot, 3)])
        .range([innerHeight, 0]),
    };
  }, [timelineData, innerWidth, innerHeight]);

  const getPointY = (point: TimelinePoint) => {
    const timeKey = Math.floor(point.timestamp.getTime() / (5 * 60 * 1000));
    const existingPoints = timelineData.filter(
      (p) =>
        Math.floor(p.timestamp.getTime() / (5 * 60 * 1000)) === timeKey &&
        p.timestamp <= point.timestamp
    );
    return yScale(existingPoints.length - 1);
  };

  const getVerdictColorClass = (verdict?: VerdictType) => {
    if (!verdict) return "#FCD34D"; // Yellow for pending

    switch (verdict) {
      case VerdictType.TRUE:
        return "#10B981"; // Green
      case VerdictType.FALSE:
        return "#EF4444"; // Red
      case VerdictType.PARTIALLY_TRUE:
        return "#F59E0B"; // Orange
      case VerdictType.MISLEADING:
        return "#F97316"; // Orange-red
      case VerdictType.UNVERIFIABLE:
        return "#6B7280"; // Gray
      default:
        return "#FCD34D"; // Yellow
    }
  };

  if (!timelineData.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <p>No claims to display yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* X-axis */}
          <Line
            from={{ x: 0, y: innerHeight }}
            to={{ x: innerWidth, y: innerHeight }}
            stroke="#E5E7EB"
            strokeWidth={2}
          />

          {/* Y-axis */}
          <Line
            from={{ x: 0, y: 0 }}
            to={{ x: 0, y: innerHeight }}
            stroke="#E5E7EB"
            strokeWidth={2}
          />

          {/* Timeline points */}
          {timelineData.map((point, i) => {
            const x = xScale(point.timestamp) ?? 0;
            const y = getPointY(point) ?? 0;
            const color = getVerdictColorClass(point.verdict);

            return (
              <Group key={i}>
                <Circle
                  cx={x as number}
                  cy={y as number}
                  r={6}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  className="cursor-pointer hover:opacity-80"
                />
                {/* Tooltip on hover - you could enhance this with a proper tooltip library */}
                <title>
                  {point.claim.text.substring(0, 100)}...
                  {point.verdict && ` | ${point.verdict}`}
                </title>
              </Group>
            );
          })}

          {/* X-axis labels */}
          {xScale.ticks(5).map((tick, i) => {
            const xTick = xScale(tick) ?? 0;
            return (
              <Group key={i}>
                <Line
                  from={{ x: xTick as number, y: innerHeight }}
                  to={{ x: xTick as number, y: innerHeight + 5 }}
                  stroke="#9CA3AF"
                />
                <Text
                  x={xTick as number}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#6B7280"
                >
                  {tick.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Group>
            );
          })}

          {/* Y-axis labels */}
          {yScale
            .ticks(Math.min(5, Math.max(...yScale.domain())))
            .map((tick, i) => {
              const yTick = yScale(tick) ?? 0;
              return (
                <Group key={i}>
                  <Line
                    from={{ x: -5, y: yTick as number }}
                    to={{ x: 0, y: yTick as number }}
                    stroke="#9CA3AF"
                  />
                  <Text
                    x={-10}
                    y={yTick as number}
                    textAnchor="end"
                    verticalAnchor="middle"
                    fontSize={12}
                    fill="#6B7280"
                  >
                    {tick}
                  </Text>
                </Group>
              );
            })}
        </Group>

        {/* Title */}
        <Text
          x={width / 2}
          y={20}
          textAnchor="middle"
          fontSize={16}
          fontWeight={600}
          fill="#374151"
        >
          Claims Timeline
        </Text>

        {/* Y-axis title */}
        <Text
          x={20}
          y={height / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#6B7280"
          transform={`rotate(-90, 20, ${height / 2})`}
        >
          Concurrent Claims
        </Text>
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>True</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>False</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Partially True</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-600" />
          <span>Misleading</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span>Unverifiable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}
