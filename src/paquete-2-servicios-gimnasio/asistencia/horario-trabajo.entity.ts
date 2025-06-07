import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { HoraLaboral } from './hora-laboral.entity';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';
import { DiaSemana } from './dia-semana.entity';

@Entity('horario_trabajo')
export class HorarioTrabajo {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ name: 'IDPersona', type: 'varchar', length: 20 })
  IDPersona: string;

  @Column({ name: 'IDDia', type: 'int' })
  IDDia: number;

  @Column({ name: 'IDHora', type: 'int' })
  IDHora: number;

  @ManyToOne(() => Persona, { eager: true })
  @JoinColumn({ name: 'IDPersona' })
  persona: Persona;

  @ManyToOne(() => HoraLaboral, (hl) => hl.horariosTrabajo, { eager: true })
  @JoinColumn({ name: 'IDHora' })
  horaLaboral: HoraLaboral;

  @ManyToOne(() => DiaSemana, { eager: true })
  @JoinColumn({ name: 'IDDia' })
  dia: DiaSemana;
}
