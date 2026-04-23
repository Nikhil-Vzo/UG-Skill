import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/pg/schema/*",
  out: "./src/db/pg/migrations",
  dialect: "postgresql",
  // We need to pass the connection string for drizzle-kit
  dbCredentials: {
    url: process.env.PG_DATABASE_URL || "",
  },
} satisfies Config;
