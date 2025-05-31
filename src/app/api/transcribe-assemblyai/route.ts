import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

export async function POST(req: NextRequest) {
    if (!process.env.ASSEMBLYAI_API_KEY) {
        console.error('AssemblyAI API key not configured.');
        return NextResponse.json(
            { message: 'AssemblyAI API key not configured. Please set ASSEMBLYAI_API_KEY in your environment variables.' },
            { status: 500 }
        );
    }

    const client = new AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY,
    });

    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return NextResponse.json({ message: 'No audio file found or the uploaded item is not a file.' }, { status: 400 });
        }

        // Convert File to a Buffer or a stream if needed by the SDK, 
        // or pass the File object if supported (check AssemblyAI SDK docs for current best practice)
        // For this example, we'll convert it to an ArrayBuffer then Buffer, common for Node.js SDKs.
        const audioBuffer = Buffer.from(await file.arrayBuffer());

        // Create a transcriber object
        const transcriber = client.transcripts;

        // Configuration for the transcription job (optional)
        const params = {
            audio: audioBuffer, // Pass the audio data
            // speaker_labels: true, // Example: if you need speaker diarization
            // language_code: 'en_US', // Example: specify language
        };

        // Request transcription
        const transcript = await transcriber.transcribe(params);

        if (transcript.status === 'error') {
            console.error('AssemblyAI Transcription Error:', transcript.error);
            return NextResponse.json({ message: transcript.error || 'AssemblyAI transcription failed.' }, { status: 500 });
        }

        if (!transcript.text) {
            // This might happen if the audio is too short, silent, or there's another issue
            console.warn('AssemblyAI transcription returned no text. Status:', transcript.status);
            return NextResponse.json({ message: 'Transcription result was empty. Audio might be too short or silent.', transcription: '' }, { status: 200 });
        }

        return NextResponse.json({ transcription: transcript.text });

    } catch (error: unknown) {
        console.error('[API /transcribe-assemblyai] Error:', error);
        let errorMessage = 'Failed to transcribe audio with AssemblyAI.';
        let errorStatus = 500;

        if (error instanceof Error) {
            errorMessage = error.message;
            // Check if it's an AssemblyAI specific error by looking at properties if not an SDK-defined error type
            if ('status' in error && 'error' in error) {
                const assemblyError = error as { status: number; error?: string }; // Type assertion
                errorMessage = assemblyError.error || errorMessage;
                errorStatus = typeof assemblyError.status === 'number' ? assemblyError.status : 500;
            }
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return NextResponse.json({ message: errorMessage }, { status: errorStatus });
    }
} 