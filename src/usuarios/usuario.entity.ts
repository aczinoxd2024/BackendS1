import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Persona } from '../personas/persona.entity';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  correo: string;

  @Column()
  contrasena: string;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'idPersona' }) // La columna de referencia que une con Persona
  idPersona: Persona; // Relación con Persona
  @Column()
  idEstadoU: number; // Estado del usuario
}
