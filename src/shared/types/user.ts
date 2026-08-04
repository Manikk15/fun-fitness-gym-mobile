import type { Timestamp } from 'firebase/firestore';
import type { TrainingPlanType } from './training-plan';

export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'rejected';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  approvedBy?: string;
  approvedAt?: Timestamp | null;
  currentTrainingPlanType: TrainingPlanType | null;
  assignedTrainingPlanId?: string | null;
  assignedTrainingPlanNameSnapshot?: string | null;
  assignedTrainingPlanType?: TrainingPlanType | null;
  assignedAt?: Timestamp | null;
  assignedBy?: string | null;
};

export type TrainingPlanAssignmentInput = {
  id: string;
  name: string;
  trainingPlanType: TrainingPlanType;
  status: 'published';
  active: true;
};

export type CreateUserProfileInput = Omit<
  UserProfile,
  'uid' | 'createdAt' | 'updatedAt'
>;

export type UpdateUserProfileInput = Partial<Pick<UserProfile, 'name' | 'email'>>;
