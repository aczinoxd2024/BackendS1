import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class ClienteCrearDto {
  @IsString()
  ci: string;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsDateString()
  fechaNacimiento: string;

  @IsString()
  telefono: string;

  @IsString()
  direccion: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsString()
  correo: string;

  @IsNumber()
  tipoMembresiaId: number;

  @IsNumber()
  metodoPagoId: number;

   @IsOptional()
  @IsNumber()
  idClase?: number;
}
