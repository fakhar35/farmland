import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthedRequest } from './auth.guard';

export const ROLES_KEY = 'farm_roles';
// Restrict a farm-scoped route to specific roles. No decorator = any member.
export const FarmRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Financial actions are restricted to these roles by default.
export const FINANCE_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.ACCOUNTANT];

@Injectable()
export class FarmRoleGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest & { farmRole?: Role }>();
    const farmId = req.params['farmId'];
    const userId = req.user?.sub;
    if (!farmId || !userId) throw new ForbiddenException('Farm context required');

    const membership = await this.prisma.farmMember.findUnique({
      where: { farmId_userId: { farmId, userId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this farm');

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (required && !required.includes(membership.role)) {
      throw new ForbiddenException('Your role does not allow this action');
    }
    req.farmRole = membership.role;
    return true;
  }
}
