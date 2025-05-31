import { Entity, Column, PrimaryColumn } from 'typeorm';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { ManyToOne, JoinColumn } from 'typeorm';


@Entity()
export class Cliente {
  @PrimaryColumn()
  CI: string;

  @Column()
  IDEstado: number;

  @Column('text')
  Observacion: string;


}
