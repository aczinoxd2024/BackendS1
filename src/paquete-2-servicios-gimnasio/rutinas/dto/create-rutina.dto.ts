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

export class CreateRutinaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  objetivo: string;

  @IsEnum(NivelRutina)
  nivel: NivelRutina;

  @IsEnum(TipoRutina)
  tipo: TipoRutina;

  @IsEnum(GeneroObjetivo)
  generoObjetivo: GeneroObjetivo;

  @IsEnum(TipoAccesoRutina)
  tipoAcceso: TipoAccesoRutina; // 'general' | 'gold' | 'personalizada'

  @IsOptional()
  esBasica?: boolean;

  @IsString()
  @IsNotEmpty()
  ciInstructor: string;

  @IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => DetalleRutinaDto)
detalles?: DetalleRutinaDto[];

}
