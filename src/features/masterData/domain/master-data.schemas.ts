import { z } from 'zod';

const name = z
  .string()
  .trim()
  .min(2, 'Enter at least 2 characters.')
  .max(80, 'Use 80 characters or fewer.');
const description = z.string().trim().max(300, 'Use 300 characters or fewer.');
const sortOrder = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Enter a whole number from 0 to 9999.')
  .refine((value) => Number(value) <= 9999, 'Enter a whole number from 0 to 9999.');
export const exerciseCategorySchema = z.object({ name, description, sortOrder });
export const exerciseLibrarySchema = z.object({
  name,
  description,
  categoryId: z.string().min(1, 'Select a category.'),
  categoryName: z.string().min(1),
  defaultUnitType: z.enum([
    'sets_reps_weight',
    'sets_reps',
    'duration',
    'distance',
    'rounds',
    'sets_duration',
    'custom',
  ]),
});
export const workoutMasterSchema = z.object({
  name,
  description,
  sortOrder,
  workoutType: z.enum(['compound', 'dual', 'single', 'cardio', 'custom']),
});
export type ExerciseCategoryFormValues = z.infer<typeof exerciseCategorySchema>;
export type ExerciseLibraryFormValues = z.infer<typeof exerciseLibrarySchema>;
export type WorkoutMasterFormValues = z.infer<typeof workoutMasterSchema>;
