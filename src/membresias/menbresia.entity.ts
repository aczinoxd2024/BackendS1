import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Membresia {
  @PrimaryGeneratedColumn()
  IDMembresia: number;

  @Column({ type: 'date' })
  FechaInicio: string;

  @Column({ type: 'date' })
  FechaFin: string;

  @Column({ length: 50 })
  PlataformaWeb: string;

  @Column()
  TipoMembresiaID: number;
}
