export class CoinService {
  constructor(){}

  converter = (amount: number): number => {
    const rate = 0.004;
    return amount * rate;
  }
}
