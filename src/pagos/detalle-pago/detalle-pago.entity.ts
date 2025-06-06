import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pago } from '../pagos.entity';
import { Membresia } from 'membresias/menbresia.entity';
import { Clase } from 'clases/clase.entity'; // ✅ Importación agregada

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

  // ✅ Nueva columna para clase asociada
  @Column({ type: 'int', nullable: true })
  IDClase: number | null;

  // Relaciones
  @ManyToOne(() => Pago, (pago) => pago.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'IDPago' })
  pago: Pago;

  @ManyToOne(() => Membresia, (membresia) => membresia.detalles, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'IDMembresia' })
  membresia: Membresia;

  // ✅ Relación con clase
  @ManyToOne(() => Clase, (clase) => clase.detallesPago, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'IDClase' })
  clase: Clase;
}
