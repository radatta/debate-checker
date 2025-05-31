import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { VerdictType } from '@/lib/types';

export async function POST() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Get all pending claims
        const { data: pendingClaims, error: claimsError } = await supabase
            .from('claim')
            .select('id, text, debate_id')
            .eq('status', 'PENDING')
            .limit(5); // Process up to 5 claims at once

        if (claimsError) {
            console.error('Error fetching pending claims:', claimsError);
            return NextResponse.json(
                { error: 'Failed to fetch pending claims' },
                { status: 500 }
            );
        }

        if (!pendingClaims || pendingClaims.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending claims to process',
                processed: 0
            });
        }

        const processedClaims = [];

        for (const claim of pendingClaims) {
            try {
                // Update status to VERIFYING
                await supabase
                    .from('claim')
                    .update({ status: 'VERIFYING' })
                    .eq('id', claim.id);

                // Mock fact-checking (since we don't have PPLX_KEY set up)
                const mockVerdict = generateMockVerdict(claim.text);

                // Insert verdict
                const { error: verdictError } = await supabase
                    .from('verdict')
                    .insert({
                        verdict: mockVerdict.verdict,
                        confidence: mockVerdict.confidence,
                        sources: mockVerdict.sources,
                        reasoning: mockVerdict.reasoning,
                        evidence: mockVerdict.evidence,
                        claim_id: claim.id,
                    });

                if (verdictError) {
                    console.error('Error inserting verdict:', verdictError);
                    continue;
                }

                // Update status to VERIFIED
                await supabase
                    .from('claim')
                    .update({ status: 'VERIFIED' })
                    .eq('id', claim.id);

                processedClaims.push({
                    id: claim.id,
                    text: claim.text,
                    verdict: mockVerdict.verdict
                });

                console.log(`Processed claim ${claim.id}: ${mockVerdict.verdict}`);

            } catch (error) {
                console.error(`Error processing claim ${claim.id}:`, error);

                // Mark as failed
                await supabase
                    .from('claim')
                    .update({ status: 'FAILED' })
                    .eq('id', claim.id);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${processedClaims.length} claims`,
            processed: processedClaims.length,
            claims: processedClaims
        });

    } catch (error) {
        console.error('Error in process-queue:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Mock verdict generator for testing
function generateMockVerdict(claimText: string) {
    // Simple heuristics for demo purposes
    const text = claimText.toLowerCase();

    if (text.includes('unemployment') || text.includes('%') || text.includes('percent')) {
        return {
            verdict: VerdictType.PARTIALLY_TRUE,
            confidence: 0.7,
            evidence: 'Statistical claims require verification against official sources. Current unemployment data shows fluctuations.',
            sources: ['https://bls.gov', 'https://census.gov'],
            reasoning: 'Economic statistics change frequently and require current data verification.'
        };
    }

    if (text.includes('research') || text.includes('study') || text.includes('data')) {
        return {
            verdict: VerdictType.TRUE,
            confidence: 0.8,
            evidence: 'Research-backed claims are generally supported by evidence.',
            sources: ['https://pubmed.ncbi.nlm.nih.gov', 'https://scholar.google.com'],
            reasoning: 'Claims citing research are typically verifiable through academic sources.'
        };
    }

    if (text.includes('crime') || text.includes('increased') || text.includes('decreased')) {
        return {
            verdict: VerdictType.MISLEADING,
            confidence: 0.6,
            evidence: 'Crime statistics can be misleading without proper context and time frames.',
            sources: ['https://fbi.gov', 'https://ncjrs.gov'],
            reasoning: 'Crime statistics require careful analysis of methodology and timeframe.'
        };
    }

    // Default fallback
    return {
        verdict: VerdictType.UNVERIFIABLE,
        confidence: 0.5,
        evidence: 'This claim requires additional verification from authoritative sources.',
        sources: [],
        reasoning: 'Insufficient information available to verify this claim.'
    };
} 