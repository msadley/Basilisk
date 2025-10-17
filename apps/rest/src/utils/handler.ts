// apps/rest/src/helper.ts

import { type Request, type Response, type NextFunction } from "express";

type AsyncController = (
  req: Request<any>,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const handler = (fn: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
