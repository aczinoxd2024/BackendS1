<<<<<<< HEAD
import { SeguimientoCliente } from 'paquete-3-control-comercial/seguimiento/seguimiento.entity';
import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
=======
import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Usuario } from 'paquete-1-usuarios-accesos/usuarios/usuario.entity';
import { ManyToOne, JoinColumn } from 'typeorm';
import { SeguimientoCliente } from 'paquete-3-control-comercial/seguimiento-cliente/seguimiento-cliente.entity';


>>>>>>> 64493db44f2098134be71f5d149468551edc4139

@Entity()
export class Cliente {
  @PrimaryColumn()
  CI: string;

  @Column()
  IDEstado: number;

  @Column('text')
  Observacion: string;

<<<<<<< HEAD
  @OneToMany(() => SeguimientoCliente, (s) => s.cliente)
  seguimientos: SeguimientoCliente[];
=======
  @OneToMany(() => SeguimientoCliente, (s) => s.IDCliente)
seguimientos: SeguimientoCliente[];


>>>>>>> 64493db44f2098134be71f5d149468551edc4139
}
