import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Clase } from 'src/clases/clase.entity'; // ajusta la ruta según tu estructura


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
// NUEVA RELACIÓN CON CLASE:
  @ManyToOne(() => Clase, { eager: true, nullable: true })
  @JoinColumn({ name: 'claseId' })
  clase: Clase;

  @Column({ nullable: true })
  claseId: number;
 
}
