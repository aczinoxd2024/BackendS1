import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('asistencia_general')
export class Asistencia {
  @PrimaryGeneratedColumn({ name: 'IDAsistencia' })
  id: number;

  @Column({ name: 'Fecha', type: 'date' })
  fecha: Date;

  @Column({ name: 'HoraEntrada', type: 'time', nullable: true })
  horaEntrada: string;

  @Column({ name: 'HoraSalida', type: 'time', nullable: true })
  horaSalida: string;

  @Column({ name: 'CIPerso' })
  CI: string;

  @Column({ name: 'IDtipoPer' })
  idTipoPer: number;

  @ManyToOne(() => Persona, { eager: true })
  @JoinColumn({ name: 'CIPerso' })
  persona: Persona;
}
