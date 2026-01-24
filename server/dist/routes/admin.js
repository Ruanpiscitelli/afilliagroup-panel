import { Router } from 'express';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
const router = Router();
// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar.' });
    }
    next();
};
// Apply admin middleware to all routes
router.use(verifyAdmin);
// GET /admin/requests - List pending affiliates
router.get('/requests', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const pendingUsers = await prisma.user.findMany({
            where: {
                status: 'PENDING',
                role: 'AFFILIATE',
            },
            select: {
                id: true,
                name: true,
                email: true,
                whatsapp: true,
                instagram: true,
                projectedFtds: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return res.json({ users: pendingUsers });
    }
    catch (error) {
        console.error('List pending error:', error);
        return res.status(500).json({ error: 'Erro ao listar solicitações' });
    }
});
// GET /admin/affiliates - List active affiliates
router.get('/affiliates', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const activeUsers = await prisma.user.findMany({
            where: {
                status: 'ACTIVE',
                role: 'AFFILIATE',
            },
            select: {
                id: true,
                name: true,
                email: true,
                whatsapp: true,
                instagram: true,
                projectedFtds: true,
                cpaAmount: true,
                createdAt: true,
                parentId: true,
                parent: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                children: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                name: 'asc',
            },
        });
        return res.json({
            users: activeUsers.map(u => ({
                ...u,
                cpaAmount: Number(u.cpaAmount),
            }))
        });
    }
    catch (error) {
        console.error('List affiliates error:', error);
        return res.status(500).json({ error: 'Erro ao listar afiliados' });
    }
});
// PUT /admin/users/:id/status - Update user status (approve, reject, ban)
const updateStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'REJECTED', 'BANNED']),
});
router.put('/users/:id/status', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    try {
        const body = updateStatusSchema.parse(req.body);
        const user = await prisma.user.update({
            where: { id: id },
            data: { status: body.status },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
            },
        });
        return res.json({
            message: `Status atualizado para ${body.status}`,
            user
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Status inválido', details: error.issues });
        }
        console.error('Update status error:', error);
        return res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});
// PUT /admin/users/:id/cpa - Update user CPA amount
const updateCpaSchema = z.object({
    cpaAmount: z.number().min(0),
});
router.put('/users/:id/cpa', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    try {
        const body = updateCpaSchema.parse(req.body);
        const user = await prisma.user.update({
            where: { id: id },
            data: { cpaAmount: body.cpaAmount },
            select: {
                id: true,
                name: true,
                cpaAmount: true,
            },
        });
        return res.json({
            message: 'CPA atualizado',
            user: {
                ...user,
                cpaAmount: Number(user.cpaAmount),
            }
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Valor de CPA inválido', details: error.issues });
        }
        console.error('Update CPA error:', error);
        return res.status(500).json({ error: 'Erro ao atualizar CPA' });
    }
});
// POST /admin/users - Create new affiliate (directly as ACTIVE)
const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
    projectedFtds: z.enum(['0-50', '51-100', '101-500', '500+']).optional(),
    cpaAmount: z.number().min(0).optional(),
    parentId: z.string().uuid().optional().nullable(),
});
router.post('/users', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const body = createUserSchema.parse(req.body);
        // Check if email exists
        const existing = await prisma.user.findUnique({
            where: { email: body.email },
        });
        if (existing) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        const passwordHash = await bcrypt.hash(body.password, 10);
        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                passwordHash,
                role: 'AFFILIATE',
                status: 'ACTIVE', // Created directly as active
                whatsapp: body.whatsapp,
                instagram: body.instagram,
                projectedFtds: body.projectedFtds,
                cpaAmount: body.cpaAmount || 0,
                parentId: body.parentId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                cpaAmount: true,
            },
        });
        return res.status(201).json({
            message: 'Afiliado criado com sucesso',
            user: {
                ...user,
                cpaAmount: Number(user.cpaAmount),
            }
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        console.error('Create user error:', error);
        return res.status(500).json({ error: 'Erro ao criar afiliado' });
    }
});
// GET /admin/stats - Dashboard stats for admin
router.get('/stats', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const [pending, active, banned, rejected] = await Promise.all([
            prisma.user.count({ where: { status: 'PENDING', role: 'AFFILIATE' } }),
            prisma.user.count({ where: { status: 'ACTIVE', role: 'AFFILIATE' } }),
            prisma.user.count({ where: { status: 'BANNED', role: 'AFFILIATE' } }),
            prisma.user.count({ where: { status: 'REJECTED', role: 'AFFILIATE' } }),
        ]);
        return res.json({
            pending,
            active,
            banned,
            rejected,
            total: pending + active + banned + rejected,
        });
    }
    catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});
