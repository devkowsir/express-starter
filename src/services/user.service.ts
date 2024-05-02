import { NewUser, userTable } from "@/schema/user.schema";
import { eq } from "drizzle-orm";
import postgres from "@/databases/postgres";

export default class UserService {
  private db = postgres.db;

  public async createUser(userData: NewUser) {
    const res = await this.db.insert(userTable).values(userData).returning();
    return res[0] ?? null;
  }

  public async findUserById(userId: number) {
    const res = await this.db.select().from(userTable).where(eq(userTable.id, userId));
    return res[0] ?? null;
  }

  public async findUserByEmail(email: string) {
    const res = await this.db.select().from(userTable).where(eq(userTable.email, email));
    return res[0] ?? null;
  }
}
