import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'trainer' | 'member';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'rejected';
export type MemberGoal =
  'Weight Loss' | 'Muscle Gain' | 'General Fitness' | 'Strength' | 'Other';

export type UserProfile = {
  uid: string;
  gymId?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  approvedBy?: string;
  approvedAt?: Timestamp | null;
  phone?: string;
  dateOfBirth?: Timestamp | null;
  age?: number;
  gender?: string;
  heightCm?: number;
  currentWeightKg?: number;
  goal?: MemberGoal;
  joiningDate?: Timestamp | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  notes?: string;
};

export type CreateUserProfileInput = Omit<
  UserProfile,
  'uid' | 'createdAt' | 'updatedAt'
>;

export type UpdateUserProfileInput = Partial<Pick<UserProfile, 'name' | 'email'>>;
export type AdminMemberProfileInput = Partial<
  Pick<
    UserProfile,
    | 'phone'
    | 'dateOfBirth'
    | 'age'
    | 'gender'
    | 'heightCm'
    | 'currentWeightKg'
    | 'goal'
    | 'joiningDate'
    | 'emergencyContactName'
    | 'emergencyContactPhone'
    | 'address'
    | 'notes'
  >
>;
