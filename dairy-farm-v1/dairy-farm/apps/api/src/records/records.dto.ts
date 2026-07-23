import { MilkSession, RecordScope } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

class ScopedRecordDto {
  @IsISO8601() date: string;
  @IsEnum(RecordScope) scope: RecordScope;
  @IsOptional() @IsUUID() groupId?: string;
  @IsOptional() @IsUUID() animalId?: string;
}

export class CreateMilkDto extends ScopedRecordDto {
  @IsEnum(MilkSession) session: MilkSession;
  @IsNumber() @Min(0.01) liters: number;
}

export class CreateFeedDto extends ScopedRecordDto {
  @IsString() @MinLength(1) feedType: string;
  @IsNumber() @Min(0) quantityKg: number;
  @IsInt() @Min(0) costCents: number;
}

export class CreateExpenseDto {
  @IsISO8601() date: string;
  @IsString() @MinLength(1) category: string;
  @IsInt() @Min(1) amountCents: number;
  @IsOptional() @IsString() note?: string;
}

export class CreateSaleDto {
  @IsISO8601() date: string;
  @IsNumber() @Min(0.01) liters: number;
  @IsInt() @Min(1) priceCentsPerLiter: number;
  @IsOptional() @IsString() customerName?: string;
  @IsBoolean() paid: boolean;
}
