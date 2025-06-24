import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateTipoMembresiaDto {
  @IsOptional()
  @IsString()
  NombreTipo?: string;

  @IsOptional()
  @IsString()
  Descripcion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  Precio?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  DuracionDias?: number;

  @IsOptional()
  @IsString()
  Beneficios?: string;
  
  @IsOptional()
@IsNumber()
IDPromocion?: number;

@IsOptional()
clases?: number[];

@IsOptional()
cantidadClasesCliente?: number;

}
