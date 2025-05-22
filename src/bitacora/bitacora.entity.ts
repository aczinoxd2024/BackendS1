import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Pago } from 'src/pagos/pagos.entity';

@Entity('bitacora')
export class Bitacora {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  idUsuario: string; // FK hacia usuario.id

  @Column('text')
  accion: string;

  @Column({ length: 50 })
  tablaAfectada: string;

  @Column({ length: 45 })
  ipMaquina: string;

  @CreateDateColumn({ type: 'timestamp' })
  fechaHora: Date;

  // ✅ Relación con usuario
  @ManyToOne(() => Usuario, (usuario) => usuario.bitacoras, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'idUsuario' })
  usuario: Usuario;

  // ✅ Nueva relación con pago (opcional)
  @Column({ nullable: true })
  IDPago: number;

  @ManyToOne(() => Pago, (pago) => pago.bitacoras, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'IDPago' })
  pago: Pago;
}
