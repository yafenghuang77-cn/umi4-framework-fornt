import { z } from 'zod';

const nonnegative = z.number().finite().nonnegative();
const text = z.string().max(2000);
const metric = z.object({
  key: text,
  route: text,
  name: text,
  release: text,
  unit: z.enum(['ms', 'score']),
  count: nonnegative.int(),
  p50: nonnegative,
  p75: nonnegative,
  p95: nonnegative,
  goodRate: z.number().min(0).max(1).optional(),
});

export const monitoringSnapshotSchema = z.object({
  events: z
    .array(
      z.object({
        id: text,
        visitId: text,
        timestamp: nonnegative,
        updatedAt: nonnegative,
        environment: text,
        release: text,
        route: text,
        kind: z.enum(['vital', 'measure', 'request', 'log', 'error']),
        name: text,
        value: nonnegative.optional(),
        unit: z.enum(['ms', 'score']).optional(),
        rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
        level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
        message: text.optional(),
        attributes: z
          .record(z.string(), z.union([z.string().max(2000), z.number().finite(), z.boolean()]))
          .optional(),
        uploadedAt: nonnegative.optional(),
      }),
    )
    .max(10_000),
  reports: z
    .array(
      z.object({
        id: text,
        revision: text,
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        environment: text,
        generatedAt: nonnegative,
        eventCount: nonnegative.int(),
        logCount: nonnegative.int(),
        errorCount: nonnegative.int(),
        metrics: z.array(metric),
        status: z.enum(['pending', 'uploaded', 'sentry-submitted']),
        uploadedAt: nonnegative.optional(),
        lastError: text.optional(),
      }),
    )
    .max(10_000),
});
