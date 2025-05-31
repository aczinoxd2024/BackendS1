import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Clase } from '../clases/clase.entity';
import { DiaSemana } from '../dia-semana/dia-semana.entity';

@Entity('horario')
export class Horario {
  @PrimaryGeneratedColumn()
  IDHorario: number;

  @Column('time')
  HoraIni: string;

  @Column('time')
  HoraFin: string;

  @ManyToOne(() => Clase, clase => clase.horarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'IDClases' })
  clase: Clase;

  @ManyToOne(() => DiaSemana, { eager: true })
  @JoinColumn({ name: 'IDDia' })
  diaSemana: DiaSemana;
}
