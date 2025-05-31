import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Clase } from './clase.entity';
import { Personal } from 'personal/personal.entity';

@Entity('clase_instructor')
export class ClaseInstructor {
  @PrimaryColumn()
  IDClase: number;

  @PrimaryColumn()
  CI: string;

  @ManyToOne(() => Clase, (clase) => clase.claseInstructores)
  @JoinColumn({ name: 'IDClase' })
  clase: Clase;

  @ManyToOne(() => Personal, (personal) => personal.clases)
  @JoinColumn({ name: 'CI' })
  instructor: Personal;
}
