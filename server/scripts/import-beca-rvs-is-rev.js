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

    console.log('=== BECA - RVS é REV! Atualizando ===\n');

    const links = await prisma.trackingLink.findMany({
        where: { userId: user.id },
    });

    if (links.length === 0) {
        console.error('No links found!');
        return;
    }

    const link = links[0];

    // Deletar todas as métricas
    await prisma.dailyMetric.deleteMany({
        where: { linkId: link.id },
    });

    // Dados do CSV para Eucacella
    // Afiliado,Data,Cadastros,FTDs,RVS,CPA Qualificado,Depósitos (R$),CPA,Total
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
            qualifiedCpa: 2,      // Coluna "CPA Qualificado"
            depositAmount: 130.00,
            commissionCpa: 350.00,    // "CPA" (700) / 2
            commissionRev: 1.94,      // "RVS" = 1.94 (REV do CSV)
        },
        {
            date: '2026-01-24',
            registrations: 39,
            ftds: 6,
            qualifiedCpa: 2,      // Coluna "CPA Qualificado"
            depositAmount: 104.00,
            commissionCpa: 350.00,    // "CPA" (700) / 2
            commissionRev: 9.75,      // "RVS" = 9.75 (REV do CSV)
        },
        {
            date: '2026-01-25',
            registrations: 15,
            ftds: 0,
            qualifiedCpa: 1,      // Coluna "CPA Qualificado"
            depositAmount: 0.00,
            commissionCpa: 175.00,    // "CPA" (350) / 2
            commissionRev: -3.14,     // "RVS" = -3.14 (REV do CSV)
        },
    ];

    console.log('Dados do CSV:');
    console.log('Data       | Cad | FTD | CPA Qual | Depósito  | CPA (col) | RVS (REV) | Com CPA | Com REV');
    console.log('-----------|-----|-----|----------|-----------|-----------|-----------|---------|---------');
    for (const row of csvData) {
        console.log(`${row.date} | ${row.registrations} | ${row.ftds} | ${row.qualifiedCpa} | R$ ${row.depositAmount.toFixed(2).padStart(7)} | R$ ${(row.commissionCpa * 2).toFixed(2).padStart(7)} | R$ ${row.commissionRev.toFixed(2).padStart(8)} | R$ ${row.commissionCpa.toFixed(2).padStart(6)} | R$ ${row.commissionRev.toFixed(2).padStart(6)}`);
    }

    console.log('\n=== Inserindo no banco ===');

    for (const row of csvData) {
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
    }

    console.log('\n=== Verificação ===');
    const metrics = await prisma.dailyMetric.findMany({
        where: { userId: user.id, linkId: link.id },
        orderBy: { date: 'asc' },
    });

    console.log('Data (BR)  | Cad | FTD | CPA Qual | Depósito | Com CPA | Com REV | Total DB | Total CSV');
    console.log('-----------|-----|-----|----------|----------|---------|---------|---------|----------');
    const totalsCsv = [0, 701.94, 709.75, 346.86];
    for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i];
        const dateBr = new Date(m.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const total = Number(m.commissionCpa) + Number(m.commissionRev) + m.qualifiedCpa;
        console.log(`${dateBr.padStart(10)} | ${m.registrations.toString().padStart(3)} | ${m.ftds.toString().padStart(3)} | ${m.qualifiedCpa.toString().padStart(8)} | R$${Number(m.depositAmount).toFixed(2).padStart(7)} | R$${Number(m.commissionCpa).toFixed(2).padStart(6)} | R$${Number(m.commissionRev).toFixed(2).padStart(7)} | R$${total.toFixed(2).padStart(7)} | R$${totalsCsv[i].toFixed(2)}`);
    }

    console.log('\n✅ Beca atualizada!');
    console.log('   commissionCpa = "CPA" do CSV / 2');
    console.log('   commissionRev = "RVS" do CSV (valor direto)');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
