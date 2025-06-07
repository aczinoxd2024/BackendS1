import { IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class CreatePersonalDto {
  // Datos de la tabla PERSONA
  @IsString()
  CI: string;

  @IsString()
  Nombre: string;

  @IsString()
  Apellido: string;

  @IsDateString()
  FechaNacimiento: string;

  @IsString()
  Telefono: string;

  @IsString()
  Direccion: string;

  // Datos de la tabla PERSONAL
  @IsString()
  Cargo: string;

  @IsDateString()
  FechaContratacion: string;

  @IsString()
  AreaP: string;

  @IsNumber()
  Sueldo: number;

  @IsString()
  correo: string;

}
