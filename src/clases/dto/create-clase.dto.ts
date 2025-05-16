import { IsString, IsInt } from 'class-validator';

export class CreateClaseDto {
  @IsString()
  Nombre: string;

  @IsInt()
  NumInscritos: number;

  @IsString()
  Estado: string;

  @IsInt()
  IDSalaa: number;
  
  @IsString()
  Horario: string;
}
