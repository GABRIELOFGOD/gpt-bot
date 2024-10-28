import { NextFunction, Response, Request } from "express";

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const  globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // ================== SET DEFAULT ERROR VALUES ================== //
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // ================== SEND OPERATIONAL ERROR MESSAGE ================== //
  if (err instanceof AppError) {
    // ================== SEND OPERATIONAL ERROR MESSAGE ================== //
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error('ERROR 💥', err);

  // ================= SEND GENERIC ERROR MESSAGE ================== //
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};


