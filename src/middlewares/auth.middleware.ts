// src/middlewares/auth.middleware.ts
import { NextFunction, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../services/error.service";
import * as jwt from 'jsonwebtoken';
import { Request } from "../@types/custome";
import {  config } from 'dotenv';

config();

const authMiddleware = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) return next(new AppError('Authorization header is missing', 401));

  const token = authHeader.split(' ')[1];

  if (!token) return next(new AppError('Token is missing', 401));
  // console.log("token", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // console.log(decoded);
    req.user = decoded;  // Now this should not throw an error
    req.token = token;   // Now this should not throw an error
  } catch (err: any) {
    console.log('Token verification failed:', err.message);
    return next(new AppError('Token verification failed', 401));
  }

  // =============== CHECKING IF USER IS BLOCKED =============== //
  if (req.user && req.user.status === 'blocked' || req.user.status === 'deleted') {
    return next(new AppError('Your account has been blocked', 401));
  }

  next();
});
 export default authMiddleware;