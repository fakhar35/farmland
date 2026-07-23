import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FarmsModule } from './farms/farms.module';
import { GroupsModule } from './groups/groups.module';
import { AnimalsModule } from './animals/animals.module';
import { RecordsModule } from './records/records.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FarmsModule,
    GroupsModule,
    AnimalsModule,
    RecordsModule,
    DashboardModule,
  ],
})
export class AppModule {}
