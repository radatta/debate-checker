"use client";

import { useMemo } from "react";
import { ClaimWithRelations, VerdictType } from "@/lib/types";

interface VerdictDistributionProps {
  claims: ClaimWithRelations[];
}

interface VerdictCount {
  verdict: VerdictType | "PENDING";
  count: number;
  percentage: number;
  color: string;
  label: string;
}

export function VerdictDistribution({ claims }: VerdictDistributionProps) {
  const verdictData: VerdictCount[] = useMemo(() => {
    const verdictCounts = new Map<string, number>();

    // Count verdicts
    claims.forEach((claim) => {
      const verdict = claim.verdicts[0]?.verdict || "PENDING";
      verdictCounts.set(verdict, (verdictCounts.get(verdict) || 0) + 1);
    });

    const total = claims.length;

    const verdictConfig = [
      { verdict: VerdictType.TRUE, color: "bg-green-500", label: "True" },
      { verdict: VerdictType.FALSE, color: "bg-red-500", label: "False" },
      {
        verdict: VerdictType.PARTIALLY_TRUE,
        color: "bg-orange-500",
        label: "Partially True",
      },
      {
        verdict: VerdictType.MISLEADING,
        color: "bg-orange-600",
        label: "Misleading",
      },
      {
        verdict: VerdictType.UNVERIFIABLE,
        color: "bg-gray-500",
        label: "Unverifiable",
      },
      { verdict: "PENDING" as const, color: "bg-yellow-400", label: "Pending" },
    ];

    return verdictConfig
      .map((config) => ({
        ...config,
        count: verdictCounts.get(config.verdict) || 0,
        percentage:
          total > 0
            ? ((verdictCounts.get(config.verdict) || 0) / total) * 100
            : 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [claims]);

  const totalClaims = claims.length;

  if (totalClaims === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
          </svg>
          <p>No verdicts to display yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalClaims}</div>
          <div className="text-sm text-gray-500">Total Claims</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {verdictData.find((v) => v.verdict === VerdictType.TRUE)?.count ||
              0}
          </div>
          <div className="text-sm text-gray-500">True</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {verdictData.find((v) => v.verdict === VerdictType.FALSE)?.count ||
              0}
          </div>
          <div className="text-sm text-gray-500">False</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {verdictData.find((v) => v.verdict === "PENDING")?.count || 0}
          </div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Verdict Distribution</h3>
        <div className="space-y-4">
          {verdictData.map((item) => (
            <div key={item.verdict} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Donut Chart Alternative */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Accuracy Overview</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            {/* Simple CSS-based donut chart */}
            <div className="absolute inset-0 rounded-full border-8 border-gray-200" />
            {verdictData.map((item, index) => {
              let cumulativePercentage = 0;
              for (let i = 0; i < index; i++) {
                cumulativePercentage += verdictData[i].percentage;
              }

              const strokeDasharray = `${item.percentage * 2.51} ${100 * 2.51}`;
              const strokeDashoffset = -cumulativePercentage * 2.51;

              return (
                <svg
                  key={item.verdict}
                  className="absolute inset-0 w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={item.color
                      .replace("bg-", "")
                      .replace("-500", "")
                      .replace("-400", "")
                      .replace("-600", "")}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000"
                  />
                </svg>
              );
            })}

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(
                    (verdictData.find((v) => v.verdict === VerdictType.TRUE)
                      ?.percentage || 0) +
                    (verdictData.find(
                      (v) => v.verdict === VerdictType.PARTIALLY_TRUE
                    )?.percentage || 0)
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-sm text-gray-500">Accuracy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {verdictData.map((item) => (
            <div key={item.verdict} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
