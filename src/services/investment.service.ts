import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
// import { MailerService } from "./email.service";
import { dataSource } from "../config/dataSource";
import { EarningsHistory } from "../entities/earningHistory.entity";
import cron from 'node-cron';
import { Investment } from "../entities/investment.entity";

export class InvestmentService {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly earningHistoryRepository: Repository<EarningsHistory>,
    private readonly investmentRepository: Repository<Investment>
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
        email: theUser.email
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

  // async calculateReferralBonus(user: User, generation: number, cUser?: User): Promise<number> {
  //   if (generation > 20) return 0;
  //   // console.log("Running at generation", generation);

  //   let bonus = 0;
  //   const theUser = await this.userRepository.findOne({
  //     where: { wallet: user.wallet },
  //     relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory", "referredUsers.referredUsers"],
  //   });

  //   if (!theUser) return 0;

  //   const criteriaUser = cUser || user;
  //   const checkCriteria = await this.criterialCalculator(criteriaUser, generation);
  //   if (!checkCriteria) return 0;

  //   const referrals = theUser.referredUsers;

  //   for (const theReferral of referrals) {
  //     const referral = await this.userRepository.findOne({
  //       where: { wallet: theReferral.wallet },
  //       relations: ["investments", "referredUsers"]
  //     });
  //     if (!referral) continue;

  //     const referralTotalInvestment = referral.investments.reduce((sum, investment) => sum + investment.amount, 0);
  //     let bonusPercentage = 0;

  //     if (generation === 1) {
  //       bonusPercentage = 0.5;
  //     } else if (generation === 2) {
  //       bonusPercentage = 0.3;
  //     } else if (generation === 3) {
  //       bonusPercentage = 0.2;
  //     } else if (generation === 4) {
  //       bonusPercentage = 0.1;
  //     } else if (generation === 5) {
  //       bonusPercentage = 0.1;
  //     } else if (generation >= 6 && generation <= 10) {
  //       bonusPercentage = 0.05;
  //     } else if (generation >= 11 && generation <= 15) {
  //       bonusPercentage = 0.03;
  //     } else if (generation >= 16 && generation <= 20) {
  //       bonusPercentage = 0.03;
  //     }

  //     const referralDailyEarnings = referralTotalInvestment <= 2000 ? referralTotalInvestment * 0.001 : referralTotalInvestment * 0.002;
  //     bonus += referralDailyEarnings * bonusPercentage;

  //     if (referral.referredUsers && referral.referredUsers.length > 0) {
  //       bonus += await this.calculateReferralBonus(referral, generation + 1, criteriaUser);
  //     }
  //   }

  //   return bonus;
  // }

  // =========================== SECOND OPTIMIZATION ============================ //
  // async criterialCalculator(theUser: User, level: number): Promise<boolean> {
  //   const user = await this.userRepository.findOne({
  //     where: { wallet: theUser.wallet },
  //     relations: ["referredUsers", "investments", "referredUsers.investments"],
  //   });
  
  //   if (!user || level > 20) return false;
  
  //   // Use `let` for mutable conditions and values within each level
  //   let requiredInvestment = 0;
  //   let requiredReferredUsers = 0;
  //   let referralInvestmentRequirement = 0;
  
  //   switch (level) {
  //     case 1:
  //       requiredInvestment = 100;
  //       requiredReferredUsers = 1;
  //       referralInvestmentRequirement = 100;
  //       break;
  //     case 2:
  //       requiredInvestment = 100;
  //       requiredReferredUsers = 2;
  //       referralInvestmentRequirement = 300;
  //       break;
  //     case 3:
  //       requiredInvestment = 200;
  //       requiredReferredUsers = 3;
  //       referralInvestmentRequirement = 500;
  //       break;
  //     case 4:
  //       requiredInvestment = 200;
  //       requiredReferredUsers = 4;
  //       referralInvestmentRequirement = 1000;
  //       break;
  //     case 5:
  //       requiredInvestment = 300;
  //       requiredReferredUsers = 5;
  //       referralInvestmentRequirement = 1000;
  //       break;
  //     default:
  //       return false;
  //   }
  
  //   const userInvestmentTotal = user.investments.reduce((sum, investment) => sum + investment.amount, 0);
  //   if (
  //     userInvestmentTotal >= requiredInvestment &&
  //     user.referredUsers.length >= requiredReferredUsers &&
  //     user.referredUsers.every(
  //       (referral) => referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= referralInvestmentRequirement
  //     )
  //   ) {
  //     return true;
  //   }
  
  //   return false;
  // }
  
  // // Referral Bonus calculation with updated variables
  // async calculateReferralBonus(user: User, generation: number): Promise<number> {
  //   if (generation > 20) return 0;
  
  //   let bonus = 0;
  //   const theUser = await this.userRepository.findOne({
  //     where: { wallet: user.wallet },
  //     relations: ["investments", "referredUsers", "referredUsers.investments"],
  //   });
  
  //   if (!theUser) return 0;
  //   const checkCriteria = await this.criterialCalculator(theUser, generation);
  //   if (!checkCriteria) return 0;
  
  //   const referrals = theUser.referredUsers;
  
  //   for (const referral of referrals) {
  //     let gottenUser = await this.userRepository.findOne({
  //       where: {
  //         wallet: referral.wallet
  //       },
  //       relations: ["investments", "referredUsers", "referredUsers.investments"],
  //     });
  //     if(!gottenUser) continue;
  //     const referralInvestmentTotal = gottenUser.investments.reduce((sum, investment) => sum + investment.amount, 0);
  //     let bonusPercentage = 0;
    
