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

  // 🔥 Relación nueva: un usuario puede tener uno o varios perfiles (normalmente 1)
  @OneToMany(() => UsuarioPerfil, (usuarioPerfil) => usuarioPerfil.usuario)
  usuarioPerfil: UsuarioPerfil[];
}
