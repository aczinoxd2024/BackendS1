import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Usuario } from 'src/paquete-1-usuarios-accesos/usuarios/usuario.entity';

@Entity('persona')
export class Persona {
  @PrimaryColumn({ name: 'CI' })
  CI: string;

  @Column()
  Nombre: string;

  @Column()
  Apellido: string;

  @Column({ type: 'date' })
  FechaNacimiento: Date;

  @Column()
  Telefono: string;

  @Column()
  Direccion: string;

  @OneToOne(() => Usuario, (usuario) => usuario.idPersona)
  @JoinColumn({ name: 'CI' })
  usuario: Usuario;


}
