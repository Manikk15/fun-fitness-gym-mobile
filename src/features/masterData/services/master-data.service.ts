import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  startAt,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '../../../shared/services/firebase';
import type {
  ExerciseCategory,
  ExerciseCategoryInput,
  ExerciseLibraryInput,
  ExerciseLibraryItem,
  WorkoutMaster,
  WorkoutMasterInput,
} from '../../../shared/types';

const normalizeName = (value: string) => value.trim().toLowerCase();
function createService<
  T extends {
    id: string;
    gymId: string;
    name: string;
    nameLowercase: string;
    isActive: boolean;
  },
  I extends { name: string },
>(collectionName: string, sort: (left: T, right: T) => number) {
  const reference = collection(firestore, collectionName);
  const map = (id: string, data: Record<string, unknown>) => ({ id, ...data }) as T;
  const assertNameAvailable = async (
    gymId: string,
    name: string,
    excludedId?: string,
  ) => {
    const snapshot = await getDocs(
      query(
        reference,
        where('gymId', '==', gymId),
        where('nameLowercase', '==', normalizeName(name)),
      ),
    );
    if (snapshot.docs.some((item) => item.id !== excludedId))
      throw new Error('master-data/duplicate-name');
  };
  return {
    async list(gymId: string): Promise<T[]> {
      const snapshot = await getDocs(query(reference, where('gymId', '==', gymId)));
      return snapshot.docs.map((item) => map(item.id, item.data())).sort(sort);
    },
    async listActive(gymId: string): Promise<T[]> {
      const snapshot = await getDocs(
        query(reference, where('gymId', '==', gymId), where('isActive', '==', true)),
      );
      return snapshot.docs.map((item) => map(item.id, item.data())).sort(sort);
    },
    async hasActive(gymId: string): Promise<boolean> {
      const snapshot = await getDocs(
        query(
          reference,
          where('gymId', '==', gymId),
          where('isActive', '==', true),
          limit(1),
        ),
      );
      return !snapshot.empty;
    },
    async get(id: string, gymId: string): Promise<T | null> {
      const snapshot = await getDoc(doc(reference, id));
      if (!snapshot.exists() || snapshot.data().gymId !== gymId) return null;
      return map(snapshot.id, snapshot.data());
    },
    async create(gymId: string, input: I, createdBy: string): Promise<void> {
      const clean = { ...input, name: input.name.trim() };
      await assertNameAvailable(gymId, clean.name);
      const target = doc(reference);
      await setDoc(target, {
        id: target.id,
        gymId,
        ...clean,
        nameLowercase: normalizeName(clean.name),
        isActive: true,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    async update(id: string, gymId: string, input: I): Promise<void> {
      const clean = { ...input, name: input.name.trim() };
      await assertNameAvailable(gymId, clean.name, id);
      await updateDoc(doc(reference, id), {
        ...clean,
        nameLowercase: normalizeName(clean.name),
        updatedAt: serverTimestamp(),
      });
    },
    setActive(id: string, isActive: boolean): Promise<void> {
      return updateDoc(doc(reference, id), { isActive, updatedAt: serverTimestamp() });
    },
  };
}
export const exerciseCategoryService = createService<
  ExerciseCategory,
  ExerciseCategoryInput
>(
  'exerciseCategories',
  (left, right) =>
    left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
);
const exerciseLibraryBaseService = createService<
  ExerciseLibraryItem,
  ExerciseLibraryInput
>('exerciseLibrary', (left, right) => left.name.localeCompare(right.name));
export type ExerciseLibraryCursor = QueryDocumentSnapshot<DocumentData>;
export const exerciseLibraryService = {
  ...exerciseLibraryBaseService,
  async listPage({
    gymId,
    categoryId,
    search = '',
    cursor,
    pageSize = 25,
  }: {
    gymId: string;
    categoryId?: string;
    search?: string;
    cursor?: ExerciseLibraryCursor;
    pageSize?: number;
  }): Promise<{
    items: ExerciseLibraryItem[];
    cursor?: ExerciseLibraryCursor;
    hasMore: boolean;
  }> {
    const normalizedSearch = normalizeName(search);
    const constraints: QueryConstraint[] = [
      where('gymId', '==', gymId),
      orderBy('nameLowercase'),
    ];
    if (categoryId) constraints.push(where('categoryId', '==', categoryId));
    if (normalizedSearch) {
      constraints.push(startAt(normalizedSearch), endAt(`${normalizedSearch}\uf8ff`));
    }
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(pageSize));

    const snapshot = await getDocs(
      query(collection(firestore, 'exerciseLibrary'), ...constraints),
    );
    return {
      items: snapshot.docs.map(
        (item) => ({ id: item.id, ...item.data() }) as ExerciseLibraryItem,
      ),
      cursor: snapshot.docs.at(-1),
      hasMore: snapshot.size === pageSize,
    };
  },
};
export const workoutMasterService = createService<WorkoutMaster, WorkoutMasterInput>(
  'workoutMasters',
  (left, right) =>
    left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
);
