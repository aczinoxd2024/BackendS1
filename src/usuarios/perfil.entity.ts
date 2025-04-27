import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Perfil {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombrePerfil: string; // 'Administrador', 'Cliente', 'Instructor', 'Recepcionista'

  @Column()
  acceso: string; // Opcional: aquí podrías describir permisos
}
