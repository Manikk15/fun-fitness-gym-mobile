import type { Timestamp } from 'firebase/firestore';

export type TrainingPlanType =
  'compound_full_body' | 'two_muscle_split' | 'single_muscle_split';
export type TrainingPlanStatus = 'draft' | 'published' | 'archived';
export type TrainingPlan = {
  id: string;
  name: string;
  nameLowercase: string;
  description: string | null;
  trainingPlanType: TrainingPlanType;
  status: TrainingPlanStatus;
  active: boolean;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  publishedAt: Timestamp | null;
  archivedAt: Timestamp | null;
  workoutDayCount: number;
  exerciseCount: number;
};
export type WorkoutDay = {
  id: string;
  name: string;
  nameLowercase: string;
  description: string | null;
  order: number;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  exerciseCount: number;
};
export type PlanExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  categoryId: string;
  categoryName: string;
  sets: number;
  reps: number;
  targetWeight: number | null;
  weightUnit: 'kg';
  restSeconds: number | null;
  notes: string | null;
  order: number;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};
export type TrainingPlanInput = Pick<
  TrainingPlan,
  'name' | 'description' | 'trainingPlanType'
>;
export type WorkoutDayInput = Pick<WorkoutDay, 'name' | 'description'>;
export type PlanExerciseInput = Pick<
  PlanExercise,
  'sets' | 'reps' | 'targetWeight' | 'restSeconds' | 'notes'
>;
