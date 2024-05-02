import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  email: varchar("email", { length: 64 }).unique().notNull(),
  password: varchar("password", { length: 128 }),
  image: varchar("image", { length: 256 }),
});

export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;
