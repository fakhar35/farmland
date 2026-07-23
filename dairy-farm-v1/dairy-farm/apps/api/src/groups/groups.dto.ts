import { GroupType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString() @MinLength(1) name: string;
  @IsEnum(GroupType) type: GroupType;
  @IsOptional() @IsInt() @Min(0) headcount?: number;
}

export class UpdateGroupDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsEnum(GroupType) type?: GroupType;
  @IsOptional() @IsInt() @Min(0) headcount?: number;
}
