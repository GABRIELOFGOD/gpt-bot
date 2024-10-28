import { Request } from 'express';

declare module 'express' {
  export interface Request {
    user?: any;  // Replace `any` with your user type if you have one
    token?: string;
  }
}
