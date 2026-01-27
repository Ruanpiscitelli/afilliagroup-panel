import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // CSV Data for Eucacella/becacella
    // CPA, REV and Total must be divided by 2
    const csvData = [
        {
            date: '2026-01-22',
            registrations: 0,
            ftds: 0,
            qualifiedCpa: 0,
            depositAmount: 0.00,
            commissionCpa: 0.00,
            commissionRev: 0.00,
        },
        {
            date: '2026-01-23',
            registrations: 24,
            ftds: 5,
            qualifiedCpa: 2,
            depositAmount: 130.00,
            commissionCpa: 700.00 / 2,  // Divide by 2
            commissionRev: 700.00 / 2,  // Divide by 2
        },
        {
            date: '2026-01-24',
            registrations: 39,
            ftds: 6,
            qualifiedCpa: 2,
            depositAmount: 104.00,
            commissionCpa: 700.00 / 2,  // Divide by 2
            commissionRev: 700.00 / 2,  // Divide by 2
        },
        {
            date: '2026-01-25',
            registrations: 15,
            ftds: 0,
            qualifiedCpa: 1,
            depositAmount: 0.00,
            commissionCpa: 350.00 / 2,  // Divide by 2
            commissionRev: 350.00 / 2,  // Divide by 2
        },
    ];

    // Find user becacella/Eucacella
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'becacella', mode: 'insensitive' } },
                { name: { contains: 'eucacella', mode: 'insensitive' } },
                { email: { contains: 'becacella', mode: 'insensitive' } },
                { email: { contains: 'eucacella', mode: 'insensitive' } },
            ],
        },
    });

    if (!user) {
        console.error('User becacella/Eucacella not found!');
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
        const existing = await prisma.dailyMetric.findFirst({
            where: {
                linkId: link.id,
                date: new Date(row.date),
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
