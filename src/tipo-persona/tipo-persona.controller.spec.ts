import { Test, TestingModule } from '@nestjs/testing';
import { TipoPersonaController } from './tipo-persona.controller';

describe('TipoPersonaController', () => {
  let controller: TipoPersonaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoPersonaController],
    }).compile();

    controller = module.get<TipoPersonaController>(TipoPersonaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
