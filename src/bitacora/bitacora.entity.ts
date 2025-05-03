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
  idUsuario: string; // Este es el FK que apunta al usuario.id

  @Column('text')
  accion: string;

  @Column({ length: 50 })
  tablaAfectada: string;

  @Column({ length: 45 })
  ipMaquina: string;

  @CreateDateColumn({ type: 'timestamp' })
  fechaHora: Date;

  // ✅ Relación con usuario (importante que coincida con idUsuario)
  @ManyToOne(() => Usuario, (usuario) => usuario.bitacoras, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'idUsuario' }) // este nombre debe ser EXACTO al de la columna
  usuario: Usuario;
}
