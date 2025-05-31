// Database types for Supabase (matching the actual schema)
export interface Debate {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string | null;
    created_at: string;
    updated_at: string;
}

export interface Speaker {
    id: string;
    name: string;
    role: string | null;
    debate_id: string;
    created_at: string;
    updated_at: string;
}

export interface Claim {
    id: string;
    text: string;
    timestamp: string;
    status: ClaimStatus;
    debate_id: string;
    speaker_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Verdict {
    id: string;
    verdict: VerdictType;
    confidence: number;
    sources: string[];
    reasoning: string | null;
    evidence: string | null;
    claim_id: string;
    created_at: string;
    updated_at: string;
}

// Enums
export enum ClaimStatus {
    PENDING = 'PENDING',
    VERIFYING = 'VERIFYING',
    VERIFIED = 'VERIFIED',
    FAILED = 'FAILED'
}

export enum VerdictType {
    TRUE = 'TRUE',
    FALSE = 'FALSE',
    PARTIALLY_TRUE = 'PARTIALLY_TRUE',
    MISLEADING = 'MISLEADING',
    UNVERIFIABLE = 'UNVERIFIABLE'
}

// Utility types for relations
export type DebateWithRelations = Debate & {
    speakers: Speaker[];
    claims: ClaimWithRelations[];
};

export type ClaimWithRelations = Claim & {
    speaker: Speaker;
    verdicts: Verdict[];
};

export type SpeakerWithClaims = Speaker & {
    claims: Claim[];
}; 