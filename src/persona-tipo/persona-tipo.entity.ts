import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class PersonaTipo {
  @PrimaryColumn()
  CI: string;

  @PrimaryColumn()
  ID_TipoPersona: number;
}
