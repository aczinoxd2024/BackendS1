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
  @Min(1)
  series: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  repeticiones: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  descanso: number;
}
