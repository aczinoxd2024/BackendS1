import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Reserva } from '../reservas/reserva.entity';

@Entity('estado_reserva')
export class EstadoReserva {
  @PrimaryGeneratedColumn({ name: 'ID' })
  ID: number;

  @Column({ name: 'Estado' }) // 👈 usa el nombre real de la columna
  Estado: string;

  @OneToMany(() => Reserva, reserva => reserva.estado)
  reservas: Reserva[];
}
