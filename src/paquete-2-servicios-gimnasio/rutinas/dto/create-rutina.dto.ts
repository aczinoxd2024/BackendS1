import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DetalleRutinaDto } from './detalle-rutina.dto';
import { NivelRutina, TipoRutina, GeneroObjetivo, TipoAccesoRutina } from '../enums';


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
IDClase?: number;

  @IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => DetalleRutinaDto)
detalles?: DetalleRutinaDto[];

}
