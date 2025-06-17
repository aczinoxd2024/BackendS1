// src/paquete-1-usuarios-accesos/auth/dto/create-personal.dto.ts
import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional, // <-- Asegúrate de que IsOptional esté importado
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer'; // Asegúrate de importar 'Type' de 'class-transformer'

export class HorarioPersonalDto {
  @IsOptional() // <-- ¡Añadido! Permite que idDia sea null o undefined
  @IsNumber()
  idDia: number;

  @IsString()
  // Puedes añadir una expresión regular para el formato HH:mm si no está ya presente
  // @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  horaInicio: string;

  @IsString()
  // Puedes añadir una expresión regular para el formato HH:mm si no está ya presente
  // @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  horaFin: string;
}

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

  // NUEVO: Horarios de trabajo del personal
  @IsOptional() // Permite que sea opcional, si no siempre se envía horario al crear
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioPersonalDto) // Importante para la transformación de tipos
  horariosTrabajo?: HorarioPersonalDto[];
}
