import { z } from 'zod';
export const trainingPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(80, 'Use 80 characters or fewer.'),
  description: z.string().trim().max(300, 'Use 300 characters or fewer.').nullable(),
  trainingPlanType: z.enum([
    'compound_full_body',
    'two_muscle_split',
    'single_muscle_split',
  ]),
});
export const workoutDaySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Workout day name is required.')
    .max(80, 'Use 80 characters or fewer.'),
  description: z.string().trim().max(300, 'Use 300 characters or fewer.').nullable(),
});
export const planExerciseSchema = z.object({
  sets: z.coerce.number().int().min(1).max(20),
  reps: z.coerce.number().int().min(1).max(100),
  targetWeight: z.coerce.number().min(0).max(1000).nullable(),
  restSeconds: z.coerce.number().int().min(0).max(1800).nullable(),
  notes: z.string().trim().max(250).nullable(),
});
