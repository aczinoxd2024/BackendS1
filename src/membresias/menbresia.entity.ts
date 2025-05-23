import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DetallePago } from 'src/pagos/detalle-pago/detalle-pago.entity';
import { Cliente } from 'src/clientes/cliente.entity';

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

  @Column({ name: 'CICliente', nullable: true })
  CICliente: string;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'CICliente' })
  cliente: Cliente;

  @OneToMany(() => DetallePago, (detalle) => detalle.membresia)
  detalles: DetallePago[];
}
