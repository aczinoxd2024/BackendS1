import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Cliente {
  @PrimaryColumn()
  CI: string;

  @Column()
  IDEstado: number;

  @Column('text')
  Observacion: string;
}
