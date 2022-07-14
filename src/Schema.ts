import { z } from 'zod';

const dateSchema = z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
}, z.date());

export const daySchema = z.object({
    avg: z.number(),
    date: dateSchema,
    day: z.number(),
    high: z.number(),
    low: z.number(),
    month: z.number(),
    year: z.number(),
});

export type Day = z.infer<typeof daySchema>;

export type DayExtended = Day; // & { day: number; month: number; year: number };

export const stationSchema = z.object({
    name: z.string().min(1),
    temps: z.array(daySchema).nonempty(),
});

export type Station = z.infer<typeof stationSchema>;

export const datasetSchema = z.record(stationSchema);

export type Dataset = z.infer<typeof datasetSchema>;
