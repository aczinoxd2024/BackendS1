import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Perfil } from './perfil.entity';

@Entity()
export class UsuarioPerfil {
  @PrimaryColumn()
  IDUsuario: string; // 🔥 Clave primaria manual

  @PrimaryColumn()
  IDPerfil: number; // 🔥 Clave primaria manual

  @ManyToOne(() => Usuario, (usuario) => usuario.usuarioPerfil)
  @JoinColumn({ name: 'IDUsuario' })
  usuario: Usuario;

  @ManyToOne(() => Perfil)
  @JoinColumn({ name: 'IDPerfil' })
  perfil: Perfil;
}
