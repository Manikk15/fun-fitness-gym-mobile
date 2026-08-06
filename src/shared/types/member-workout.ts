import type { Timestamp } from 'firebase/firestore';
import type { DefaultUnitType } from './master-data';

export type MemberWorkoutStatus = 'assigned' | 'completed' | 'cancelled';
export type DurationUnit = 'minutes' | 'seconds';
export type DistanceUnit = 'metres' | 'kilometres';

export type ExerciseSetDetail = {
  setNumber: number;
  targetReps: number;
  targetWeightKg: number;
  actualReps?: number;
  actualWeightKg?: number;
  isCompleted: boolean;
  completedAt?: Timestamp | null;
};

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
  setDetails?: ExerciseSetDetail[];
  /** Legacy fields retained for reading workouts assigned before setDetails. */
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
