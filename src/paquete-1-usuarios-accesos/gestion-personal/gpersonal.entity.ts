import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Persona } from 'paquete-1-usuarios-accesos/personas/persona.entity';

@Entity('personal')
export class Personal {
  @PrimaryColumn({ name: 'CI' })
  CI: string;

  @Column({ length: 50 })
  Cargo: string;

  @Column({ type: 'date' })
  FechaContratacion: Date;

  @Column({ length: 50 })
  AreaP: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  Sueldo: number;

  @OneToOne(() => Persona)
  @JoinColumn({ name: 'CI' }) // CI es tanto PK como FK hacia persona
  persona: Persona;
}
