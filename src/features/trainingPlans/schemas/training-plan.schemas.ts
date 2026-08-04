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
  sets: z.coerce
    .number({ invalid_type_error: 'Enter the number of sets.' })
    .int('Sets must be a whole number.')
    .min(1, 'Sets must be at least 1.')
    .max(20, 'Sets cannot exceed 20.'),
  reps: z.coerce
    .number({ invalid_type_error: 'Enter the number of reps.' })
    .int('Reps must be a whole number.')
    .min(1, 'Reps must be at least 1.')
    .max(100, 'Reps cannot exceed 100.'),
  targetWeight: z.preprocess(
    (value) => (value === '' ? null : value),
    z.coerce.number({ invalid_type_error: 'Enter a valid weight.' }).min(0).nullable(),
  ),
  restSeconds: z.preprocess(
    (value) => (value === '' ? null : value),
    z.coerce
      .number({ invalid_type_error: 'Enter valid rest seconds.' })
      .int('Rest must be a whole number.')
      .min(0)
      .max(600, 'Rest cannot exceed 600 seconds.')
      .nullable(),
  ),
});
