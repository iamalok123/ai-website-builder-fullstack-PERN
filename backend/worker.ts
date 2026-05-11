import 'dotenv/config';
import express, { Request, Response } from 'express';
import { serve } from "inngest/express";
import { inngest } from "./lib/inngest.js";
import { inngestFunctions } from "./inngest/functions.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json({ limit: '50mb' }));

app.get('/', (_req: Request, res: Response) => {
    res.send('Worker is Live!');
});

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api/inngest', serve({ client: inngest, functions: inngestFunctions, streaming: true }));

app.listen(port, () => {
    console.log(`Worker is running at http://localhost:${port}`);
});
