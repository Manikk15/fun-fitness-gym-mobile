import { z } from 'zod';

const optionalNumber = (label: string, maximum: number) =>
  z
    .string()
    .trim()
    .refine((value) => !value || (Number(value) > 0 && Number(value) <= maximum), {
      message: `Enter a valid ${label}.`,
    });
const phone = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^(?:\+91[ -]?)?[6-9]\d{9}$/.test(value.replace(/\s/g, '')),
    {
      message: 'Enter a valid 10-digit phone number.',
    },
  );
const date = z
  .string()
  .trim()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Use YYYY-MM-DD.',
  });

export const memberProfileSchema = z.object({
  phone,
  dateOfBirth: date,
  age: optionalNumber('age', 120).refine(
    (value) => !value || Number.isInteger(Number(value)),
    'Enter age as a whole number.',
  ),
  gender: z.string().trim().max(30),
  heightCm: optionalNumber('height', 300),
  currentWeightKg: optionalNumber('weight', 500),
  goal: z.enum([
    '',
    'Weight Loss',
    'Muscle Gain',
    'General Fitness',
    'Strength',
    'Other',
  ]),
  joiningDate: date,
  emergencyContactName: z.string().trim().max(80),
  emergencyContactPhone: phone,
  address: z.string().trim().max(300),
  notes: z.string().trim().max(500),
});

export const measurementSchema = z
  .object({
    weightKg: optionalNumber('weight', 500),
    chestCm: optionalNumber('chest measurement', 300),
    waistCm: optionalNumber('waist measurement', 300),
    armsCm: optionalNumber('arms measurement', 200),
    thighsCm: optionalNumber('thighs measurement', 250),
    shouldersCm: optionalNumber('shoulders measurement', 300),
    hipsCm: optionalNumber('hips measurement', 300),
    bodyFatPercent: optionalNumber('body fat percentage', 100),
    notes: z.string().trim().max(500),
  })
  .refine(
    (values) =>
      Object.entries(values).some(([key, value]) => key !== 'notes' && Boolean(value)),
    { message: 'Enter at least one measurement.', path: ['weightKg'] },
  );

export type MemberProfileFormValues = z.infer<typeof memberProfileSchema>;
export type MeasurementFormValues = z.infer<typeof measurementSchema>;
