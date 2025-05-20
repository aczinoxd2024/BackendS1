// src/salas/sala.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Clase } from '../clases/clase.entity';

@Entity('sala')
export class Sala {
  @PrimaryGeneratedColumn()
  IDSala: number;

  @Column({ length: 100 })
  Descripcion: string;

  @Column()
  Capacidad: number;

  @OneToMany(() => Clase, clase => clase.sala)
  clases: Clase[];
}
