import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './groups.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  list(farmId: string) {
    return this.prisma.herdGroup.findMany({
      where: { farmId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { animals: true } } },
    });
  }

  create(farmId: string, dto: CreateGroupDto) {
    return this.prisma.herdGroup.create({ data: { farmId, ...dto } });
  }

  update(farmId: string, id: string, dto: UpdateGroupDto) {
    return this.prisma.herdGroup.update({
      where: { id, farmId },
      data: dto,
    });
  }
}
