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
import { ethers } from "ethers";


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
    cron.schedule('0/40 * * * * *', async () => {
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

  // private autoExecute() {
  //   cron.schedule('0 0 * * *', async () => {
  //     if (this.isRunning) {
  //       console.log("Skipped execution: getInvestmentRoi is already running");
  //       return;
  //     }
      
  //     this.isRunning = true;  // Acquire the "lock"

  //     try {
  //       console.log("Running getInvestmentRoi...");
  //       await this.getInvestmentRoi();  // Ensure this function is async to handle delays properly
  //       console.log("getInvestmentRoi completed successfully");
  //     } catch (error) {
  //       console.error("Error in getInvestmentRoi:", error);
  //       // Optionally, you can add a retry or notification mechanism here
  //     } finally {
  //       this.isRunning = false;  // Release the "lock"
  //     }
  //   });
  // }
  
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
    
    // ============== CHECK USER ================== //
    if(user.role !== "user") return next(new AppError("You are not allowed to invest", 400))

    // ======================= CREATE NEW INVESTMENT ======================= //
    const newInvestment = this.investmentRepository.create({
        amount,
        investor: user
    });

    // ======================= SAVE NEW INVESTMENT ======================= //
    const savedInvestment = await this.investmentRepository.save(newInvestment);

    // ======================= UPDATE USER BALANCE ======================= //
    // const currentBalance = parseFloat(user.balance as unknown as string);
    // const investmentAmount = parseFloat(savedInvestment.amount.toString());

    // const newBalance = parseFloat((currentBalance + investmentAmount).toFixed(4));

    // user.balance = newBalance;
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

  // createInvestment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //   const { amount, transactionHash } = req.body;

  //   // Validate required fields
  //   if (!amount || !transactionHash) {
  //     return next(new AppError("Amount and transaction hash are required", 400));
  //   }

  //   // Get the requesting user
  //   const reqUser = req.user;
  //   if (!reqUser) return next(new AppError("User not found", 400));

  //   const user = await this.userRepository.findOne({
  //     where: { email: reqUser.email },
  //   });

  //   if (!user) return next(new AppError("User not found", 400));
  //   if (user.role !== "user") return next(new AppError("You are not allowed to invest", 400));

  //   // Verify transaction on-chain
  //   const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  //   const txReceipt = await provider.getTransactionReceipt(transactionHash);

  //   if (!txReceipt || txReceipt.status !== 1) {
  //     return next(new AppError("Transaction not found or not confirmed on-chain", 400));
  //   }

  //   // Fetch the transaction details using the transaction hash
  //   const transaction = await provider.getTransaction(transactionHash);

  //   if (!transaction) {
  //     return next(new AppError("Transaction not found", 400));
  //   }

  //   // Get the value from the transaction and format it to Ether
  //   const transactionValue = ethers.formatEther(transaction.value.toString());

  //   // Check if the transaction value matches the requested amount
  //   if (parseFloat(transactionValue) !== parseFloat(amount)) {
  //     return next(new AppError("Transaction amount does not match the requested amount", 400));
  //   }

  //   // Check for duplicate transaction hash
  //   const existingInvestment = await this.investmentRepository.findOne({
  //     where: { transactionHash },
  //   });

  //   if (existingInvestment) {
  //     return next(new AppError("This transaction has already been processed", 400));
  //   }

  //   // Create and save the new investment
  //   const newInvestment = this.investmentRepository.create({
  //     amount,
  //     investor: user,
  //     transactionHash,
  //   });

  //   const savedInvestment = await this.investmentRepository.save(newInvestment);

  //   // Update user properties
  //   user.hasActiveInvestment = true;
  //   await this.userRepository.save(user);

  //   // Return success response
  //   res.status(201).json({
  //     status: "success",
  //     message: `You have successfully invested ${amount}`,
  //   });
  // });

  // ================ GET ALL USERS WITH INVESTMENTS AND REFERRED USERS ================ //
  // const users = await this.userRepository.find({
  //   relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory"],
  // });

  // for (let user of users) {
  //   if (!user.investments || user.investments.length === 0) continue;

  //   // ======================= CALCULATE TOTAL INVESTMENT ======================= //
  //   const totalInvestment = user.investments.reduce((sum, investment) => sum + parseFloat(investment.amount.toString()), 0);

  //   if(user.balance+user.claimableROI+user.claimableRef >= totalInvestment*3) continue;

  //   // ======================= CALCULATE ROI ======================= //
  //   const roi = this.investmentService.calculateInvestmentRoi(totalInvestment);

  //   // ======================= UPDATE USER BALANCE ======================= //
  //   user.balance = parseFloat((Number(user.balance) + Number(roi)).toFixed(4));

  //   // ======================= ADD EARNINGS TO EARNINGS HISTORY ================= //
  //   const newEarning = this.earningHistoryRepository.create({
  //     amountEarned: roi,
  //     user,
  //     generationLevel: 0,
  //   });
  //   const addedEarning = await this.earningHistoryRepository.save(newEarning);
  //   user.earningsHistory && user.earningsHistory.push(addedEarning);

  //   // ======================= CALCULATE REFERRAL BONUS IF APPLICABLE ======================= //
  //   if (user.referredUsers && user.referredUsers.length > 0) {
  //     console.log("running referral bonus");
  //     const referralBonus = await this.investmentService.calculateReferralBonus(user, 1);
  //     console.log("referral bonus: ", referralBonus);
  //     user.claimableRef = parseFloat((Number(user.claimableRef) + Number(referralBonus)).toFixed(4));
  //     // user.claimableRef = parseFloat((user.claimableRef + referralBonus).toString());
  //   }

  //   // ====================== SAVE USER ====================== //
  //   await this.userRepository.save(user);
  //   console.log(`User: ${user.wallet} ROI: ${roi}`);
  //   console.log(`User: ${user.wallet} Balance ref: ${user.claimableRef}`);
  //   console.log(`User: ${user.wallet} Balance: ${user.balance}`);
  // }
  async getInvestmentRoi() {
    try {
      // Fetch all active investments from the database
      const investments = await this.investmentRepository.find({ where: { expired: false } });
  
      for (const theInvestment of investments) {
        const investment = await this.investmentRepository.findOne({
          where: { id: theInvestment.id },
          relations: ["investor", "investor.referredBy", "investor.referredBy.referredBy", "investor.investments", "investor.investments.investor"]
        });

        if(!investment) continue;
        
        // Calculate ROI based on investment amount
        let roiPercentage = investment.amount < 2000 ? 0.001 : 0.002; // 0.1% or 0.2%
        let roi = investment.amount * roiPercentage;
  
        // Update the user's wallet with the ROI
        const user = investment.investor;
        user.claimableROI = parseFloat((Number(user.balance) + Number(roi)).toFixed(4));
        await this.userRepository.save(user);
  
        // Process referral commissions
        if (user.referredBy) {
          let referrer = await this.userRepository.findOne({
            where: { email: user.referredBy.email }
          });
          let generation = 1;
  
          while (referrer && generation <= 20) {
            // Calculate referral bonus percentage for the current generation
            let bonusPercentage = 0;
            if (generation === 1) bonusPercentage = 0.5;
            else if (generation === 2) bonusPercentage = 0.3;
            else if (generation === 3) bonusPercentage = 0.2;
            else if (generation === 4 || generation === 5) bonusPercentage = 0.1;
            else if (generation >= 6 && generation <= 10) bonusPercentage = 0.05;
            else if (generation >= 11 && generation <= 20) bonusPercentage = 0.03;
  
            // Calculate referral commission from the valid investment's ROI
            let referralCommission = roi * bonusPercentage;
  
            // Add commission to the referrer's wallet
            referrer.claimableRef = parseFloat((Number(user.claimableRef) + Number(referralCommission)).toFixed(4));
            await this.userRepository.save(referrer);
  
            // Move to the next generation's referrer (upline)
            referrer = await this.userRepository.findOne({
              where: { email: referrer.referredBy?.email }
            });

            generation++;
            
          }
        }
      }
    } catch (error) {
      console.error("Error calculating ROI and referral commissions:", error);
    }
  }
  

  claimRefEarnings = async (req: Request, res: Response, next: NextFunction) => {
    const reqUser = req.user;
    if (!reqUser) return next(new AppError("User not found", 400));

    const user = await this.userRepository.findOne({
      where: { email: reqUser.email }
    });

    if (!user) return next(new AppError("User not found", 400));

    if (user.claimableRef <= 0) return next(new AppError("No earnings to claim", 400));

    // ====================== CREATE NEW CLAIM ====================== //
    const newClaim = this.claimRepository.create({
      amount: user.claimableRef,
      user
    });

    // ====================== SAVE NEW CLAIM ====================== //
    await this.claimRepository.save(newClaim);

    user.balance = parseFloat((Number(user.balance) + Number(user.claimableRef)).toFixed(4));
    user.claimableRef = 0;
    user.claims && user.claims.push(newClaim);

    await this.userRepository.save(user);

    res.status(200).json({
      status: "success",
      message: "Earnings claimed successfully"
    });
  }
  
}