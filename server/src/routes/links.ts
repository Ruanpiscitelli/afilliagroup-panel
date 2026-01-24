import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Get all links for current user (for affiliates)
router.get('/', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;
    const user = (req as any).user;

    try {
        const links = await prisma.trackingLink.findMany({
            where: {
                userId: user.id, // Filter by current user
            },
            include: {
                campaign: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.json({ links });
    } catch (error) {
        console.error('Links error:', error);
        return res.status(500).json({ error: 'Erro ao buscar links' });
    }
});

export default router;
