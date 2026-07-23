// Seeds a demo account so the app is explorable on first run.
//   email: demo@farm.test  password: password123
// Run with: npm run db:seed -w apps/api
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function dayOffset(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@farm.test' },
    update: {},
    create: { email: 'demo@farm.test', passwordHash, name: 'Demo Farmer' },
  });

  const existing = await prisma.farm.findFirst({ where: { members: { some: { userId: user.id } } } });
  if (existing) {
    console.log('Demo farm already exists — skipping seed.');
    return;
  }

  const farm = await prisma.farm.create({
    data: {
      name: 'Green Valley Dairy',
      mode: 'HYBRID',
      currencySymbol: '$',
      milkPriceCents: 68,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  });

  const milking = await prisma.herdGroup.create({
    data: { farmId: farm.id, name: 'Milking herd', type: 'MILKING', headcount: 24 },
  });
  await prisma.herdGroup.createMany({
    data: [
      { farmId: farm.id, name: 'Dry cows', type: 'DRY', headcount: 6 },
      { farmId: farm.id, name: 'Heifers', type: 'HEIFER', headcount: 8 },
      { farmId: farm.id, name: 'Calves', type: 'CALF', headcount: 5 },
    ],
  });

  await prisma.animal.createMany({
    data: [
      { farmId: farm.id, tag: 'C-102', name: 'Bella', breed: 'Holstein', groupId: milking.id, status: 'MILKING' },
      { farmId: farm.id, tag: 'C-107', name: 'Daisy', breed: 'Jersey', groupId: milking.id, status: 'MILKING' },
    ],
  });

  for (let i = 6; i >= 0; i--) {
    const date = dayOffset(i);
    const morning = 210 + Math.round(Math.random() * 30);
    const evening = 180 + Math.round(Math.random() * 30);
    await prisma.milkRecord.createMany({
      data: [
        { farmId: farm.id, date, session: 'MORNING', scope: 'HERD', liters: morning },
        { farmId: farm.id, date, session: 'EVENING', scope: 'HERD', liters: evening },
      ],
    });
    await prisma.feedRecord.create({
      data: { farmId: farm.id, date, scope: 'HERD', feedType: 'Mixed ration', quantityKg: 620, costCents: 148000 },
    });
    if (i % 2 === 0) {
      await prisma.expense.create({
        data: { farmId: farm.id, date, category: 'Labor', amountCents: 60000, note: 'Daily wages' },
      });
    }
    await prisma.sale.create({
      data: {
        farmId: farm.id,
        date,
        liters: Math.round((morning + evening) * 0.9),
        priceCentsPerLiter: 68,
        customerName: 'Valley Dairy Co-op',
        paid: i > 1,
      },
    });
  }

  console.log('Seeded demo farm. Log in with demo@farm.test / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
