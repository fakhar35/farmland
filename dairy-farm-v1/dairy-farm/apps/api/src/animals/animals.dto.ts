import { AnimalStatus, Sex } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateAnimalDto {
  @IsString() @MinLength(1) tag: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() breed?: string;
  @IsOptional() @IsEnum(Sex) sex?: Sex;
  @IsOptional() @IsEnum(AnimalStatus) status?: AnimalStatus;
  @IsOptional() @IsDateString() dob?: string;
  @IsOptional() @IsUUID() groupId?: string;
  @IsOptional() @IsUUID() motherId?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateAnimalDto {
  @IsOptional() @IsString() @MinLength(1) tag?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() breed?: string;
  @IsOptional() @IsEnum(AnimalStatus) status?: AnimalStatus;
  @IsOptional() @IsUUID() groupId?: string;
  @IsOptional() @IsString() notes?: string;
}
