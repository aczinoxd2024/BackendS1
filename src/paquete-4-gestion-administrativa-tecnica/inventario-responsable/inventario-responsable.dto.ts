import { IsString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
export class CrearResponsableDto {
  @IsString()
  CI: string;

  @IsInt()
   @Type(() => Number) 
  IDItem: number;

  @IsOptional()
  @IsString()
  Observacion?: string;
}