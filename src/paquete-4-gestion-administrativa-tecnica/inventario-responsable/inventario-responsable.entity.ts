import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Inventario } from '../inventario/inventario.entity';
import { Personal } from 'paquete-2-servicios-gimnasio/personal/personal.entity';

@Entity('inventario_responsable')
export class InventarioResponsable {
  @PrimaryColumn()
  CI: string;

  @PrimaryColumn()
  IDItem: number;

  @ManyToOne(() => Personal)
  @JoinColumn({ name: 'CI' })
  persona: Personal;

  @ManyToOne(() => Inventario)
  @JoinColumn({ name: 'IDItem' })
  item: Inventario;

  @Column({ type: 'date' })
  FechaAsignacion: Date;

  @Column({ type: 'text', nullable: true })
  Observacion: string;
}
