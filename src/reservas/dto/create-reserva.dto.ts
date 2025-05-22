import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateReservaDto {
  @IsNotEmpty()
  @IsNumber()
  IDClase: number;
  // ❌ quita CI si se toma del token
}
