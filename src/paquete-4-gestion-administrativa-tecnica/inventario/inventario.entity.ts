import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EstadoInventario } from '../estado-inventario/estado-inventario.entity';

@Entity('inventario')
export class Inventario {
  @PrimaryGeneratedColumn({ name: 'IDItem' })
  idItem: number;

  @Column({ length: 50 })
  nombre: string;

  @Column('text')
  descripcion: string;

  @Column()
  cantidadActual: number;

  @ManyToOne(() => EstadoInventario)
  @JoinColumn({ name: 'IDEstadoI' })
  estado: EstadoInventario;
}
