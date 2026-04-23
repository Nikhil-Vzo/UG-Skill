"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
let redisClient = null;
if (env_1.env.REDIS_URL) {
    redisClient = new ioredis_1.default(env_1.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
    redisClient.on('connect', () => {
        console.log('✅ Redis Connected');
    });
    redisClient.on('error', (err) => {
        console.error('❌ Redis Connection Error:', err);
    });
}
else {
    console.warn('⚠️ REDIS_URL not provided, skipping Redis connection');
}
exports.redis = redisClient;
//# sourceMappingURL=redis.js.map