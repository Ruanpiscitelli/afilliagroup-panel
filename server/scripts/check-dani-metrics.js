import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'danielacacella', mode: 'insensitive' } },
                { name: { contains: 'danicacella', mode: 'insensitive' } },
            ],
        },
    });

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log('=== Métricas atuais no banco para DANIELA ===');
    console.log('User:', user.name, user.id);

    const metrics = await prisma.dailyMetric.findMany({
        where: { userId: user.id },
        orderBy: { date: 'asc' },
        include: { link: { include: { campaign: true } } },
    });

    console.log('\nData (UTC) | Data (BR) | Cad | FTD | Depósito   | CPA Qual | Com CPA | Com REV | Total');
    console.log('-----------|-----------|-----|-----|------------|----------|---------|---------|-----------');

    for (const m of metrics) {
        const dateUtc = m.date.toISOString().split('T')[0];
        const dateBr = new Date(m.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const total = Number(m.commissionCpa) + Number(m.commissionRev) + Number(m.qualifiedCpa);

        console.log(`${dateUtc} | ${dateBr.padStart(10)} | ${m.registrations.toString().padStart(3)} | ${m.ftds.toString().padStart(3)} | R$ ${Number(m.depositAmount).toFixed(2).padStart(8)} | ${Number(m.qualifiedCpa).toFixed(2).padStart(8)} | R$ ${Number(m.commissionCpa).toFixed(2).padStart(6)} | R$ ${Number(m.commissionRev).toFixed(2).padStart(6)} | R$ ${total.toFixed(2).padStart(8)}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
