import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { FarmRoleGuard } from '../common/farm-role.guard';
import { DashboardService } from './dashboard.service';

@Controller('farms/:farmId/dashboard')
@UseGuards(AuthGuard, FarmRoleGuard)
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  get(@Param('farmId') farmId: string) {
    return this.dashboard.payload(farmId);
  }
}
