const mongoose = require('mongoose');
const Redis = require('ioredis');

// Redis configuration
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const CACHE_PREFIX = 'mongoose-cache:';
const DEFAULT_EXPIRY = 3600;  // Cache expiry time in seconds (1 hour)

// Cache utility functions
async function getFromCache(key) {
    const data = await redis.get(CACHE_PREFIX + key);
    return data ? JSON.parse(data) : null;
}

async function setToCache(key, value, expiry = DEFAULT_EXPIRY) {
    await redis.set(CACHE_PREFIX + key, JSON.stringify(value), 'EX', expiry);
}

async function clearCache(key) {
    await redis.del(CACHE_PREFIX + key);
}

// Middleware to apply caching to queries
function applyCacheToQueries(schema) {
    // Pre-find middleware
    schema.pre(/^find/, async function (next) {
        const cacheKey = JSON.stringify(this.getQuery());  // Cache based on the query
        const cachedData = await getFromCache(cacheKey);
        
        if (cachedData) {
            console.log('Returning cached data');
            this._cachedResult = cachedData;
            return next();
        }
        next();
    });

    // Post-find middleware to save the result in Redis
    schema.post(/^find/, async function (docs) {
        if (!this._cachedResult) {
            const cacheKey = JSON.stringify(this.getQuery());
            await setToCache(cacheKey, docs);
            console.log('Query result cached');
        }
    });
    schema.post('save', function () {
        // Clear cache after saving a document
        const cacheKey = JSON.stringify(this._id);
        clearCache(cacheKey);
        console.log('Cache cleared for key:', cacheKey);
    });

    schema.post('create', function () {
        // Clear cache after creating a document
        const cacheKey = JSON.stringify(this._id);
        clearCache(cacheKey);
        console.log('Cache cleared for key:', cacheKey);
    });
    
    schema.post(/^delete/, function () {
        // Clear cache after deleting a document
        const cacheKey = JSON.stringify(this.getQuery());
        clearCache(cacheKey);
        console.log('Cache cleared for key:', cacheKey);
    });

    schema.post(/^update/, function () {
        // Clear cache after updating a document
        const cacheKey = JSON.stringify(this.getQuery());
        clearCache(cacheKey);
        console.log('Cache cleared for key:', cacheKey);
    });
    
    // Pre-aggregate middleware
    schema.pre('aggregate', async function (next) {
        const cacheKey = JSON.stringify(this.pipeline());  // Cache based on the pipeline
        const cachedData = await getFromCache(cacheKey);
        
        if (cachedData) {
            console.log('Returning cached aggregate data');
            this._cachedResult = cachedData;
            return next();
        }
        next();
    });

    // Post-aggregate middleware to save the result in Redis
    schema.post('aggregate', async function (docs) {
        if (!this._cachedResult) {
            const cacheKey = JSON.stringify(this.pipeline());
            await setToCache(cacheKey, docs);
            console.log('Aggregate result cached');
        }
    });
}

// Log cached data for debugging
async function logCachedData() {
    try {
        const keys = await redis.keys(CACHE_PREFIX + '*');
        for (const key of keys) {
            const value = await redis.get(key);
            console.log(`Key: ${key}, Value: ${value}`);
        }
    } catch (err) {
        console.error('Error retrieving cached data:', err);
    }
}

module.exports = {
    applyCacheToQueries,
    logCachedData,
    clearCache
};
