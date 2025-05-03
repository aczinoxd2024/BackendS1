import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tipo_membresia')
export class TipoMembresia {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  NombreTipo: string;

  @Column('text')
  Descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  Precio: number;

  @Column()
  DuracionDias: number;

  @Column('text')
  Beneficios: string;
}
