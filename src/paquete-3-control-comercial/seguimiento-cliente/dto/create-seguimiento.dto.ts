import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsPositive,
  IsOptional,
} from 'class-validator';

export class CreateSeguimientoDto {
  @IsString()
  @IsNotEmpty({ message: 'El CI del cliente es obligatorio' })
  ciCliente: string;

  @IsString()
  @IsNotEmpty({ message: 'El CI del instructor es obligatorio' })
  ciInstructor: string;

  @IsNumber({}, { message: 'El peso debe ser un número.' })
  @IsPositive({ message: 'El peso debe ser mayor a 0.' })
  @Min(30, { message: 'El peso mínimo permitido es 30 kg.' })
  @Max(300, { message: 'El peso máximo permitido es 300 kg.' })
  peso: number;

  @IsNumber({}, { message: 'La altura debe ser un número.' })
  @IsPositive({ message: 'La altura debe ser mayor a 0.' })
  @Min(1.2, { message: 'La altura mínima permitida es 1.20 m.' })
  @Max(2.5, { message: 'La altura máxima permitida es 2.50 m.' })
  altura: number;

  @IsOptional()
  @IsNumber({}, { message: 'El IMC debe ser un número válido.' })
  @Min(10, { message: 'El IMC no puede ser menor a 10.' })
  @Max(50, { message: 'El IMC no puede ser mayor a 50.' })
  imc?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El valor de pecho debe ser un número válido.' })
  @Min(20, { message: 'El valor de pecho mínimo es 20 cm.' })
  @Max(140, { message: 'El valor de pecho máximo es 140 cm.' })
  pecho?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El valor de abdomen debe ser un número válido.' })
  @Min(20, { message: 'El valor de abdomen mínimo es 20 cm.' })
  @Max(140, { message: 'El valor de abdomen máximo es 140 cm.' })
  abdomen?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El valor de cintura debe ser un número válido.' })
  @Min(20, { message: 'El valor de cintura mínimo es 20 cm.' })
  @Max(140, { message: 'El valor de cintura máximo es 140 cm.' })
  cintura?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El valor de cadera debe ser un número válido.' })
  @Min(20, { message: 'El valor de cadera mínimo es 20 cm.' })
  @Max(140, { message: 'El valor de cadera máximo es 140 cm.' })
  cadera?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El valor de pierna debe ser un número válido.' })
  @Min(20, { message: 'El valor de pierna mínimo es 20 cm.' })
  @Max(140, { message: 'El valor de pierna máximo es 140 cm.' })
  pierna?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El valor de bíceps debe ser un número válido.' })
  @Min(20, { message: 'El valor de bíceps mínimo es 20 cm.' })
  @Max(70, { message: 'El valor de bíceps máximo es 70 cm.' })
  biceps?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El valor de espalda debe ser un número válido.' })
  @Min(20, { message: 'El valor de espalda mínimo es 20 cm.' })
  @Max(140, { message: 'El valor de espalda máximo es 140 cm.' })
  espalda?: number;

}
