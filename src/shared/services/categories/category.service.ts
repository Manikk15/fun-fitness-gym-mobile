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

import type { Category, CategoryInput } from '../../types';
import { firestore } from '../firebase';

const categoriesCollection = collection(firestore, 'categories');

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function toCategory(id: string, data: Record<string, unknown>): Category {
  return { id, ...(data as Omit<Category, 'id'>) };
}

async function assertNameAvailable(name: string, excludedId?: string) {
  const snapshot = await getDocs(
    query(categoriesCollection, where('nameLowercase', '==', normalizeName(name))),
  );
  if (snapshot.docs.some((item) => item.id !== excludedId)) {
    throw new Error('category/duplicate-name');
  }
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const snapshot = await getDocs(
      query(categoriesCollection, orderBy('nameLowercase')),
    );
    return snapshot.docs.map((item) => toCategory(item.id, item.data()));
  },

  async create(input: CategoryInput, createdBy: string): Promise<Category> {
    const name = input.name.trim();
    await assertNameAvailable(name);
    const reference = doc(categoriesCollection);
    await setDoc(reference, {
      id: reference.id,
      name,
      nameLowercase: normalizeName(name),
      active: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: reference.id,
      name,
      nameLowercase: normalizeName(name),
      active: true,
      createdBy,
      createdAt: null,
      updatedAt: null,
    };
  },

  async update(id: string, input: CategoryInput): Promise<void> {
    const name = input.name.trim();
    await assertNameAvailable(name, id);
    await updateDoc(doc(categoriesCollection, id), {
      name,
      nameLowercase: normalizeName(name),
      updatedAt: serverTimestamp(),
    });
  },

  setActive(id: string, active: boolean): Promise<void> {
    return updateDoc(doc(categoriesCollection, id), {
      active,
      updatedAt: serverTimestamp(),
    });
  },
};
