import { z } from 'zod';

export const createEventSchema = z.object({
  subject_id: z.string().trim().min(1),
  door_id: z.coerce.number().int().positive(),
  event_type: z.string().trim().min(1),
  occurred_at: z.string().datetime().optional(),
});

export const listEventsQuerySchema = z.object({
  door_id: z.coerce.number().int().positive().optional(),
  subject_id: z.string().trim().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const eventIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
