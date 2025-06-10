import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { Bitacora } from 'paquete-1-usuarios-accesos/bitacora/bitacora.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';

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

  // 🔁 Relación con Cliente (necesaria para evitar el error)
  @ManyToOne(() => Cliente, (cliente) => cliente.pagos)
  @JoinColumn({ name: 'CIPersona', referencedColumnName: 'CI' })
  cliente: Cliente;

  @OneToMany(() => DetallePago, (detalle) => detalle.pago)
  detalles: DetallePago[];

  @OneToMany(() => Bitacora, (bitacora) => bitacora.pago)
  bitacoras: Bitacora[];
}
