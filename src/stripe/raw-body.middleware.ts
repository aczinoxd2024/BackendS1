import { Request, Response } from 'express';

export function rawBodyMiddleware(
  req: Request,
  res: Response,
  buf: Buffer,
  encoding: BufferEncoding,
): void {
  if (req.originalUrl.includes('/stripe/webhook')) {
    (req as any).rawBody = buf;

    // Logs útiles para confirmar que rawBody fue capturado
    console.log('📩 Middleware rawBody aplicado para:', req.originalUrl);
    console.log('📦 Tamaño del rawBody:', buf.length);
  }
}
