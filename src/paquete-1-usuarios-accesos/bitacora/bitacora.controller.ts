import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'paquete-1-usuarios-accesos/auth/roles/roles.guard';
import { BitacoraService } from './bitacora.service';
import { Roles } from 'paquete-1-usuarios-accesos/auth/roles/roles.decorator';

@Controller('bitacora')
@UseGuards(RolesGuard)
export class BitacoraController {
  // ✅ EXPORT CORREGIDO

  constructor(private readonly bitacoraService: BitacoraService) {}

  /**
   * Obtener todos los registros de la bitácora
   * Solo permitido para Administradores
   */
  @Get()
  @Roles('Administrador')
  async obtenerBitacora() {
    return this.bitacoraService.obtenerTodos();
  }
}
