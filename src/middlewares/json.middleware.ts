import { NextFunction, Request, Response } from "express";

/**
 * This middleware attaches the refreshed access token from res.locals to the json body.
 * and then continues to send the response.
 * @param req
 * @param res
 * @param next
 */
//
export default function jsonMiddleware(req: Request, res: Response, next: NextFunction) {
  var json = res.json;
  res.json = function (obj: Record<string, any>) {
    if (res.locals.accessToken && !obj.accessToken) obj.accessToken = res.locals.accessToken;
    return json.call(this, obj);
  };
  next();
}
