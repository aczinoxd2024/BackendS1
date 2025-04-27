import { Test, TestingModule } from '@nestjs/testing';
import { PersonaTipoController } from './persona-tipo.controller';

describe('PersonaTipoController', () => {
  let controller: PersonaTipoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonaTipoController],
    }).compile();

    controller = module.get<PersonaTipoController>(PersonaTipoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
