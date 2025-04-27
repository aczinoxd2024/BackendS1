import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity()
export class Persona {
  @PrimaryColumn()
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

  @OneToOne(() => Usuario, (usuario) => usuario.idPersona) // Relación inversa con Usuario
  @JoinColumn({ name: 'CI' }) // La columna de Persona que se relaciona con Usuario
  usuario: Usuario;
}
