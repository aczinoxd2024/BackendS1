import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { Bitacora } from 'src/paquete-1-usuarios-accesos/bitacora/bitacora.entity';

@Entity('pago')
export class Pago {
  @PrimaryGeneratedColumn()
  NroPago: number;

  @CreateDateColumn({ type: 'timestamp' })
  Fecha: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  Monto: number;

  @Column()
  MetodoPago: number;

  @Column()
  CIPersona: string;

  @Column({ nullable: true, unique: true })
  StripeEventId?: string;

  @Column({ nullable: true })
  StripePaymentIntentId?: string;

  @OneToMany(() => DetallePago, (detalle) => detalle.pago)
  detalles: DetallePago[];

  @OneToMany(() => Bitacora, (bitacora) => bitacora.pago)
  bitacoras: Bitacora[];
}
