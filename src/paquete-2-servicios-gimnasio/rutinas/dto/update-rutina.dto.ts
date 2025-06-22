import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DetalleRutinaDto } from './detalle-rutina.dto';

export class UpdateRutinaDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
@IsString()
ciInstructor?: string;

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

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleRutinaDto)
  detalles?: DetalleRutinaDto[];
  
}
