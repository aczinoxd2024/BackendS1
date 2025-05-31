import { IsInt, IsString, Matches, IsNotEmpty } from 'class-validator';

export class CreateHorarioDto {
  @IsInt({ message: 'IDClase debe ser un número entero' })
  IDClase: number;

  @IsInt({ message: 'IDDia debe ser un número entero' })
  IDDia: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'HoraIni debe tener formato HH:mm',
  })
  HoraIni: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'HoraFin debe tener formato HH:mm',
  })
  HoraFin: string;
}
