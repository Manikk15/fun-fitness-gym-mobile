import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../../../shared/services/firebase';
import type { MemberMeasurement, MemberMeasurementInput } from '../../../shared/types';

const reference = collection(firestore, 'memberMeasurements');
const map = (id: string, data: Record<string, unknown>) =>
  ({ id, ...data }) as MemberMeasurement;
const defined = (input: MemberMeasurementInput) =>
  Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));

export const memberMeasurementService = {
  async list(gymId: string, memberId: string): Promise<MemberMeasurement[]> {
    const snapshot = await getDocs(
      query(
        reference,
        where('gymId', '==', gymId),
        where('memberId', '==', memberId),
        orderBy('measuredAt', 'desc'),
        limit(50),
      ),
    );
    return snapshot.docs.map((item) => map(item.id, item.data()));
  },
  async get(id: string): Promise<MemberMeasurement | null> {
    const snapshot = await getDoc(doc(reference, id));
    return snapshot.exists() ? map(snapshot.id, snapshot.data()) : null;
  },
  async create(
    gymId: string,
    memberId: string,
    recordedBy: string,
    input: MemberMeasurementInput,
  ) {
    const target = doc(reference);
    const batch = writeBatch(firestore);
    batch.set(target, {
      id: target.id,
      gymId,
      memberId,
      measuredAt: Timestamp.now(),
      ...defined(input),
      recordedBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (input.weightKg)
      batch.update(doc(firestore, 'users', memberId), {
        currentWeightKg: input.weightKg,
        updatedAt: serverTimestamp(),
      });
    await batch.commit();
  },
  async update(id: string, memberId: string, input: MemberMeasurementInput) {
    const batch = writeBatch(firestore);
    const updates = Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        value === undefined ? deleteField() : value,
      ]),
    );
    batch.update(doc(reference, id), { ...updates, updatedAt: serverTimestamp() });
    if (input.weightKg)
      batch.update(doc(firestore, 'users', memberId), {
        currentWeightKg: input.weightKg,
        updatedAt: serverTimestamp(),
      });
    await batch.commit();
  },
  delete(id: string) {
    return deleteDoc(doc(reference, id));
  },
};
