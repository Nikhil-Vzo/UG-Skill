import postgres from 'postgres';
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<Record<string, never>> & {
    $client: postgres.Sql<{}>;
};
export declare const getPgClient: () => postgres.Sql<{}>;
//# sourceMappingURL=postgres.d.ts.map