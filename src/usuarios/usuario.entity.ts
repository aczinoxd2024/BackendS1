import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Persona } from '../personas/persona.entity';
import { UsuarioPerfil } from './usuario-perfil.entity';
import { Bitacora } from '../bitacora/bitacora.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'Correo', unique: true }) // ✅ Correo único
  correo: string;

  @Column({ name: 'Contrasena' }) // ✅ Contraseña
  contrasena: string;

  // ✅ Relación con Persona (nombre, apellido, etc)
  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'IDPersona' }) // ✅ Nombre exacto del campo FK en la BD
  idPersona: Persona;

  @Column({ name: 'IDEstadoU' }) // ✅ Estado del usuario
  idEstadoU: number;

  // ✅ Relación con perfiles de usuario
  @OneToMany(() => UsuarioPerfil, (usuarioPerfil) => usuarioPerfil.usuario)
  usuarioPerfil: UsuarioPerfil[];

  // ✅ Relación con Bitácora (importante para saber qué acciones hizo)
  @OneToMany(() => Bitacora, (bitacora) => bitacora.usuario)
  bitacoras: Bitacora[];

  // ✅ BONUS OPCIONAL: Virtual Getter para traer nombre directamente (esto es solo para uso en código)
  get nombreCompleto(): string {
    return this.idPersona?.Nombre || ''; // 🔧 Asegúrate que "nombre" sea el campo correcto en Persona
  }
}
