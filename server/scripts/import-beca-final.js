import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'becacella', mode: 'insensitive' } },
            ],
        },
    });

    if (!user) {
        console.error('User becacella not found!');
        return;
    }

    console.log('=== Limpando métricas antigas da Beca ===');
    const links = await prisma.trackingLink.findMany({
        where: { userId: user.id },
    });

    if (links.length === 0) {
        console.error('No links found!');
        return;
    }

    const link = links[0];

    // Deletar todas as métricas deste link
    const deleted = await prisma.dailyMetric.deleteMany({
        where: { linkId: link.id },
    });
    console.log(`Deletadas ${deleted.count} métricas antigas`);

    console.log('\n=== Inserindo métricas corretas ===');

    // Dados da imagem para Eucacella/Beca
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
            qualifiedCpa: 2,   // Arredondando de 1.94
            depositAmount: 130.00,
            commissionCpa: 350.00,  // 700/2
            commissionRev: 65.00,   // 130/2
        },
        {
            date: '2026-01-24',
            registrations: 39,
            ftds: 6,
            qualifiedCpa: 10,  // Arredondando de 9.75
            depositAmount: 104.00,
            commissionCpa: 350.00,  // 700/2
            commissionRev: 52.00,   // 104/2
        },
        {
            date: '2026-01-25',
            registrations: 15,
            ftds: 0,
            qualifiedCpa: -3,  // Arredondando de -3.14
            depositAmount: 0.00,
            commissionCpa: 175.00,  // 350/2
            commissionRev: 0.00,
        },
    ];

    for (const row of csvData) {
        // Criar data como 03:00 UTC para ser meia-noite em SP (UTC-3)
        const [year, month, day] = row.date.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));

        await prisma.dailyMetric.create({
            data: {
                linkId: link.id,
                userId: user.id,
                date: date,
                clicks: 0,
                registrations: row.registrations,
                ftds: row.ftds,
                qualifiedCpa: row.qualifiedCpa,
                depositAmount: row.depositAmount,
                commissionCpa: row.commissionCpa,
                commissionRev: row.commissionRev,
            },
        });

        const total = row.commissionCpa + row.commissionRev + row.qualifiedCpa;
        console.log(`${row.date}: Cad=${row.registrations}, FTD=${row.ftds}, Dep=R$${row.depositAmount}, CPA=${row.qualifiedCpa}, ComCPA=R$${row.commissionCpa}, ComREV=R$${row.commissionRev}, Total=R$${total.toFixed(2)}`);
    }

    console.log('\n=== Verificação final ===');
    const metrics = await prisma.dailyMetric.findMany({
        where: { userId: user.id, linkId: link.id },
        orderBy: { date: 'asc' },
    });

    console.log('Data (UTC)  | Data (BR) | Cad | FTD | Depósito | CPA | ComCPA | ComREV | Total');
    console.log('-------------|-----------|-----|-----|----------|-----|--------|--------|-------');
    for (const m of metrics) {
        const dateUtc = m.date.toISOString().split('T')[0];
        const dateBr = new Date(m.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const total = Number(m.commissionCpa) + Number(m.commissionRev) + m.qualifiedCpa;
        console.log(`${dateUtc} | ${dateBr.padStart(10)} | ${m.registrations.toString().padStart(3)} | ${m.ftds.toString().padStart(3)} | R$${Number(m.depositAmount).toFixed(2).padStart(7)} | ${m.qualifiedCpa.toString().padStart(3)} | R$${Number(m.commissionCpa).toFixed(2).padStart(5)} | R$${Number(m.commissionRev).toFixed(2).padStart(5)} | R$${total.toFixed(2).padStart(6)}`);
    }

    console.log('\n✅ Beca atualizada com datas corretas!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
