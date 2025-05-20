import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Clase } from '../clases/clase.entity';
import { DiaSemana } from '../dia-semana/dia-semana.entity';


@Entity('horario')
export class Horario {
  @PrimaryGeneratedColumn()
  IDHorario: number;

  @Column()
  IDClases: number;

  @Column('time')
  HoraIni: string;

  @Column('time')
  HoraFin: string;

   //@Column()
  //Dia: string;

  @ManyToOne(() => Clase, clase => clase.horarios)
  @JoinColumn({ name: 'IDClases' })
  clase: Clase;

  @ManyToOne(() => DiaSemana)
@JoinColumn({ name: 'IDDia' })
diaSemana: DiaSemana;

}
