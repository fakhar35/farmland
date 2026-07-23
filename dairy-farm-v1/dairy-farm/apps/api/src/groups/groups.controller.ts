import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { FarmRoleGuard } from '../common/farm-role.guard';
import { CreateGroupDto, UpdateGroupDto } from './groups.dto';
import { GroupsService } from './groups.service';

@Controller('farms/:farmId/groups')
@UseGuards(AuthGuard, FarmRoleGuard)
export class GroupsController {
  constructor(private groups: GroupsService) {}

  @Get()
  list(@Param('farmId') farmId: string) {
    return this.groups.list(farmId);
  }

  @Post()
  create(@Param('farmId') farmId: string, @Body() dto: CreateGroupDto) {
    return this.groups.create(farmId, dto);
  }

  @Patch(':id')
  update(@Param('farmId') farmId: string, @Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groups.update(farmId, id, dto);
  }
}
