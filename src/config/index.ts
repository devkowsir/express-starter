import { config } from "dotenv";
config();

export const ONE_DAY = 24 * 60 * 60,
  ACCESS_TOKEN_AGE = ONE_DAY,
  REFRESH_TOKEN_AGE = 15 * ONE_DAY;

export const {
  PORT,
  POSTGRES_CONNECTION_STRING,
  MYSQL_CONNECTION_STRING,
  JWT_SECRET,
  NODE_ENV,
  REDIS_URL,
  REDIS_TOKEN,
  FRONT_END_URL,
  BACK_END_URL,
} = process.env;
