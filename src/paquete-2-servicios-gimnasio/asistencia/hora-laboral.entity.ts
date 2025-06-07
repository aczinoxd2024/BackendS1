import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { HorarioTrabajo } from './horario-trabajo.entity';

@Entity('hora_laboral')
export class HoraLaboral {
  @PrimaryGeneratedColumn({ name: 'IDHora' })
  IDHora: number;

  @Column({ name: 'HoraIni', type: 'time' })
  HoraIni: string;

  @Column({ name: 'HoraFin', type: 'time' })
  HoraFin: string;

  // Relación inversa opcional
  @OneToMany(() => HorarioTrabajo, (ht) => ht.horaLaboral)
  horariosTrabajo: HorarioTrabajo[];
}
