import type { Timestamp } from 'firebase/firestore';
import type { DefaultUnitType } from './master-data';

export type MemberWorkoutStatus = 'assigned' | 'completed' | 'cancelled';
export type DurationUnit = 'minutes' | 'seconds';
export type DistanceUnit = 'metres' | 'kilometres';

export type MemberWorkout = {
  id: string;
  gymId: string;
  memberId: string;
  workoutId: string;
  workoutNameSnapshot: string;
  assignedBy: string;
  assignedAt: Timestamp | null;
  workoutDate: Timestamp;
  status: MemberWorkoutStatus;
  exerciseCount: number;
  completedExerciseCount?: number;
  completedAt?: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type MemberWorkoutExercise = {
  id: string;
  gymId: string;
  memberWorkoutId: string;
  memberId: string;
  exerciseId: string;
  exerciseNameSnapshot: string;
  categoryId: string;
  categoryNameSnapshot: string;
  unitType: DefaultUnitType;
  order: number;
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationValue?: number;
  durationUnit?: DurationUnit;
  distanceValue?: number;
  distanceUnit?: DistanceUnit;
  rounds?: number;
  notes?: string;
  isCompleted?: boolean;
  completedAt?: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type AssignmentExerciseInput = Omit<
  MemberWorkoutExercise,
  | 'id'
  | 'gymId'
  | 'memberWorkoutId'
  | 'memberId'
  | 'isCompleted'
  | 'completedAt'
  | 'createdAt'
  | 'updatedAt'
>;
