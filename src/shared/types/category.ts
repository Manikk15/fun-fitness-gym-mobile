import type { Timestamp } from 'firebase/firestore';

export type Category = {
  id: string;
  name: string;
  nameLowercase: string;
  active: boolean;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type CategoryInput = Pick<Category, 'name'>;
