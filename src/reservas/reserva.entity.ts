import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clase } from '../clases/clase.entity';
import { Cliente } from '../clientes/cliente.entity';
import { EstadoReserva } from '../estado-reserva/estado-reserva.entity';
import { Horario } from '../horarios/horario.entity';


@Entity('reserva')
export class Reserva {
  @PrimaryGeneratedColumn({ name: 'ID' })
  IDReserva: number;

  @Column({ name: 'FechaReserva', type: 'date' })
  FechaReserva: Date;

  @Column({ name: 'IDHorario', nullable: true })
  IDHorario: number;

  @ManyToOne(() => Clase)
  @JoinColumn({ name: 'IDClase' })
  clase: Clase;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'CICliente' })
  cliente: Cliente;

  @ManyToOne(() => EstadoReserva)
  @JoinColumn({ name: 'IDEstado' })
  estado: EstadoReserva;

@ManyToOne(() => Horario, { eager: true }) // eager opcional, si quieres que siempre se cargue
@JoinColumn({ name: 'IDHorario' })
horario: Horario;

}
