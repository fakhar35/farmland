import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    farmId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    data?: unknown;
  }) {
    await this.prisma.auditLog.create({
      data: {
        farmId: params.farmId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        data: params.data as object | undefined,
      },
    });
  }
}
