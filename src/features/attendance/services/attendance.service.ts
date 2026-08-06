import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../../../shared/services/firebase';
import type { AttendanceRecord, AttendanceStatus } from '../../../shared/types';

const attendance = collection(firestore, 'attendance');
const recordId = (memberId: string, date: string) => `${memberId}_${date}`;
const mapRecord = (id: string, data: Record<string, unknown>) =>
  ({ id, ...data }) as AttendanceRecord;

export const attendanceService = {
  async listForDate(gymId: string, date: string): Promise<AttendanceRecord[]> {
    const snapshot = await getDocs(
      query(attendance, where('gymId', '==', gymId), where('date', '==', date)),
    );
    return snapshot.docs.map((item) => mapRecord(item.id, item.data()));
  },

  async getForMemberDate(
    memberId: string,
    date: string,
  ): Promise<AttendanceRecord | null> {
    const snapshot = await getDoc(doc(attendance, recordId(memberId, date)));
    return snapshot.exists() ? mapRecord(snapshot.id, snapshot.data()) : null;
  },

  async listForMember(
    gymId: string,
    memberId: string,
    count = 10,
  ): Promise<AttendanceRecord[]> {
    const snapshot = await getDocs(
      query(
        attendance,
        where('gymId', '==', gymId),
        where('memberId', '==', memberId),
        orderBy('date', 'desc'),
        limit(count),
      ),
    );
    return snapshot.docs.map((item) => mapRecord(item.id, item.data()));
  },

  async markPresent({
    gymId,
    memberId,
    date,
  }: {
    gymId: string;
    memberId: string;
    date: string;
  }): Promise<void> {
    const reference = doc(attendance, recordId(memberId, date));
    const existing = await getDoc(reference);
    if (existing.exists() && existing.data().status === 'present') return;
    await setDoc(
      reference,
      {
        id: reference.id,
        gymId,
        memberId,
        date,
        status: 'present',
        markedBy: memberId,
        ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async save({
    gymId,
    date,
    markedBy,
    statuses,
    existingMemberIds,
  }: {
    gymId: string;
    date: string;
    markedBy: string;
    statuses: { memberId: string; status: AttendanceStatus }[];
    existingMemberIds: Set<string>;
  }): Promise<void> {
    const batch = writeBatch(firestore);
    statuses.forEach(({ memberId, status }) => {
      const reference = doc(attendance, recordId(memberId, date));
      batch.set(
        reference,
        {
          id: reference.id,
          gymId,
          memberId,
          date,
          status,
          markedBy,
          ...(!existingMemberIds.has(memberId) ? { createdAt: serverTimestamp() } : {}),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });
    await batch.commit();
  },
};
