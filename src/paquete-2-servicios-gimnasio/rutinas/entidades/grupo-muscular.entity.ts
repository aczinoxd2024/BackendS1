import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ejercicio } from './ejercicio.entity';

@Entity('grupo_muscular')
export class GrupoMuscular {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @OneToMany(() => Ejercicio, (ejercicio) => ejercicio.grupo, { cascade: true })
  ejercicios: Ejercicio[];
}
