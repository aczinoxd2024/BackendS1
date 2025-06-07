import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { ManyToOne, JoinColumn } from 'typeorm';
import { SeguimientoCliente } from 'paquete-3-control-comercial/seguimiento-cliente/seguimiento-cliente.entity';

@Entity()
export class Cliente {
  @PrimaryColumn()
  CI: string;

  @Column()
  IDEstado: number;

  @Column('text')
  Observacion: string;

  @OneToMany(() => SeguimientoCliente, (s) => s.IDCliente)
  seguimientos: SeguimientoCliente[];
}
