"use client";

import { useMemo } from "react";
import { ClaimWithRelations, VerdictType, Speaker } from "@/lib/types";

interface SpeakerStatsProps {
  claims: ClaimWithRelations[];
  speakers: Speaker[];
}

interface SpeakerStat {
  speaker: Speaker;
  totalClaims: number;
  trueClaims: number;
  falseClaims: number;
  pendingClaims: number;
  accuracyRate: number;
}

export function SpeakerStats({ claims, speakers }: SpeakerStatsProps) {
  const speakerStats: SpeakerStat[] = useMemo(() => {
    return speakers
      .map((speaker) => {
        const speakerClaims = claims.filter(
          (claim) => claim.speaker_id === speaker.id
        );

        const totalClaims = speakerClaims.length;
        const trueClaims = speakerClaims.filter(
          (claim) =>
            claim.verdicts[0]?.verdict === VerdictType.TRUE ||
            claim.verdicts[0]?.verdict === VerdictType.PARTIALLY_TRUE
        ).length;
        const falseClaims = speakerClaims.filter(
          (claim) =>
            claim.verdicts[0]?.verdict === VerdictType.FALSE ||
            claim.verdicts[0]?.verdict === VerdictType.MISLEADING
        ).length;
        const pendingClaims = speakerClaims.filter(
          (claim) => !claim.verdicts[0]
        ).length;

        const verifiedClaims = totalClaims - pendingClaims;
        const accuracyRate =
          verifiedClaims > 0 ? (trueClaims / verifiedClaims) * 100 : 0;

        return {
          speaker,
          totalClaims,
          trueClaims,
          falseClaims,
          pendingClaims,
          accuracyRate,
        };
      })
      .sort((a, b) => b.totalClaims - a.totalClaims);
  }, [claims, speakers]);

  if (speakers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <p>No speakers to display yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Speaker Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {speakers.length}
            </div>
            <div className="text-sm text-gray-500">Total Speakers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(
                speakerStats.reduce((sum, stat) => sum + stat.totalClaims, 0) /
                  speakers.length
              )}
            </div>
            <div className="text-sm text-gray-500">Avg Claims per Speaker</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {speakerStats.length > 0
                ? Math.round(
                    speakerStats.reduce(
                      (sum, stat) => sum + stat.accuracyRate,
                      0
                    ) / speakerStats.filter((s) => s.totalClaims > 0).length
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-gray-500">Avg Accuracy</div>
          </div>
        </div>
      </div>

      {/* Individual Speaker Stats */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Speaker Performance</h3>
        </div>
        <div className="divide-y">
          {speakerStats.map((stat) => (
            <div key={stat.speaker.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {stat.speaker.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {stat.speaker.name}
                    </h4>
                    {stat.speaker.role && (
                      <p className="text-sm text-gray-500">
                        {stat.speaker.role}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Accuracy Rate</div>
                  <div
                    className={`text-2xl font-bold ${
                      stat.accuracyRate >= 80
                        ? "text-green-600"
                        : stat.accuracyRate >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {stat.totalClaims > 0
                      ? `${stat.accuracyRate.toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Claims breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {stat.totalClaims}
                  </div>
                  <div className="text-xs text-gray-500">Total Claims</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {stat.trueClaims}
                  </div>
                  <div className="text-xs text-gray-500">True/Partial</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-semibold text-red-600">
                    {stat.falseClaims}
                  </div>
                  <div className="text-xs text-gray-500">False/Misleading</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-semibold text-yellow-600">
                    {stat.pendingClaims}
                  </div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>

              {/* Visual accuracy bar */}
              {stat.totalClaims > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Accuracy Breakdown</span>
                    <span>
                      {stat.totalClaims - stat.pendingClaims} verified claims
                    </span>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-2 bg-gray-200">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${(stat.trueClaims / stat.totalClaims) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${(stat.falseClaims / stat.totalClaims) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-yellow-400"
                      style={{
                        width: `${(stat.pendingClaims / stat.totalClaims) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Accuracy Leaderboard</h3>
        <div className="space-y-3">
          {speakerStats
            .filter((stat) => stat.totalClaims > 0)
            .sort((a, b) => b.accuracyRate - a.accuracyRate)
            .map((stat, index) => (
              <div
                key={stat.speaker.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-yellow-400 text-yellow-900"
                        : index === 1
                          ? "bg-gray-300 text-gray-700"
                          : index === 2
                            ? "bg-orange-400 text-orange-900"
                            : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium">{stat.speaker.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {stat.totalClaims} claims
                  </span>
                  <span
                    className={`font-semibold ${
                      stat.accuracyRate >= 80
                        ? "text-green-600"
                        : stat.accuracyRate >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {stat.accuracyRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
