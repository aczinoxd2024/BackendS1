import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { DetalleRutina } from './detalle-rutina.entity'
import { Cliente } from 'paquete-1-usuarios-accesos/clientes/cliente.entity';

@Entity('rutina')
export class Rutina {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255 })
  descripcion: string;

  @Column()
  objetivo: string;

  @Column()
  nivel: string;

  @Column()
  ciInstructor: string;

  @Column()
  generoObjetivo: string;

   @Column({ default: true })
activo: boolean;

@Column({ nullable: true })
  CICliente?: string;


  @OneToMany(() => DetalleRutina, detalle => detalle.rutina, { cascade: true })
  detalles: DetalleRutina[];

 @Column({ type: 'enum', enum: ['general', 'gold', 'personalizada', 'clase'], default: 'general' })
tipoAcceso: string;

 @ManyToOne(() => Cliente, (cliente) => cliente.rutinas, { nullable: true })
  @JoinColumn({ name: 'CICliente' })
  cliente?: Cliente;

@Column({ default: false })
esBasica: boolean;

}