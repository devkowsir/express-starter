import App from "@/app";
import postgres from "@/databases/postgres";
import { SignUpData } from "@/validators/auth.validator";
import { BACK_END_URL } from "@config";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import request, { Response } from "supertest";
import { afterEach, describe, expect, it, vitest } from "vitest";
import AuthRoute from "../../routes/auth.route";

const random = randomUUID();

const emailSignUpData: SignUpData = {
  provider: "credential",
  name: random,
  email: random + "@mail.com",
  password: random,
};

const googleSignUpData: SignUpData = {
  provider: "oauth/google",
  token: [
    "ya29.a0Ad52N3-TTX0QAcGYzjqnQEYY_cWP6JOfYhG_l4yxU273Ia5",
    "J5R0x-0G1MrW-XRldErPuUny4hf0zBuhnpuIrt4MPARgs3Jms7h2ic",
    "b6g01zqIaVCU9etqmJH09FoFbx2VezMkQH2F7kbw0kuj1RpL_dcQfp",
    "YrOgCbwaCgYKAQMSARESFQHGX2MiNm73S8QXvHcOss472KrT6w0169",
  ].join(),
};

const tokenParseData = {
  name: emailSignUpData.name,
  email: emailSignUpData.email,
  picture: "https://lh3.googleusercontent.com/a/ACg8ocJGF7C42EMvzYL40Sc3liG_CL3oDaxrzi5yyOA0EBIU=s96-c",
};

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

afterEach(async () => {
  await postgres.db.execute(sql`delete from "user" where email = ${emailSignUpData.email}`);
});

describe("[POST] /auth/signup", () => {
  it("201: 'created' and response data and headers are valid(credential)", async () => {
    const app = new App([new AuthRoute()]);
    const response = await request(app.getServer()).post("/auth/signup").send(emailSignUpData);

    successfulAuthResponseCheck(response, 201);
  });

  it("201: 'created' and response data and headers are valid(oauth/google)", async () => {
    const authRoute = new AuthRoute();
    authRoute.authController.getGoogleUserInfo = vitest.fn().mockReturnValue(tokenParseData);
    const app = new App([authRoute]);
    const response = await request(app.getServer()).post("/auth/signup").send(googleSignUpData);

    successfulAuthResponseCheck(response, 201);
  });

  it("400: 'bad request' error when data sent is not valid(credential)", async () => {
    const app = new App([new AuthRoute()]);
    const response = await request(app.getServer())
      .post("/auth/signup")
      .send({ ...emailSignUpData, password: "" });

    failedAuthResponseCheck(response, 400);
  });

  it("400: 'bad request' error when token is not valid", async () => {
    const app = new App([new AuthRoute()]);
    const response = await request(app.getServer())
      .post("/auth/signup")
      .send({ ...googleSignUpData });

    failedAuthResponseCheck(response, 400);
  });

  it("409: 'conflict' error when email is used for the second time", async () => {
    const app = new App([new AuthRoute()]);
    await request(app.getServer()).post("/auth/signup").send(emailSignUpData);
    const response = await request(app.getServer()).post("/auth/signup").send(emailSignUpData);

    failedAuthResponseCheck(response, 409);
  });
});

describe("[POST] /auth/signin", () => {
  it("200: 'ok' response data and header(credential)", async () => {
    const app = new App([new AuthRoute()]);
    await request(app.getServer()).post("/auth/signup").send(emailSignUpData);
    const response = await request(app.getServer()).post("/auth/signin").send(emailSignUpData);

    successfulAuthResponseCheck(response, 200);
  });

  it("200: 'ok' response data and header(oauth/google)", async () => {
    const authRoute = new AuthRoute();
    authRoute.authController.getGoogleUserInfo = vitest.fn().mockReturnValue(tokenParseData);
    const app = new App([authRoute]);
    await request(app.getServer()).post("/auth/signup").send(googleSignUpData);
    const response = await request(app.getServer()).post("/auth/signin").send(googleSignUpData);

    successfulAuthResponseCheck(response, 200);
  });

  it("401: 'unauthorized' error when password is different", async () => {
    const app = new App([new AuthRoute()]);
    await request(app.getServer()).post("/auth/signup").send(emailSignUpData);
    const response = await request(app.getServer())
      .post("/auth/signin")
      .send({ provider: "credential", email: emailSignUpData.email, password: "Wrong passwodk." });

    failedAuthResponseCheck(response, 401);
  });

  it("401: 'unauthorized' error when signed up using email and password but logging in with google access token", async () => {
    const authRoute = new AuthRoute();
    authRoute.authController.getGoogleUserInfo = vitest.fn().mockReturnValue(tokenParseData);
    const app = new App([authRoute]);
    await request(app.getServer()).post("/auth/signup").send(emailSignUpData);
    const response = await request(app.getServer()).post("/auth/signin").send(googleSignUpData);

    failedAuthResponseCheck(response, 401);
  });

  it("401: 'unauthorized' error when signed up using google access token but logging in with email and password", async () => {
    const authRoute = new AuthRoute();
    authRoute.authController.getGoogleUserInfo = vitest.fn().mockReturnValue(tokenParseData);
    const app = new App([authRoute]);
    await request(app.getServer()).post("/auth/signup").send(googleSignUpData);
    const response = await request(app.getServer()).post("/auth/signin").send(emailSignUpData);

    failedAuthResponseCheck(response, 401);
  });

  it("404: 'not found' error when user is not singed up with the provided email(credential)", async () => {
    const authRoute = new AuthRoute();
    const app = new App([authRoute]);
    const response = await request(app.getServer()).post("/auth/signin").send(emailSignUpData);

    failedAuthResponseCheck(response, 404);
  });

  it("404: 'not found' error when user is not singed up with the provided email(oauth/google)", async () => {
    const authRoute = new AuthRoute();
    authRoute.authController.getGoogleUserInfo = vitest.fn().mockReturnValue(tokenParseData);
    const app = new App([authRoute]);
    const response = await request(app.getServer()).post("/auth/signin").send(googleSignUpData);

    failedAuthResponseCheck(response, 404);
  });
});
