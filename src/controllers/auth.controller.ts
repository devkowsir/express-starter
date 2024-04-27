import { BACK_END_URL, NODE_ENV, REFRESH_TOKEN_AGE } from "@/config";
import { HttpException } from "@/exceptions";
import { createAccessToken, createRefreshToken } from "@/helpers/token.helper";
import { User } from "@/schema";
import AuthService from "@/services/auth.service";
import { SignInData, SignUpData } from "@/validators/auth.validator";
import axios, { AxiosError } from "axios";
import { CookieOptions, NextFunction, Request, Response } from "express";

type GoogleUserInfo = {
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
};
const googleUserInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";

export default class AuthController {
  public authService = new AuthService();

  public signUp = async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body as SignUpData;

    if (userData.provider === "credential") {
      try {
        const { name, email, password } = userData;
        const user = await this.authService.signUp({ name, email, password });

        res.status(201);
        this.sendSuccessfulAuthenticationResponse(res, user);
      } catch (error: unknown) {
        next(error);
      }
    } else {
      try {
        const { token } = userData;
        const { name, email, picture } = await this.getGoogleUserInfo(token);
        const user = await this.authService.signUp({ name, email, image: picture });

        res.status(201);
        this.sendSuccessfulAuthenticationResponse(res, user);
      } catch (error) {
        if (error instanceof AxiosError) return next(new HttpException(400, "Invalid token."));
        next(error);
      }
    }
  };

  public signIn = async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body as SignInData;

    if (userData.provider === "credential") {
      try {
        const { email, password } = userData;
        const user = await this.authService.signIn({ email, password });

        this.sendSuccessfulAuthenticationResponse(res, user);
      } catch (error) {
        next(error);
      }
    } else {
      try {
        const { token } = userData;
        const { email } = await this.getGoogleUserInfo(token);

        const user = await this.authService.signIn({ email });

        this.sendSuccessfulAuthenticationResponse(res, user);
      } catch (error) {
        if (error instanceof AxiosError) return next(new HttpException(400, "Invalid token."));
        next(error);
      }
    }
  };

  public getGoogleUserInfo = async (token: string) => {
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await axios.get(googleUserInfoUrl, { headers });
    const { given_name, family_name, email, picture } = data as GoogleUserInfo;
    const name = `${given_name} ${family_name}`;
    return { name, email, picture };
  };

  private sendSuccessfulAuthenticationResponse = (res: Response, user: User) => {
    const options: CookieOptions = {
      domain: BACK_END_URL,
      httpOnly: true,
      secure: NODE_ENV === "production",
      maxAge: REFRESH_TOKEN_AGE,
      sameSite: true,
    };
    const accessToken = createAccessToken({ id: user.id, name: user.name, email: user.email, image: user.image });

    res.cookie("refresh_token", createRefreshToken({ id: user.id }), options).json({ accessToken });
  };
}
