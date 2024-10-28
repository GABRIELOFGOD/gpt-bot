import Joi from 'joi';

export const userRegisterSchema = Joi.object({
  wallet: Joi.string().required(),
  email: Joi.string().email().required(),
  referralCode: Joi.string().optional(),
});
