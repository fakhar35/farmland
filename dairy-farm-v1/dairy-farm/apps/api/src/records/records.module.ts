import { Module } from '@nestjs/common';
import { AuditService } from '../common/audit.service';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  controllers: [RecordsController],
  providers: [RecordsService, AuditService],
})
export class RecordsModule {}
