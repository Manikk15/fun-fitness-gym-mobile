import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { Exercise, ExerciseInput } from '../../types';
import { firestore } from '../firebase';

const exercisesCollection = collection(firestore, 'exercises');

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function toExercise(id: string, data: Record<string, unknown>): Exercise {
  return { id, ...(data as Omit<Exercise, 'id'>) };
}

async function assertNameAvailable(input: ExerciseInput, excludedId?: string) {
  const snapshot = await getDocs(
    query(
      exercisesCollection,
      where('categoryId', '==', input.categoryId),
      where('nameLowercase', '==', normalizeName(input.name)),
    ),
  );
  if (snapshot.docs.some((item) => item.id !== excludedId)) {
    throw new Error('exercise/duplicate-name');
  }
}

export const exerciseService = {
  async getAll(): Promise<Exercise[]> {
    const snapshot = await getDocs(
      query(exercisesCollection, orderBy('nameLowercase')),
    );
    return snapshot.docs.map((item) => toExercise(item.id, item.data()));
  },

  async create(input: ExerciseInput, createdBy: string): Promise<Exercise> {
    const name = input.name.trim();
    const data = { ...input, name };
    await assertNameAvailable(data);
    const reference = doc(exercisesCollection);
    await setDoc(reference, {
      id: reference.id,
      ...data,
      nameLowercase: normalizeName(name),
      active: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: reference.id,
      ...data,
      nameLowercase: normalizeName(name),
      active: true,
      createdBy,
      createdAt: null,
      updatedAt: null,
    };
  },

  async update(id: string, input: ExerciseInput): Promise<void> {
    const name = input.name.trim();
    const data = { ...input, name };
    await assertNameAvailable(data, id);
    await updateDoc(doc(exercisesCollection, id), {
      ...data,
      nameLowercase: normalizeName(name),
      updatedAt: serverTimestamp(),
    });
  },

  setActive(id: string, active: boolean): Promise<void> {
    return updateDoc(doc(exercisesCollection, id), {
      active,
      updatedAt: serverTimestamp(),
    });
  },
};
