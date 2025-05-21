import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateReservaDto {
  @IsNotEmpty()
  @IsNumber()
  IDClase: number;

  @IsNotEmpty()
  @IsString()
  CI: string;
}
