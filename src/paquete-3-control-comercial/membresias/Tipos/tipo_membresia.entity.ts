import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,JoinColumn,} from 'typeorm';
import { Promocion } from '../../promociones/promocion.entity';

@Entity('tipo_membresia')
export class TipoMembresia {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  NombreTipo: string;

  @Column({ type: 'text', nullable: true })
  Descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  Precio: number;

  @Column({ type: 'int', nullable: true })
  DuracionDias: number;

  @Column({ type: 'text', nullable: true })
  Beneficios: string;

  // 🔗 Relación con Promoción
@ManyToOne(() => Promocion, { nullable: true, eager: true }) // ← eager para que cargue automáticamente
@JoinColumn({ name: 'IDPromocion' })
promocion?: Promocion;


@Column({ nullable: true })
IDPromocion?: number;
}
