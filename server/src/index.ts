import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import metricsRoutes from './routes/metrics.js';
import campaignsRoutes from './routes/campaigns.js';
import linksRoutes from './routes/links.js';
import adminRoutes from './routes/admin.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:5174', 'https://affiliagroup.team'] : ['http://localhost:5173', 'http://localhost:5174', 'https://affiliagroup.team'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Make prisma available to routes
app.set('prisma', prisma);

// Auth middleware - extract user from token
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
                userId: string;
                email: string;
                role: string;
            };

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                },
            });

            if (user) {
                (req as any).user = user;
            }
        } catch (error) {
            // Token invalid, continue without user
        }
    }

    next();
};

// Apply auth middleware globally
app.use(authMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/admin', adminRoutes);

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
