import { ACCESS_TOKEN_AGE, JWT_SECRET, REFRESH_TOKEN_AGE } from "@/config";
import { AccessTokenPayload, RefreshTokenPayload } from "@/interfaces";
import jsonwebtoken, { SignOptions } from "jsonwebtoken";

export function createAccessToken(payload: AccessTokenPayload, options?: Omit<SignOptions, "expiresIn">) {
  return jsonwebtoken.sign(payload, JWT_SECRET!, { ...options, expiresIn: ACCESS_TOKEN_AGE });
}

export function createRefreshToken(payload: RefreshTokenPayload, options?: Omit<SignOptions, "expiresIn">) {
  return jsonwebtoken.sign(payload, JWT_SECRET!, { ...options, expiresIn: REFRESH_TOKEN_AGE });
}
