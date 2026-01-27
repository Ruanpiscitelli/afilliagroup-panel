import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const metrics = await prisma.dailyMetric.findMany({
        where: {
            OR: [
                { commissionCpa: 1008 },
                { commissionRev: 1008 },
                { depositAmount: 1008 },
                { qualifiedCpa: 1008 },
                { clicks: 1008 },
                { registrations: 1008 },
                { ftds: 1008 },
            ]
        },
        include: {
            user: true
        }
    });

    console.log('Results:', JSON.stringify(metrics, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
