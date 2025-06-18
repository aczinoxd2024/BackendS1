import { IsInt, IsString } from 'class-validator';

export class CrearInventarioUsoDto {
  @IsInt()
  IDItem: number;

  @IsInt()
  IDDestino: number;

  @IsString()
  TipoDestino: string;

  @IsInt()
  CantidadAsignada: number;
}
