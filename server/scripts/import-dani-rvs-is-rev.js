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

    console.log('=== DANI - RVS é REV! Atualizando ===\n');

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

    // Dados do CSV: Afiliado,Data,Cadastros,FTDs,RVS,CPA Qualificado,Depósitos (R$),CPA,Total
    // RVS é o valor de REV!
    const csvData = [
        {
            date: '2026-01-23',
            registrations: 36,
            ftds: 4,
            qualifiedCpa: 3,      // Coluna "CPA Qualificado"
            depositAmount: 210.00,
            commissionCpa: 525.00,    // "CPA" (1050) / 2
            commissionRev: -118.73,   // "RVS" = -118.73 (REV do CSV)
        },
        {
            date: '2026-01-24',
            registrations: 30,
            ftds: 5,
            qualifiedCpa: 3,      // Coluna "CPA Qualificado"
            depositAmount: 540.00,
            commissionCpa: 525.00,    // "CPA" (1050) / 2
            commissionRev: 41.15,     // "RVS" = 41.15 (REV do CSV)
        },
        {
            date: '2026-01-25',
            registrations: 7,
            ftds: 0,
            qualifiedCpa: 0,      // Coluna "CPA Qualificado"
            depositAmount: 47.00,
            commissionCpa: 0.00,      // "CPA" (0) / 2
            commissionRev: 18.25,     // "RVS" = 18.25 (REV do CSV)
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
    const totalsCsv = [931.27, 1091.15, 18.25];
    for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i];
        const dateBr = new Date(m.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const total = Number(m.commissionCpa) + Number(m.commissionRev) + m.qualifiedCpa;
        console.log(`${dateBr.padStart(10)} | ${m.registrations.toString().padStart(3)} | ${m.ftds.toString().padStart(3)} | ${m.qualifiedCpa.toString().padStart(8)} | R$${Number(m.depositAmount).toFixed(2).padStart(7)} | R$${Number(m.commissionCpa).toFixed(2).padStart(6)} | R$${Number(m.commissionRev).toFixed(2).padStart(7)} | R$${total.toFixed(2).padStart(7)} | R$${totalsCsv[i].toFixed(2)}`);
    }

    console.log('\n✅ Dani atualizada!');
    console.log('   commissionCpa = "CPA" do CSV / 2');
    console.log('   commissionRev = "RVS" do CSV (valor direto)');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
