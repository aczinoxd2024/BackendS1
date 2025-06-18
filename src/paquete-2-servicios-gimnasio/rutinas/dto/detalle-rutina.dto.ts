import { IsNotEmpty, IsNumber, Min } from 'class-validator';


export class DetalleRutinaDto {
  @IsNotEmpty()
  @IsNumber()
  dia: number;

  @IsNotEmpty()
  @IsNumber()
  ejercicio: number;

  @IsNotEmpty()
  @IsNumber()
  series: number;

  @IsNotEmpty()
  @IsNumber()
  reps: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  descanso: number;
}
