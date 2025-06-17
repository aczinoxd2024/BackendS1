import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NivelRutina, TipoRutina, GeneroObjetivo, TipoAccesoRutina } from '../enums';

class DetalleRutinaDto {
  @IsNotEmpty()
  idEjercicio: number;

  @IsNotEmpty()
  idDia: number;

  @IsNotEmpty()
  series: number;

  @IsNotEmpty()
  repeticiones: number;
}

export class UpdateRutinaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  objetivo?: string;

  @IsEnum(NivelRutina)
  @IsOptional()
  nivel?: NivelRutina;

  @IsEnum(GeneroObjetivo)
  @IsOptional()
  generoObjetivo?: GeneroObjetivo;

  @IsEnum(TipoAccesoRutina)
  @IsOptional()
  tipoAcceso?: TipoAccesoRutina;

  @IsOptional()
  esBasica?: boolean;

  @IsString()
  @IsOptional()
  ciInstructor?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleRutinaDto)
  @IsOptional()
  detalles?: DetalleRutinaDto[];
}
