import { createClient } from '@redis/client';

const globalForRedis = globalThis as unknown as {
    redis: ReturnType<typeof createClient> | undefined;
};

export const redis = globalForRedis.redis ?? createClient({
    url: process.env.REDIS_URL,
});

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}

// Ensure Redis connection is established
redis.connect().catch(console.error); 