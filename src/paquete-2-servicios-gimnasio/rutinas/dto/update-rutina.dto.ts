import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DetalleRutinaDto } from './detalle-rutina.dto';

export class UpdateRutinaDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  objetivo: string;

  @IsNotEmpty()
  @IsString()
  generoObjetivo: string;

  @IsNotEmpty()
  @IsString()
  nivel: string;

  @IsNotEmpty()
  @IsString()
  tipoAcceso: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @ValidateNested({ each: true })
@Type(() => DetalleRutinaDto)
detalles: DetalleRutinaDto[];
}
