import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/schema",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_CONNECTION_STRING!,
  },
  verbose: true,
  strict: true,
  out: "migrations",
});
