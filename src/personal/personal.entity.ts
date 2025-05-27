import {Entity,Column,PrimaryColumn,OneToMany,ManyToOne,JoinColumn} from 'typeorm';
import { ClaseInstructor } from '../clases/clase-instructor.entity';
import { Persona } from '../personas/persona.entity';


@Entity('personal')
export class Personal {
  @PrimaryColumn({ length: 20 })
  CI: string;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'CI' })
  persona: Persona;

  @Column({ length: 20 })
  Cargo: string;

  @Column({ type: 'date' })
  FechaContratacion: Date;

  @Column({ length: 50 })
  AreaP: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  Sueldo: number;

  @OneToMany(() => ClaseInstructor, ci => ci.instructor)
  clases: ClaseInstructor[];
}
