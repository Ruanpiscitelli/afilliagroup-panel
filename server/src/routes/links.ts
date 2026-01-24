import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Get all links for current user
router.get('/', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;

    try {
        const links = await prisma.trackingLink.findMany({
            include: {
                campaign: true,
                user: {
                    select: { name: true },
                },
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
