
import {
  Entity,
  Column,
  PrimaryColumn,
  Generated,
  CreateDateColumn,
} from 'typeorm';

@Entity('seguimiento_cliente')
export class SeguimientoCliente {
  @PrimaryColumn()
  IDCliente: string;

  @PrimaryColumn()
  @Generated('increment')
  id: number;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  Fecha: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  Peso: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  Altura: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  IMC: number;

  @Column()
  CIInstructor: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) Pecho?: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) Abdomen?: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) Cintura?: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) Cadera?: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) Pierna?: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) Biceps?: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) Espalda?: number;
}

