import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

type ToastInput = {
  message: string;
  type?: ToastType;
};

type ToastState = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastClasses: Record<ToastType, string> = {
  success: 'bg-emerald-700',
  error: 'bg-red-700',
  info: 'bg-slate-800',
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const showToast = useCallback(({ message, type = 'info' }: ToastInput) => {
    setToast({ id: Date.now(), message, type });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <View className="absolute left-5 right-5 top-16 z-50">
          <View
            className={`flex-row items-center rounded-2xl px-4 py-3 shadow-lg ${toastClasses[toast.type]}`}
          >
            <Text className="flex-1 text-sm font-medium text-white">
              {toast.message}
            </Text>
            <Pressable
              accessibilityLabel="Dismiss message"
              onPress={() => setToast(null)}
            >
              <Text className="ml-4 text-base font-bold text-white">×</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider.');
  }

  return context;
}
