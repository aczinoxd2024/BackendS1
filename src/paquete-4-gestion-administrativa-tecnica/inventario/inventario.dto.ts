import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CrearInventarioDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsInt()
  @Min(0)
  cantidadActual: number;

  @IsInt()
  estadoId: number;
}

export class ActualizarInventarioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  cantidadActual?: number;

  @IsOptional()
  @IsInt()
  estadoId?: number;
}
