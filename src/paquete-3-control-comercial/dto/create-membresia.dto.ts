import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';

export enum TipoMembresiaEnum {
  BASICA = 'Básica',
  GOLD = 'Gold',
  DISCIPLINA = 'Disciplina',
  VIP = 'VIP',
  PROMO = 'Promo'
}

export class CreateMembresiaDto {
  @IsNotEmpty()
  @IsString()
  nombre: string; // Ej: "Gold Anual", "VIP 3 Meses"

  @IsNotEmpty()
  @IsEnum(TipoMembresiaEnum)
  tipo: TipoMembresiaEnum;

  @IsNotEmpty()
  @IsNumber()
  precio: number;

  @IsOptional()
  @IsNumber()
  descuento?: number; // Porcentaje de descuento (ej: 10 para 10%)

  @IsNotEmpty()
  @IsNumber()
  duracionDias: number; // Ej: 30, 90, 365

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  descripcion?: string; // Texto extra para mostrar en frontend

  @IsOptional()
  @IsNumber()
  idClase?: number; // solo si es tipo disciplina

  @IsOptional()
  @IsString()
  plataforma?: string; // web o presencial
}
