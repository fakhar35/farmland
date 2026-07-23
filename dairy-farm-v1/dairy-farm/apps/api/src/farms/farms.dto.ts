import { FarmMode } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateFarmDto {
  @IsString() @MinLength(1) name: string;
  @IsEnum(FarmMode) mode: FarmMode;
  @IsOptional() @IsString() currencySymbol?: string;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsInt() @Min(0) milkPriceCents?: number;
  @IsOptional() @IsString() timezone?: string;
}

export class UpdateFarmDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsEnum(FarmMode) mode?: FarmMode;
  @IsOptional() @IsString() currencySymbol?: string;
  @IsOptional() @IsInt() @Min(0) milkPriceCents?: number;
}
