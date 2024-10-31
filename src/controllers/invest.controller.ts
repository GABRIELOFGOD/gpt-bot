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
  ){
    // this.autoExecute();
  }

  // ================= AUTO EXECUTE AFTER 20 SECONDS ================= //
  autoExecute = () => {
    setInterval(() => {
      this.getInvestmentRoi();
    }, 20000);
  }
  
  createInvestment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { amount } = req.body;

    // ============== VALIDATE REQUEST ============== //
    if (!amount) return next(new AppError("Amount is required", 400));

    // ====================== GET USER ====================== //
    const reqUser = req.user;
    if (!reqUser) return next(new AppError("User not found", 400));

    // ========================= FIND USER ========================= //
    const user = await this.userRepository.findOne({
        where: { email: reqUser.email }
    });

    if (!user) return next(new AppError("User not found", 400));

    // ======================= CREATE NEW INVESTMENT ======================= //
    const newInvestment = this.investmentRepository.create({
        amount,
        investor: user
    });

    // ======================= SAVE NEW INVESTMENT ======================= //
    const savedInvestment = await this.investmentRepository.save(newInvestment);

    // ======================= UPDATE USER BALANCE ======================= //
    const currentBalance = parseFloat(user.balance as unknown as string);
    const investmentAmount = parseFloat(savedInvestment.amount.toString());

    const newBalance = parseFloat((currentBalance + investmentAmount).toFixed(4));

    user.balance = newBalance;
    user.hasActiveInvestment = true;

    const savedUser = await this.userRepository.save(user);

    // ===================== RETURN RESPONSE ===================== //
    res.status(201).json({
        status: "success",
        message: `You have successfully invested ${amount}`,
    });
  });

  getInvestments = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const reqUser = req.user;
    if (!reqUser) return next(new AppError("User not found", 400));

    const user = await this.userRepository.findOne({
      where: { email: reqUser.email },
      relations: ["investments"]
    });

    if (!user) return next(new AppError("User not found", 400));

    res.status(200).json({
      status: "success",
      data: user.investments
    });
  });

  getInvestmentRoi = async () => {
    // ================ GET ALL USERS WITH INVESTMENTS AND REFERRED USERS ================ //
    const users = await this.userRepository.find({
      relations: ["investments", "referredUsers", "referredUsers.investments"], // Ensure investments for referred users are loaded
    });

    for (let user of users) {
      if (!user.investments || user.investments.length === 0) continue;

      // ======================= CALCULATE TOTAL INVESTMENT ======================= //
      const totalInvestment = user.investments.reduce((sum, investment) => sum + parseFloat(investment.amount.toString()), 0);

      // ======================= CALCULATE ROI ======================= //
      const roi = this.investmentService.calculateInvestmentRoi(totalInvestment);

      // ======================= UPDATE USER BALANCE ======================= //
      user.balance = parseFloat((Number(user.balance) + Number(roi)).toFixed(4));

      // ======================= CALCULATE REFERRAL BONUS IF APPLICABLE ======================= //
      if (user.referredUsers && user.referredUsers.length > 0) {
        console.log("running referral bonus");
        const referralBonus = await this.investmentService.calculateReferralBonus(user, 1);
        console.log("referral bonus: ", referralBonus);
        user.balance = parseFloat((user.balance + referralBonus).toFixed(4));
      }

      // ====================== SAVE USER ====================== //
      await this.userRepository.save(user);
      console.log(`User: ${user.email} ROI: ${roi}`);
      console.log(`User: ${user.email} Balance: ${user.balance}`);
    }
  };
  
}