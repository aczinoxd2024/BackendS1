import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promocion } from './promocion.entity';

@Injectable()
export class PromocionService {
  constructor(
    @InjectRepository(Promocion)
    private readonly promoRepo: Repository<Promocion>,
  ) {}

  async obtenerTodas(): Promise<Promocion[]> {
    return this.promoRepo.find();
  }

  async obtenerPorId(id: number): Promise<Promocion | null> {
    return this.promoRepo.findOne({ where: { IDPromo: id } });
  }
}
