// src/@types/customRequest.d.ts
import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
  user?: any;  // Replace `any` with your actual user type
  token?: string;
}
