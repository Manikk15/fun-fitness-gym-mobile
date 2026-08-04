import type { Timestamp } from 'firebase/firestore';

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
};

export type CreateUserProfileInput = Omit<
  UserProfile,
  'uid' | 'createdAt' | 'updatedAt'
>;

export type UpdateUserProfileInput = Partial<Pick<UserProfile, 'name' | 'email'>>;
