import Joi from 'joi';

export class InvestmentSchema {
  static createInvestment = Joi.object({
    amount: Joi.number().required(),
  });

  // static loginUser = Joi.object({
  //   wallet: Joi.string().required(),
  //   email: Joi.string().email().required(),
  // });
}