  //     if (generation === 1) bonusPercentage = 0.5;
  //     else if (generation === 2) bonusPercentage = 0.3;
  //     else if (generation === 3) bonusPercentage = 0.2;
  //     else if (generation === 4 || generation === 5) bonusPercentage = 0.1;
  //     else if (generation >= 6 && generation <= 10) bonusPercentage = 0.05;
  //     else if (generation >= 11 && generation <= 20) bonusPercentage = 0.03;
    
  //     const referralDailyEarnings = referralInvestmentTotal <= 2000 ? referralInvestmentTotal * 0.001 : referralInvestmentTotal * 0.002;
  //     bonus += referralDailyEarnings * bonusPercentage;
    
  //     // Check if the referral also has referrals and recursively calculate their bonuses
  //     if (referral.referredUsers && referral.referredUsers.length > 0) {
  //       bonus += await this.calculateReferralBonus(referral, generation + 1);
  //     }
  //   }
  
  //   return bonus;
  // }  

  // =========================== FIRST OPTIMIZATION ============================ //
  // const CRITERIA_CONFIG = [
  //   { level: 1, minInvestment: 100, minReferrals: 1, referralInvestment: 100 },
  //   { level: 2, minInvestment: 100, minReferrals: 2, referralInvestment: 300 },
  //   { level: 3, minInvestment: 200, minReferrals: 3, referralInvestment: 500 },
  //   { level: 4, minInvestment: 200, minReferrals: 4, referralInvestment: 1000 },
  //   { level: 5, minInvestment: 300, minReferrals: 5, referralInvestment: 1000 },
  //   { level: 6, minInvestment: 300, minReferrals: 6, referralInvestment: 1500 },
  //   { level: 7, minInvestment: 500, minReferrals: 7, referralInvestment: 1500 },
  //   { level: 8, minInvestment: 500, minReferrals: 8, referralInvestment: 2000 },
  //   { level: 9, minInvestment: 500, minReferrals: 9, referralInvestment: 2000 },
  //   { level: 10, minInvestment: 500, minReferrals: 10, referralInvestment: 2500 },
  //   { level: 11, minInvestment: 1000, minReferrals: 10, referralInvestment: 3000 },
  //   { level: 16, minInvestment: 1500, minReferrals: 10, referralInvestment: 4000 }
  // ];
  
  // const BONUS_PERCENTAGE = {
  //   1: 0.5,
  //   2: 0.3,
  //   3: 0.2,
  //   4: 0.1,
  //   5: 0.1,
  //   6: 0.05,
  //   7: 0.05,
  //   11: 0.03,
  //   16: 0.03
  // };
  
  // async criterialCalculator(user: User, level: number): Promise<boolean> {
  //   if (level > 20) return false;
  
  //   const config = CRITERIA_CONFIG.find(c => level >= c.level);
  //   if (!config) return false;
  
  //   const totalUserInvestment = user.investments.reduce((sum, investment) => sum + investment.amount, 0);
  //   if (totalUserInvestment < config.minInvestment) return false;
  
  //   if (!user.referredUsers || user.referredUsers.length < config.minReferrals) return false;
  
  //   return user.referredUsers.every(referral => 
  //     referral.investments.reduce((sum, investment) => sum + investment.amount, 0) >= config.referralInvestment
  //   );
  // }
  
  // async calculateReferralBonus(user: User, generation: number): Promise<number> {
  //   if (generation > 20) return 0;
  
  //   const theUser = await this.userRepository.findOne({
  //     where: { wallet: user.wallet },
  //     relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory"]
  //   });
  
  //   if (!theUser || !(await this.criterialCalculator(theUser, generation))) return 0;
  
  //   const bonusPercentage = BONUS_PERCENTAGE[generation] || 0.03; // Default to 0.03 for higher generations
  //   let bonus = 0;
  
  //   for (const referral of theUser.referredUsers) {
  //     const referralInvestment = referral.investments.reduce((sum, investment) => sum + investment.amount, 0);
  //     const referralDailyEarnings = referralInvestment * (referralInvestment <= 2000 ? 0.001 : 0.002);
      
  //     bonus += referralDailyEarnings * bonusPercentage;
  //     bonus += await this.calculateReferralBonus(referral, generation + 1);  // Recursive call for next level referrals
  //   }
  
  //   return bonus;
  // }


  async calculateReferralBonus(user: User, generation: number, cUser?: User): Promise<number> {
    if (generation > 20) return 0;
    // console.log("Running at generation", generation);

    let bonus = 0;
    const theUser = await this.userRepository.findOne({
      where: { email: user.email },
      relations: ["investments", "referredUsers", "referredUsers.investments", "earningsHistory", "referredUsers.referredUsers"],
    });

    if (!theUser) return 0;

    const criteriaUser = cUser || user;
    const checkCriteria = await this.criterialCalculator(criteriaUser, generation);
    if (!checkCriteria) return 0;

    const referrals = theUser.referredUsers;

    for (const theReferral of referrals) {
      const referral = await this.userRepository.findOne({
        where: { wallet: theReferral.wallet },
        relations: ["investments", "referredUsers"]
      });
      if (!referral) continue;

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

      if (referral.referredUsers && referral.referredUsers.length > 0) {
        bonus += await this.calculateReferralBonus(referral, generation + 1, criteriaUser);
      }
    }

    return bonus;
  }
  
}