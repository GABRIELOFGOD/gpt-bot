import { NextFunction, Response, Request } from "express";

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message); // Call the Error constructor

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const  globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Set default values for error status and code if they are not defined
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Check if the error is an instance of AppError (operational error)
  if (err instanceof AppError) {
    // Operational, trusted error: send message to the client
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // If the error is not an instance of AppError, it's a programming or unknown error.
  console.error('ERROR 💥', err);

  // Hide error details from the client, but send a generic message
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};


