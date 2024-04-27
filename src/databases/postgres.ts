import { NODE_ENV, POSTGRES_CONNECTION_STRING } from "@/config";
import * as schema from "@schema";
import { sql } from "drizzle-orm";

// uncomment only following imports to use neon postgres database
/*
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
// @ts-expect-error
import ws from "ws";

neonConfig.webSocketConstructor = ws;
*/

// uncomment only following imports to use default pg database
// /*
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
// */

export class PostGres {
  public db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: POSTGRES_CONNECTION_STRING });
    this.db = drizzle(this.pool, { logger: NODE_ENV === "development", schema });
  }

  public async connect() {
    await this.db.execute(sql`SELECT NOW();`);
    await this.db.execute(sql`delete from "user"`);
  }

  public async disconnect() {
    await this.pool.end();
  }
}

export default new PostGres();
