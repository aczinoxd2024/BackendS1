import { Request } from 'express';

export interface UserRequest extends Request {
  user: {
    id: string;
    correo: string;
    rol: string;
    ci: string;
  };
}
