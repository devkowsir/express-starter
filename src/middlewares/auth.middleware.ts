import { BACK_END_URL, JWT_SECRET, NODE_ENV, REFRESH_TOKEN_AGE } from "@/config";
import { HttpException } from "@/exceptions";
import { createAccessToken, createRefreshToken } from "@/helpers";
import { AccessTokenPayload, RefreshTokenPayload } from "@/interfaces";
import TokenService from "@/services/token.service";
import UserService from "@/services/user.service";
import { CookieOptions, NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

export class AuthMiddleware {
  public userService = new UserService();
  public tokenService = new TokenService();

  public handler = async (req: Request, res: Response, next: NextFunction) => {
    if (req.url.startsWith("/auth")) return next();

    const accessToken = this.getAccessToken(req);
    const refreshToken = this.getRefreshToken(req);

    if (!accessToken && !refreshToken) {
      // No tokens available, must sign in to continue.
      return next(new HttpException(401, "Please sign in to continue."));
    } else if (!accessToken && refreshToken) {
      // Access token not available, but refresh token available. Verify and continue or sign in.
      const user = await this.handleRefreshToken(refreshToken);
      if (!user) return next(new HttpException(401, "Please sign in again."));
      this.setTokens(res, user);
      return next();
    } else if (accessToken && !refreshToken) {
      // access token available but refresh token not available. To avoid access token theft scenario log in.
      return next(new HttpException(401, "Please sign in to continue."));
    } else if (accessToken && refreshToken) {
      // Both tokens available. Verify and continue or sign in.
      let user = this.handleAccessToken(accessToken);
      if (user) {
        this.setTokens(res, user);
        return next();
      }

      user = await this.handleRefreshToken(refreshToken);
      if (user) {
        this.setTokens(res, user);
        return next();
      }
      return next(new HttpException(401, "Please sign in again."));
    }
  };

  private getAccessToken = (req: Request) => req.header("Authorization")?.slice(7);

  private getRefreshToken = (req: Request) => req.cookies["refresh_token"];

  private handleAccessToken = (accessToken: string) => {
    try {
      return verify(accessToken, JWT_SECRET!) as AccessTokenPayload;
    } catch (_) {
      return null;
    }
  };

  private handleRefreshToken = async (refreshToken: string) => {
    try {
      const isTokenInValid = await this.tokenService.isRefreshTokenRevoked(refreshToken);
      if (isTokenInValid) return null;

      const { id } = verify(refreshToken, JWT_SECRET!) as RefreshTokenPayload;
      const user = await this.userService.findUserById(id);
      if (!user) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image } as AccessTokenPayload;
    } catch (error) {
      return null;
    }
  };

  private setTokens = (res: Response, user: AccessTokenPayload) => {
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
}

const authMiddleware = new AuthMiddleware().handler;
export default authMiddleware;
