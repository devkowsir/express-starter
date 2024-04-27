import { HttpException } from "@/exceptions";
import { NextFunction, Request, Response } from "express";

export default function errorMiddleware(error: HttpException, req: Request, res: Response, next: NextFunction) {
  try {
    const { status, message, details } = error;

    // ideally log to some file/hosting
    console.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
    if (details) res.status(status).json(details);
    else res.status(status).send(message);
  } catch (error) {
    next(error);
  }
}
