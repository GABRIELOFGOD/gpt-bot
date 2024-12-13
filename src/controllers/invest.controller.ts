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
import { CoinService } from "../services/coin.service";
import { Downlines } from "src/dtos/downlines";


export class InvestmentController {
  private isRunning = false;
  constructor(
    private investmentService: InvestmentService,
    private readonly coinService: CoinService,
    private readonly userRepository: Repository<User>,
    private readonly investmentRepository: Repository<Investment>,
    private readonly earningHistoryRepository: Repository<EarningsHistory>,
    private readonly claimRepository: Repository<Claim>
  ) {
    this.autoExecute();
  }

  // ================= AUTO EXECUTE AFTER 20 SECONDS ================= //

  private autoExecute() {
    cron.schedule('*/20 * * * * *', async () => {
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
    const { amount, wallet } = req.body;

    // ============== VALIDATE REQUEST ============== //
    if (!amount) return next(new AppError("Amount is required", 400));
    if (!wallet) return next(new AppError("Wallet address is required", 400));

    // ====================== GET USER ====================== //
    const reqUser = req.user;
    if (!reqUser) return next(new AppError("User not found", 400));

    // ========================= FIND USER ========================= //
    const user = await this.userRepository.findOne({
      where: { email: reqUser.email }
    });

    if (!user) return next(new AppError("User not found", 400));

    // ============== CHECK USER ================== //
    if (user.role !== "user") return next(new AppError("You are not allowed to invest", 400));

    // ======================= CONFIRM WALLET OWNER ======================== //
    if (user.wallet !== wallet) return next(new AppError("Sorry you cannot invest with other people's wallet", 400));

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
  // async getInvestmentRoi() {
  //   try {
  //     // Fetch all active investments from the database
  //     const investments = await this.investmentRepository.find({ where: { expired: false } });

  //     for (const theInvestment of investments) {
  //       const investment = await this.investmentRepository.findOne({
  //         where: { id: theInvestment.id },
  //         relations: ["investor", "investor.referredBy", "investor.referredBy.referredBy", "investor.investments", "investor.investments.investor"]
  //       });

  //       if(!investment) continue;

  //       // Calculate ROI based on investment amount
  //       let roiPercentage = investment.amount < 2000 ? 0.001 : 0.002; // 0.1% or 0.2%
  //       let roi = investment.amount * roiPercentage;

  //       // Update the user's wallet with the ROI
  //       const user = investment.investor;
  //       user.claimableROI = parseFloat((Number(user.claimableROI) + Number(roi)).toFixed(4));
  //       await this.userRepository.save(user);

  //       // Process referral commissions
  //       if (user.referredBy) {
  //         let referrer = await this.userRepository.findOne({
  //           where: { email: user.referredBy.email }
  //         });
  //         let generation = 1;

  //         while (referrer && generation <= 20) {
  //           // Calculate referral bonus percentage for the current generation
  //           let bonusPercentage = 0;
  //           if (generation === 1) bonusPercentage = 0.5;
  //           else if (generation === 2) bonusPercentage = 0.3;
  //           else if (generation === 3) bonusPercentage = 0.2;
  //           else if (generation === 4 || generation === 5) bonusPercentage = 0.1;
  //           else if (generation >= 6 && generation <= 10) bonusPercentage = 0.05;
  //           else if (generation >= 11 && generation <= 20) bonusPercentage = 0.03;

  //           // Calculate referral commission from the valid investment's ROI
  //           let referralCommission = roi * bonusPercentage;

  //           // Add commission to the referrer's wallet
  //           referrer.claimableRef = parseFloat((Number(user.claimableRef) + Number(referralCommission)).toFixed(4));
  //           await this.userRepository.save(referrer);

  //           // Move to the next generation's referrer (upline)
  //           referrer = await this.userRepository.findOne({
  //             where: { email: referrer.referredBy?.email }
  //           });

  //           generation++;

  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error calculating ROI and referral commissions:", error);
  //   }
  // }

  // getInvestmentRoi = async () => {
  //   // ================ GET ALL USERS WITH INVESTMENTS AND REFERRED USERS ================ //
  //   const users = await this.userRepository.find({
  //     relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory"],
  //   });

  //   for (let user of users) {
  //     if (!user.investments || user.investments.length === 0) continue;

  //     // ======================= CALCULATE TOTAL INVESTMENT ======================= //
  //     const totalInvestment = user.investments.reduce((sum, investment) => sum + parseFloat(investment.amount.toString()), 0);

  //     if(user.earningsHistory.reduce((amount, earning) => amount+earning.amountEarned, 0) >= totalInvestment*3) continue;

  //     // ======================= CALCULATE ROI ======================= //
  //     const roi = this.investmentService.calculateInvestmentRoi(totalInvestment);

  //     // ======================= UPDATE USER BALANCE ======================= //
  //     user.claimableROI = parseFloat((Number(user.claimableROI) + Number(roi)).toFixed(4));

  //     // ======================= ADD EARNINGS TO EARNINGS HISTORY ================= //
  //     const newEarning = this.earningHistoryRepository.create({
  //       amountEarned: roi,
  //       user,
  //       generationLevel: 0,
  //     });
  //     const addedEarning = await this.earningHistoryRepository.save(newEarning);
  //     user.earningsHistory && user.earningsHistory.push(addedEarning);

  //     // ======================= CALCULATE REFERRAL BONUS IF APPLICABLE ======================= //
  //     if (user.referredUsers && user.referredUsers.length > 0) {
  //       // console.log("running referral bonus");
  //       const referralBonus = await this.investmentService.calculateReferralBonus(user, 1);
  //       // console.log("referral bonus: ", referralBonus);
  //       user.claimableRef = parseFloat((Number(user.claimableRef) + Number(referralBonus)).toFixed(4));
  //     }

  //     // ====================== SAVE USER ====================== //
  //     await this.userRepository.save(user);
  //     console.log(`User: ${user.wallet} ROI: ${roi}`);
  //     console.log(`User: ${user.wallet} Balance: ${user.claimableROI}`);
  //   }
  // };



  // Calculate ROI for self-investment
  calculateSelfInvestmentROI(user: User) {
    const roiRate = user.investments.reduce((total, invest) => total + invest.amount, 0) >= 2000 ? 0.002 : 0.001;
    const dailyROI = user.investments.reduce((total, invest) => total + invest.amount, 0) * roiRate;

    return dailyROI;
  }

  // Calculate referral overriding income
  async calculateReferralROI(user: User) {
    const levels = [
      { level: 1, rate: 0.5, minSponsors: 1, selfInvestment: 100, directBusiness: 100 },
      { level: 2, rate: 0.3, minSponsors: 2, selfInvestment: 100, directBusiness: 300 },
      { level: 3, rate: 0.2, minSponsors: 3, selfInvestment: 200, directBusiness: 500 },
      { level: 4, rate: 0.1, minSponsors: 4, selfInvestment: 200, directBusiness: 1000 },
      { level: 5, rate: 0.1, minSponsors: 5, selfInvestment: 300, directBusiness: 1000 },
      { level: 6, rate: 0.1, minSponsors: 6, selfInvestment: 300, directBusiness: 1500 },
      { level: 7, rate: 0.05, minSponsors: 7, selfInvestment: 500, directBusiness: 1500 },
      { level: 8, rate: 0.05, minSponsors: 8, selfInvestment: 500, directBusiness: 2000 },
      { level: 9, rate: 0.05, minSponsors: 9, selfInvestment: 500, directBusiness: 2000 },
      { level: 10, rate: 0.05, minSponsors: 10, selfInvestment: 500, directBusiness: 2500 },
      { level: 11, rate: 0.03, minSponsors: 10, selfInvestment: 1000, directBusiness: 3000 },
      { level: 16, rate: 0.03, minSponsors: 10, selfInvestment: 1500, directBusiness: 4000 },
    ];
    const allDownlines = await this.fetchAllLevelDownlines({
      user,
      type: "active"
    });
    let referralROI = 0;

    for (const level of levels) {
      if (
        user.referredUsers.length >= level.minSponsors &&
        user.investments.reduce((total, invest) => total + invest.amount, 0) >= level.selfInvestment &&
        user.referredUsers.reduce((total, referredUser) => {
          return total + referredUser.investments.reduce((sum, investment) => sum + investment.amount, 0);
        }, 0) >= level.directBusiness
      ) {
        // for (const theReferral of user.referredUsers) {
        //   const referral = await this.userRepository.findOne({
        //     where: { id: theReferral.id },
        //     relations: ["investments", "earningsHistory"],
        //   });

        //   if (!referral) continue;

        //   const userEarnings = this.calculateSelfInvestmentROI(referral);
        //   const amountEarned = userEarnings * level.rate;
        //   referralROI += amountEarned;

        //   const newEarning = this.earningHistoryRepository.create({
        //     amountEarned,
        //     user: referral,
        //     generationLevel: level.level,
        //   });
        //   const addedEarning = await this.earningHistoryRepository.save(newEarning);
        //   // console.log("New Earning", addedEarning);

        //   if (!user.earningsHistory) {
        //     user.earningsHistory = [];
        //   }
        //   user.earningsHistory.push(addedEarning);
        //   await this.userRepository.save(user);
        // }
        const levelDownlines = allDownlines.filter(downline => downline.level === level.level);
        for (const downline of levelDownlines) {
          const referral = await this.userRepository.findOne({
            where: { id: downline.id },
            relations: ["investments", "earningsHistory"],
          });

          if (!referral) continue;

          const userEarnings = this.calculateSelfInvestmentROI(referral);
          const amountEarned = userEarnings * level.rate;
          referralROI += amountEarned;

          if (amountEarned > 0) {
            const newEarning = this.earningHistoryRepository.create({
              amountEarned,
              user: referral,
              generationLevel: level.level,
            });
            const addedEarning = await this.earningHistoryRepository.save(newEarning);
            // console.log("New Earning", addedEarning);

            if (!user.earningsHistory) {
              user.earningsHistory = [];
            }
            user.earningsHistory.push(addedEarning);
            await this.userRepository.save(user);
          }
        }
      }
    }

    // levels.forEach((level) => {
    //     if (
    //         user.referredUsers && user.referredUsers.length >= level.minSponsors &&
    //         user.investments.reduce((total, invest) => total+invest.amount, 0) >= level.selfInvestment &&
    //         // user.referredUsers.reduce >= level.directBusiness
    //         user.referredUsers.reduce((total, referredUser) => {
    //           return total + referredUser.investments.reduce((sum, investment) => sum + investment.amount, 0);
    //         }, 0) >= level.directBusiness
    //     ) {
    //         user.referredUsers.forEach(async (theReferral) => {
    //           const referral = await this.userRepository.findOne({
    //             where: { id: theReferral.id },
    //             relations: ["investments", "earningsHistory", "referredUsers", "referredUsers.investments"],
    //           });

    //           if (!referral) return;

    //             // referralROI += referral.investments.reduce((amount, invest) => amount+invest.amount, 0) * level.rate;
    //           const userEarnings = this.calculateSelfInvestmentROI(referral);
    //           referralROI += userEarnings * level.rate;

    //           const newEarning = this.earningHistoryRepository.create({
    //             amountEarned: userEarnings * level.rate,
    //             user: referral,
    //             generationLevel: level.level,
    //           });
    //           await this.earningHistoryRepository.save(newEarning);
    //           referral.earningsHistory && referral.earningsHistory.push(newEarning);
    //           await this.userRepository.save(referral);
    //           // console.log("Earning", referral.earningsHistory);
    //         });
    //     }
    // });

    return referralROI;
  }

  async fetchAllLevelDownlines({ user, type }: { user: User, type: "active" | "inactive" | "all" }) {
    let allDownlines: Downlines[] = [];
    // Recursive function to fetch referrals up to the 20th generation
    const fetchReferrals = async (currentUser: User, level: number) => {
      if (level > 20 || !currentUser.referredUsers || currentUser.referredUsers.length === 0) return;

      for (const referral of currentUser.referredUsers) {
        // Fetch investments for the referral
        const investments = await this.investmentRepository.find({
          where: { investor: referral },
        });
        const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

        // Add the referral to allDownlines with its level
        allDownlines.push({
          ...referral, level
        });

        // Fetch the referral's own referrals recursively
        const referralDetails = await this.userRepository.findOne({
          where: { wallet: referral.wallet },
          relations: ["referredUsers", "referredUsers.investments"],
        });

        if (referralDetails) {
          await fetchReferrals(referralDetails, level + 1);
        }
      }
    };

    // Start fetching referrals from the top level
    await fetchReferrals(user, 1);
    return allDownlines;
  }
  getInvestmentRoi = async () => {
    const users = await this.userRepository.find();

    for (const theUser of users) {
      const user = await this.userRepository.findOne({
        where: { id: theUser.id },
        relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory"],
      });

      if (!user || !user.investments || !user.investments.length) continue;

      user.claimableROI = Number(user.claimableROI) || 0;
      user.claimableRef = Number(user.claimableRef) || 0;

      const selfROI = this.calculateSelfInvestmentROI(user) || 0;
      const newEarning = this.earningHistoryRepository.create({
        amountEarned: selfROI,
        user,
        generationLevel: 0,
      });
      await this.earningHistoryRepository.save(newEarning);

      const referralROI = await this.calculateReferralROI(user) || 0;
      user.earningsHistory.push(newEarning);

      user.claimableROI = parseFloat((user.claimableROI + selfROI).toFixed(4));
      user.claimableRef = parseFloat((user.claimableRef + referralROI).toFixed(4));

      console.log({ userId: user.id, claimableROI: user.claimableROI, claimableRef: user.claimableRef });
      await this.userRepository.save(user);
    }

    // for (const theUser of users) {
    //   const user = await this.userRepository.findOne({
    //     where: { id: theUser.id },
    //     relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory"],
    //   });

    //   if (!user || !user.investments || !user.investments.length) continue;

    //   // Ensure claimableROI and claimableRef are numbers
    //   user.claimableROI = isNaN(Number(user.claimableROI)) ? 0 : Number(user.claimableROI);
    //   user.claimableRef = isNaN(Number(user.claimableRef)) ? 0 : Number(user.claimableRef);

    //   const selfROI = this.calculateSelfInvestmentROI(user) || 0;

    //   const newEarning = this.earningHistoryRepository.create({
    //     amountEarned: selfROI,
    //     user,
    //     generationLevel: 0,
    //   });
    //   await this.earningHistoryRepository.save(newEarning);
    //   user.earningsHistory && user.earningsHistory.push(newEarning);
    //   const referralROI = await this.calculateReferralROI(user) || 0;

    //   // Perform calculations
    //   user.claimableROI = parseFloat((user.claimableROI + selfROI).toFixed(4));
    //   user.claimableRef = parseFloat((user.claimableRef + referralROI).toFixed(4));

    //   // Log for debugging
    //   console.log({
    //     userId: user.id,
    //     claimableROI: user.claimableROI,
    //     claimableRef: user.claimableRef,
    //     selfROI,
    //     referralROI,
    //   });

    //   await this.userRepository.save(user);
    // }
  };

  // Endpoint to calculate ROI
  // app.post("/calculate-roi", (req, res) => {
  //   const userId = req.body.userId;
  //   const user = users.find((u) => u.id === userId);

  //   if (!user) {
  //       return res.status(404).json({ message: "User not found" });
  //   }

  //   const selfROI = calculateSelfInvestmentROI(user);
  //   const referralROI = calculateReferralROI(user);

  //   res.json({
  //       message: "ROI Calculated",
  //       selfROI,
  //       referralROI,
  //       totalDailyROI: selfROI + referralROI,
  //   });
  // });

  claimRefEarnings = async (req: Request, res: Response, next: NextFunction) => {

    // ====================== GET USER ====================== //
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

    const gptRate = this.coinService.converter(user.claimableRef);
    user.claimableRef = 0;
    user.gptBalance = parseFloat((Number(user.gptBalance) + Number(gptRate)).toFixed(4));
    user.claims && user.claims.push(newClaim);

    await this.userRepository.save(user);
    res.status(200).json({
      status: "success",
      message: "Earnings claimed successfully, check your GPT balance"
    });

    // const reqUser = req.user;
    // if (!reqUser) return next(new AppError("User not found", 400));

    // const user = await this.userRepository.findOne({
    //   where: { email: reqUser.email }
    // });

    // if (!user) return next(new AppError("User not found", 400));

    // if (user.claimableRef <= 0) return next(new AppError("No earnings to claim", 400));

    // // ====================== CREATE NEW CLAIM ====================== //
    // const newClaim = this.claimRepository.create({
    //   amount: user.claimableRef,
    //   user
    // });

    // // ====================== SAVE NEW CLAIM ====================== //
    // await this.claimRepository.save(newClaim);

    // user.balance = parseFloat((Number(user.balance) + Number(user.claimableRef)).toFixed(4));
    // user.claimableRef = 0;
    // user.claims && user.claims.push(newClaim);

    // await this.userRepository.save(user);

    // res.status(200).json({
    //   status: "success",
    //   message: "Earnings claimed successfully"
    // });
  }

  claimRoi = async (req: Request, res: Response, next: NextFunction) => {
    // ====================== GET USER ====================== //
    const reqUser = req.user;
    if (!reqUser) return next(new AppError("User not found", 400));

    const user = await this.userRepository.findOne({
      where: { email: reqUser.email }
    });

    if (!user) return next(new AppError("User not found", 400));

    if (user.claimableROI <= 0) return next(new AppError("No earnings to claim", 400));

    // ====================== CREATE NEW CLAIM ====================== //
    const newClaim = this.claimRepository.create({
      amount: user.claimableROI,
      user
    });

    // ====================== SAVE NEW CLAIM ====================== //
    await this.claimRepository.save(newClaim);

    const gptRate = this.coinService.converter(user.claimableROI);
    user.claimableROI = 0;
    user.gptBalance = parseFloat((Number(user.gptBalance) + Number(gptRate)).toFixed(4));
    user.claims && user.claims.push(newClaim);

    await this.userRepository.save(user);
    res.status(200).json({
      status: "success",
      message: "Earnings claimed successfully, check your GPT balance"
    });
  }

  getAllInvestments = async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    if (!theUser) return next(new AppError("User not found", 400));
    const user = await this.userRepository.findOne({
      where: { email: theUser.email }
    });
    if (!user) return next(new AppError("User not found", 400));
    if (user.role !== "admin") return next(new AppError("You are not allowed to view all investments", 400));

    const investments = await this.investmentRepository.find();
    res.status(200).json({
      status: "success",
      data: investments
    });
  }

}