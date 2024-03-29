import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { QueryDto } from 'src/shared/dto/query.dto';

enum Order {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListClientDto extends QueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  physicalAddress?: string;

  @IsOptional()
  @IsString()
  referenceAddress?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasMissingReceipts?: boolean;

  @IsOptional()
  @ValidateIf((o) => o.hasMissingReceipts)
  @IsDateString()
  @Transform(({ value }) => value as Date, {
    toPlainOnly: true,
  })
  hasMissingReceiptsStartDate?: Date;

  @IsOptional()
  @ValidateIf((o) => o.hasMissingReceipts)
  @IsDateString()
  @Transform(({ value }) => value as Date, {
    toPlainOnly: true,
  })
  hasMissingReceiptsEndDate?: Date;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasNotPaidCurrentMonth?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  monthsWithoutPaying?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  paymentDay?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  showRetired: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  showSleeping: boolean;
}
