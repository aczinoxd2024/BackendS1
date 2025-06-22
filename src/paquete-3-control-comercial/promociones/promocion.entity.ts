import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('promocion')
export class Promocion {
  @PrimaryGeneratedColumn()
  IDPromo: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  Descuento: number;

  @Column({ type: 'text', nullable: true })
  Descripcion: string;

  @Column({ type: 'date' })
FechaInicio: Date;

@Column({ type: 'date' })
FechaFin: Date;

}
