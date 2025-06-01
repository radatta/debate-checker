"use client";

import { useState } from "react";
import {
  useRealtimeDebate,
  useRealtimeTranscription,
} from "@/lib/hooks/use-realtime";
import { DebateWithRelations } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveTranscript } from "@/components/live-transcript";
import { VerdictDistribution } from "@/components/analytics/verdict-distribution";
import { SpeakerStats } from "@/components/analytics/speaker-stats";
import { ClaimStatusOverlay } from "@/components/claim-status-overlay";

interface DashboardProps {
  debate: DebateWithRelations;
}

export function Dashboard({ debate: initialDebate }: DashboardProps) {
  const debate = useRealtimeDebate(initialDebate);
  const { isLive, startTranscription, stopTranscription } =
    useRealtimeTranscription(debate.id);

  const [activeTab, setActiveTab] = useState<"live" | "analytics" | "speakers">(
    "live"
  );
  const [showOverlay, setShowOverlay] = useState(true);

  const toggleLive = () => {
    if (isLive) {
      stopTranscription();
    } else {
      startTranscription();
    }
  };

  const pendingClaims = debate.claims.filter((claim) => !claim.verdicts[0]);
  const verifiedClaims = debate.claims.filter((claim) => claim.verdicts[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {debate.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{debate.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Live status indicator */}
              <div className="flex items-center space-x-2">
                {isLive && (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-red-600">
                      LIVE
                    </span>
                  </>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Claims:</span>
                  <Badge variant="outline">{debate.claims.length}</Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Pending:</span>
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 text-yellow-700"
                  >
                    {pendingClaims.length}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Verified:</span>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700"
                  >
                    {verifiedClaims.length}
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOverlay(!showOverlay)}
                >
                  {showOverlay ? "Hide" : "Show"} Overlay
                </Button>
                <Button
                  variant={isLive ? "destructive" : "default"}
                  onClick={toggleLive}
                  className="min-w-[100px]"
                >
                  {isLive ? "Stop Live" : "Start Live"}
                </Button>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex space-x-1 mt-4">
            <button
              onClick={() => setActiveTab("live")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "live"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              Live Debate
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "analytics"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("speakers")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "speakers"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              Speakers
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {activeTab === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(100vh-200px)]">
            {/* Live transcript */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Live Transcript</h2>
              </div>
              <div className="h-full">
                <LiveTranscript
                  debateId={debate.id}
                  isLive={isLive}
                  speakers={debate.speakers}
                />
              </div>
            </div>

            {/* Claims panel */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Claims & Verdicts</h2>
              </div>
              <div className="p-4 h-full overflow-y-auto space-y-4">
                {debate.claims.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                      </svg>
                      <p>No claims detected yet</p>
                      <p className="text-sm mt-1">
                        Claims will appear here as they are detected during the
                        debate
                      </p>
                    </div>
                  </div>
                ) : (
                  debate.claims
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((claim) => (
                      <div
                        key={claim.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {claim.text}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500">
                                {claim.speaker.name}
                              </span>
                              <span className="text-sm text-gray-400">•</span>
                              <span className="text-sm text-gray-500">
                                {new Date(claim.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          {claim.verdicts[0] ? (
                            <Badge className="ml-2">
                              {claim.verdicts[0].verdict.replace("_", " ")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="ml-2 text-yellow-600"
                            >
                              Verifying...
                            </Badge>
                          )}
                        </div>

                        {claim.verdicts[0] && (
                          <div className="bg-gray-50 rounded p-3 text-sm">
                            <p className="font-medium text-gray-700 mb-1">
                              Evidence:
                            </p>
                            <p className="text-gray-600 mb-2">
                              {claim.verdicts[0].evidence}
                            </p>
                            {claim.verdicts[0].sources.length > 0 && (
                              <div>
                                <p className="font-medium text-gray-700 mb-1">
                                  Sources:
                                </p>
                                <ul className="space-y-1">
                                  {claim.verdicts[0].sources
                                    .slice(0, 2)
                                    .map((source, index) => (
                                      <li key={index}>
                                        <a
                                          href={source}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-xs break-all"
                                        >
                                          {source}
                                        </a>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="p-6">
            <VerdictDistribution claims={debate.claims} />
          </div>
        )}

        {activeTab === "speakers" && (
          <div className="p-6">
            <SpeakerStats claims={debate.claims} speakers={debate.speakers} />
          </div>
        )}
      </div>

      {/* Real-time status overlay */}
      <ClaimStatusOverlay
        debateId={debate.id}
        isVisible={showOverlay && isLive}
      />
    </div>
  );
}
