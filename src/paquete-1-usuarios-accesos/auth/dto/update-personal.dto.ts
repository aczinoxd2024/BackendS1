import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePersonalDto {
  // 📌 PERSONA
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

  // 📌 PERSONAL
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
  @Type(() => Number) // ✅ transforma string a número si viene así
  @IsNumber({}, { message: 'Sueldo debe ser un número válido' })
  Sueldo?: number;
}
