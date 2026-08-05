import type { Timestamp } from 'firebase/firestore';

export type MemberMeasurement = {
  id: string;
  gymId: string;
  memberId: string;
  measuredAt: Timestamp;
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  armsCm?: number;
  thighsCm?: number;
  shouldersCm?: number;
  hipsCm?: number;
  bodyFatPercent?: number;
  notes?: string;
  recordedBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type MemberMeasurementInput = Pick<
  MemberMeasurement,
  | 'weightKg'
  | 'chestCm'
  | 'waistCm'
  | 'armsCm'
  | 'thighsCm'
  | 'shouldersCm'
  | 'hipsCm'
  | 'bodyFatPercent'
  | 'notes'
>;
