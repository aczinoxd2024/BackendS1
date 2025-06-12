import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';
import { Rutina } from './rutina.entity';

@Entity('cliente_rutina')
export class ClienteRutina {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente, { eager: true })
  @JoinColumn({ name: 'IDCliente' })
  cliente: Cliente;

  @ManyToOne(() => Rutina, { eager: true })
  @JoinColumn({ name: 'IDRutina' })
  rutina: Rutina;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaAsignacion: Date;

  @Column({ default: true })
  activo: boolean;
}