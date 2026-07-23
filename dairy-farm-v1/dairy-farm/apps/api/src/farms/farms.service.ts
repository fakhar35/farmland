import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmDto, UpdateFarmDto } from './farms.dto';

@Injectable()
export class FarmsService {
  constructor(private prisma: PrismaService) {}

  // Creating a farm makes the creator its OWNER and seeds default groups.
  async create(userId: string, dto: CreateFarmDto) {
    return this.prisma.$transaction(async (tx) => {
      const farm = await tx.farm.create({ data: { ...dto } });
      await tx.farmMember.create({
        data: { farmId: farm.id, userId, role: Role.OWNER },
      });
      await tx.herdGroup.createMany({
        data: [
          { farmId: farm.id, name: 'Milking herd', type: 'MILKING' },
          { farmId: farm.id, name: 'Dry cows', type: 'DRY' },
          { farmId: farm.id, name: 'Heifers', type: 'HEIFER' },
          { farmId: farm.id, name: 'Calves', type: 'CALF' },
        ],
      });
      return farm;
    });
  }

  mine(userId: string) {
    return this.prisma.farm.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  get(farmId: string) {
    return this.prisma.farm.findUniqueOrThrow({ where: { id: farmId } });
  }

  update(farmId: string, dto: UpdateFarmDto) {
    return this.prisma.farm.update({ where: { id: farmId }, data: dto });
  }
}
