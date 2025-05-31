// clase.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sala } from 'salas/sala.entity';
import { OneToMany } from 'typeorm';
import { Horario } from 'horarios/horario.entity'; // crearás esta entidad
import { ClaseInstructor } from './clase-instructor.entity';

//comprobante pago
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

  // @Column({ type: 'varchar', length: 20 })
  //CIInstructor: string;

  @Column({ type: 'int' })
  CupoMaximo: number;

  //@Column({ length: 100 })
  //Horario: string;

  @Column()
  IDSalaa: number;

  @ManyToOne(() => Sala, (sala) => sala.clases)
  @JoinColumn({ name: 'IDSalaa' })
  sala: Sala;

  @OneToMany(() => Horario, (horario) => horario.clase)
  horarios: Horario[];

  @OneToMany(() => ClaseInstructor, (ci) => ci.clase)
  claseInstructores: ClaseInstructor[];

  // ✅ Nueva relación hacia detalle_pago
  @OneToMany(() => DetallePago, (detallePago) => detallePago.clase)
  detallesPago: DetallePago[];
}
