import { Type } from 'class-transformer'
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class FilterProductsDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}