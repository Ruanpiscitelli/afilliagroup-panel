import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para criar data no fuso horário de São Paulo
function createDateInBR(dateStr) {
    // Cria a data como se fosse em São Paulo (UTC-3)
    const [year, month, day] = dateStr.split('-').map(Number);
    // Cria data em UTC e adiciona 3 horas para compensar o fuso de SP
    const date = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
    return date;
}

async function main() {
    const csvData = [
        {
            date: '2026-01-23',
            registrations: 36,
            ftds: 4,
            qualifiedCpa: -118,  // Arredondado porque campo é Int no schema
            depositAmount: 210.00,
            commissionCpa: 525.00,
            commissionRev: 105.00,
        },
        {
            date: '2026-01-24',
            registrations: 30,
            ftds: 5,
            qualifiedCpa: 41,
            depositAmount: 540.00,
            commissionCpa: 525.00,
            commissionRev: 270.00,
        },
        {
            date: '2026-01-25',
            registrations: 7,
            ftds: 0,
            qualifiedCpa: 18,
            depositAmount: 47.00,
            commissionCpa: 0.00,
            commissionRev: 23.50,
        },
    ];

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

    console.log('=== DANIELA - Corrigindo datas e valores ===');

    const links = await prisma.trackingLink.findMany({
        where: { userId: user.id },
    });

    if (links.length === 0) {
        console.error('No links found!');
        return;
    }

    const link = links[0];

    for (const row of csvData) {
        const dateBr = createDateInBR(row.date);

        console.log(`\nData planilha: ${row.date}`);
        console.log(`  Data salvando no banco (UTC+3): ${dateBr.toISOString()}`);

        const existing = await prisma.dailyMetric.findFirst({
            where: {
                linkId: link.id,
                date: dateBr,
            },
        });

        if (existing) {
            await prisma.dailyMetric.update({
                where: { id: existing.id },
                data: {
                    date: dateBr,
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
                    date: dateBr,
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

    console.log('\n=== Verificando dados no banco ===');
    const metrics = await prisma.dailyMetric.findMany({
        where: { userId: user.id, linkId: link.id },
        orderBy: { date: 'asc' },
    });

    console.log('Data (UTC) | Data (BR) | Cad | FTD | Depósito | CPA Qual | Com CPA | Com REV');
    console.log('-----------|-----------|-----|-----|----------|----------|---------|---------');
    for (const m of metrics) {
        const dateUtc = m.date.toISOString().split('T')[0];
        const dateBr = new Date(m.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        console.log(`${dateUtc} | ${dateBr.padStart(10)} | ${m.registrations.toString().padStart(3)} | ${m.ftds.toString().padStart(3)} | R$ ${Number(m.depositAmount).toFixed(2).padStart(7)} | ${m.qualifiedCpa.toString().padStart(8)} | R$ ${Number(m.commissionCpa).toFixed(2).padStart(6)} | R$ ${Number(m.commissionRev).toFixed(2).padStart(6)}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
