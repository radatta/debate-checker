import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local, .env, etc.
// Adjust path if your .env.local is in a different location relative to the script
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // Fallback to .env

import { startClaimWorker } from '../src/lib/queue';

console.log('Starting BullMQ claim worker...');

const worker = startClaimWorker();

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Gracefully shutting down worker...');
    await worker.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Gracefully shutting down worker (SIGTERM)...');
    await worker.close();
    process.exit(0);
}); 