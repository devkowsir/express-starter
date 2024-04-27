import AuthController from "@/controllers/auth.controller";
import { Route } from "@/interfaces";
import getValidationMiddleware from "@/middlewares/validation.middleware";
import { signInValidator, signUpValidator } from "@/validators/auth.validator";
import { Router } from "express";

class AuthRoute implements Route {
  public path = "/auth";
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/signup", getValidationMiddleware(signUpValidator, "body"), this.authController.signUp);
    this.router.post("/signin", getValidationMiddleware(signInValidator, "body"), this.authController.signIn);
  }
}

export default AuthRoute;
