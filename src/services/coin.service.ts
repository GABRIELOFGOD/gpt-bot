import { SwapDto } from "../dtos/swap.dto";
import { User } from "../entities/user.entity";

export class CoinService {
  constructor(){}

  converter = (amount: number): number => {
    const rate = 0.004;
    return parseFloat((amount / rate).toFixed(4));
  };

  swap = (swapDto: SwapDto): number => {
    let value = 0;

    if(swapDto.to === "USDT"){
      value = this.converter(swapDto.amount);
    }

    if(swapDto.to === "GPT"){
      value = swapDto.amount;
    }

    return value;

  }
  
}
