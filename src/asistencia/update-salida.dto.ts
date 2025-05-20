import { IsString } from 'class-validator';

export class UpdateHoraSalidaDto {
  @IsString()
  horaSalida: string;
}