import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function HoraValida(validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      name: 'HoraValida',
      target: constructor,
      propertyName: 'HoraFin', // solo se usa como referencia
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const obj = args.object as any;
          return obj.HoraIni && obj.HoraFin && obj.HoraIni < obj.HoraFin;
        },
        defaultMessage() {
          return 'La hora de fin debe ser mayor que la hora de inicio';
        },
      },
    });
  };
}
