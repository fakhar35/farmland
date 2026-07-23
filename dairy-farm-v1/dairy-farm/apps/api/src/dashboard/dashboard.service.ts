import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DayTotals {
  date: string;
  milkLiters: number;
  soldLiters: number;
  revenueCents: number;
  feedCostCents: number;
  expenseCents: number;
  profitCents: number;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async payload(farmId: string) {
    const today = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);

    const [milk, feed, expenses, sales, groups, animals, unpaid] = await Promise.all([
      this.prisma.milkRecord.findMany({
        where: { farmId, date: { gte: start, lte: today } },
        select: { date: true, liters: true },
      }),
      this.prisma.feedRecord.findMany({
        where: { farmId, date: { gte: start, lte: today } },
        select: { date: true, costCents: true },
      }),
      this.prisma.expense.findMany({
        where: { farmId, date: { gte: start, lte: today } },
        select: { date: true, amountCents: true },
      }),
      this.prisma.sale.findMany({
        where: { farmId, date: { gte: start, lte: today } },
        select: { date: true, liters: true, priceCentsPerLiter: true },
      }),
      this.prisma.herdGroup.findMany({
        where: { farmId },
        select: { type: true, headcount: true, _count: { select: { animals: true } } },
      }),
      this.prisma.animal.count({
        where: { farmId, status: { notIn: ['SOLD', 'CULLED', 'DEAD'] } },
      }),
      this.prisma.sale.findMany({
        where: { farmId, paid: false },
        select: { liters: true, priceCentsPerLiter: true },
      }),
    ]);

    // Build the 7-day series.
    const series: DayTotals[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = iso(d);
      const dayMilk = milk.filter((m) => iso(m.date) === key).reduce((s, m) => s + Number(m.liters), 0);
      const daySales = sales.filter((x) => iso(x.date) === key);
      const soldLiters = daySales.reduce((s, x) => s + Number(x.liters), 0);
      const revenueCents = daySales.reduce((s, x) => s + Math.round(Number(x.liters) * x.priceCentsPerLiter), 0);
      const feedCostCents = feed.filter((f) => iso(f.date) === key).reduce((s, f) => s + f.costCents, 0);
      const expenseCents = expenses.filter((e) => iso(e.date) === key).reduce((s, e) => s + e.amountCents, 0);
      series.push({
        date: key,
        milkLiters: dayMilk,
        soldLiters,
        revenueCents,
        feedCostCents,
        expenseCents,
        profitCents: revenueCents - feedCostCents - expenseCents,
      });
    }

    // Headcount: registered animals if any exist, otherwise group headcounts.
    const groupHeadcount = groups.reduce((s, g) => s + g.headcount, 0);
    const totalAnimals = animals > 0 ? animals : groupHeadcount;
    const milkingCount = groups
      .filter((g) => g.type === 'MILKING')
      .reduce((s, g) => s + (g._count.animals > 0 ? g._count.animals : g.headcount), 0);

    const unpaidCents = unpaid.reduce((s, x) => s + Math.round(Number(x.liters) * x.priceCentsPerLiter), 0);

    return {
      today: series[series.length - 1],
      series7d: series,
      totalAnimals,
      milkingCount,
      unpaidCents,
    };
  }
}
