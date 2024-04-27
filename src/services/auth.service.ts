import { HttpException } from "@/exceptions";
import { NewUser, userTable } from "@/schema/user.schema";
import postgres from "@databases/postgres";
import { compare, hash } from "bcrypt";
import { eq } from "drizzle-orm";

export default class AuthService {
  private db = postgres.db;

  public async signUp(userData: NewUser) {
    const [findUser] = await this.db.select().from(userTable).where(eq(userTable.email, userData.email));
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists.`);

    let hashedPass;
    if (userData.password) hashedPass = await hash(userData.password, 10);
    const [createdUser] = await this.db
      .insert(userTable)
      .values({ ...userData, password: hashedPass || null })
      .returning();

    return createdUser;
  }

  public async signIn(userData: { email: string; password?: string }) {
    const [findUser] = await this.db.select().from(userTable).where(eq(userTable.email, userData.email));
    if (!findUser) throw new HttpException(404, `No user is associated with the email of: ${userData.email}.`);

    if (userData.password && findUser.password) {
      const isPasswordOk = await compare(userData.password, findUser.password);
      if (!isPasswordOk) throw new HttpException(401, "Email and password mismatch.");
    }

    if (userData.password && !findUser.password) throw new HttpException(401, "Email and password mismatch.");
    if (!userData.password && findUser.password) throw new HttpException(401, "Email and password mismatch.");

    return findUser;
  }
}
