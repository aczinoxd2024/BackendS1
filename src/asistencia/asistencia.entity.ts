import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Persona } from '../personas/persona.entity';

@Entity('asistencia_general')
export class Asistencia {
  @PrimaryGeneratedColumn({ name: 'IDAsistencia' })
  id: number;

  @Column({ name: 'Fecha', type: 'date' })
  fecha: Date;

  @Column({ name: 'HoraEntrada', type: 'time' })
  horaEntrada: string;

  @Column({ name: 'HoraSalida', type: 'time', nullable: true })
  horaSalida: string;

  @Column({ name: 'IDtipoPer' })
  idTipoPer: number;
  
  @ManyToOne(() => Persona , { eager: true })
  @JoinColumn({ name: 'CIPerso' }) // esta es la FK
  persona: Persona;
}