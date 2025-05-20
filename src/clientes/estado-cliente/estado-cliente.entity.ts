
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('estado_cliente')
export class EstadoCliente {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  Estado: string;
}