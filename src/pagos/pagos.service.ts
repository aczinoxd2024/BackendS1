import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './pagos.entity';
import { Membresia } from '../membresias/menbresia.entity';
import { Cliente } from '../clientes/cliente.entity';
import { DetallePago } from './detalle-pago/detalle-pago.entity';
import { RegistroPagoDto } from './registro-pago/registro-pago.dto';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,

    @InjectRepository(DetallePago)
    private detallePagoRepository: Repository<DetallePago>,

    @InjectRepository(Membresia)
    private membresiaRepository: Repository<Membresia>,

    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  async registrarPago(data: RegistroPagoDto) {
    const { ciCliente, idMembresia, monto, metodoPagoId } = data;

    // 1️⃣ Validar Cliente
    const cliente = await this.clienteRepository.findOneBy({ CI: ciCliente });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // 2️⃣ Validar Membresía
    const membresia = await this.membresiaRepository.findOneBy({
      IDMembresia: idMembresia,
    });
    if (!membresia) {
      throw new NotFoundException('Membresía no encontrada');
    }

    // 3️⃣ Crear Pago
    const pago = this.pagosRepository.create({
      Fecha: new Date(),
      Monto: monto,
      MetodoPago: metodoPagoId,
      CIPersona: ciCliente,
    });

    const pagoGuardado = await this.pagosRepository.save(pago);

    // 4️⃣ Crear Detalle Pago
    const detallePago = this.detallePagoRepository.create({
      IDPago: pagoGuardado.NroPago,
      IDMembresia: idMembresia,
      MontoTotal: monto,
      IDPromo: null, // No se está usando promociones en este flujo
    });

    await this.detallePagoRepository.save(detallePago);

    return {
      mensaje: 'Pago registrado con éxito',
      pagoId: pagoGuardado.NroPago,
      cliente: ciCliente,
      membresia: idMembresia,
      montoPagado: monto,
      fecha: pagoGuardado.Fecha,
    };
  }

  // Puedes agregar otros métodos como findAll, findByCliente, etc. si lo deseas en el futuro.
}
