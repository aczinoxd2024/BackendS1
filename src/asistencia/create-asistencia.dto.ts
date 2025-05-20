import { IsDateString, IsString, IsNotEmpty } from 'class-validator';

export class CreateAsistenciaDto {
  @IsDateString()
  fecha: Date;

  @IsString()
  @IsNotEmpty()
  horaEntrada: string;

  @IsString()
  @IsNotEmpty()
  cipersona: string;
}