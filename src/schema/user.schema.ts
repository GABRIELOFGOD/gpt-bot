import Joi from 'joi';

export class UserSchema {
  static createUser = Joi.object({
    wallet: Joi.string().required(),
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    password: Joi.string().required(),
    referralCode: Joi.string().optional().empty(''),
  });

  static loginUser = Joi.object({
    // wallet: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  static swap = Joi.object({
    amount: Joi.number().required(),
    to: Joi.string().required(),
  });
}

// export const userRegisterSchema = Joi.object({
//   wallet: Joi.string().required(),
//   email: Joi.string().email().required(),
//   referralCode: Joi.string().optional(),
// });

// export const userLoginSchema = Joi.object({
//   wallet: Joi.string().required(),
//   email: Joi.string().email().required(),
// });
