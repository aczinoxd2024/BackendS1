import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Raw, Repository } from 'typeorm';
import { Membresia } from 'paquete-2-servicios-gimnasio/membresias/menbresia.entity';
import { TipoMembresia } from 'paquete-2-servicios-gimnasio/membresias/Tipos/menbresia.entity';
import { Pago } from 'pagos/pagos.entity';

@Injectable()
export class ReportesEstadisticasService {
  constructor(
    @InjectRepository(Membresia)
    private readonly membresiaRepo: Repository<Membresia>,

    @InjectRepository(TipoMembresia)
    private readonly tipoRepo: Repository<TipoMembresia>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
  ) { }

async obtenerResumenMembresias() {
  const hoy = new Date();

  // Excluir membresías "Incluidas" (gratuitas por Gold)
  const filtro = {
    PlataformaWeb: Not(In(['Incluida']))
  };

  // Total real de membresías adquiridas
  const total = await this.membresiaRepo.count({ where: filtro });

  // Activas: FechaFin >= hoy
  const activas = await this.membresiaRepo.count({
    where: {
      ...filtro,
      FechaFin: Raw((alias) => `${alias} >= CURDATE()`),
    },
  });

  const expiradas = total - activas;

  // Resumen por tipo (sin contar las incluidas)
  const tipos = await this.membresiaRepo
    .createQueryBuilder('m')
    .innerJoin('m.tipo', 'tipo')
    .where("m.PlataformaWeb != 'Incluida'")
    .select('tipo.NombreTipo', 'tipo')
    .addSelect('COUNT(*)', 'cantidad')
    .groupBy('tipo.NombreTipo')
    .getRawMany();

  const resumenPorTipo = {};
  tipos.forEach(t => {
    resumenPorTipo[t.tipo.trim()] = parseInt(t.cantidad);
  });

  return {
    total,
    activas,
    expiradas,
    tipo: resumenPorTipo,
  };
}

  async obtenerReportePagosMensuales() {
  const pagos = await this.pagoRepo
    .createQueryBuilder('p')
    .select([
      "MONTH(p.Fecha) AS mes",
      "COUNT(*) AS totalPagos",
      "SUM(p.Monto) AS montoTotal" 
    ])
    .groupBy("MONTH(p.Fecha)")
    .orderBy("mes", "ASC")
    .getRawMany();

  const meses = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return pagos.map(p => ({
    mes: meses[parseInt(p.mes)],
    totalPagos: parseInt(p.totalPagos),
    montoTotal: parseFloat(p.montoTotal)
  }));
}

}