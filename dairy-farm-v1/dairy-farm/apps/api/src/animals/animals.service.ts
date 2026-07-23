import { BadRequestException, Injectable } from '@nestjs/common';
import { AnimalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnimalDto, UpdateAnimalDto } from './animals.dto';

// The lifecycle state machine. Transitions outside this map are rejected —
// e.g. a SOLD animal cannot silently return to MILKING.
const ALLOWED: Record<AnimalStatus, AnimalStatus[]> = {
  CALF: ['HEIFER', 'SOLD', 'DEAD'],
  HEIFER: ['MILKING', 'SOLD', 'CULLED', 'DEAD'],
  MILKING: ['DRY', 'SOLD', 'CULLED', 'DEAD'],
  DRY: ['MILKING', 'SOLD', 'CULLED', 'DEAD'],
  SOLD: [],
  CULLED: [],
  DEAD: [],
};

@Injectable()
export class AnimalsService {
  constructor(private prisma: PrismaService) {}

  list(farmId: string) {
    return this.prisma.animal.findMany({
      where: { farmId },
      orderBy: { tag: 'asc' },
      include: { group: { select: { id: true, name: true } } },
    });
  }

  create(farmId: string, dto: CreateAnimalDto) {
    return this.prisma.animal.create({
      data: { farmId, ...dto, dob: dto.dob ? new Date(dto.dob) : undefined },
    });
  }

  async update(farmId: string, id: string, dto: UpdateAnimalDto) {
    if (dto.status) {
      const current = await this.prisma.animal.findUniqueOrThrow({
        where: { id, farmId },
        select: { status: true },
      });
      if (dto.status !== current.status && !ALLOWED[current.status].includes(dto.status)) {
        throw new BadRequestException(
          `An animal cannot move from ${current.status} to ${dto.status}`,
        );
      }
    }
    return this.prisma.animal.update({ where: { id, farmId }, data: dto });
  }
}
