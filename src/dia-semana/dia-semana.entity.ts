import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Horario } from 'src/horarios/horario.entity';

@Entity('dia_semana')
export class DiaSemana {
  @PrimaryGeneratedColumn()
  ID: number; // ← debe ser igual al nombre real de la base de datos

  @Column({ length: 20 })
  Dia: string;

  @OneToMany(() => Horario, (horario) => horario.diaSemana)
  horarios: Horario[];
}
