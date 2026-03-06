import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Prevent multiple connections in development (hot reload)
declare global {
    // eslint-disable-next-line no-var
    var _pgClient: postgres.Sql | undefined;
}

const connectionString = process.env.DATABASE_URL!;

const client =
    global._pgClient ??
    postgres(connectionString, { ssl: "require" });

if (process.env.NODE_ENV !== "production") {
    global._pgClient = client;
}

export const db = drizzle(client, { schema });
