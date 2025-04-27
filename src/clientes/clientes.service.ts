import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,
  ) {}

  create(cliente: Cliente): Promise<Cliente> {
    return this.clientesRepository.save(cliente);
  }

  findAll(): Promise<Cliente[]> {
    return this.clientesRepository.find();
  }
}
