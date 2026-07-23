import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthedRequest } from '../common/auth.guard';
import { FarmRoleGuard, FarmRoles, FINANCE_ROLES } from '../common/farm-role.guard';
import { CreateExpenseDto, CreateFeedDto, CreateMilkDto, CreateSaleDto } from './records.dto';
import { RecordsService } from './records.service';
import { daysAgoISO, todayISO } from './range.util';

@Controller('farms/:farmId')
@UseGuards(AuthGuard, FarmRoleGuard)
export class RecordsController {
  constructor(private records: RecordsService) {}

  // ---- milk ----
  @Post('milk')
  createMilk(@Param('farmId') farmId: string, @Req() req: AuthedRequest, @Body() dto: CreateMilkDto) {
    return this.records.createMilk(farmId, req.user!.sub, dto);
  }

  @Get('milk')
  listMilk(@Param('farmId') farmId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.records.listMilk(farmId, from ?? daysAgoISO(30), to ?? todayISO());
  }

  // ---- feed ----
  @Post('feed')
  createFeed(@Param('farmId') farmId: string, @Req() req: AuthedRequest, @Body() dto: CreateFeedDto) {
    return this.records.createFeed(farmId, req.user!.sub, dto);
  }

  @Get('feed')
  listFeed(@Param('farmId') farmId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.records.listFeed(farmId, from ?? daysAgoISO(30), to ?? todayISO());
  }

  // ---- expenses (finance-restricted) ----
  @Post('expenses')
  @FarmRoles(...FINANCE_ROLES)
  createExpense(@Param('farmId') farmId: string, @Req() req: AuthedRequest, @Body() dto: CreateExpenseDto) {
    return this.records.createExpense(farmId, req.user!.sub, dto);
  }

  @Get('expenses')
  @FarmRoles(...FINANCE_ROLES)
  listExpenses(@Param('farmId') farmId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.records.listExpenses(farmId, from ?? daysAgoISO(30), to ?? todayISO());
  }

  // ---- sales (finance-restricted) ----
  @Post('sales')
  @FarmRoles(...FINANCE_ROLES)
  createSale(@Param('farmId') farmId: string, @Req() req: AuthedRequest, @Body() dto: CreateSaleDto) {
    return this.records.createSale(farmId, req.user!.sub, dto);
  }

  @Get('sales')
  @FarmRoles(...FINANCE_ROLES)
  listSales(@Param('farmId') farmId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.records.listSales(farmId, from ?? daysAgoISO(30), to ?? todayISO());
  }

  @Patch('sales/:id/paid')
  @FarmRoles(...FINANCE_ROLES)
  markPaid(@Param('farmId') farmId: string, @Param('id') id: string) {
    return this.records.markSalePaid(farmId, id);
  }
}
