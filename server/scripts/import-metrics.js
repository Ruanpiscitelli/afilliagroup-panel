import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // CSV Data for Danielacacella
    // CPA, REV and Total must be divided by 2
    const csvData = [
        {
            date: '2026-01-23',
            registrations: 36,
            ftds: 4,
            qualifiedCpa: -118.73,
            depositAmount: 210.00,
            commissionCpa: 1050.00 / 2,  // Divide by 2
            commissionRev: 1050.00 / 2,  // Divide by 2
        },
        {
            date: '2026-01-24',
            registrations: 30,
            ftds: 5,
            qualifiedCpa: 41.15,
            depositAmount: 540.00,
            commissionCpa: 1050.00 / 2,  // Divide by 2
            commissionRev: 1050.00 / 2,  // Divide by 2
        },
        {
            date: '2026-01-25',
            registrations: 7,
            ftds: 0,
            qualifiedCpa: 18.25,
            depositAmount: 47.00,
            commissionCpa: 0.00,
            commissionRev: 0.00,
        },
    ];

    // Find user Danielacacella
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'danielacacella', mode: 'insensitive' } },
                { name: { contains: 'danicacella', mode: 'insensitive' } },
                { email: { contains: 'danielacacella', mode: 'insensitive' } },
            ],
        },
    });

    if (!user) {
        console.error('User Danielacacella not found!');
        return;
    }

    console.log('Found user:', user.name, user.id);

    // Find links for this user
    const links = await prisma.trackingLink.findMany({
        where: { userId: user.id },
        include: { campaign: true },
    });

    console.log('Found links:', links.length);

    if (links.length === 0) {
        console.error('No links found for this user!');
        return;
    }

    // Use the first link (or you might need to specify which campaign)
    const link = links[0];
    console.log('Using link:', link.id, link.campaign.name);

    // Insert or update metrics
    for (const row of csvData) {
        console.log(`\nProcessing date: ${row.date}`);

        // Check if metric already exists
        const existing = await prisma.dailyMetric.findUnique({
            where: {
                linkId_date: {
                    linkId: link.id,
                    date: new Date(row.date),
                },
            },
        });

        if (existing) {
            console.log(`  Updating existing metric ID: ${existing.id}`);
            await prisma.dailyMetric.update({
                where: { id: existing.id },
                data: {
                    clicks: existing.clicks,
                    registrations: row.registrations,
                    ftds: row.ftds,
                    qualifiedCpa: row.qualifiedCpa,
                    depositAmount: row.depositAmount,
                    commissionCpa: row.commissionCpa,
                    commissionRev: row.commissionRev,
                },
            });
        } else {
            console.log(`  Creating new metric`);
            await prisma.dailyMetric.create({
                data: {
                    linkId: link.id,
                    userId: user.id,
                    date: new Date(row.date),
                    clicks: 0,
                    registrations: row.registrations,
                    ftds: row.ftds,
                    qualifiedCpa: row.qualifiedCpa,
                    depositAmount: row.depositAmount,
                    commissionCpa: row.commissionCpa,
                    commissionRev: row.commissionRev,
                },
            });
        }

        console.log(`  Cadastros: ${row.registrations}, FTDs: ${row.ftds}`);
        console.log(`  CPA: ${row.commissionCpa}, REV: ${row.commissionRev}`);
    }

    console.log('\n✅ Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
