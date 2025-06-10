// clase.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Sala } from 'salas/sala.entity';
import { Horario } from 'horarios/horario.entity';
import { ClaseInstructor } from './clase-instructor.entity';
import { Rutina } from 'paquete-2-servicios-gimnasio/rutinas/entidades/rutina.entity';
import { DetallePago } from 'pagos/detalle-pago/detalle-pago.entity';

@Entity('clase')
export class Clase {
  @PrimaryGeneratedColumn()
  IDClase: number;

  @Column({ length: 50 })
  Nombre: string;

  @Column()
  NumInscritos: number;

  @Column({ length: 30 })
  Estado: string;

  @Column({ nullable: true })
  IDRutina?: number;

  @Column({ type: 'varchar', length: 20 })
  CIInstructor: string;

  @Column({ type: 'int' })
  CupoMaximo: number;

  @Column()
  IDSalaa: number;

  @ManyToOne(() => Rutina, { nullable: true })
  @JoinColumn({ name: 'IDRutina' })
  rutina?: Rutina;

  @ManyToOne(() => Sala, (sala) => sala.clases)
  @JoinColumn({ name: 'IDSalaa' })
  sala: Sala;

  @OneToMany(() => Horario, (horario) => horario.clase)
  horarios: Horario[];

  @OneToMany(() => ClaseInstructor, (ci) => ci.clase)
  claseInstructores: ClaseInstructor[];

  @OneToMany(() => DetallePago, (detallePago) => detallePago.clase)
  detallesPago: DetallePago[];
}
