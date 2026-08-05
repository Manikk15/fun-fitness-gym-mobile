import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { User } from 'firebase/auth';

import type { UserProfile } from '../../../shared/types';
import { authService, userService } from '../../../shared/services';
import type { LoginFormValues, RegisterFormValues } from '../domain/auth.schemas';
import { DEFAULT_GYM_ID } from '../../../shared/constants';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  register: (values: RegisterFormValues) => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = authService.observeAuthState(async (authenticatedUser) => {
      if (!authenticatedUser) {
        if (active) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      if (active) {
        setUser(authenticatedUser);
        setLoading(true);
      }

      try {
        const nextProfile = await userService.getById(authenticatedUser.uid);
        if (active) {
          setProfile(nextProfile);
        }
      } catch {
        if (active) {
          setProfile(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async ({ email, password }: LoginFormValues) => {
    await authService.signInWithEmailAndPassword(email.trim(), password);
  }, []);

  const logout = useCallback(async () => {
    await authService.signOut();
  }, []);

  const register = useCallback(
    async ({ fullName, email, password }: RegisterFormValues) => {
      const credential = await authService.createUserWithEmailAndPassword(
        email.trim(),
        password,
      );
      const profileData = {
        gymId: DEFAULT_GYM_ID,
        name: fullName.trim(),
        email: credential.user.email ?? email.trim(),
        role: 'member' as const,
        status: 'pending' as const,
      };

      try {
        await userService.create(credential.user.uid, profileData);
      } catch (error) {
        await authService.deleteUser(credential.user);
        throw error;
      }

      const profile: UserProfile = {
        uid: credential.user.uid,
        ...profileData,
        createdAt: null,
        updatedAt: null,
      };

      setUser(credential.user);
      setProfile(profile);
      setLoading(false);

      return profile;
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    await authService.sendPasswordResetEmail(email.trim());
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return null;
    }

    setLoading(true);
    try {
      const nextProfile = await userService.getById(user.uid);
      setProfile(nextProfile);
      return nextProfile;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      login,
      logout,
      register,
      resetPassword,
      refreshProfile,
    }),
    [loading, login, logout, profile, refreshProfile, register, resetPassword, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}
