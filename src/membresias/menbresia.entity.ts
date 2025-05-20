import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('membresia')
export class Membresia {
  @PrimaryGeneratedColumn()
  IDMembresia: number;

  @Column({ type: 'date' })
  FechaInicio: Date;

  @Column({ type: 'date' })
  FechaFin: Date;

  @Column({ length: 50 })
  PlataformaWeb: string;

  @Column()
  TipoMembresiaID: number;

 
}
