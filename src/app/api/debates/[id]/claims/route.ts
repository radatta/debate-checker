import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { claimQueue } from '@/lib/queue';

const createClaimSchema = z.object({
    text: z.string().min(1),
    timestamp: z.number(),
    speaker_id: z.string().optional(),
});

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const json = await req.json();
        const body = createClaimSchema.parse(json);

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

        // Create the claim
        const { data: claim, error: claimError } = await supabase
            .from('claim')
            .insert({
                text: body.text,
                timestamp: new Date(body.timestamp).toISOString(),
                debate_id: params.id,
                speaker_id: body.speaker_id || null,
                status: 'PENDING',
            })
            .select()
            .single();

        if (claimError) {
            console.error('Error creating claim:', claimError);
            return NextResponse.json(
                { error: 'Failed to create claim' },
                { status: 500 }
            );
        }

        // Add to verification queue
        await claimQueue.add('verify-claim', {
            claimId: claim.id,
        });

        return NextResponse.json(claim);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: claims, error } = await supabase
            .from('claim')
            .select(`
                id,
                text,
                timestamp,
                status,
                debate_id,
                speaker_id,
                speaker:speaker(id, name, role),
                verdicts:verdict(id, verdict, confidence, sources, reasoning, evidence)
            `)
            .eq('debate_id', params.id)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching claims:', error);
            return NextResponse.json(
                { error: 'Failed to fetch claims' },
                { status: 500 }
            );
        }

        return NextResponse.json(claims || []);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 