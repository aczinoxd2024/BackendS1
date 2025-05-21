import { Request, Response } from 'express';

export function rawBodyMiddleware(
  req: Request,
  res: Response,
  buf: Buffer,
  encoding: BufferEncoding,
): void {
  if (req.originalUrl.includes('/stripe/webhook')) {
    (req as any).rawBody = buf; // 👈 usamos 'as any' para evitar el error de TS
  }
}
