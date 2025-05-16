import { IsString, Length } from 'class-validator';

export class AsignarInstructorDto {
  @IsString()
  @Length(5, 20)
  ci: string;
}
