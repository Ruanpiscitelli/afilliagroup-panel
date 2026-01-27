import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find user becacella
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'becacella', mode: 'insensitive' } },
                { email: { contains: 'becacella', mode: 'insensitive' } },
            ],
        },
    });

    if (!user) {
        console.error('User becacella not found!');
        return;
    }

    console.log('Found user:', user.name, user.id);

    // Get or create default campaign
    let campaign = await prisma.campaign.findFirst({
        where: { slug: 'cadastro' },
    });

    if (!campaign) {
        console.log('Creating default campaign...');
        campaign = await prisma.campaign.create({
            data: {
                name: 'Cadastro',
                slug: 'cadastro',
            },
        });
        console.log('Campaign created:', campaign.id);
    } else {
        console.log('Using existing campaign:', campaign.id, campaign.name);
    }

    // Generate tracking code
    const trackingCode = `reg_${Math.floor(1000 + Math.random() * 9000)}`;

    // Create link
    const link = await prisma.trackingLink.create({
        data: {
            userId: user.id,
            campaignId: campaign.id,
            platformUrl: 'https://example.com', // Default URL
            trackingCode: trackingCode,
        },
    });

    console.log('✅ Link created:', link.id, 'Tracking code:', link.trackingCode);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
