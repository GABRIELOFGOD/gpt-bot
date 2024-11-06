import { NextFunction, Response } from "express";
import { Request } from "../@types/custome";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../services/error.service";
import { InvestmentService } from "../services/investment.service";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { Investment } from "../entities/investment.entity";
import { EarningsHistory } from "../entities/earningHistory.entity";
import { Claim } from "../entities/claim.entity";
import cron from "node-cron";

export class InvestmentController {
  private isRunning = false;
  constructor(
    private investmentService: InvestmentService,
    private readonly userRepository: Repository<User>,
    private readonly investmentRepository: Repository<Investment>,
    private readonly earningHistoryRepository: Repository<EarningsHistory>,
    private readonly claimRepository: Repository<Claim>
  ){
    this.autoExecute();
  }

  // ================= AUTO EXECUTE AFTER 20 SECONDS ================= //
  
  private autoExecute() {
    cron.schedule('0 0 * * *', async () => {
      if (this.isRunning) {
        console.log("Skipped execution: getInvestmentRoi is already running");
        return;
      }
      
      this.isRunning = true;  // Acquire the "lock"

      try {
        console.log("Running getInvestmentRoi...");
        await this.getInvestmentRoi();  // Ensure this function is async to handle delays properly
        console.log("getInvestmentRoi completed successfully");
      } catch (error) {
        console.error("Error in getInvestmentRoi:", error);
        // Optionally, you can add a retry or notification mechanism here
      } finally {
        this.isRunning = false;  // Release the "lock"
      }
    });
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
        where: { wallet: reqUser.wallet }
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
      where: { wallet: reqUser.wallet },
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
      relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory"], // Ensure investments for referred users are loaded
    });

    for (let user of users) {
      if (!user.investments || user.investments.length === 0) continue;

      // ======================= CALCULATE TOTAL INVESTMENT ======================= //
      const totalInvestment = user.investments.reduce((sum, investment) => sum + parseFloat(investment.amount.toString()), 0);

      if(user.balance >= totalInvestment*3) continue;

      // ======================= CALCULATE ROI ======================= //
      const roi = this.investmentService.calculateInvestmentRoi(totalInvestment);

      // ======================= UPDATE USER BALANCE ======================= //
      user.claimable = parseFloat((Number(user.claimable) + Number(roi)).toFixed(4));

      // ======================= ADD EARNINGS TO EARNINGS HISTORY ================= //
      const newEarning = this.earningHistoryRepository.create({
        amountEarned: roi,
        user,
        generationLevel: 0,
      });
      const addedEarning = await this.earningHistoryRepository.save(newEarning);
      user.earningsHistory && user.earningsHistory.push(addedEarning);

      // ======================= CALCULATE REFERRAL BONUS IF APPLICABLE ======================= //
      if (user.referredUsers && user.referredUsers.length > 0) {
        console.log("running referral bonus");
        const referralBonus = await this.investmentService.calculateReferralBonus(user, 1);
        console.log("referral bonus: ", referralBonus);
        user.claimable = parseFloat((user.claimable + referralBonus).toFixed(4));
      }

      // ====================== SAVE USER ====================== //
      await this.userRepository.save(user);
      console.log(`User: ${user.wallet} ROI: ${roi}`);
      console.log(`User: ${user.wallet} Balance: ${user.claimable}`);
    }
  };

  claimEarnings = async (req: Request, res: Response, next: NextFunction) => {
    const reqUser = req.user;
    if (!reqUser) return next(new AppError("User not found", 400));

    const user = await this.userRepository.findOne({
      where: { wallet: reqUser.wallet }
    });

    if (!user) return next(new AppError("User not found", 400));

    if (user.claimable <= 0) return next(new AppError("No earnings to claim", 400));

    // ====================== CREATE NEW CLAIM ====================== //
    const newClaim = this.claimRepository.create({
      amount: user.claimable,
      user
    });

    // ====================== SAVE NEW CLAIM ====================== //
    await this.claimRepository.save(newClaim);

    user.balance = parseFloat((Number(user.balance) + Number(user.claimable)).toFixed(4));
    user.claimable = 0;
    user.claims && user.claims.push(newClaim);

    await this.userRepository.save(user);

    res.status(200).json({
      status: "success",
      message: "Earnings claimed successfully"
    });
  }
  
}