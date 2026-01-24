import { PrismaClient, Role, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create Admin
    const adminPassword = await bcrypt.hash('@Iopx384815', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'piscitelliruan@gmail.com' },
        update: {
            passwordHash: adminPassword,
        },
        create: {
            name: 'Admin Master',
            email: 'piscitelliruan@gmail.com',
            passwordHash: adminPassword,
            role: Role.ADMIN,
            status: Status.ACTIVE,
            whatsapp: '+5511999999999',
        },
    });
    console.log('✅ Admin created:', admin.email);

    // Create Active Affiliates
    const activeAffiliates = [
        {
            name: 'LucasJ',
            email: 'lucas@affilia.group',
            whatsapp: '+5511988887777',
            instagram: '@lucasj_aff',
            projectedFtds: '51-100',
            cpaAmount: 350.00,
        },
        {
            name: 'Eucace',
            email: 'eucace@affilia.group',
            whatsapp: '+5521977776666',
            instagram: '@eucace',
            projectedFtds: '101-500',
            cpaAmount: 400.00,
        },
        {
            name: 'MariaAff',
            email: 'maria@affilia.group',
            whatsapp: '+5531966665555',
            instagram: '@maria_affiliate',
            projectedFtds: '0-50',
            cpaAmount: 300.00,
        },
        {
            name: 'PedroTop',
            email: 'pedro@affilia.group',
            whatsapp: '+5541955554444',
            instagram: '@pedrotop',
            projectedFtds: '51-100',
            cpaAmount: 325.00,
        },
        {
            name: 'AnaDigital',
            email: 'ana@affilia.group',
            whatsapp: '+5551944443333',
            instagram: '@ana.digital',
            projectedFtds: '500+',
            cpaAmount: 500.00,
        },
    ];

    const affPassword = await bcrypt.hash('aff123', 10);

    for (const aff of activeAffiliates) {
        const user = await prisma.user.upsert({
            where: { email: aff.email },
            update: {},
            create: {
                name: aff.name,
                email: aff.email,
                passwordHash: affPassword,
                role: Role.AFFILIATE,
                status: Status.ACTIVE,
                whatsapp: aff.whatsapp,
                instagram: aff.instagram,
                projectedFtds: aff.projectedFtds,
                cpaAmount: aff.cpaAmount,
            },
        });
        console.log('✅ Active affiliate created:', user.email);
    }

    // Create Pending Affiliates (for testing the queue)
    const pendingAffiliates = [
        {
            name: 'NovoAfiliado1',
            email: 'novo1@teste.com',
            whatsapp: '+5511911112222',
            instagram: '@novoaff1',
            projectedFtds: '0-50',
        },
        {
            name: 'NovoAfiliado2',
            email: 'novo2@teste.com',
            whatsapp: '+5521922223333',
            instagram: '@novoaff2',
            projectedFtds: '51-100',
        },
        {
            name: 'NovoAfiliado3',
            email: 'novo3@teste.com',
            whatsapp: '+5531933334444',
            instagram: '@novoaff3',
            projectedFtds: '101-500',
        },
        {
            name: 'NovoAfiliado4',
            email: 'novo4@teste.com',
            whatsapp: '+5541944445555',
            instagram: '@novoaff4',
            projectedFtds: '0-50',
        },
        {
            name: 'NovoAfiliado5',
            email: 'novo5@teste.com',
            whatsapp: '+5551955556666',
            instagram: '@novoaff5',
            projectedFtds: '500+',
        },
    ];

    for (const aff of pendingAffiliates) {
        const user = await prisma.user.upsert({
            where: { email: aff.email },
            update: {},
            create: {
                name: aff.name,
                email: aff.email,
                passwordHash: affPassword,
                role: Role.AFFILIATE,
                status: Status.PENDING,
                whatsapp: aff.whatsapp,
                instagram: aff.instagram,
                projectedFtds: aff.projectedFtds,
            },
        });
        console.log('⏳ Pending affiliate created:', user.email);
    }

    // Create Campaigns
    const campaigns = [
        { name: 'Instagram Stories', slug: 'insta_stories' },
        { name: 'Cadastro', slug: 'cadastro' },
        { name: 'Instagram', slug: 'instagram' },
        { name: 'Telegram', slug: 'telegram' },
        { name: 'TikTok', slug: 'tiktok' },
    ];

    for (const campaign of campaigns) {
        await prisma.campaign.upsert({
            where: { slug: campaign.slug },
            update: {},
            create: campaign,
        });
        console.log('📢 Campaign created:', campaign.name);
    }

    /*
    // Create TrackingLinks and Metrics for active affiliates
    const activeUsers = await prisma.user.findMany({
        where: { status: Status.ACTIVE, role: Role.AFFILIATE },
    });
    const allCampaigns = await prisma.campaign.findMany();

    for (const user of activeUsers) {
        for (const campaign of allCampaigns.slice(0, 2)) {
            const link = await prisma.trackingLink.create({
                data: {
                    platformUrl: `https://bet.affilia.group/${campaign.slug}`,
                    trackingCode: `${campaign.slug}_${user.id.slice(0, 8)}`,
                    userId: user.id,
                    campaignId: campaign.id,
                },
            });

            // Create metrics for last 30 days
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                const registrations = Math.floor(Math.random() * 10);
                const ftds = Math.floor(registrations * 0.5);
                const qualifiedCpa = Math.floor(ftds * 0.7);

                await prisma.dailyMetric.create({
                    data: {
                        date,
                        clicks: Math.floor(Math.random() * 50) + 10,
                        registrations,
                        ftds,
                        qualifiedCpa,
                        depositAmount: ftds * (Math.random() * 100 + 50),
                        commissionCpa: qualifiedCpa * Number(user.cpaAmount),
                        commissionRev: ftds * (Math.random() * 20 + 5),
                        linkId: link.id,
                        userId: user.id,
                    },
                });
            }
            console.log(`📊 Metrics created for ${user.name} - ${campaign.name}`);
        }
    }
    */

    console.log('✨ Seed completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
