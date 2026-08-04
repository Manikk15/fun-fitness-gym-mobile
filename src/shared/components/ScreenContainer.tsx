import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenContainerProps = PropsWithChildren<{
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
}>;

export function ScreenContainer({
  children,
  className = '',
  contentClassName = '',
  scroll = false,
}: ScreenContainerProps) {
  const content = <View className={`flex-1 ${contentClassName}`}>{children}</View>;

  return (
    <SafeAreaView
      className={`flex-1 bg-slate-50 ${className}`}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        className="flex-1"
      >
        {scroll ? (
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
