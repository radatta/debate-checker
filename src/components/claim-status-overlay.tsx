"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClaimStatus, VerdictType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { getVerdictColor } from "@/lib/utils";

interface ClaimStatusOverlayProps {
  debateId: string;
  isVisible: boolean;
}

interface ClaimStatusItem {
  id: string;
  text: string;
  status: ClaimStatus;
  verdict?: VerdictType;
  timestamp: string;
  progress: number;
}

export function ClaimStatusOverlay({
  debateId,
  isVisible,
}: ClaimStatusOverlayProps) {
  const [claimStatuses, setClaimStatuses] = useState<ClaimStatusItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!isVisible) return;

    // Subscribe to claim changes via Supabase Realtime
    const channel = supabase
      .channel(`claim-status:${debateId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "claim",
          filter: `debate_id=eq.${debateId}`,
        },
        async (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            // Fetch the full claim with verdicts
            const { data: claim } = await supabase
              .from("claim")
              .select(
                `
                id,
                text,
                timestamp,
                status,
                verdicts:verdict(verdict)
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (claim) {
              const statusItem: ClaimStatusItem = {
                id: claim.id,
                text: claim.text,
                status: claim.status as ClaimStatus,
                verdict: claim.verdicts?.[0]?.verdict as VerdictType,
                timestamp: claim.timestamp,
                progress: claim.status === "VERIFYING" ? 50 : 100,
              };

              setClaimStatuses((prev) => {
                const existingIndex = prev.findIndex(
                  (item) => item.id === statusItem.id
                );
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = statusItem;
                  return updated;
                } else {
                  return [...prev, statusItem];
                }
              });

              // Auto-remove completed claims after 5 seconds
              if (claim.status === "VERIFIED" || claim.status === "FAILED") {
                setTimeout(() => {
                  setClaimStatuses((prev) =>
                    prev.filter((item) => item.id !== statusItem.id)
                  );
                }, 5000);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debateId, isVisible, supabase]);

  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.PENDING:
        return (
          <svg
            className="w-4 h-4 animate-pulse text-yellow-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case ClaimStatus.VERIFYING:
        return (
          <svg
            className="w-4 h-4 animate-spin text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case ClaimStatus.VERIFIED:
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case ClaimStatus.FAILED:
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        );
    }
  };

  const getStatusText = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.PENDING:
        return "Claim detected";
      case ClaimStatus.VERIFYING:
        return "Fact-checking...";
      case ClaimStatus.VERIFIED:
        return "Verified";
      case ClaimStatus.FAILED:
        return "Verification failed";
    }
  };

  const getVerdictBadge = (verdict?: VerdictType) => {
    if (!verdict) return null;

    const colorClass = getVerdictColor(verdict);
    return (
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        {verdict.replace("_", " ")}
      </Badge>
    );
  };

  if (!isVisible || claimStatuses.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {claimStatuses.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg shadow-lg border p-4 transform transition-all duration-300 ease-in-out animate-slide-in"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(item.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {getStatusText(item.status)}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                {item.text.length > 80
                  ? `${item.text.substring(0, 80)}...`
                  : item.text}
              </p>

              {/* Progress bar for verifying status */}
              {item.status === ClaimStatus.VERIFYING && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Analyzing...</span>
                    <span>{Math.round(item.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Verdict badge */}
              {item.verdict && (
                <div className="flex justify-end">
                  {getVerdictBadge(item.verdict)}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Summary indicator */}
      {claimStatuses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-blue-900">
            Processing{" "}
            {
              claimStatuses.filter((c) => c.status === ClaimStatus.VERIFYING)
                .length
            }{" "}
            claims
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {
              claimStatuses.filter((c) => c.status === ClaimStatus.VERIFIED)
                .length
            }{" "}
            completed
          </div>
        </div>
      )}
    </div>
  );
}
