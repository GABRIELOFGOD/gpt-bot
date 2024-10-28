import { NextFunction, Request, Response } from "express";

const catchAsync = (controller: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    controller(req, res, next).catch(next);
  };
};

export default catchAsync;
