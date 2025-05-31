"use client";

import { useMemo } from "react";
import { ClaimWithRelations, VerdictType } from "@/lib/types";

interface RealTimeStatsProps {
  claims: ClaimWithRelations[];
  className?: string;
}

export function RealTimeStats({ claims, className = "" }: RealTimeStatsProps) {
  const stats = useMemo(() => {
    const total = claims.length;
    const verified = claims.filter((claim) => claim.verdicts[0]).length;
    const pending = total - verified;

    const true_claims = claims.filter(
      (claim) => claim.verdicts[0]?.verdict === VerdictType.TRUE
    ).length;

    const false_claims = claims.filter(
      (claim) => claim.verdicts[0]?.verdict === VerdictType.FALSE
    ).length;

    const accuracy =
      verified > 0 ? Math.round((true_claims / verified) * 100) : 0;

    return {
      total,
      verified,
      pending,
      true_claims,
      false_claims,
      accuracy,
    };
  }, [claims]);

  return (
    <div className={`grid grid-cols-2 md:grid-cols-6 gap-3 ${className}`}>
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">{stats.total}</div>
        <div className="text-xs text-gray-500">Total</div>
      </div>

      <div className="text-center">
        <div className="text-lg font-bold text-blue-600">{stats.verified}</div>
        <div className="text-xs text-gray-500">Verified</div>
      </div>

      <div className="text-center">
        <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
        <div className="text-xs text-gray-500">Pending</div>
      </div>

      <div className="text-center">
        <div className="text-lg font-bold text-green-600">
          {stats.true_claims}
        </div>
        <div className="text-xs text-gray-500">True</div>
      </div>

      <div className="text-center">
        <div className="text-lg font-bold text-red-600">
          {stats.false_claims}
        </div>
        <div className="text-xs text-gray-500">False</div>
      </div>

      <div className="text-center">
        <div
          className={`text-lg font-bold ${
            stats.accuracy >= 80
              ? "text-green-600"
              : stats.accuracy >= 60
                ? "text-yellow-600"
                : "text-red-600"
          }`}
        >
          {stats.accuracy}%
        </div>
        <div className="text-xs text-gray-500">Accuracy</div>
      </div>
    </div>
  );
}
