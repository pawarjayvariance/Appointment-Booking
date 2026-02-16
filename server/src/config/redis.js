const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
        console.log('Connected to Redis');
    }
}

/**
 * Acquire a lock for a specific slot to prevent double booking.
 * @param {string} slotId 
 * @param {number} ttl - Time to live in seconds
 */
async function acquireLock(slotId, ttl = 30) {
    const lockKey = `lock:slot:${slotId}`;
    const result = await client.set(lockKey, 'locked', {
        NX: true, // Only set if it doesn't exist
        EX: ttl   // Expire after ttl seconds
    });
    return result === 'OK';
}

async function releaseLock(slotId) {
    const lockKey = `lock:slot:${slotId}`;
    await client.del(lockKey);
}

module.exports = {
    client,
    connectRedis,
    acquireLock,
    releaseLock
};
