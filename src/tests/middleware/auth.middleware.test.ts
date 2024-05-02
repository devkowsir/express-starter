import { BACK_END_URL } from "@/config";
import postgres from "@/databases/postgres";
import { createAccessToken, createRefreshToken } from "@/helpers";
import { AccessTokenPayload } from "@/interfaces";
import authMiddleware, { AuthMiddleware } from "@/middlewares/auth.middleware";
import errorMiddleware from "@/middlewares/error.middleware";
import jsonMiddleware from "@/middlewares/json.middleware";
import TokenService from "@/services/token.service";
import UserService from "@/services/user.service";
import cookieParser from "cookie-parser";
import { randomUUID } from "crypto";
import { desc, sql } from "drizzle-orm";
import express from "express";
import request, { Response } from "supertest";
import { afterEach, describe, expect, it, vitest } from "vitest";

const emailSignUpData = {
  name: randomUUID(),
  email: `${randomUUID()}@mail.com`,
  password: randomUUID(),
};

afterEach(async () => {
  await postgres.db.execute(sql`delete from "user" where email = ${emailSignUpData.email}`);
});

function successfulAuthResponseCheck(response: Response, status: number) {
  const refreshTokenCookie = new RegExp(
    `^refreshToken=[^;]+; Domain=${BACK_END_URL}; Path=\/; Expires=[^;]+; HttpOnly$`
  );
  expect(response.status).toEqual(status);
  expect(response.header["set-cookie"]).toMatchObject(refreshTokenCookie);
  expect(response.header["content-type"]).toEqual("application/json; charset=utf-8");
  expect(response.body.accessToken).toBeTypeOf("string");
}

function failedAuthResponseCheck(response: Response, status: number) {
  expect(response.status).toEqual(status);
  expect(response.header["set-cookie"]).not.toBeDefined();
  expect(response.body.accessToken).not.toBeDefined();
}

function initializeAppWithDefaults() {
  const app = express();
  app.use(cookieParser());
  app.use(errorMiddleware);
  app.use(jsonMiddleware);
  return app;
}

const tokenService = new TokenService();
const userService = new UserService();

const user: AccessTokenPayload = { id: 547, name: "kawsar ahmed", email: "kawsar@mail.com", image: null };
const validAccessToken = createAccessToken(user);
const validRefreshToken = createRefreshToken({ id: user.id });
const invalidAccessToken = createAccessToken(user, { notBefore: 600 });
const invalidRefreshToken = createRefreshToken({ id: user.id }, { notBefore: 600 });

describe("[GET] / with response 401", () => {
  it("both tokens are absent.", async () => {
    const app = initializeAppWithDefaults();

    app.use(authMiddleware);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app).get("/");
    failedAuthResponseCheck(response, 401);
  });

  it("access token absent and refresh token is invalid", async () => {
    const app = initializeAppWithDefaults();

    const authMiddleware = new AuthMiddleware();
    authMiddleware.tokenService.isRefreshTokenRevoked = vitest.fn().mockReturnValue(false);
    app.use(authMiddleware.handler);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app).get("/").set("Cookie", `refresh_token=${invalidRefreshToken}`);
    failedAuthResponseCheck(response, 401);
  });

  it("refresh token absent and access token is valid", async () => {
    const app = initializeAppWithDefaults();

    app.use(authMiddleware);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app).get("/").set("Authorization", `Bearer ${validAccessToken}`);
    failedAuthResponseCheck(response, 401);
  });

  it("refresh token absent and access token is invalid", async () => {
    const app = initializeAppWithDefaults();

    app.use(authMiddleware);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app).get("/").set("Authorization", `Bearer ${invalidAccessToken}`);
    failedAuthResponseCheck(response, 401);
  });

  it("both token present, both are invalid", async () => {
    const app = initializeAppWithDefaults();

    const authMiddleware = new AuthMiddleware();
    authMiddleware.tokenService.isRefreshTokenRevoked = vitest.fn().mockReturnValue(false);
    app.use(authMiddleware.handler);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app)
      .get("/")
      .set("Cookie", `refresh_token=${invalidRefreshToken}`)
      .set("Authorization", `Bearer ${invalidAccessToken}`);
    failedAuthResponseCheck(response, 401);
  });
});

describe("[GET] / with response 200", () => {
  it("access token absent and refresh token is valid", async () => {
    const app = initializeAppWithDefaults();

    const authMiddleware = new AuthMiddleware();
    authMiddleware.tokenService.isRefreshTokenRevoked = vitest.fn().mockReturnValue(false);
    authMiddleware.userService.findUserById = vitest.fn().mockReturnValue(user);
    app.use(authMiddleware.handler);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app).get("/").set("Cookie", `refresh_token=${validRefreshToken}`);
    successfulAuthResponseCheck(response, 200);
  });

  it("both token present, refresh token is invalid", async () => {
    const app = initializeAppWithDefaults();

    const authMiddleware = new AuthMiddleware();
    authMiddleware.tokenService.isRefreshTokenRevoked = vitest.fn().mockReturnValue(false);
    authMiddleware.userService.findUserById = vitest.fn().mockReturnValue(user);
    app.use(authMiddleware.handler);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app)
      .get("/")
      .set("Cookie", `refresh_token=${invalidRefreshToken}`)
      .set("Authorization", `Bearer ${validAccessToken}`);
    successfulAuthResponseCheck(response, 200);
  });

  it("both token present, access token is invalid", async () => {
    const app = initializeAppWithDefaults();

    const authMiddleware = new AuthMiddleware();
    authMiddleware.tokenService.isRefreshTokenRevoked = vitest.fn().mockReturnValue(false);
    authMiddleware.userService.findUserById = vitest.fn().mockReturnValue(user);
    app.use(authMiddleware.handler);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app)
      .get("/")
      .set("Cookie", `refresh_token=${validRefreshToken}`)
      .set("Authorization", `Bearer ${invalidAccessToken}`);
    successfulAuthResponseCheck(response, 200);
  });

  it("both token present, both are valid", async () => {
    const app = initializeAppWithDefaults();

    app.use(authMiddleware);

    app.get("/", (_, res) => res.json({}));

    const response = await request(app)
      .get("/")
      .set("Cookie", `refresh_token=${validRefreshToken}`)
      .set("Authorization", `Bearer ${validAccessToken}`);
    successfulAuthResponseCheck(response, 200);
  });
});
