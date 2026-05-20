import 'dotenv/config';
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/pg/schema/index.ts",
  out: "./src/db/pg/migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  tablesFilter: ["!audit_logs_2026_*", "!exam_scores_2026_*", "!notification_logs_2026_*"],
  // We need to pass the connection string for drizzle-kit
  dbCredentials: {
    url: (process.env.PG_DATABASE_URL || "").replace(':6543/', ':5432/'),
  },
} satisfies Config;
