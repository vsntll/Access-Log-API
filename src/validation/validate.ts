import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodType, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(400).json({
        error: 'validation failed',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    (req as any)[`valid${target[0].toUpperCase()}${target.slice(1)}`] = result.data;
    next();
  };
}
