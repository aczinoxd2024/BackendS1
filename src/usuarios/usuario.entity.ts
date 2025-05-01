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
import { Bitacora } from '../bitacora/bitacora.entity'; // ✅

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  correo: string;

  @Column()
  contrasena: string;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'IDPersona' })
  idPersona: Persona;

  @Column()
  idEstadoU: number;

  // 🔥 Relación con perfiles
  @OneToMany(() => UsuarioPerfil, (usuarioPerfil) => usuarioPerfil.usuario)
  usuarioPerfil: UsuarioPerfil[];

  // ✅ Relación con bitácora (nuevo)
  @OneToMany(() => Bitacora, (bitacora) => bitacora.usuario)
  bitacoras: Bitacora[];
}
