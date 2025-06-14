import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class UpdatePersonalDto {
  // 📌 Campos de la tabla PERSONA
  @IsOptional()
  @IsString()
  Nombre?: string;

  @IsOptional()
  @IsString()
  Apellido?: string;

  @IsOptional()
  @IsDateString()
  FechaNacimiento?: string;

  @IsOptional()
  @IsString()
  Telefono?: string;

  @IsOptional()
  @IsString()
  Direccion?: string;

  // 📌 Campos de la tabla PERSONAL
  @IsOptional()
  @IsString()
  Cargo?: string;

  @IsOptional()
  @IsDateString()
  FechaContratacion?: string;

  @IsOptional()
  @IsString()
  AreaP?: string;

  @IsOptional()
  @IsNumber()
  Sueldo?: number;
}
