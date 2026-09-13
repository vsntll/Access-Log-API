import { z } from 'zod';

export const createDoorSchema = z.object({
  name: z.string().trim().min(1),
  location: z.string().trim().min(1).optional(),
});

export const doorIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
