import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

const createDebateSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    start_time: z.string().datetime(),
    end_time: z.string().datetime().optional(),
    speakers: z.array(z.object({
        name: z.string(),
        role: z.string().optional(),
    })),
});

export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const json = await req.json();
        const body = createDebateSchema.parse(json);

        // Create the debate first
        const { data: debate, error: debateError } = await supabase
            .from('debate')
            .insert({
                title: body.title,
                description: body.description,
                start_time: body.start_time,
                end_time: body.end_time || null,
            })
            .select()
            .single();

        if (debateError) {
            console.error('Error creating debate:', debateError);
            return NextResponse.json(
                { error: 'Failed to create debate' },
                { status: 500 }
            );
        }

        // Create speakers if any
        if (body.speakers.length > 0) {
            const speakersToInsert = body.speakers.map(speaker => ({
                ...speaker,
                debate_id: debate.id
            }));

            const { data: speakers, error: speakersError } = await supabase
                .from('speaker')
                .insert(speakersToInsert)
                .select();

            if (speakersError) {
                console.error('Error creating speakers:', speakersError);
                // Delete the debate if speakers creation failed
                await supabase.from('debate').delete().eq('id', debate.id);
                return NextResponse.json(
                    { error: 'Failed to create speakers' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ ...debate, speakers });
        }

        return NextResponse.json({ ...debate, speakers: [] });
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

export async function GET() {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: debates, error } = await supabase
            .from('debate')
            .select(`
                id,
                title,
                description,
                start_time,
                end_time,
                speakers:speaker(id, name, role)
            `)
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Error fetching debates:', error);
            return NextResponse.json(
                { error: 'Failed to fetch debates' },
                { status: 500 }
            );
        }

        // Get claims count for each debate
        const debatesWithCounts = await Promise.all(
            debates?.map(async (debate) => {
                const { count } = await supabase
                    .from('claim')
                    .select('*', { count: 'exact', head: true })
                    .eq('debate_id', debate.id);

                return {
                    ...debate,
                    _count: { claims: count || 0 }
                };
            }) || []
        );

        return NextResponse.json(debatesWithCounts);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 