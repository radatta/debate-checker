import { Queue, Worker } from 'bullmq';
import { createServerClient } from '@supabase/ssr';
import { createPerplexityClient } from './perplexity';

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
    throw new Error('REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD must be set');
}

if (!process.env.PROD_REDIS_HOST || !process.env.PROD_REDIS_PORT || !process.env.PROD_REDIS_PASSWORD) {
    throw new Error('PROD_REDIS_HOST, PROD_REDIS_PORT, and PROD_REDIS_PASSWORD must be set');
}

const redisConnection = process.env.NODE_ENV === 'production'
    ? {
        host: process.env.PROD_REDIS_HOST,
        port: parseInt(process.env.PROD_REDIS_PORT),
        password: process.env.PROD_REDIS_PASSWORD,
    }
    : {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
    };

// Queue for processing claims
export const claimQueue = new Queue('claims', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});

// Worker for processing claims
export function startClaimWorker() {
    const worker = new Worker(
        'claims',
        async (job) => {
            const { claimId } = job.data;

            try {
                // Create Supabase client for server-side operations in worker context
                const supabase = createServerClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    {
                        cookies: {
                            getAll() { return []; },
                            setAll() { /* no-op in worker context */ },
                        },
                    }
                );

                // Get the claim details
                const { data: claim, error: claimError } = await supabase
                    .from('claim')
                    .select('id, text')
                    .eq('id', claimId)
                    .single();

                if (claimError || !claim) {
                    throw new Error(`Claim not found: ${claimId}`);
                }

                // Update claim status to VERIFYING
                const { error: updateError } = await supabase
                    .from('claim')
                    .update({ status: 'VERIFYING' })
                    .eq('id', claimId);

                if (updateError) {
                    throw new Error(`Failed to update claim status: ${updateError.message}`);
                }

                // Check if PPLX_KEY is available for fact-checking
                if (!process.env.PPLX_KEY) {
                    console.log('PPLX_KEY not found, skipping actual fact-checking for claim:', claim.text);

                    // Just mark as verified without actual fact-checking
                    const { error: verifiedError } = await supabase
                        .from('claim')
                        .update({ status: 'VERIFIED' })
                        .eq('id', claimId);

                    if (verifiedError) {
                        throw new Error(`Failed to update claim to verified: ${verifiedError.message}`);
                    }
                    return;
                }

                // Perform actual fact-checking with Perplexity
                const perplexityClient = createPerplexityClient();
                const factCheckResult = await perplexityClient.factCheck(claim.text);

                // Store the verdict in the database
                const { error: verdictError } = await supabase
                    .from('verdict')
                    .insert({
                        verdict: factCheckResult.verdict,
                        confidence: factCheckResult.confidence,
                        sources: factCheckResult.sources,
                        reasoning: factCheckResult.reasoning,
                        evidence: factCheckResult.evidence,
                        claim_id: claimId,
                    });

                if (verdictError) {
                    throw new Error(`Failed to store verdict: ${verdictError.message}`);
                }

                // Update claim status to VERIFIED
                const { error: verifiedError } = await supabase
                    .from('claim')
                    .update({ status: 'VERIFIED' })
                    .eq('id', claimId);

                if (verifiedError) {
                    throw new Error(`Failed to update claim to verified: ${verifiedError.message}`);
                }

                console.log(`Successfully fact-checked claim ${claimId}: ${factCheckResult.verdict} (confidence: ${factCheckResult.confidence})`);

            } catch (error) {
                console.error('Error processing claim:', error);

                // Update claim status to FAILED
                try {
                    const supabase = createServerClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        {
                            cookies: {
                                getAll() { return []; },
                                setAll() { /* no-op in worker context */ },
                            },
                        }
                    );

                    await supabase
                        .from('claim')
                        .update({ status: 'FAILED' })
                        .eq('id', claimId);
                } catch (updateError) {
                    console.error('Failed to update claim status to FAILED:', updateError);
                }

                throw error;
            }
        },
        {
            connection: redisConnection,
        }
    );

    return worker;
}

