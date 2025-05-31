import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { detectClaims } from '@/lib/claim-detection';
import { claimQueue } from '@/lib/queue';

const processTranscriptSchema = z.object({
    text: z.string().min(1),
    speaker_id: z.string().optional(),
    timestamp: z.number().optional(), // Unix timestamp, defaults to now
});

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const json = await req.json();
        const body = processTranscriptSchema.parse(json);

        // Check if debate exists
        const { data: debate, error: debateError } = await supabase
            .from('debate')
            .select('id')
            .eq('id', params.id)
            .single();

        if (debateError || !debate) {
            return NextResponse.json(
                { error: 'Debate not found' },
                { status: 404 }
            );
        }

        // Detect claims in the transcript text
        const detectedClaims = detectClaims(body.text);

        if (detectedClaims.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No claims detected in transcript',
                transcript: body.text,
                claims: []
            });
        }

        // Store detected claims in the database
        const claimsToInsert = detectedClaims.map(claim => ({
            text: claim.text,
            timestamp: new Date(body.timestamp || Date.now()).toISOString(),
            debate_id: params.id,
            speaker_id: body.speaker_id || null,
            status: 'PENDING' as const,
        }));

        const { data: insertedClaims, error: claimsError } = await supabase
            .from('claim')
            .insert(claimsToInsert)
            .select();

        if (claimsError) {
            console.error('Error inserting claims:', claimsError);
            return NextResponse.json(
                { error: 'Failed to store claims' },
                { status: 500 }
            );
        }

        // Add each claim to the verification queue
        const queuePromises = insertedClaims.map(claim =>
            claimQueue.add('verify-claim', { claimId: claim.id })
        );

        await Promise.all(queuePromises);

        return NextResponse.json({
            success: true,
            transcript: body.text,
            detectedClaims: detectedClaims.length,
            storedClaims: insertedClaims.length,
            claims: insertedClaims.map((claim, index) => ({
                ...claim,
                detectionInfo: {
                    confidence: detectedClaims[index]?.confidence,
                    type: detectedClaims[index]?.type
                }
            }))
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error processing transcript:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 