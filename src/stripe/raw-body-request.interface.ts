import { Request } from 'express';

export interface RawBodyRequest extends Request {
  rawBody: Buffer;
  user?: { ci: string };
}
