import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pago } from '../pagos.entity';
import { Membresia } from 'src/membresias/menbresia.entity';

@Entity('detalle_pago')
export class DetallePago {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  IDPago: number;

  @Column()
  IDMembresia: number;

  @Column('decimal', { precision: 10, scale: 2 })
  MontoTotal: number;

  @Column({ type: 'int', nullable: true })
  IDPromo: number | null;

  @ManyToOne(() => Pago, (pago) => pago.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'IDPago' })
  pago: Pago;

  @ManyToOne(() => Membresia, (membresia) => membresia.detalles, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'IDMembresia' })
  membresia: Membresia;
}
