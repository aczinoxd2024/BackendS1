import { SeguimientoCliente } from 'paquete-3-control-comercial/seguimiento/seguimiento.entity';
import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';

@Entity()
export class Cliente {
  @PrimaryColumn()
  CI: string;

  @Column()
  IDEstado: number;

  @Column('text')
  Observacion: string;

  @OneToMany(() => SeguimientoCliente, (s) => s.cliente)
  seguimientos: SeguimientoCliente[];
}
