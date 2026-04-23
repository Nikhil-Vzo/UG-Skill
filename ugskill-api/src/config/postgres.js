"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPgClient = exports.db = void 0;
const postgres_1 = __importDefault(require("postgres"));
const postgres_js_1 = require("drizzle-orm/postgres-js");
const env_1 = require("./env");
// For migrations and schema execution
const queryClient = (0, postgres_1.default)(env_1.env.PG_DATABASE_URL, { max: 10 });
exports.db = (0, postgres_js_1.drizzle)(queryClient);
// Optional: exported for health checks or raw queries
const getPgClient = () => queryClient;
exports.getPgClient = getPgClient;
//# sourceMappingURL=postgres.js.map