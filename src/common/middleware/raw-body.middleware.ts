/*import { Request, Response, NextFunction } from 'express';
import { raw } from 'body-parser';

export function rawBodyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Solo aplicar para la ruta del webhook
  if (req.originalUrl === '/api/stripe/webhook') {
    console.log('Middleware rawBody aplicado correctamente'); //temporalmente, luego se saca
    return raw({ type: 'application/json' })(req, res, next);
  }
  next();
} */

import { Request, Response, NextFunction } from 'express';
import { raw } from 'body-parser';

export function rawBodyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.originalUrl === '/api/stripe/webhook') {
    raw({ type: 'application/json' })(req, res, (err) => {
      if (err) return next(err);

      // ⚠️ Stripe necesita el raw body como propiedad adicional
      // Aquí asignamos el cuerpo original al request para usarlo en el verificador
      (req as any).rawBody = req.body;

      console.log('rawBody correctamente asignado manualmente');
      next();
    });
  } else {
    next();
  }
}
