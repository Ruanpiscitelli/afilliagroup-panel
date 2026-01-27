import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // CSV Data for Danielacacella - CORRECTED
    // commissionCpa = "CPA" / 2
    // commissionRev = "Depósitos" / 2
    const csvData = [
        {
            date: '2026-01-23',
            registrations: 36,
            ftds: 4,
            qualifiedCpa: -118.73,
            depositAmount: 210.00,
            commissionCpa: 1050.00 / 2,  // "CPA" column / 2
            commissionRev: 210.00 / 2,   // "Depósitos" / 2
        },
        {
            date: '2026-01-24',
            registrations: 30,
            ftds: 5,
            qualifiedCpa: 41.15,
            depositAmount: 540.00,
            commissionCpa: 1050.00 / 2,
            commissionRev: 540.00 / 2,
        },
        {
            date: '2026-01-25',
            registrations: 7,
            ftds: 0,
            qualifiedCpa: 18.25,
            depositAmount: 47.00,
            commissionCpa: 0.00,
            commissionRev: 47.00 / 2,
        },
    ];

    // Find user Danielacacella
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'danielacacella', mode: 'insensitive' } },
                { name: { contains: 'danicacella', mode: 'insensitive' } },
            ],
        },
    });

    if (!user) {
        console.error('User Danielacacella not found!');
        return;
    }

    console.log('=== Updating DANIELACELLA metrics ===');
    console.log('User:', user.name, user.id);

    const links = await prisma.trackingLink.findMany({
        where: { userId: user.id },
    });

    if (links.length === 0) {
        console.error('No links found!');
        return;
    }

    const link = links[0];

    for (const row of csvData) {
        console.log(`\nProcessing ${row.date}:`);

        const existing = await prisma.dailyMetric.findFirst({
            where: {
                linkId: link.id,
                date: new Date(row.date),
            },
        });

        if (existing) {
            await prisma.dailyMetric.update({
                where: { id: existing.id },
                data: {
                    registrations: row.registrations,
                    ftds: row.ftds,
                    qualifiedCpa: row.qualifiedCpa,
                    depositAmount: row.depositAmount,
                    commissionCpa: row.commissionCpa,
                    commissionRev: row.commissionRev,
                },
            });
            console.log(`  ✅ Updated ID ${existing.id}`);
        } else {
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
            console.log(`  ✅ Created new`);
        }

        console.log(`     CPA: ${row.commissionCpa}, REV: ${row.commissionRev}, Total: ${(row.commissionCpa + row.commissionRev + row.qualifiedCpa).toFixed(2)}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
