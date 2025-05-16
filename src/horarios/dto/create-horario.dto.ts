import { IsInt, IsString, Matches } from 'class-validator';

export class CreateHorarioDto {
  @IsInt({ message: 'IDClases debe ser un número entero' })
  IDClases: number;

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
