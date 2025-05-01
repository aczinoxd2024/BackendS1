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

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'Correo', unique: true }) // 🔧 Mapeo correcto al campo en la base
  correo: string;

  @Column({ name: 'Contrasena' }) // 🔧 Corrige mapeo de contraseña
  contrasena: string;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'IDPersona' }) // 🔧 Nombre exacto del campo FK
  idPersona: Persona;

  @Column({ name: 'IDEstadoU' }) // 🔧 Corrige nombre exacto del campo
  idEstadoU: number;

  @OneToMany(() => UsuarioPerfil, (usuarioPerfil) => usuarioPerfil.usuario)
  usuarioPerfil: UsuarioPerfil[];

  @OneToMany(() => Bitacora, (bitacora) => bitacora.usuario)
  bitacoras: Bitacora[];
}

