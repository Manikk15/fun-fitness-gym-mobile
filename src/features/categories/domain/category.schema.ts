import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required.')
    .max(50, 'Use 50 characters or fewer.'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
