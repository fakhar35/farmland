import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { FarmRoleGuard } from '../common/farm-role.guard';
import { CreateAnimalDto, UpdateAnimalDto } from './animals.dto';
import { AnimalsService } from './animals.service';

@Controller('farms/:farmId/animals')
@UseGuards(AuthGuard, FarmRoleGuard)
export class AnimalsController {
  constructor(private animals: AnimalsService) {}

  @Get()
  list(@Param('farmId') farmId: string) {
    return this.animals.list(farmId);
  }

  @Post()
  create(@Param('farmId') farmId: string, @Body() dto: CreateAnimalDto) {
    return this.animals.create(farmId, dto);
  }

  @Patch(':id')
  update(@Param('farmId') farmId: string, @Param('id') id: string, @Body() dto: UpdateAnimalDto) {
    return this.animals.update(farmId, id, dto);
  }
}
