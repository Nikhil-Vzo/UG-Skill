"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectMongo = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.env.MONGO_URI, {
            autoIndex: process.env.NODE_ENV !== 'production', // Don't auto-build indexes in prod
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    }
    catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};
exports.connectMongo = connectMongo;
//# sourceMappingURL=mongodb.js.map