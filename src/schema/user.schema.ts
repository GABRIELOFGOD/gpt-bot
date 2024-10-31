import Joi from 'joi';

export class UserSchema {
  static createUser = Joi.object({
    wallet: Joi.string().required(),
    // email: Joi.string().email().required(),
    referralCode: Joi.string().optional(),
  });

  static loginUser = Joi.object({
    wallet: Joi.string().required(),
    // email: Joi.string().email().required(),
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
