import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pago')
export class Pago {
  @PrimaryGeneratedColumn()
  NroPago: number;

  @Column({ type: 'date' })
  Fecha: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  Monto: number;

  @Column()
  MetodoPago: number;

  @Column()
  CIPersona: string;
}
