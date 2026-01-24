import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import metricsRoutes from './routes/metrics.js';
import campaignsRoutes from './routes/campaigns.js';
import linksRoutes from './routes/links.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Make prisma available to routes
app.set('prisma', prisma);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/links', linksRoutes);

// Health check
app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export { prisma };
