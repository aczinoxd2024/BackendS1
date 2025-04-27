import { Controller, Get, Post, Body } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { Cliente } from './cliente.entity';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Body() cliente: Cliente): Promise<Cliente> {
    return this.clientesService.create(cliente);
  }

  @Get()
  findAll(): Promise<Cliente[]> {
    return this.clientesService.findAll();
  }
}
