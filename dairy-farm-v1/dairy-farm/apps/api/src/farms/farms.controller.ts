import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard, AuthedRequest } from '../common/auth.guard';
import { FarmRoleGuard, FarmRoles } from '../common/farm-role.guard';
import { CreateFarmDto, UpdateFarmDto } from './farms.dto';
import { FarmsService } from './farms.service';

@Controller('farms')
@UseGuards(AuthGuard)
export class FarmsController {
  constructor(private farms: FarmsService) {}

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateFarmDto) {
    return this.farms.create(req.user!.sub, dto);
  }

  @Get('mine')
  mine(@Req() req: AuthedRequest) {
    return this.farms.mine(req.user!.sub);
  }

  @Get(':farmId')
  @UseGuards(FarmRoleGuard)
  get(@Param('farmId') farmId: string) {
    return this.farms.get(farmId);
  }

  @Patch(':farmId')
  @UseGuards(FarmRoleGuard)
  @FarmRoles(Role.OWNER, Role.MANAGER)
  update(@Param('farmId') farmId: string, @Body() dto: UpdateFarmDto) {
    return this.farms.update(farmId, dto);
  }
}
