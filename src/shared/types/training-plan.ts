import type { Timestamp } from 'firebase/firestore';

export type TrainingPlanType =
  'compound_full_body' | 'two_muscle_split' | 'single_muscle_split';

export type WorkoutItem = {
  exerciseId: string;
  exerciseName: string;
  categoryId: string;
  categoryName: string;
  sets: number;
  reps: number;
  weight: number | null;
  order: number;
};

export type TrainingPlanTemplate = {
  id: string;
  name: string;
  planType: TrainingPlanType;
  items: WorkoutItem[];
  active: boolean;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};
