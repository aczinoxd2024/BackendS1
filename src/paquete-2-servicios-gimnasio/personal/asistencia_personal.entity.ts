import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';

@Entity('asistencia_personal')
export class AsistenciaPersonal {
  @PrimaryGeneratedColumn({ name: 'IDAsistencia' })
  id: number;

  @Column({ name: 'Fecha', type: 'date' })
  fecha: Date;

  @Column({ name: 'HoraEntrada', type: 'time', nullable: true })
  horaEntrada: string;

  @Column({ name: 'HoraSalida', type: 'time', nullable: true })
  horaSalida: string;

  @Column({ name: 'Estado', type: 'varchar', length: 20, nullable: true })
  estado?: string; // Puntual | Retraso | Inasistencia

  @Column({ name: 'CIPerso' })
  ci: string;

  @ManyToOne(() => Persona, { eager: true })
  @JoinColumn({ name: 'CIPerso' })
  persona: Persona;
}
