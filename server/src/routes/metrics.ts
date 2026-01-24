import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Get aggregated metrics for dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { startDate, endDate } = req.query;

    try {
        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate as string) : new Date();

        const metrics = await prisma.dailyMetric.aggregate({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
            _sum: {
                clicks: true,
                registrations: true,
                ftds: true,
                qualifiedCpa: true,
                depositAmount: true,
                commissionCpa: true,
                commissionRev: true,
            },
        });

        // Funnel data
        const funnelData = await prisma.dailyMetric.groupBy({
            by: ['date'],
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
            _sum: {
                clicks: true,
                registrations: true,
                ftds: true,
                qualifiedCpa: true,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return res.json({
            totals: {
                clicks: metrics._sum.clicks || 0,
                registrations: metrics._sum.registrations || 0,
                ftds: metrics._sum.ftds || 0,
                qualifiedCpa: metrics._sum.qualifiedCpa || 0,
                depositAmount: Number(metrics._sum.depositAmount) || 0,
                commissionCpa: Number(metrics._sum.commissionCpa) || 0,
                commissionRev: Number(metrics._sum.commissionRev) || 0,
                commissionTotal: Number(metrics._sum.commissionCpa || 0) + Number(metrics._sum.commissionRev || 0),
            },
            funnelData: funnelData.map(item => ({
                date: item.date.toISOString().split('T')[0],
                clicks: item._sum.clicks || 0,
                registrations: item._sum.registrations || 0,
                ftds: item._sum.ftds || 0,
                qualifiedCpa: item._sum.qualifiedCpa || 0,
            })),
        });
    } catch (error) {
        console.error('Metrics error:', error);
        return res.status(500).json({ error: 'Erro ao buscar métricas' });
    }
});

// Get top campaigns by performance
router.get('/top-campaigns', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { startDate, endDate, limit = '5' } = req.query;

    try {
        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate as string) : new Date();

        const campaigns = await prisma.dailyMetric.groupBy({
            by: ['linkId'],
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
            _sum: {
                clicks: true,
                registrations: true,
                ftds: true,
                qualifiedCpa: true,
                depositAmount: true,
                commissionCpa: true,
                commissionRev: true,
            },
            orderBy: {
                _sum: {
                    commissionCpa: 'desc',
                },
            },
            take: parseInt(limit as string, 10),
        });

        // Enrich with link and campaign data
        const enrichedCampaigns = await Promise.all(
            campaigns.map(async (item) => {
                const link = await prisma.trackingLink.findUnique({
                    where: { id: item.linkId },
                    include: {
                        campaign: true,
                        user: {
                            select: { name: true },
                        },
                    },
                });

                const totalCommission = Number(item._sum.commissionCpa || 0) + Number(item._sum.commissionRev || 0);
                const conversionRate = item._sum.registrations ? ((item._sum.ftds || 0) / item._sum.registrations) * 100 : 0;

                return {
                    affiliate: link?.user.name || 'Unknown',
                    campaign: link?.campaign.name || 'Unknown',
                    registrations: item._sum.registrations || 0,
                    ftds: item._sum.ftds || 0,
                    qualifiedCpa: item._sum.qualifiedCpa || 0,
                    depositAmount: Number(item._sum.depositAmount) || 0,
                    conversionRate: conversionRate,
                    commissionCpa: Number(item._sum.commissionCpa) || 0,
                    commissionRev: Number(item._sum.commissionRev) || 0,
                    totalCommission: totalCommission,
                };
            })
        );

        return res.json({ campaigns: enrichedCampaigns });
    } catch (error) {
        console.error('Top campaigns error:', error);
        return res.status(500).json({ error: 'Erro ao buscar campanhas' });
    }
});

// Get metrics by campaign for charts
router.get('/by-campaign', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { startDate, endDate } = req.query;

    try {
        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate as string) : new Date();

        const links = await prisma.trackingLink.findMany({
            include: {
                campaign: true,
                metrics: {
                    where: {
                        date: {
                            gte: start,
                            lte: end,
                        },
                    },
                },
            },
        });

        const campaignMetrics = links.reduce((acc, link) => {
            const campaignName = link.campaign.name;

            if (!acc[campaignName]) {
                acc[campaignName] = {
                    name: campaignName,
                    commissionCpa: 0,
                    commissionRev: 0,
                    registrations: 0,
                    ftds: 0,
                };
            }

            link.metrics.forEach(metric => {
                acc[campaignName].commissionCpa += Number(metric.commissionCpa);
                acc[campaignName].commissionRev += Number(metric.commissionRev);
                acc[campaignName].registrations += metric.registrations;
                acc[campaignName].ftds += metric.ftds;
            });

            return acc;
        }, {} as Record<string, { name: string; commissionCpa: number; commissionRev: number; registrations: number; ftds: number }>);

        return res.json({ campaigns: Object.values(campaignMetrics) });
    } catch (error) {
        console.error('Campaign metrics error:', error);
        return res.status(500).json({ error: 'Erro ao buscar métricas por campanha' });
    }
});

// Get time series data
router.get('/time-series', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;
    const { startDate, endDate } = req.query;

    try {
        const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate as string) : new Date();

        const data = await prisma.dailyMetric.groupBy({
            by: ['date'],
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
            _sum: {
                registrations: true,
                ftds: true,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return res.json({
            timeSeries: data.map(item => ({
                date: item.date.getDate().toString(),
                registrations: item._sum.registrations || 0,
                ftds: item._sum.ftds || 0,
            })),
        });
    } catch (error) {
        console.error('Time series error:', error);
        return res.status(500).json({ error: 'Erro ao buscar série temporal' });
    }
});

export default router;
