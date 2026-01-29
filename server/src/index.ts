import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'https://affiliagroup.team',
    'https://www.affiliagroup.team',
    'https://client-production-38e8.up.railway.app',
];
if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https:\/\/.*\.up\.railway\.app$/.test(origin)) return callback(null, true);

        console.log('Blocked by CORS:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

            if (user && user.status === 'ACTIVE') {
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

// API 404
app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Health check
app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Serve static files in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we are in production or if the build folder exists
// In Docker, client dist will be at ../../client/dist relative to ./server/dist/index.js
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Handle SPA routing: serve index.html for any unknown route NOT starting with /api
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export { prisma };
