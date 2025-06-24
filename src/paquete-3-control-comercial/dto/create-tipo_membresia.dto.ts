import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateTipoMembresiaDto {
  @IsNotEmpty()
  @IsString()
  nombreTipo: string;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  precio: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  duracionDias: number;

  @IsNotEmpty()
  @IsString()
  beneficios: string;

  @IsOptional()
  @IsNumber()
  IDPromocion?: number;

  @IsOptional()
  clases?: number[];

  @IsOptional()
  cantidadClasesCliente?: number;
}
