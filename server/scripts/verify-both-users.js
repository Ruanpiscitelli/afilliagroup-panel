import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== VERIFICANDO DADOS NO BANCO ===\n');

    // Dani
    const dani = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'danielacacella', mode: 'insensitive' } },
                { name: { contains: 'danicacella', mode: 'insensitive' } },
            ],
        },
    });

    if (dani) {
        console.log('👤 DANIELA (danicacella):');
        const daniMetrics = await prisma.dailyMetric.findMany({
            where: { userId: dani.id },
            orderBy: { date: 'asc' },
        });

        console.log('Data (BR)  | Cad | FTD | CPA Qual | Depósito | Com CPA | Com REV | Total');
        console.log('-----------|-----|-----|----------|----------|---------|---------|---------');
        for (const m of daniMetrics) {
            const dateBr = new Date(m.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            const total = Number(m.commissionCpa) + Number(m.commissionRev) + m.qualifiedCpa;
            console.log(`${dateBr.padStart(10)} | ${m.registrations.toString().padStart(3)} | ${m.ftds.toString().padStart(3)} | ${m.qualifiedCpa.toString().padStart(8)} | R$${Number(m.depositAmount).toFixed(2).padStart(7)} | R$${Number(m.commissionCpa).toFixed(2).padStart(6)} | R$${Number(m.commissionRev).toFixed(2).padStart(7)} | R$${total.toFixed(2).padStart(6)}`);
        }
        console.log(`Total: ${daniMetrics.length} métricas\n`);
    }

    // Beca
    const beca = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'becacella', mode: 'insensitive' } },
            ],
        },
    });

    if (beca) {
        console.log('👤 BECA (becacella):');
        const becaMetrics = await prisma.dailyMetric.findMany({
            where: { userId: beca.id },
            orderBy: { date: 'asc' },
        });

        console.log('Data (BR)  | Cad | FTD | CPA Qual | Depósito | Com CPA | Com REV | Total');
        console.log('-----------|-----|-----|----------|----------|---------|---------|---------');
        for (const m of becaMetrics) {
            const dateBr = new Date(m.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            const total = Number(m.commissionCpa) + Number(m.commissionRev) + m.qualifiedCpa;
            console.log(`${dateBr.padStart(10)} | ${m.registrations.toString().padStart(3)} | ${m.ftds.toString().padStart(3)} | ${m.qualifiedCpa.toString().padStart(8)} | R$${Number(m.depositAmount).toFixed(2).padStart(7)} | R$${Number(m.commissionCpa).toFixed(2).padStart(6)} | R$${Number(m.commissionRev).toFixed(2).padStart(7)} | R$${total.toFixed(2).padStart(6)}`);
        }
        console.log(`Total: ${becaMetrics.length} métricas\n`);
    }

    console.log('✅ Dados confirmados no banco de dados!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
