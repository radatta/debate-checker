"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DebateWithRelations } from "@/lib/types";

export function useRealtimeDebate(debate: DebateWithRelations) {
    const [currentDebate, setCurrentDebate] = useState<DebateWithRelations>(debate);
    const supabase = createClient();

    useEffect(() => {
        // Subscribe to changes on claims table for this debate
        const claimsChannel = supabase
            .channel(`claims-for-debate:${debate.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'claim',
                    filter: `debate_id=eq.${debate.id}`,
                },
                async (payload) => {
                    console.log('[Realtime DEBUG] Claim change detected:', JSON.stringify(payload, null, 2));

                    if (payload.eventType === 'INSERT') {
                        console.log('[Realtime DEBUG] INSERT event, new ID:', payload.new.id);
                        const { data: newClaim, error: fetchError } = await supabase
                            .from('claim')
                            .select(
                                `
                id,
                text,
                timestamp,
                status,
                debate_id,
                speaker_id,
                created_at,
                updated_at,
                speaker:speaker(id, name, role, debate_id, created_at, updated_at),
                verdicts:verdict(id, verdict, confidence, sources, reasoning, evidence, claim_id, created_at, updated_at)
              `
                            )
                            .eq('id', payload.new.id)
                            .single();

                        if (fetchError) {
                            console.error('[Realtime DEBUG] Error fetching new claim:', fetchError);
                            return;
                        }
                        console.log('[Realtime DEBUG] Fetched new claim:', newClaim);

                        if (newClaim) {
                            setCurrentDebate(prev => {
                                console.log('[Realtime DEBUG] Adding new claim to state:', newClaim.id);
                                // Ensure no duplicates if event fires multiple times rapidly
                                if (prev.claims.some(c => c.id === newClaim.id)) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    claims: [...prev.claims, newClaim as any].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                };
                            });
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        console.log('[Realtime DEBUG] UPDATE event for claim ID:', payload.new.id);
                        const { data: updatedClaimToLog, error: fetchErrorOnUpdate } = await supabase
                            .from('claim')
                            .select('id, text, status, verdicts:verdict(id, verdict)') // Log specific fields
                            .eq('id', payload.new.id)
                            .single();
                        if (fetchErrorOnUpdate) {
                            console.error('[Realtime DEBUG] Error fetching updated claim for logging:', fetchErrorOnUpdate);
                        }
                        console.log('[Realtime DEBUG] Fetched updated claim for logging:', updatedClaimToLog);
                        // Fetch updated claim with relations
                        const { data: updatedClaim } = await supabase
                            .from('claim')
                            .select(`
                id,
                text,
                timestamp,
                status,
                debate_id,
                speaker_id,
                created_at,
                updated_at,
                speaker:speaker(id, name, role, debate_id, created_at, updated_at),
                verdicts:verdict(id, verdict, confidence, sources, reasoning, evidence, claim_id, created_at, updated_at)
              `)
                            .eq('id', payload.new.id)
                            .single();

                        if (updatedClaim) {
                            setCurrentDebate(prev => ({
                                ...prev,
                                claims: prev.claims.map(claim =>
                                    claim.id === updatedClaim.id ? updatedClaim as any : claim
                                )
                            }));
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime DEBUG] Successfully subscribed to claims channel: claims-for-debate:${debate.id}`);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error(`[Realtime DEBUG] Failed to subscribe to claims channel: ${status}`, err);
                } else {
                    console.log('[Realtime DEBUG] Claims channel status:', status);
                }
            });

        // Subscribe to changes on verdicts table
        const verdictsChannel = supabase
            .channel(`verdicts-for-debate:${debate.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'verdict',
                },
                async (payload) => {
                    console.log('[Realtime DEBUG] Verdict change detected:', JSON.stringify(payload, null, 2));
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const claimId = payload.new.claim_id;
                        console.log('[Realtime DEBUG] Verdict changed for claim ID:', claimId);
                        // Find the claim this verdict belongs to and update it
                        // Fetch the updated claim with the new verdict
                        const { data: updatedClaimWithVerdict, error: fetchVerdictError } = await supabase
                            .from('claim')
                            .select(
                                `
                id,
                text,
                timestamp,
                status,
                debate_id,
                speaker_id,
                created_at,
                updated_at,
                speaker:speaker(id, name, role, debate_id, created_at, updated_at),
                verdicts:verdict(id, verdict, confidence, sources, reasoning, evidence, claim_id, created_at, updated_at)
              `
                            )
                            .eq('id', claimId)
                            .single();

                        if (fetchVerdictError) {
                            console.error('[Realtime DEBUG] Error fetching claim after verdict update:', fetchVerdictError);
                            return;
                        }
                        console.log('[Realtime DEBUG] Fetched claim after verdict update:', updatedClaimWithVerdict);

                        if (updatedClaimWithVerdict) {
                            setCurrentDebate(prev => {
                                console.log('[Realtime DEBUG] Updating claim in state with new verdict:', updatedClaimWithVerdict.id);
                                return {
                                    ...prev,
                                    claims: prev.claims.map(claim =>
                                        claim.id === updatedClaimWithVerdict.id ? updatedClaimWithVerdict as any : claim
                                    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                };
                            });
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime DEBUG] Successfully subscribed to verdicts channel: verdicts-for-debate:${debate.id}`);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error(`[Realtime DEBUG] Failed to subscribe to verdicts channel: ${status}`, err);
                } else {
                    console.log('[Realtime DEBUG] Verdicts channel status:', status);
                }
            });

        // Cleanup subscriptions
        return () => {
            supabase.removeChannel(claimsChannel);
            supabase.removeChannel(verdictsChannel);
        };
    }, [debate.id, supabase]);

    return currentDebate;
}

// Hook for live transcription broadcasting
export function useRealtimeTranscription(debateId: string) {
    const [transcriptSegments, setTranscriptSegments] = useState<any[]>([]);
    const [isLive, setIsLive] = useState(false);
    const supabase = createClient();

    const startTranscription = () => {
        setIsLive(true);
        // Send broadcast message to start transcription
        supabase.channel(`debate:${debateId}`).send({
            type: 'broadcast',
            event: 'transcription_started',
            payload: { debateId, timestamp: Date.now() }
        });
    };

    const stopTranscription = () => {
        setIsLive(false);
        // Send broadcast message to stop transcription
        supabase.channel(`debate:${debateId}`).send({
            type: 'broadcast',
            event: 'transcription_stopped',
            payload: { debateId, timestamp: Date.now() }
        });
    };

    const addTranscriptSegment = (segment: any) => {
        setTranscriptSegments(prev => [...prev, segment]);

        // Broadcast the new segment to other clients
        supabase.channel(`debate:${debateId}`).send({
            type: 'broadcast',
            event: 'new_transcript_segment',
            payload: segment
        });
    };

    useEffect(() => {
        // Subscribe to transcript broadcasts
        const channel = supabase
            .channel(`debate:${debateId}`)
            .on('broadcast', { event: 'new_transcript_segment' }, ({ payload }) => {
                setTranscriptSegments(prev => [...prev, payload]);
            })
            .on('broadcast', { event: 'transcription_started' }, () => {
                setIsLive(true);
            })
            .on('broadcast', { event: 'transcription_stopped' }, () => {
                setIsLive(false);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [debateId, supabase]);

    return {
        transcriptSegments,
        isLive,
        startTranscription,
        stopTranscription,
        addTranscriptSegment
    };
} 