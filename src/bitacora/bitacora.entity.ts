// src/bitacora/bitacora.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('bitacora')
export class Bitacora {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  idUsuario: string;

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
}
