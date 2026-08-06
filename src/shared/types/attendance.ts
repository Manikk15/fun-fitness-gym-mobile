import type { Timestamp } from 'firebase/firestore';

export type AttendanceStatus = 'present' | 'absent';

export type AttendanceRecord = {
  id: string;
  gymId: string;
  memberId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export const attendanceDate = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
