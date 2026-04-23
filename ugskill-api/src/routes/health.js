"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_1 = require("../config/postgres");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../config/redis");
const response_1 = require("../lib/response");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const health = {
        pg: 'down',
        mongo: 'down',
        redis: 'up', // Assume up unless we have a client that fails
    };
    try {
        // Check PG
        await (0, postgres_1.getPgClient)() `SELECT 1`;
        health.pg = 'up';
        // Check Mongo
        if (mongoose_1.default.connection.readyState === 1) {
            health.mongo = 'up';
        }
        // Check Redis
        if (redis_1.redis && redis_1.redis.status !== 'ready') {
            health.redis = 'down';
        }
        if (redis_1.redis === null) {
            health.redis = 'disabled';
        }
        const isHealthy = health.pg === 'up' && health.mongo === 'up' && (health.redis === 'up' || health.redis === 'disabled');
        res.status(isHealthy ? 200 : 503).json((0, response_1.successResponse)(health));
    }
    catch (error) {
        res.status(503).json((0, response_1.errorResponse)('SERVICE_UNAVAILABLE', 'Database connections failing', { error: error.message, health }));
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map