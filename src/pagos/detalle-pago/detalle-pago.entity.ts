import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pago } from '../pagos.entity';
import { Membresia } from 'src/membresias/menbresia.entity';

@Entity('detalle_pago')
export class DetallePago {
  @PrimaryColumn()
  IDPago: number;

  @PrimaryColumn()
  IDMembresia: number;

  @Column('decimal', { precision: 10, scale: 2 })
  MontoTotal: number;

  @Column({ nullable: true })
  IDPromo: number | null;

  @ManyToOne(() => Pago)
  @JoinColumn({ name: 'IDPago' })
  pago: Pago;

  @ManyToOne(() => Membresia)
  @JoinColumn({ name: 'IDMembresia' })
  membresia: Membresia;
}