// GET /admin/users/:id - Get affiliate details with metrics summary
router.get('/users/:id', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                name: true,
                email: true,
                whatsapp: true,
                instagram: true,
                projectedFtds: true,
                cpaAmount: true,
                status: true,
                role: true,
                createdAt: true,
                parentId: true,
                parent: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                children: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                    }
                }
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const metricsAggregate = await prisma.dailyMetric.aggregate({
            where: { userId: String(id) },
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
        return res.json({
            user: {
                ...user,
                cpaAmount: Number(user.cpaAmount),
            },
            metrics: {
                clicks: metricsAggregate._sum?.clicks || 0,
                registrations: metricsAggregate._sum?.registrations || 0,
                ftds: metricsAggregate._sum?.ftds || 0,
                qualifiedCpa: metricsAggregate._sum?.qualifiedCpa || 0,
                depositAmount: Number(metricsAggregate._sum?.depositAmount || 0),
                commissionCpa: Number(metricsAggregate._sum?.commissionCpa || 0),
                commissionRev: Number(metricsAggregate._sum?.commissionRev || 0),
            },
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Erro ao buscar afiliado' });
    }
});
// PUT /admin/users/:id - Update affiliate data
const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
    projectedFtds: z.string().optional(),
    cpaAmount: z.number().min(0).optional(),
    parentId: z.string().uuid().optional().nullable(),
});
router.put('/users/:id', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    try {
        const body = updateUserSchema.parse(req.body);
        const user = await prisma.user.update({
            where: { id: id },
            data: body,
            select: {
                id: true,
                name: true,
                email: true,
                whatsapp: true,
                instagram: true,
                projectedFtds: true,
                cpaAmount: true,
                parentId: true,
            },
        });
        return res.json({
            message: 'Afiliado atualizado',
            user: {
                ...user,
                cpaAmount: Number(user.cpaAmount),
            },
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        console.error('Update user error:', error);
        return res.status(500).json({ error: 'Erro ao atualizar afiliado' });
    }
});
// GET /admin/users/:id/metrics - Get daily metrics for affiliate
router.get('/users/:id/metrics', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    try {
        const where = { userId: id };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = new Date(startDate);
            if (endDate)
                where.date.lte = new Date(endDate);
        }
        const metrics = await prisma.dailyMetric.findMany({
            where,
            include: {
                link: {
                    include: {
                        campaign: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
            take: 30,
        });
        return res.json({
            metrics: metrics.map(m => ({
                id: m.id,
                date: m.date,
                clicks: m.clicks,
                registrations: m.registrations,
                ftds: m.ftds,
                qualifiedCpa: m.qualifiedCpa,
                depositAmount: Number(m.depositAmount),
                commissionCpa: Number(m.commissionCpa),
                commissionRev: Number(m.commissionRev),
                campaign: m.link?.campaign?.name || 'N/A',
            })),
        });
    }
    catch (error) {
        console.error('Get metrics error:', error);
        return res.status(500).json({ error: 'Erro ao buscar métricas' });
    }
});
// PUT /admin/metrics/:id - Update a specific metric
const updateMetricSchema = z.object({
    clicks: z.number().min(0).optional(),
    registrations: z.number().min(0).optional(),
    ftds: z.number().min(0).optional(),
    qualifiedCpa: z.number().min(0).optional(),
    depositAmount: z.number().min(0).optional(),
    commissionCpa: z.number().min(0).optional(),
    commissionRev: z.number().min(0).optional(),
});
router.put('/metrics/:id', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    try {
        const body = updateMetricSchema.parse(req.body);
        const metric = await prisma.dailyMetric.update({
            where: { id: Number(id) },
            data: body,
        });
        return res.json({
            message: 'Métrica atualizada',
            metric: {
                ...metric,
                depositAmount: Number(metric.depositAmount),
                commissionCpa: Number(metric.commissionCpa),
                commissionRev: Number(metric.commissionRev),
            },
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        console.error('Update metric error:', error);
        return res.status(500).json({ error: 'Erro ao atualizar métrica' });
    }
});
// POST /admin/metrics - Create manual metric
const createMetricSchema = z.object({
    userId: z.string().uuid(),
    campaignId: z.number().int().positive(),
    date: z.string(), // YYYY-MM-DD
    clicks: z.number().min(0).optional().default(0),
    registrations: z.number().min(0).optional().default(0),
    ftds: z.number().min(0).optional().default(0),
    qualifiedCpa: z.number().min(0).optional().default(0),
    depositAmount: z.number().min(0).optional().default(0),
    commissionCpa: z.number().min(0).optional().default(0),
    commissionRev: z.number().min(0).optional().default(0),
});
router.post('/metrics', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const body = createMetricSchema.parse(req.body);
        const date = new Date(body.date);
        // Find or create TrackingLink for this user/campaign
        let link = await prisma.trackingLink.findFirst({
            where: {
                userId: body.userId,
                campaignId: body.campaignId,
            },
        });
        if (!link) {
            const campaign = await prisma.campaign.findUnique({ where: { id: body.campaignId } });
            if (!campaign) {
                return res.status(404).json({ error: 'Campanha não encontrada' });
            }
            const trackingCode = `manual_${body.userId.slice(0, 8)}_${body.campaignId}_${Date.now()}`;
            link = await prisma.trackingLink.create({
                data: {
                    userId: body.userId,
                    campaignId: body.campaignId,
                    platformUrl: 'https://manual.entry',
                    trackingCode,
                },
            });
        }
        // Check for duplicates
        const existing = await prisma.dailyMetric.findUnique({
            where: {
                linkId_date: {
                    linkId: link.id,
                    date: date,
                },
            },
        });
        if (existing) {
            return res.status(409).json({ error: 'Métrica já existe para esta data e campanha' });
        }
        const metric = await prisma.dailyMetric.create({
            data: {
                date,
                linkId: link.id,
                userId: body.userId,
                clicks: body.clicks,
                registrations: body.registrations,
                ftds: body.ftds,
                qualifiedCpa: body.qualifiedCpa,
                depositAmount: body.depositAmount,
                commissionCpa: body.commissionCpa,
                commissionRev: body.commissionRev,
            },
        });
        return res.status(201).json({
            message: 'Métrica criada',
            metric: {
                ...metric,
                depositAmount: Number(metric.depositAmount),
                commissionCpa: Number(metric.commissionCpa),
                commissionRev: Number(metric.commissionRev),
            },
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        console.error('Create metric error:', error);
        return res.status(500).json({ error: 'Erro ao criar métrica' });
    }
});
// ============ LINK MANAGEMENT ROUTES ============
// GET /admin/links - List all links with affiliate info
router.get('/links', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const links = await prisma.trackingLink.findMany({
            include: {
                campaign: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: [
                { user: { name: 'asc' } },
                { createdAt: 'desc' },
            ],
        });
        return res.json({ links });
    }
    catch (error) {
        console.error('List links error:', error);
        return res.status(500).json({ error: 'Erro ao listar links' });
    }
});
// GET /admin/campaigns - List all campaigns
router.get('/campaigns', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const campaigns = await prisma.campaign.findMany({
            orderBy: { name: 'asc' },
        });
        return res.json({ campaigns });
    }
    catch (error) {
        console.error('List campaigns error:', error);
        return res.status(500).json({ error: 'Erro ao listar campanhas' });
    }
});
// POST /admin/campaigns - Create a new campaign
const createCampaignSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
});
router.post('/campaigns', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const body = createCampaignSchema.parse(req.body);
        const campaign = await prisma.campaign.create({
            data: {
                name: body.name,
                slug: body.slug,
            },
        });
        return res.status(201).json({ message: 'Campanha criada', campaign });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        console.error('Create campaign error:', error);
        return res.status(500).json({ error: 'Erro ao criar campanha' });
    }
});
// POST /admin/links - Create a new link for an affiliate
const createLinkSchema = z.object({
    userId: z.string().uuid(),
    campaignId: z.number().int().positive(),
    platformUrl: z.string().url(),
});
router.post('/links', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const body = createLinkSchema.parse(req.body);
        // Verify user exists and is an active affiliate
        const user = await prisma.user.findUnique({
            where: { id: body.userId },
        });
        if (!user) {
            return res.status(404).json({ error: 'Afiliado não encontrado' });
        }
        // Verify campaign exists
        const campaign = await prisma.campaign.findUnique({
            where: { id: body.campaignId },
        });
        if (!campaign) {
            return res.status(404).json({ error: 'Campanha não encontrada' });
        }
        // Generate tracking code
        const trackingCode = `registro_${Date.now().toString(36)}`;
        const link = await prisma.trackingLink.create({
            data: {
                userId: body.userId,
                campaignId: body.campaignId,
                platformUrl: body.platformUrl,
                trackingCode,
            },
            include: {
                campaign: true,
                user: {
                    select: { name: true },
                },
            },
        });
        return res.status(201).json({ message: 'Link criado', link });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        console.error('Create link error:', error);
        return res.status(500).json({ error: 'Erro ao criar link' });
    }
});
// DELETE /admin/links/:id - Delete a link
router.delete('/links/:id', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    try {
        // First delete related metrics
        await prisma.dailyMetric.deleteMany({
            where: { linkId: parseInt(id) },
        });
        // Then delete the link
        await prisma.trackingLink.delete({
            where: { id: parseInt(id) },
        });
        return res.json({ message: 'Link deletado' });
    }
    catch (error) {
        console.error('Delete link error:', error);
        return res.status(500).json({ error: 'Erro ao deletar link' });
    }
});
export default router;
