import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GrupoMuscular } from './grupo-muscular.entity';

@Entity('ejercicio')
export class Ejercicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  instrucciones: string;

  @Column({ nullable: true }) // 👈 importante: permite null
  idGrupo: number;

  @ManyToOne(() => GrupoMuscular, grupo => grupo.ejercicios, { nullable: true })
  @JoinColumn({ name: 'idGrupo' })
  grupo: GrupoMuscular;
}
