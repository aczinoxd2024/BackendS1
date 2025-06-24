import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Promocion } from '../../promociones-Crud/promocion.entity';

@Entity('tipo_membresia')
export class TipoMembresia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombreTipo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio: number;

  @Column({ type: 'int', nullable: true })
  duracionDias: number;

  @Column({ type: 'text', nullable: true })
  beneficios: string;

  @ManyToOne(() => Promocion, { nullable: true, eager: true })
  @JoinColumn({ name: 'IDPromocion' })
  promocion?: Promocion;

  @Column({ nullable: true })
  IDPromocion?: number;

  @Column({ type: 'text', nullable: true })
  clases?: string;

  @Column({ type: 'int', nullable: true })
  cantidadClasesCliente?: number;
}

