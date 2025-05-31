import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Persona } from 'src/paquete-1-usuarios-accesos/personas/persona.entity';
import { UsuarioPerfil } from './usuario-perfil.entity';
import { Bitacora } from 'src/paquete-1-usuarios-accesos/bitacora/bitacora.entity';
import { Cliente } from 'src/paquete-1-usuarios-accesos/clientes/cliente.entity';


@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'Correo', unique: true })
  correo: string;

  @Column({ name: 'Contrasena' })
  contrasena: string;

  // 🔗 Relación con persona (CI, nombre, apellido, etc.)
  @ManyToOne(() => Persona, { eager: true })
  @JoinColumn({ name: 'IDPersona' }) // Nombre exacto de la FK en la BD
  idPersona: Persona;

  @Column({ name: 'IDEstadoU' })
  idEstadoU: number;

  // 🔗 Relación con perfiles de usuario (rol, permisos, etc.)
  @OneToMany(() => UsuarioPerfil, (usuarioPerfil) => usuarioPerfil.usuario, {
    cascade: true,
  })
  usuarioPerfil: UsuarioPerfil[];

  // 🔗 Relación con bitácora (acciones del usuario)
  @OneToMany(() => Bitacora, (bitacora) => bitacora.usuario, {
    cascade: true,
  })
  bitacoras: Bitacora[];

  // 🧠 Getter virtual (no persistido en BD)
  get nombreCompleto(): string {
    const nombre = this.idPersona?.Nombre ?? '';
    const apellido = this.idPersona?.Apellido ?? '';
    return `${nombre} ${apellido}`.trim();
  }
}
