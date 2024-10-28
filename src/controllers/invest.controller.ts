import { NextFunction, Response } from "express";
import { Request } from "../@types/custome";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../services/error.service";

export class InvestmentController {
  constructor(

  ){}

  createInvestment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { amount } = req.body;

    if(!amount) return next(new AppError("Amount is required", 400));

    const reqUser = req.user;
    if(!reqUser) return next(new AppError("User not found", 400));

    res.send("Investment created successfully");
  });
}