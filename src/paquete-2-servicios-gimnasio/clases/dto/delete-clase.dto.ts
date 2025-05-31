import { IsString, IsOptional } from 'class-validator';

export class DeleteClaseDto {
  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  eliminadoPor?: string; // CI o correo del admin
}
