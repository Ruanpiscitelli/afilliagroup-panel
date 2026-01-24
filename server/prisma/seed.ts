import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Clear existing data
    await prisma.dailyMetric.deleteMany();
    await prisma.trackingLink.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    const passwordHash = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'AffiliaGroup',
            email: 'vitor@affilia.group',
            passwordHash,
            role: 'admin',
            avatarUrl: null,
        },
    });

    const affiliate1 = await prisma.user.create({
        data: {
            name: 'LucasJ',
            email: 'lucas@affilia.group',
            passwordHash,
            role: 'affiliate',
        },
    });

    const affiliate2 = await prisma.user.create({
        data: {
            name: 'Eucace',
            email: 'eucace@affilia.group',
            passwordHash,
            role: 'affiliate',
        },
    });

    console.log('Users created');

    // Create campaigns
    const campaigns = await Promise.all([
        prisma.campaign.create({ data: { name: 'insta_stories', slug: 'insta_stories' } }),
        prisma.campaign.create({ data: { name: 'Cadastro', slug: 'cadastro' } }),
        prisma.campaign.create({ data: { name: 'Instagram', slug: 'instagram' } }),
        prisma.campaign.create({ data: { name: 'Telegram', slug: 'telegram' } }),
    ]);

    console.log('Campaigns created');

    // Create tracking links
    const links = await Promise.all([
        // LucasJ links
        prisma.trackingLink.create({
            data: {
                platformUrl: 'https://bet.example.com/register',
                trackingCode: 'lucas_insta_001',
                userId: affiliate1.id,
                campaignId: campaigns[0].id,
            },
        }),
        prisma.trackingLink.create({
            data: {
                platformUrl: 'https://bet.example.com/register',
                trackingCode: 'lucas_cadastro_001',
                userId: affiliate1.id,
                campaignId: campaigns[1].id,
            },
        }),
        // Eucace links
        prisma.trackingLink.create({
            data: {
                platformUrl: 'https://bet.example.com/register',
                trackingCode: 'eucace_instagram_001',
                userId: affiliate2.id,
                campaignId: campaigns[2].id,
            },
        }),
        prisma.trackingLink.create({
            data: {
                platformUrl: 'https://bet.example.com/register',
                trackingCode: 'eucace_cadastro_001',
                userId: affiliate2.id,
                campaignId: campaigns[1].id,
            },
        }),
        prisma.trackingLink.create({
            data: {
                platformUrl: 'https://bet.example.com/register',
                trackingCode: 'eucace_telegram_001',
                userId: affiliate2.id,
                campaignId: campaigns[3].id,
            },
        }),
    ]);

    console.log('Tracking links created');

    // Create daily metrics for the last 30 days
    const today = new Date();
    const metrics = [];

    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        // LucasJ insta_stories - high performance near the end
        if (i <= 10) {
            const peakMultiplier = i <= 3 ? 3 : i <= 5 ? 2 : 1;
            const clicks = Math.floor(Math.random() * 20 * peakMultiplier) + 10;
            const registrations = Math.floor(clicks * 0.4 + Math.random() * 5);
            const ftds = Math.floor(registrations * 0.5 + Math.random() * 3);
            const qualifiedCpa = Math.floor(ftds * 0.75);

            metrics.push({
                date,
                clicks,
                registrations,
                ftds,
                qualifiedCpa,
                depositAmount: ftds * 50 + Math.random() * 50,
                commissionCpa: qualifiedCpa * 350,
                commissionRev: ftds * 14,
                linkId: links[0].id,
                userId: affiliate1.id,
            });
        }

        // LucasJ cadastro - moderate performance
        if (i <= 15) {
            const clicks = Math.floor(Math.random() * 10) + 3;
            const registrations = Math.floor(clicks * 0.35);
            const ftds = Math.floor(registrations * 0.6);
            const qualifiedCpa = Math.floor(ftds * 0.8);

            metrics.push({
                date,
                clicks,
                registrations,
                ftds,
                qualifiedCpa,
                depositAmount: ftds * 30 + Math.random() * 20,
                commissionCpa: qualifiedCpa * 350,
                commissionRev: ftds * 3.5,
                linkId: links[1].id,
                userId: affiliate1.id,
            });
        }

        // Eucace - low or zero performance (as shown in reference images)
        if (Math.random() < 0.1) {
            metrics.push({
                date,
                clicks: 0,
                registrations: 0,
                ftds: 0,
                qualifiedCpa: 0,
                depositAmount: 0,
                commissionCpa: 0,
                commissionRev: 0,
                linkId: links[2].id,
                userId: affiliate2.id,
            });
        }
    }

    await prisma.dailyMetric.createMany({ data: metrics });

    console.log(`Created ${metrics.length} daily metrics`);

    // Summary statistics
    const totalCommissionCpa = metrics.reduce((sum, m) => sum + Number(m.commissionCpa), 0);
    const totalCommissionRev = metrics.reduce((sum, m) => sum + Number(m.commissionRev), 0);
    const totalRegistrations = metrics.reduce((sum, m) => sum + m.registrations, 0);
    const totalFtds = metrics.reduce((sum, m) => sum + m.ftds, 0);
    const totalQualifiedCpa = metrics.reduce((sum, m) => sum + m.qualifiedCpa, 0);

    console.log('\n--- Summary ---');
    console.log(`Total Commission: R$ ${(totalCommissionCpa + totalCommissionRev).toFixed(2)}`);
    console.log(`CPA Total: R$ ${totalCommissionCpa.toFixed(2)}`);
    console.log(`REV Total: R$ ${totalCommissionRev.toFixed(2)}`);
    console.log(`Registrations: ${totalRegistrations}`);
    console.log(`FTDs: ${totalFtds}`);
    console.log(`Qualified CPA: ${totalQualifiedCpa}`);

    console.log('\nSeeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
