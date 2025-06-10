import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { HorarioTrabajo } from './horario-trabajo.entity';

@Entity('dia_semana')
export class DiaSemana {
  @PrimaryGeneratedColumn({ name: 'IDDia' })
  IDDia: number;

  @Column({ name: 'NombreDia', length: 20 })
  NombreDia: string;

  @OneToMany(() => HorarioTrabajo, (ht) => ht.dia)
  horarios: HorarioTrabajo[];
}
