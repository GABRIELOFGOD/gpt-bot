import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
// import { MailerService } from "./email.service";
import { dataSource } from "../config/dataSource";
import { EarningsHistory } from "../entities/earningHistory.entity";
import cron from 'node-cron';

export class InvestmentService {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly earningHistoryRepository: Repository<EarningsHistory>

  ){}
  
  calculateInvestmentRoi(amount: number): number{
    let roi = 0;
    if (amount <= 2000) {
      roi = amount * 0.001;
    } else {
      roi = amount * 0.002;
    }
    return roi;
  }

  async criterialCalculator(theUser: User, level: number): Promise<boolean>{
    const user = await this.userRepository.findOne({
      where: {
        wallet: theUser.wallet
      },
      relations: ["referredUsers", "investments", "referredUsers.investments"]
    });

    if(!user) return false;
    
    if(level > 20) return false;
    if(level === 1) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 100 && user.referredUsers && user.referredUsers.length >= 1 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 100;
      })) return true;
      return false;
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 100;
      // user.referredUsers.length >= 1;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 100;
      // });
      // return true;
    };
    if(level === 2) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 100 && user.referredUsers && user.referredUsers.length >= 2 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 300;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 100;
      // user.referredUsers.length >= 2;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 300;
      // });
      return false;
    };
    if(level === 3) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 200 && user.referredUsers && user.referredUsers.length >= 3 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 500;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 200;
      // user.referredUsers.length >= 3;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500;
      // });
      return false;
    };
    if(level === 4) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 200 && user.referredUsers && user.referredUsers.length >= 4 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 1000;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 200;
      // user.referredUsers.length >= 4;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 1000;
      // });
      return false;
    };
    if(level === 5) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 300 && user.referredUsers && user.referredUsers.length >= 5 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 1000;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 300;
      // user.referredUsers.length >= 5;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 1000;
      // });
      return true;
    };
    if(level === 6) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 300 && user.referredUsers && user.referredUsers.length >= 6 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 1500;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 300;
      // user.referredUsers.length = level;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 1500;
      // });
      return false;
    };
    if(level === 7) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500 && user.referredUsers && user.referredUsers.length >= 7 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 1500;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500;
      // user.referredUsers.length = level;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 1500;
      // });
      return false;
    };
    if(level === 8) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500 && user.referredUsers && user.referredUsers.length >= 8 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 2000;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500;
      // user.referredUsers.length = level;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 2000;
      // });
      return false;
    };
    if(level === 9) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500 && user.referredUsers && user.referredUsers.length >= 9 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 2000;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500;
      // user.referredUsers.length = level;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 2000;
      // });
      return false;
    };
    if(level === 10) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500 && user.referredUsers && user.referredUsers.length >= 10 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 2500;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 500;
      // user.referredUsers.length = level;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 2500;
      // });
      return false;
    };
    if(level >= 11 && level <= 15) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 1000 && user.referredUsers && user.referredUsers.length >= 10 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 3000;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 1000;
      // user.referredUsers.length = 10;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 3000;
      // });
      return false;
    }
    if(level >= 16 && level <= 20) {
      if(user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 1500 && user.referredUsers && user.referredUsers.length >= 10 && user.referredUsers.every(referral => {
        return referral.investments.reduce((sum, investment) => sum+investment.amount, 0) >= 4000;
      })) return true;
      
      // user.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 1500;
      // user.referredUsers.length = 10;
      // user.referredUsers.forEach(referral => {
      //   referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= 4000;
      // });
      return false;
    }
    return false;
  }

  async calculateReferralBonus(user: User, generation: number): Promise<number> {
    if (generation > 20) return 0;

    let bonus = 0;
    const theUser = await this.userRepository.findOne({
      where: { wallet: user.wallet },
      relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory"],
    });

    if (!theUser) return 0;
    const checkCriteria = await this.criterialCalculator(theUser, generation);
    if (!checkCriteria) return 0;

    const referrals = theUser.referredUsers;

    for (const referral of referrals) {
      const referralTotalInvestment = referral.investments.reduce((sum, investment) => sum + investment.amount, 0);
      let bonusPercentage = 0;

      if (generation === 1) {
        bonusPercentage = 0.5;
      } else if (generation === 2) {
        bonusPercentage = 0.3;
      } else if (generation === 3) {
        bonusPercentage = 0.2;
      } else if (generation === 4) {
        bonusPercentage = 0.1;
      } else if (generation === 5) {
        bonusPercentage = 0.1;
      } else if (generation >= 6 && generation <= 10) {
        bonusPercentage = 0.05;
      } else if (generation >= 11 && generation <= 15) {
        bonusPercentage = 0.03;
      } else if (generation >= 16 && generation <= 20) {
        bonusPercentage = 0.03;
      }

      const referralDailyEarnings = referralTotalInvestment <= 2000 ? referralTotalInvestment * 0.001 : referralTotalInvestment * 0.002;
      bonus += referralDailyEarnings * bonusPercentage;

      bonus += await this.calculateReferralBonus(referral, generation + 1);
    }

    return bonus;
  }
  
  // private mailerService: MailerService;
  // private userRepository: Repository<User>;
  // private earningsHistoryRepository: Repository<EarningsHistory>;

  // constructor() {
  //   this.mailerService = new MailerService();
  //   this.userRepository = dataSource.getRepository(User);
  //   this.earningsHistoryRepository = dataSource.getRepository(EarningsHistory);
  //   this.scheduleDailyEarnings();
  // }
  



  // scheduleDailyEarnings() {
  //   cron.schedule('0 */10 * * *', async () => {
  //     console.log('Running daily earnings processing job');
  //     const users = await this.userRepository.find({ where: { hasActiveInvestment: true } });
  //     for (const user of users) {
  //       await this.applyEarnings(user);
  //     }
  //     console.log('Daily earnings processing job completed');
  //   }, { timezone: "GMT" });
  // }
  
  
  
  
  // async processDailyEarnings() {
  //   // Pseudo-code for iterating over all users with active investments
  //   const users = await this.userRepository.find({ where: { hasActiveInvestment: true } });
    
  //   for (const user of users) {
  //     const totalInvestment = user.investments.reduce((sum, investment) => sum + investment.amount, 0);
  //     const currentBalance = user.balance;

  //     // Calculate 300% cap
  //     const earningsCap = totalInvestment * 3;

  //     if (currentBalance >= earningsCap) {
  //       // Send email notification
  //       await this.mailerService.sendTopUpNotification(user.email, user.email);
  //       console.log(`Top-up notification sent to user: ${user.email}`);
  //       continue; // Skip further processing for capped users
  //     }

  //     // Calculate daily earnings based on investment amount and update user balance
  //     const dailyEarnings = await this.calculateDailyEarnings(user); // Function that calculates based on criteria
  //     user.balance += dailyEarnings;

  //     // Save the updated balance
  //     await this.userRepository.save(user);

  //     // Log the earnings
  //     await this.earningsHistoryRepository.save({
  //       user,
  //       amountEarned: dailyEarnings,
  //       date: new Date(),
  //     });
  //   }
  // }


  // // ============== CALCULATE DAILY EARNINGS ============== //
  // async calculateDailyEarnings(user: User): Promise<number> {
  //   let dailyEarnings = 0;
  //   const totalInvestment = user.investments.reduce((sum, investment) => sum + investment.amount, 0);

  //   // Calculate based on investment thresholds
  //   if (totalInvestment <= 2000) {
  //     dailyEarnings = totalInvestment * 0.001; // 0.1% earnings
  //   } else {
  //     dailyEarnings = totalInvestment * 0.002; // 0.2% earnings
  //   }

  //   return dailyEarnings;
  // }

  // // ============== APPLY EARNINGS ==============
  // async applyEarnings(user: User) {
  //   const thisUser = await this.userRepository.findOne({
  //     where: {
  //       email: user.email
  //     },
  //     relations: ["investments"]
  //   })

  //   if (!thisUser) return;

  //   const totalInvestment = thisUser.investments.reduce((sum, investment) => sum + investment.amount, 0);

  //   const earningsCap = totalInvestment * 3;

  //   let dailyEarnings = 0;
  //   if (totalInvestment <= 2000) {
  //     dailyEarnings = totalInvestment * 0.001;
  //   } else {
  //     dailyEarnings = totalInvestment * 0.002;
  //   }

  //   thisUser.balance += dailyEarnings;
  //   const savedUser = await this.userRepository.save(thisUser);
  //   console.log("Earnings applied for user: ", savedUser.email, "with balnace ", savedUser.balance);
    
  //   // const totalInvestment = user.investments.reduce((sum, investment) => sum + investment.amount, 0);
  //   // const earningsCap = totalInvestment * 3;
  
  //   // // Daily Earnings Calculation
  //   // let dailyEarnings = 0;
  //   // if (totalInvestment <= 2000) {
  //   //   dailyEarnings = totalInvestment * 0.001; // 0.1%
  //   // } else {
  //   //   dailyEarnings = totalInvestment * 0.002; // 0.2%
  //   // }
  
  //   // // Referral Bonuses Calculation (up to 20 generations)
  //   // const referralBonus = await this.calculateReferralBonus(user, 1);
  
  //   // // Total earnings (daily + referral bonuses)
  //   // let totalEarnings = dailyEarnings + referralBonus;
  
  //   // // Apply the 300% earnings cap
  //   // if (user.balance + totalEarnings > earningsCap) {
  //   //   totalEarnings = Math.max(0, earningsCap - user.balance);
  //   //   await this.mailerService.sendTopUpNotification(user.email, user.email); // Notify user
  //   // }
  
  //   // // Update user balance
  //   // user.balance += totalEarnings;
  
  //   // // Save to earnings history
  //   // const earningsRecord = this.earningsHistoryRepository.create({
  //   //   user,
  //   //   amountEarned: totalEarnings,
  //   // });
  //   // await this.earningsHistoryRepository.save(earningsRecord);
  
  //   // // Update user record with the new balance
  //   // await this.userRepository.save(user);
  // }
   
  

  // async calculateReferralBonus(user: User, generation: number): Promise<number> {
  //   // Base case: stop at the 20th generation
  //   if (generation > 20) return 0;
  
  //   // Fetch the user's direct referrals
  //   const referrals = await this.userRepository.find({
  //     where: { referredBy: user },
  //     relations: ["investments"],
  //   });
  
  //   let generationBonus = 0;
  
  //   for (const referral of referrals) {
  //     // Calculate total investment for the referral by summing up their investments
  //     const referralTotalInvestment = referral.investments.reduce((sum, investment) => sum + investment.amount, 0);
  
  //     // Calculate the bonus percentage based on the generation
  //     let bonusPercentage = 0;
  //     if (generation === 1) {
  //       bonusPercentage = 0.5;
  //     } else if (generation === 2 && user.referredUsers.length >= 2 && referralTotalInvestment >= 300) {
  //       bonusPercentage = 0.3;
  //     } else if (generation === 3 && user.referredUsers.length >= 3 && referralTotalInvestment >= 500) {
  //       bonusPercentage = 0.2;
  //     } else if (generation === 4 && user.referredUsers.length >= 4 && referralTotalInvestment >= 1000) {
  //       bonusPercentage = 0.1;
  //     } else if (generation === 5 && user.referredUsers.length >= 5 && referralTotalInvestment >= 1000) {
  //       bonusPercentage = 0.1;
  //     } else if (generation >= 6 && generation <= 10 && user.referredUsers.length >= generation && referralTotalInvestment >= 1500) {
  //       bonusPercentage = 0.05;
  //     } else if (generation >= 11 && generation <= 15 && user.referredUsers.length >= 10 && referralTotalInvestment >= 3000) {
  //       bonusPercentage = 0.03;
  //     } else if (generation >= 16 && generation <= 20 && user.referredUsers.length >= 10 && referralTotalInvestment >= 4000) {
  //       bonusPercentage = 0.03;
  //     }
  
  //     // Calculate and add the bonus based on the referral's daily earnings
  //     const referralDailyEarnings = referralTotalInvestment <= 2000 ? referralTotalInvestment * 0.001 : referralTotalInvestment * 0.002;
  //     generationBonus += referralDailyEarnings * bonusPercentage;
  
  //     // Recursive call to calculate the bonus from the next generation
  //     generationBonus += await this.calculateReferralBonus(referral, generation + 1);
  //   }
  
  //   return generationBonus;
  // }   

}