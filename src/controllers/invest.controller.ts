import { NextFunction, Response } from "express";
import { Request } from "../@types/custome";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../services/error.service";
import { InvestmentService } from "../services/investment.service";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { Investment } from "src/entities/investment.entity";

export class InvestmentController {
  constructor(
    private investmentService: InvestmentService,
    private readonly userRepository: Repository<User>,
    private readonly investmentRepository: Repository<Investment>
  ){}

  createInvestment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { amount } = req.body;

    // Validate input
    if (!amount) return next(new AppError("Amount is required", 400));

    // Retrieve the authenticated user from the request
    const reqUser = req.user;
    if (!reqUser) return next(new AppError("User not found", 400));

    // Find the user in the database
    const user = await this.userRepository.findOne({
      where: { email: reqUser.email }
    });

    if (!user) return next(new AppError("User not found", 400));

    // Create a new investment
    const newInvestment = this.investmentRepository.create({
      amount,
      investor: user
    });

    // Save the investment to the database
    await this.investmentRepository.save(newInvestment);

    user.balance += amount;
    await this.userRepository.save(user);

    // Respond with the newly created investment details
    res.status(201).json({
      status: "success",
      message: `You have successfully invested ${amount}`,
    });
  });
}