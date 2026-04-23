"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    // PostgreSQL (Supabase)
    PG_DATABASE_URL: zod_1.z.string().url(),
    // MongoDB
    MONGO_URI: zod_1.z.string().url(),
    // Redis
    REDIS_URL: zod_1.z.string().url().optional(), // Make optional for local dev if not strictly required yet, but in reality we expect it
    // Secrets (for JWT later)
    JWT_SECRET: zod_1.z.string().min(32).default('super-secret-key-change-in-production'),
});
const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        process.exit(1);
    }
    return parsed.data;
};
exports.env = parseEnv();
//# sourceMappingURL=env.js.map