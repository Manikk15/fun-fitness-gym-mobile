import type { Timestamp } from 'firebase/firestore';

export type Exercise = {
  id: string;
  name: string;
  nameLowercase: string;
  categoryId: string;
  categoryName: string;
  active: boolean;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type ExerciseInput = Pick<Exercise, 'name' | 'categoryId' | 'categoryName'>;
