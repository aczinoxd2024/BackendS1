import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Persona } from '../personas/persona.entity'; // Importa la entidad Persona
import { Clase } from '../clases/clase.entity';

@Entity()
export class Reserva {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  FechaReserva: Date;

  @ManyToOne(() => Clase)
  @JoinColumn({ name: 'IDClase' })
  Clase: Clase;

  @ManyToOne(() => Persona) // Relacionamos con la entidad Persona (Cliente)
  @JoinColumn({ name: 'CICliente' })
  Cliente: Persona; // Cliente que realiza la reserva

  @Column()
  IDEstado: number; // Estado de la reserva
}
