import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Rutina } from './rutina.entity';
import { Ejercicio } from './ejercicio.entity';
import { DiaSemana } from 'dia-semana/dia-semana.entity';

@Entity('detalle_rutina')
export class DetalleRutina {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  series: number;

  @Column()
  repeticiones: number;

  @Column()
descanso: number;

  @Column({ default: false })
  completado: boolean;

  @ManyToOne(() => Rutina, rutina => rutina.detalles)
  @JoinColumn({ name: 'idRutina' })
  rutina: Rutina;

  @ManyToOne(() => Ejercicio)
  @JoinColumn({ name: 'idEjercicio' })
  ejercicio: Ejercicio;

  @ManyToOne(() => DiaSemana)
  @JoinColumn({ name: 'idDia' })
  dia: DiaSemana;
}