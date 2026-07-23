import { BadRequestException, Injectable } from '@nestjs/common';
import { RecordScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { CreateExpenseDto, CreateFeedDto, CreateMilkDto, CreateSaleDto } from './records.dto';

// Scope rule (mirrors @dairy/shared.validateScope, enforced server-side):
// exactly one reference matches the declared scope. This is what prevents
// herd totals and per-animal entries from double-counting in reports.
function assertScope(scope: RecordScope, groupId?: string, animalId?: string) {
  const bad =
    (scope === 'HERD' && (groupId || animalId)) ||
    (scope === 'GROUP' && (!groupId || animalId)) ||
    (scope === 'ANIMAL' && (!animalId || groupId));
  if (bad) throw new BadRequestException(`References do not match scope ${scope}`);
}

@Injectable()
export class RecordsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ---- milk ----
  async createMilk(farmId: string, userId: string, dto: CreateMilkDto) {
    assertScope(dto.scope, dto.groupId, dto.animalId);
    const rec = await this.prisma.milkRecord.create({
      data: {
        farmId,
        date: new Date(dto.date),
        session: dto.session,
        scope: dto.scope,
        groupId: dto.groupId,
        animalId: dto.animalId,
        liters: dto.liters,
        createdById: userId,
      },
    });
    await this.audit.log({ farmId, userId, action: 'milk.create', entity: 'MilkRecord', entityId: rec.id, data: dto });
    return rec;
  }

  listMilk(farmId: string, from: string, to: string) {
    return this.prisma.milkRecord.findMany({
      where: { farmId, date: { gte: new Date(from), lte: new Date(to) } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ---- feed ----
  async createFeed(farmId: string, userId: string, dto: CreateFeedDto) {
    assertScope(dto.scope, dto.groupId, dto.animalId);
    const rec = await this.prisma.feedRecord.create({
      data: {
        farmId,
        date: new Date(dto.date),
        scope: dto.scope,
        groupId: dto.groupId,
        animalId: dto.animalId,
        feedType: dto.feedType,
        quantityKg: dto.quantityKg,
        costCents: dto.costCents,
        createdById: userId,
      },
    });
    await this.audit.log({ farmId, userId, action: 'feed.create', entity: 'FeedRecord', entityId: rec.id, data: dto });
    return rec;
  }

  listFeed(farmId: string, from: string, to: string) {
    return this.prisma.feedRecord.findMany({
      where: { farmId, date: { gte: new Date(from), lte: new Date(to) } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ---- expenses ----
  async createExpense(farmId: string, userId: string, dto: CreateExpenseDto) {
    const rec = await this.prisma.expense.create({
      data: { farmId, date: new Date(dto.date), category: dto.category, amountCents: dto.amountCents, note: dto.note, createdById: userId },
    });
    await this.audit.log({ farmId, userId, action: 'expense.create', entity: 'Expense', entityId: rec.id, data: dto });
    return rec;
  }

  listExpenses(farmId: string, from: string, to: string) {
    return this.prisma.expense.findMany({
      where: { farmId, date: { gte: new Date(from), lte: new Date(to) } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ---- sales ----
  async createSale(farmId: string, userId: string, dto: CreateSaleDto) {
    const rec = await this.prisma.sale.create({
      data: {
        farmId,
        date: new Date(dto.date),
        liters: dto.liters,
        priceCentsPerLiter: dto.priceCentsPerLiter,
        customerName: dto.customerName,
        paid: dto.paid,
        createdById: userId,
      },
    });
    await this.audit.log({ farmId, userId, action: 'sale.create', entity: 'Sale', entityId: rec.id, data: dto });
    return rec;
  }

  listSales(farmId: string, from: string, to: string) {
    return this.prisma.sale.findMany({
      where: { farmId, date: { gte: new Date(from), lte: new Date(to) } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  markSalePaid(farmId: string, id: string) {
    return this.prisma.sale.update({ where: { id, farmId }, data: { paid: true } });
  }
}
