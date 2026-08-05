import {
  doc,
  deleteField,
  getDocs,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import type {
  CreateUserProfileInput,
  AdminMemberProfileInput,
  UpdateUserProfileInput,
  UserProfile,
} from '../../types';
import { firestore } from '../firebase';

const USERS_COLLECTION = 'users';
const usersCollection = collection(firestore, USERS_COLLECTION);

export type UserProfileListener = (profile: UserProfile | null) => void;

export interface UserService {
  create(userId: string, data: CreateUserProfileInput): Promise<void>;
  getById(userId: string): Promise<UserProfile | null>;
  update(userId: string, data: UpdateUserProfileInput): Promise<void>;
  observe(userId: string, listener: UserProfileListener): Unsubscribe;
  getMembers(): Promise<UserProfile[]>;
  setMemberStatus(
    memberId: string,
    status: 'active' | 'rejected' | 'inactive',
    adminId: string,
  ): Promise<void>;
  updateMemberProfile(memberId: string, data: AdminMemberProfileInput): Promise<void>;
}

function userDocument(userId: string) {
  return doc(firestore, USERS_COLLECTION, userId);
}

function toUserProfile(snapshot: DocumentSnapshot<DocumentData>): UserProfile | null {
  if (!snapshot.exists()) {
    return null;
  }

  return {
    uid: snapshot.id,
    ...(snapshot.data() as Omit<UserProfile, 'uid'>),
  };
}

/** Firestore adapter for the `users` collection. */
export const userService: UserService = {
  async create(userId, data) {
    await setDoc(userDocument(userId), {
      uid: userId,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async getById(userId) {
    return toUserProfile(await getDoc(userDocument(userId)));
  },

  async update(userId, data) {
    if (Object.keys(data).length === 0) {
      throw new Error('User profile update requires at least one field.');
    }

    await updateDoc(userDocument(userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  observe(userId, listener) {
    return onSnapshot(userDocument(userId), (snapshot) => {
      listener(toUserProfile(snapshot));
    });
  },

  async getMembers(): Promise<UserProfile[]> {
    const snapshot = await getDocs(
      query(usersCollection, where('role', '==', 'member')),
    );
    return snapshot.docs.map((item) => toUserProfile(item)!).filter(Boolean);
  },

  async setMemberStatus(memberId, status, adminId) {
    await updateDoc(userDocument(memberId), {
      status,
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  async updateMemberProfile(memberId, data) {
    const updates = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === undefined ? deleteField() : value,
      ]),
    );
    await updateDoc(userDocument(memberId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },
};
