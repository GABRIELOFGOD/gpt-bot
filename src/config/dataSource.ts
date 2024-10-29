// data-source.ts
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { config } from 'dotenv';
import { Investment } from '../entities/investment.entity';
import { EarningsHistory } from '../entities/earningHistory.entity';

config();

export const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Investment, EarningsHistory],
  synchronize: true,
});
