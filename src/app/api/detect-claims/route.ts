import { NextResponse } from 'next/server';
import { detectClaims } from '@/lib/claim-detection';
import { z } from 'zod';

const detectClaimsSchema = z.object({
    text: z.string().min(1, 'Text is required'),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const { text } = detectClaimsSchema.parse(json);

        const detectedClaims = detectClaims(text);

        return NextResponse.json({
            success: true,
            claims: detectedClaims,
            count: detectedClaims.length,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error in claim detection:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint for testing with sample text
export async function GET() {
    const sampleText = `
    According to recent studies, unemployment has decreased by 3.2 percent in the last year.
    Crime rates have increased by 15% in major cities according to FBI data.
    The data shows that renewable energy production rose by 40% compared to last year.
    I think the economy is doing well overall.
    Research indicates that 75% of Americans support renewable energy initiatives.
  `;

    const detectedClaims = detectClaims(sampleText);

    return NextResponse.json({
        success: true,
        sampleText,
        claims: detectedClaims,
        count: detectedClaims.length,
    });
} 