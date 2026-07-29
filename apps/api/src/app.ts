import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFound } from "./lib/errors.js";

export const app = express();
app.set("trust proxy", 1);
app.use(pinoHttp());
app.use(helmet({contentSecurityPolicy:false}));
app.use(cors({origin:(process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),credentials:false}));
app.use(express.json({limit:"512kb"}));
app.use(rateLimit({windowMs:60_000,limit:300,standardHeaders:"draft-8",legacyHeaders:false}));
app.use("/api/v1",apiRouter);
app.use(notFound);
app.use(errorHandler);
