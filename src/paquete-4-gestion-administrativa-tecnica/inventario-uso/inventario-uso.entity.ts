import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Inventario } from '../inventario/inventario.entity';

@Entity('inventario_uso')
export class InventarioUso {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inventario)
  @JoinColumn({ name: 'IDItem' })
  item: Inventario;

  @Column()
  IDDestino: number;

  @Column()
  TipoDestino: string;

  @Column()
  CantidadAsignada: number;

  @Column({ type: 'date' })
  FechaAsignacion: Date;
}
