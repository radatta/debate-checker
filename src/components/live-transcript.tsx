"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { useRealtimeTranscription } from "@/lib/hooks/use-realtime";
import { ClaimWithRelations } from "@/lib/types";
import { getVerdictColor } from "@/lib/utils";

interface TranscriptSegment {
  id: string;
  text: string;
  speaker: Speaker;
  timestamp: string;
  claims?: ClaimWithRelations[];
}

interface Speaker {
  id: string;
  name: string;
}

interface LiveTranscriptProps {
  debateId: string;
  isLive: boolean;
  speakers: Speaker[];
}

export function LiveTranscript({
  debateId,
  isLive,
  speakers,
}: LiveTranscriptProps) {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [manualInputText, setManualInputText] = useState<string>("");
  const { transcriptSegments } = useRealtimeTranscription(debateId);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>(speakers[0]);

  // Update transcript when new segments arrive via Supabase Realtime
  useEffect(() => {
    setTranscript(transcriptSegments);
  }, [transcriptSegments]);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Demo function to add mock transcript segments
  const addMockSegment = () => {
    const mockTexts = [
      // Should trigger detection
      "According to the World Bank, global poverty fell from 9.2% in 2017 to 8.6% in 2018.",
      "Unemployment in the United States decreased from 6.7% in December 2020 to 3.5% in July 2022.",
      "The population of India reached 1,428,627,663 as of July 2023, according to the United Nations.",
      "Solar energy accounted for 6.2% of total U.S. electricity generation in 2022.",
      "The FBI reported a 29.4% increase in murder rates in the United States between 2019 and 2020.",
      "A Harvard study published in 2021 found that people who walk at least 8,000 steps per day have a 51% lower risk of death from all causes.",
      "In 2023, Apple reported a quarterly revenue of $94.8 billion for Q2.",
      "The Intergovernmental Panel on Climate Change stated in 2022 that global surface temperature has increased by 1.1°C since the pre-industrial era.",
      "A clinical trial published in The Lancet in 2020 showed a 62% efficacy rate for the AstraZeneca COVID-19 vaccine.",
      "It is true that the Earth completes one rotation on its axis every 23.934 hours.",
      "By 2030, the International Energy Agency predicts that electric vehicles will make up 60% of new car sales in China.",
      "A 2022 report by Goldman Sachs forecasts that artificial intelligence will automate 18% of global work hours by 2030.",
      "The U.S. Bureau of Labor Statistics reported that consumer prices rose by 7.0% in 2021.",
      "According to the CDC, there were 1,752 cases of measles in the United States in 2019.",
      "Data from Pew Research Center shows that 85% of Americans owned a smartphone as of 2021.",
      "The highest temperature ever recorded on Earth was 56.7°C (134°F) in Furnace Creek Ranch, California, on July 10, 1913.",
      "Compared to 2010, global wind power capacity increased by more than 400% by 2022.",
      "The U.S. Department of Transportation announced that the Gateway Tunnel project will be completed by 2035.",
      '"We have reduced our carbon emissions by 47% since 2010," said Microsoft CEO Satya Nadella in 2022.',
      "A Stanford University study found that students who sleep at least 8 hours per night score 12% higher on exams.",
      "The International Renewable Energy Agency projects that renewables will supply 90% of global electricity by 2050.",
      "The World Health Organization confirms that smoking causes more than 7 million deaths each year worldwide.",
      "The European Union declared that single-use plastics would be banned across member states by July 2021.",
      "A 2019 meta-analysis published in JAMA found that bilingual children outperform monolingual peers in cognitive flexibility tests.",
      "Tesla's total revenue increased from $31.5 billion in 2020 to $81.5 billion in 2022.",
      // Should NOT trigger detection
      "I think the weather will be nice tomorrow.",
      "In my opinion, this movie is the best.",
      "Maybe we should try a different approach.",
      "It seems like the team is working hard.",
      "I believe this is the right decision.",
      "Well, you know, things happen.",
      "Um, I guess we could start now.",
      "Perhaps we will see more changes soon.",
      "I might go to the store later.",
      "Should we consider other options?",
      "You know, it's just how I feel.",
      "I could be wrong about this.",
      "It might rain later today.",
      "I'm not sure if that's correct.",
      "Possibly, the results will be different.",
      "I would like to visit Paris someday.",
      "And, so, we continued our journey.",
      "But, I don't have all the facts.",
      "Well, that's just my perspective.",
      "Uh, I saw something interesting yesterday.",
      "I think she's a great leader.",
      "Maybe this isn't the best time.",
      "In my opinion, cats are better than dogs.",
      "I believe he will succeed.",
      "It seems like a good idea.",
    ];

    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    const newSegment = {
      id: `segment-${Date.now()}`,
      text: randomText,
      speaker: currentSpeaker,
      timestamp: new Date().toISOString(),
      claims: [],
    };

    setTranscript((prev) => [...prev, newSegment]);

    // Process the segment for claims (this would normally be done server-side)
    setTimeout(() => {
      // Auto-detect claims and add them to the database
      fetch(`/api/debates/${debateId}/process-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: randomText,
          speaker_id: currentSpeaker.id,
          timestamp: Date.now(),
        }),
      }).then(() => {
        console.log("Processed transcript segment for claims");
      });
    }, 500);
  };

  // Handler for manual text input submission
  const handleManualSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!manualInputText.trim()) return;

    const newSegmentText = manualInputText.trim();
    const newSegment: TranscriptSegment = {
      id: `manual-segment-${Date.now()}`,
      text: newSegmentText,
      speaker: currentSpeaker,
      timestamp: new Date().toISOString(),
      claims: [],
    };

    // Add to local transcript for immediate display (optional, but good UX)
    setTranscript((prev) => [...prev, newSegment]);
    setManualInputText("");

    // Process the segment for claims
    try {
      const response = await fetch(
        `/api/debates/${debateId}/process-transcript`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: newSegmentText,
            speaker_id: currentSpeaker.id,
            timestamp: Date.now(),
          }),
        }
      );
      if (!response.ok) {
        console.error("Failed to process manual transcript segment");
      } else {
        console.log("Processed manual transcript segment for claims");
      }
    } catch (error) {
      console.error("Error submitting manual transcript segment:", error);
    }
  };

  const handleStartRecording = async () => {
    setAudioError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setAudioStream(stream);
        setIsRecording(true);
        audioChunksRef.current = [];

        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          audioChunksRef.current = [];

          if (audioBlob.size === 0) {
            setAudioError("No audio data recorded.");
            return;
          }

          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");

          try {
            setAudioError("Transcribing audio with AssemblyAI...");
            const response = await fetch("/api/transcribe-assemblyai", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({
                message:
                  "AssemblyAI transcription failed with status: " +
                  response.status,
              }));
              throw new Error(
                errorData.message || "AssemblyAI transcription failed"
              );
            }

            const result = await response.json();
            const transcribedText = result.transcription;
            setAudioError(null);

            if (transcribedText) {
              const newSegment: TranscriptSegment = {
                id: `audio-segment-${Date.now()}`,
                text: transcribedText,
                speaker: currentSpeaker,
                timestamp: new Date().toISOString(),
                claims: [],
              };
              setTranscript((prev) => [...prev, newSegment]);

              fetch(`/api/debates/${debateId}/process-transcript`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: transcribedText,
                  speaker_id: currentSpeaker.id,
                  timestamp: Date.now(),
                }),
              })
                .then((claimProcessingResponse) => {
                  if (claimProcessingResponse.ok) {
                    console.log(
                      "Processed audio transcript segment for claims"
                    );
                  } else {
                    console.error(
                      "Failed to process audio transcript segment for claims"
                    );
                  }
                })
                .catch((claimProcessingError) => {
                  console.error(
                    "Error processing audio transcript segment:",
                    claimProcessingError
                  );
                });
            } else {
              setAudioError("Transcription returned empty text.");
            }
          } catch (err) {
            console.error("Error transcribing audio:", err);
            setAudioError(
              `Transcription error: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        };

        mediaRecorderRef.current.start();
        console.log("Audio recording started with MediaRecorder.");
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setAudioError(
          `Error accessing microphone: ${err instanceof Error ? err.message : String(err)}. Please ensure permission is granted.`
        );
        setIsRecording(false);
      }
    } else {
      setAudioError("Audio recording is not supported by your browser.");
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }
    setAudioStream(null);
    setIsRecording(false);
    console.log("Audio recording stopped, processing...");
  };

  // Cleanup audio stream when component unmounts or isLive changes to false
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioStream]);

  const highlightClaims = (text: string, claims: ClaimWithRelations[] = []) => {
    if (!claims.length) return text;

    let highlighted = text;
    claims.forEach((claim) => {
      const claimText = claim.text;
      if (text.includes(claimText)) {
        const verdict = claim.verdicts[0];
        const colorClass = verdict
          ? getVerdictColor(verdict.verdict)
          : "bg-yellow-100";
        highlighted = highlighted.replace(
          claimText,
          `<span class="relative inline-block ${colorClass} px-1 rounded cursor-pointer" 
                  data-claim-id="${claim.id}" 
                  title="${verdict?.verdict || "Verifying..."}">${claimText}</span>`
        );
      }
    });
    return highlighted;
  };

  if (!isLive) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a5 5 0 1110 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <p>Start the live debate to see real-time transcription</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">LIVE</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {transcript.length} segments
          </div>
          <button
            onClick={addMockSegment}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Add Mock Segment
          </button>
        </div>
      </div>

      {/* Speaker Selection Buttons */}
      <div className="p-4 border-b flex space-x-2">
        {speakers.map((speaker) => (
          <button
            key={speaker.id}
            onClick={() => setCurrentSpeaker(speaker)}
            className={`px-4 py-2 text-sm rounded ${currentSpeaker.name === speaker.name ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {speaker.name}
          </button>
        ))}
      </div>

      {/* Manual Text Input Area */}
      <form
        onSubmit={handleManualSubmit}
        className="p-4 border-b flex items-center space-x-2"
      >
        <input
          type="text"
          value={manualInputText}
          onChange={(e) => setManualInputText(e.target.value)}
          placeholder="Enter transcript text manually..."
          className="flex-grow p-2 border rounded text-sm"
          aria-label="Manual transcript input"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          disabled={!manualInputText.trim()}
        >
          Submit
        </button>
      </form>

      {/* Audio Input Area */}
      <div className="p-4 border-b">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="px-4 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 w-full md:w-auto"
          >
            Start Audio Input
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 w-full md:w-auto"
          >
            Stop Audio Input
          </button>
        )}
        {isRecording && (
          <p className="text-sm text-green-600 mt-2">Recording audio...</p>
        )}
        {audioError && (
          <p className="text-sm text-red-600 mt-2">{audioError}</p>
        )}
      </div>

      <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript.map((segment) => (
          <div key={segment.id} className="group">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {segment.speaker?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {segment.speaker.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(segment.timestamp).toLocaleTimeString()}
                  </span>
                  {segment.claims && segment.claims.length > 0 && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      {segment.claims.length} claim
                      {segment.claims.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: highlightClaims(segment.text, segment.claims),
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
