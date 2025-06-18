import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class DetalleRutinaDto {

    
  @IsNotEmpty()
  @IsNumber()
  idDia: number;

  @IsNotEmpty()
  @IsNumber()
  idEjercicio: number;

  @IsNotEmpty()
  @IsNumber()
  series: number;

  @IsNotEmpty()
  @IsNumber()
  repeticiones: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  descanso: number;
}
