import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateTipoMembresiaDto {
  @IsNotEmpty()
  @IsString()
  NombreTipo: string;

  @IsNotEmpty()
  @IsString()
  Descripcion: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  Precio: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  DuracionDias: number;

  @IsNotEmpty()
  @IsString()
  Beneficios: string;

  @IsOptional()
  @IsNumber()
  IDPromocion?: number; // 👈 Agregado para relacionar con la tabla promoción
}
