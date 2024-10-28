import express, { Request, Response } from 'express';
import { config } from 'dotenv';
import { AppError, globalErrorHandler } from './services/error.service';
import morgan from 'morgan';
import helmet from 'helmet';
import userRoute from './routes/user.route';
import 'reflect-metadata';
import { dataSource } from './config/dataSource';
import dbConfig from './config/database.config';

config();

const app = express();
const port = process.env.PORT || 5000;

app.use(morgan("dev"));
app.use(helmet());
app.use(express.json());
dbConfig();

app.get('/', (req: Request, res: Response) => res.status(200).json("HELLO FROM GBTBOT SERVER"));

dataSource.initialize().then(() => {
  console.log('Data Source has been initialized!');
}).catch((err) => {
  console.error('Error during Data Source initialization', err);
});

// =============== ERROR HANDLING ROUTES =========== //
app.use("/api/v1/user", userRoute);

// =============== NOT FOUND ROUTE ==================== //
app.all("*", (req: Request, res: Response, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ================ GLOBAL ERROR HANDLER ============== //
app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
