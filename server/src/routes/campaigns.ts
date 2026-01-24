import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Get all campaigns
router.get('/', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;

    try {
        const campaigns = await prisma.campaign.findMany({
            orderBy: { name: 'asc' },
        });

        return res.json({ campaigns });
    } catch (error) {
        console.error('Campaigns error:', error);
        return res.status(500).json({ error: 'Erro ao buscar campanhas' });
    }
});

export default router;
