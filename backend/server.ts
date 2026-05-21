import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import userRouter from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import { stripeWebhook } from './controllers/stripeWebhook.js';
import { authRateLimit } from './middlewares/rateLimit.js';
import { serve } from "inngest/express";
import { inngest } from "./lib/inngest.js";
import { inngestFunctions } from "./inngest/functions.js";

const app = express();
app.set('trust proxy', 1);

const port = process.env.PORT || 3000;

const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) || [],
    credentials: true,
}

app.use(cors(corsOptions));
app.post('/api/stripe', express.raw({type: 'application/json'}), stripeWebhook);

app.use('/api/auth', authRateLimit);
app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json({limit: '50mb'}));


app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api/inngest', serve({ client: inngest, functions: inngestFunctions, streaming: true }));
app.use('/api/user', userRouter);
app.use('/api/project', projectRoutes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
