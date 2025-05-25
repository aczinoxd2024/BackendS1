import { IsNotEmpty, IsString, IsNumber, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClaseDto {
  @IsNotEmpty()
  @IsString()
  Nombre: string;

  @IsNotEmpty()
  @IsNumber()
  IDSalaa: number;

  @IsNotEmpty()
  @IsString()
  CIInstructor: string;

  @IsNotEmpty()
  @IsNumber()
  CupoMaximo: number;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => {
    if (value === 'Miercoles') return 'Miércoles';
    if (value === 'Sabado') return 'Sábado';
    return value;
  })
  Dia: string; // Ej: 'Lunes', 'Martes'

  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'HoraIni debe tener formato HH:mm',
  })
  HoraIni: string;

  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'HoraFin debe tener formato HH:mm',
  })
  HoraFin: string;
}
