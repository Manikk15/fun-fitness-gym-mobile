import { z } from 'zod';

export const exerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Exercise name is required.')
    .max(80, 'Use 80 characters or fewer.'),
  categoryId: z.string().min(1, 'Select a category.'),
  categoryName: z.string().min(1, 'Select a category.'),
});

export type ExerciseFormValues = z.infer<typeof exerciseSchema>;
