import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DetallePago } from 'pagos/detalle-pago/detalle-pago.entity';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { TipoMembresia } from '../membresias/Tipos/tipo_membresia.entity';

@Entity('membresia')
export class Membresia {
  @PrimaryGeneratedColumn()
  IDMembresia: number;

  @Column({ type: 'date' })
  FechaInicio: Date;

  @Column({ type: 'date' })
  FechaFin: Date;

  @Column({ length: 50 })
  PlataformaWeb: string;

  @Column({ name: 'TipoMembresiaID' })
  TipoMembresiaID: number;

  @ManyToOne(() => TipoMembresia)
  @JoinColumn({ name: 'TipoMembresiaID' })
  tipo: TipoMembresia;

  @Column({ name: 'CICliente', nullable: true })
  CICliente: string;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'CICliente' })
  cliente: Cliente;

  @OneToMany(() => DetallePago, (detalle) => detalle.membresia)
  detalles: DetallePago[];

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date; // <-- Este campo se actualiza automáticamente en cada save()
}
