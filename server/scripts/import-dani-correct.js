import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Dados exatos da imagem para Dani
    // CPA no banco = coluna "CPA" da planilha / 2
    // REV no banco = coluna "Depósitos" da planilha / 2
    const csvData = [
        {
            date: '2026-01-23',
            registrations: 36,
            ftds: 4,
            qualifiedCpa: -118.73,
            depositAmount: 210.00,
            commissionCpa: 1050.00 / 2,  // 525.00
            commissionRev: 210.00 / 2,   // 105.00
        },
        {
            date: '2026-01-24',
            registrations: 30,
            ftds: 5,
            qualifiedCpa: 41.15,
            depositAmount: 540.00,
            commissionCpa: 1050.00 / 2,  // 525.00
            commissionRev: 540.00 / 2,   // 270.00
        },
        {
            date: '2026-01-25',
            registrations: 7,
            ftds: 0,
            qualifiedCpa: 18.25,
            depositAmount: 47.00,
            commissionCpa: 0.00 / 2,     // 0.00
            commissionRev: 47.00 / 2,    // 23.50
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

    console.log('=== DANIELA - Atualizando métricas ===');
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
        console.log(`\nData: ${row.date}`);
        console.log(`  Cadastros: ${row.registrations}, FTDs: ${row.ftds}`);
        console.log(`  Depósitos: R$ ${row.depositAmount.toFixed(2)}`);
        console.log(`  CPA Qual: ${row.qualifiedCpa}`);
        console.log(`  Comissão CPA: R$ ${row.commissionCpa.toFixed(2)} (1050/2)`);
        console.log(`  Comissão REV: R$ ${row.commissionRev.toFixed(2)} (${row.depositAmount}/2)`);
        console.log(`  Total: R$ ${(row.commissionCpa + row.commissionRev + row.qualifiedCpa).toFixed(2)}`);

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
                    clicks: 0,
                    registrations: row.registrations,
                    ftds: row.ftds,
                    qualifiedCpa: row.qualifiedCpa,
                    depositAmount: row.depositAmount,
                    commissionCpa: row.commissionCpa,
                    commissionRev: row.commissionRev,
                },
            });
            console.log(`  ✅ Atualizado (ID: ${existing.id})`);
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
            console.log(`  ✅ Criado novo`);
        }
    }

    console.log('\n=== RESUMO ===');
    console.log('Data       | Cad | FTD | Depósito   | CPA Qual | Com CPA | Com REV | Total');
    console.log('-----------|-----|-----|------------|----------|---------|---------|-----------');
    for (const row of csvData) {
        const total = row.commissionCpa + row.commissionRev + row.qualifiedCpa;
        console.log(`${row.date} | ${row.registrations.toString().padStart(3)} | ${row.ftds.toString().padStart(3)} | R$ ${row.depositAmount.toFixed(2).padStart(8)} | ${row.qualifiedCpa.toString().padStart(8)} | R$ ${row.commissionCpa.toFixed(2).padStart(6)} | R$ ${row.commissionRev.toFixed(2).padStart(6)} | R$ ${total.toFixed(2).padStart(8)}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
