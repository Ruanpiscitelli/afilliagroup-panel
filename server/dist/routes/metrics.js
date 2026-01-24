import { Router } from 'express';
const router = Router();
// Helper to get allowed User IDs based on role and request
const getAllowedUserIds = async (prisma, user, requestedIds) => {
    if (user.role === 'ADMIN') {
        if (requestedIds && requestedIds !== 'all') {
            return requestedIds.split(',');
        }
        return undefined; // No filter = all
    }
    // For Affiliates
    const userWithChildren = await prisma.user.findUnique({
        where: { id: user.id },
        include: { children: { select: { id: true } } }
    });
    const allowedIds = [user.id, ...(userWithChildren?.children.map(c => c.id) || [])];
    if (requestedIds && requestedIds !== 'all') {
        const requestedList = requestedIds.split(',');
        const validIds = requestedList.filter(id => allowedIds.includes(id));
        return validIds.length > 0 ? validIds : [user.id]; // Fallback to self if invalid
    }
    return allowedIds; // Default to self + children
};
// Get aggregated metrics for dashboard
// Get list of affiliates
router.get('/affiliates', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const affiliates = await prisma.user.findMany({
            where: {
                role: 'AFFILIATE',
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return res.json({ affiliates });
    }
    catch (error) {
        console.error('Affiliates error:', error);
        return res.status(500).json({ error: 'Erro ao buscar afiliados' });
    }
});
// Get aggregated metrics for dashboard
router.get('/dashboard', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { startDate, endDate, affiliateId } = req.query;
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Não autorizado' });
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        const filterIds = await getAllowedUserIds(prisma, user, affiliateId);
        const whereClause = {
            date: {
                gte: start,
                lte: end,
            },
        };
        if (filterIds) {
            whereClause.userId = { in: filterIds };
        }
        const metrics = await prisma.dailyMetric.aggregate({
            where: whereClause,
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
            where: whereClause,
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
    }
    catch (error) {
        console.error('Metrics error:', error);
        return res.status(500).json({ error: 'Erro ao buscar métricas' });
    }
});
// Get top campaigns by performance
router.get('/top-campaigns', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { startDate, endDate, limit = '5', affiliateId } = req.query;
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Não autorizado' });
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        const filterIds = await getAllowedUserIds(prisma, user, affiliateId);
        const whereClause = {
            date: {
                gte: start,
                lte: end,
            },
        };
        if (filterIds) {
            whereClause.userId = { in: filterIds };
        }
        const campaigns = await prisma.dailyMetric.groupBy({
            by: ['linkId'],
            where: whereClause,
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
            take: parseInt(limit, 10),
        });
        // Enrich with link and campaign data
        const enrichedCampaigns = await Promise.all(campaigns.map(async (item) => {
            const link = await prisma.trackingLink.findUnique({
                where: { id: item.linkId },
                include: {
                    campaign: true,
                    user: {
                        select: { id: true, name: true },
                    },
                },
            });
            const totalCommission = Number(item._sum.commissionCpa || 0) + Number(item._sum.commissionRev || 0);
            const conversionRate = item._sum.registrations ? ((item._sum.ftds || 0) / item._sum.registrations) * 100 : 0;
            return {
                affiliateId: link?.user.id,
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
        }));
        return res.json({ campaigns: enrichedCampaigns });
    }
    catch (error) {
        console.error('Top campaigns error:', error);
        return res.status(500).json({ error: 'Erro ao buscar campanhas' });
    }
});
// Get metrics by campaign for charts
router.get('/by-campaign', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { startDate, endDate, affiliateId } = req.query;
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Não autorizado' });
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        const filterIds = await getAllowedUserIds(prisma, user, affiliateId);
        const linkWhere = {};
        if (filterIds) {
            linkWhere.userId = { in: filterIds };
        }
        const links = await prisma.trackingLink.findMany({
            where: linkWhere,
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
        }, {});
        return res.json({ campaigns: Object.values(campaignMetrics) });
    }
    catch (error) {
        console.error('Campaign metrics error:', error);
        return res.status(500).json({ error: 'Erro ao buscar métricas por campanha' });
    }
});
// Get time series data
router.get('/time-series', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { startDate, endDate, affiliateId } = req.query;
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Não autorizado' });
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        const filterIds = await getAllowedUserIds(prisma, user, affiliateId);
        const whereClause = {
            date: {
                gte: start,
                lte: end,
            },
        };
        if (filterIds) {
            whereClause.userId = { in: filterIds };
        }
        const data = await prisma.dailyMetric.groupBy({
            by: ['date'],
            where: whereClause,
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
    }
    catch (error) {
        console.error('Time series error:', error);
        return res.status(500).json({ error: 'Erro ao buscar série temporal' });
    }
});
export default router;
