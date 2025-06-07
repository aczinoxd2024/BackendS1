import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class UpdatePersonalDto {
  // Campos de persona
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: Date;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  // Campos de personal
  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsDateString()
  fechaContratacion?: Date;

  @IsOptional()
  @IsString()
  areaP?: string;

  @IsOptional()
  @IsNumber()
  sueldo?: number;
}
