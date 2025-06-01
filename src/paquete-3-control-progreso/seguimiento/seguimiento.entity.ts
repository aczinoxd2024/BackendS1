import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { SeguimientoModule } from './seguimiento.module';

@Entity('seguimiento_cliente')
export class SeguimientoCliente {
  @PrimaryColumn()
  IDCliente: string;

  @PrimaryColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  Fecha: Date;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  Peso: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  Altura: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  GrasaCorporal: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  MasaMuscular: number;

  @Column({ type: 'text', nullable: true })
  Observaciones: string;

 @ManyToOne(() => Cliente, (cliente) => cliente.seguimientos)
@JoinColumn({ name: 'IDCliente' })
cliente: Cliente;

}
