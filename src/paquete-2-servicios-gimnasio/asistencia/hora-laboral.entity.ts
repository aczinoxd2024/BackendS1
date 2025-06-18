// src/entities/hora_laboral.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { HorarioTrabajo } from './horario-trabajo.entity';

@Entity('hora_laboral') // Asegúrate de que el nombre de la tabla coincida exactamente
export class HoraLaboral {
  // Corrección: Tu tabla tiene 'ID' como Primary Key.
  // Si quieres que TypeORM genere la columna con el nombre 'ID', déjalo vacío o usa { name: 'ID' }.
  // Si tu columna en la DB es realmente 'IDHora' (contrario a tu DESCRIBE), entonces la de abajo está bien.
  // BASADO EN TU 'DESCRIBE', TU PK ES 'ID'.
  @PrimaryGeneratedColumn() // Si la columna en tu DB es simplemente 'ID' y es auto-incrementable
  ID: number; // El nombre de la propiedad debe coincidir con el nombre de la columna en la BD

  // --- ALTERNATIVA (solo si la columna PK en tu DB es **REALMENTE** 'IDHora') ---
  // Si por alguna razón tu tabla tiene la PK llamada 'IDHora', entonces el siguiente es correcto:
  // @PrimaryGeneratedColumn({ name: 'IDHora' })
  // IDHora: number;
  // --- FIN ALTERNATIVA ---

  // --- CORRECCIÓN AQUÍ ---
  @Column({ name: 'HoraInicio', type: 'time' }) // El nombre de la columna en la BD es 'HoraInicio'
  HoraInicio: string; // La propiedad en la entidad también debe ser 'HoraInicio'

  @Column({ name: 'HoraFinal', type: 'time' }) // El nombre de la columna en la BD es 'HoraFinal'
  HoraFinal: string; // La propiedad en la entidad también debe ser 'HoraFinal'
  // --- FIN CORRECCIÓN ---

  @OneToMany(() => HorarioTrabajo, (ht) => ht.horaLaboral)
  horariosTrabajo: HorarioTrabajo[];
}
