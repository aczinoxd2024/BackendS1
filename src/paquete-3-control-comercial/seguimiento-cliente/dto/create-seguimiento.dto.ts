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

  @IsNumber()
  @IsPositive({ message: 'El peso debe ser mayor a 0' })
  @Min(30)
  @Max(300)
  peso: number;

  @IsNumber()
  @IsPositive({ message: 'La altura debe ser mayor a 0' })
  @Min(1.2)
  @Max(2.5)
  altura: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(50)
  imc?: number;

  @IsOptional()
@IsNumber()
@Min(20)
@Max(140)
pecho?: number;

@IsOptional()
@IsNumber()
@Min(20)
@Max(140)
abdomen?: number;

@IsOptional()
@IsNumber()
@Min(20)
@Max(140)
cintura?: number;

@IsOptional()
@IsNumber()
@Min(20)
@Max(140)
cadera?: number;

@IsOptional()
@IsNumber()
@Min(20)
@Max(140)
pierna?: number;

@IsOptional()
@IsNumber()
@Min(20)
@Max(70)
biceps?: number;

@IsOptional()
@IsNumber()
@Min(20)
@Max(140)
espalda?: number;

}