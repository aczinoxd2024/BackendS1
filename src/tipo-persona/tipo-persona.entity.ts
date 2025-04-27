import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TipoPersona {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  Descripcion: string;
}
