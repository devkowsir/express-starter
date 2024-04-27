import { HttpException } from "@/exceptions";
import { NextFunction } from "express";
import { ZodError, type Schema } from "zod";

export default function getValidationMiddleware(validator: Schema, value: string) {
  return function (req: Record<string, any>, res: any, next: NextFunction) {
    try {
      const data = validator.parse(req[value]);
      req[value] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError)
        return next(new HttpException(400, "Invalid request", { errors: error.flatten().fieldErrors }));
      // @ts-expect-error
      next(new HttpException(500, error.message || "Something went wrong."));
    }
  };
}
