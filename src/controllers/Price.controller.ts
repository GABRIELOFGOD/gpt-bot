import { NextFunction, Response } from "express";
import { Request } from "../@types/custome";
import catchAsync from "../utils/catchAsync";
import { Repository } from "typeorm";
import { Price } from "../entities/coinPrice.entity";
import { User } from "../entities/user.entity";
import { AppError } from "../services/error.service";

export class CoinController {
    constructor(
      private readonly priceRepository: Repository<Price>,
      private readonly userRepository: Repository<User>
    ) {}

    public getPrice = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
      const latestPrice = await this.priceRepository.findOne({
        where: {},
        order: { updatedAt: "DESC" }
      });

      if (!latestPrice) return next(new AppError("No price found", 404));

      res.status(200).json({ price: latestPrice });
    });

    public updatePrice = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
      const { price } = req.body;
      const theUser = req.user;

      const user = await this.userRepository.findOne({
        where: { id: theUser.id }
      });

      if (!user) return next(new AppError("User not found", 404));

      if (user.role !== "admin") return next(new AppError("You are not authorized to perform this action", 403));
      
      const newPrice = this.priceRepository.create({ price, updatedBy: user });

      await this.priceRepository.save(newPrice);

      res.status(201).json({ price: newPrice, message: "Price updated successfully" });
    });
}