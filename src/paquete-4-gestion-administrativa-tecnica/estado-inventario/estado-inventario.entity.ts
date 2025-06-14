import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('estado_inventario')
export class EstadoInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  estado: string;
}
