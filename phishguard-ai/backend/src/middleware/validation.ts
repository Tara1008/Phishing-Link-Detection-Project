import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const analyzeSchema = z.object({
  url:        z.string().min(1, 'URL is required').max(2048, 'URL too long'),
  session_id: z.string().max(64).optional().default(''),
});

export type AnalyzeBody = z.infer<typeof analyzeSchema>;

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error:   'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
