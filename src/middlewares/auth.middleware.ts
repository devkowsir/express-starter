import { BACK_END_URL, JWT_SECRET, NODE_ENV, REFRESH_TOKEN_AGE } from "@/config";
import { HttpException } from "@/exceptions";
import { createAccessToken, createRefreshToken } from "@/helpers";
import { AccessTokenPayload, RefreshTokenPayload } from "@/interfaces";
import { User } from "@/schema";
import TokenService from "@/services/token.service";
import UserService from "@/services/user.service";
import { CookieOptions, NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

const { findUserById } = new UserService();
const { isRefreshTokenRevoked } = new TokenService();

export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith("/auth")) next();

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    await handleRefreshToken(req, res, next);
    return next();
  }
  try {
    const { id, name, email, image } = verify(accessToken, JWT_SECRET!) as AccessTokenPayload;
    res.locals.id = id;
    res.locals.name = name;
    res.locals.email = email;
    res.locals.image = image;
  } catch (error) {
    await handleRefreshToken(req, res, next);
  }
  next();
}

function getAccessToken(req: Request) {
  return req.header("Authorization")?.slice(7) as string | undefined;
}

function getRefreshToken(req: Request) {
  return req.cookies.get("refresh_token") as string | undefined;
}

const setTokens = (res: Response, user: User) => {
  const options: CookieOptions = {
    domain: BACK_END_URL,
    httpOnly: true,
    secure: NODE_ENV === "production",
    maxAge: REFRESH_TOKEN_AGE,
    sameSite: true,
  };

  const accessToken = createAccessToken({ id: user.id, name: user.name, email: user.email, image: user.image });
  res.cookie("refresh_token", createRefreshToken({ id: user.id }), options);
  res.locals.accessToken = accessToken;
};

async function handleRefreshToken(req: Request, res: Response, next: NextFunction) {
  const refreshToken = getRefreshToken(req);
  if (!refreshToken) return next(new HttpException(401, "Please sign in to continue."));

  try {
    if (await isRefreshTokenRevoked(refreshToken)) next(new HttpException(401, "Please sign in to continue."));
    const { id } = verify(refreshToken, JWT_SECRET!) as RefreshTokenPayload;
    const user = await findUserById(id);
    if (!user) next(new HttpException(404, "User not found."));
    setTokens(res, user);
  } catch (error) {
    next(new HttpException(401, "Your session has expired. Please sign in again."));
  }
}
