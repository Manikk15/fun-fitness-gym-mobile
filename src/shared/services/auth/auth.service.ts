import {
  createUserWithEmailAndPassword as createFirebaseUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
  type User,
  type UserCredential,
} from 'firebase/auth';

import { auth } from '../firebase';

export type AuthStateListener = (user: User | null) => void;

export interface AuthService {
  signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential>;
  createUserWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<UserCredential>;
  deleteUser(user: User): Promise<void>;
  signOut(): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<void>;
  observeAuthState(listener: AuthStateListener): Unsubscribe;
}

/**
 * Thin Firebase Auth adapter. Form validation and application-specific
 * authorization remain in the feature/domain layers.
 */
export const authService: AuthService = {
  signInWithEmailAndPassword: (email, password) =>
    signInWithEmailAndPassword(auth, email, password),
  createUserWithEmailAndPassword: async (email, password) => {
    try {
      return await createFirebaseUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Firebase registration error:', error);
      throw error;
    }
  },
  deleteUser: (user) => deleteUser(user),
  signOut: () => signOut(auth),
  sendPasswordResetEmail: (email) => sendPasswordResetEmail(auth, email),
  observeAuthState: (listener) => onAuthStateChanged(auth, listener),
};
