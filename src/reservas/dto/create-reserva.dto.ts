import { IsNumber } from 'class-validator';

export class CreateReservaDto {
  @IsNumber()
  IDClase: number;
}
