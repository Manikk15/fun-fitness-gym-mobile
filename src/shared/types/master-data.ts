import type { Timestamp } from 'firebase/firestore';

export type DefaultUnitType =
  | 'sets_reps_weight'
  | 'sets_reps'
  | 'duration'
  | 'distance'
  | 'rounds'
  | 'sets_duration'
  | 'custom';
export type WorkoutMasterType = 'compound' | 'dual' | 'single' | 'cardio' | 'custom';

type MasterDataBase = {
  id: string;
  gymId: string;
  name: string;
  nameLowercase: string;
  description: string;
  isActive: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
};
export type ExerciseCategory = MasterDataBase & { sortOrder: number };
export type ExerciseLibraryItem = MasterDataBase & {
  categoryId: string;
  defaultUnitType: DefaultUnitType;
  equipment?: string;
  difficulty?: string;
};
export type WorkoutMaster = MasterDataBase & {
  workoutType: WorkoutMasterType;
  sortOrder: number;
};
export type ExerciseCategoryInput = Pick<
  ExerciseCategory,
  'name' | 'description' | 'sortOrder'
>;
export type ExerciseLibraryInput = Pick<
  ExerciseLibraryItem,
  'name' | 'description' | 'categoryId' | 'defaultUnitType'
>;
export type WorkoutMasterInput = Pick<
  WorkoutMaster,
  'name' | 'description' | 'workoutType' | 'sortOrder'
>;
