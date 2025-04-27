import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Clase {
  @PrimaryGeneratedColumn()
  IDClase: number;

  @Column({ length: 50 })
  Nombre: string;

  @Column()
  NumInscritos: number;

  @Column({ length: 30 })
  Estado: string;

  @Column()
  IDSalaa: number;
}
