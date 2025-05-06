import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ClienteActualizarDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string; // 👈 agregado para fecha de nacimiento (en formato string ISO)
}
