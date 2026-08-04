import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Pressable, Text, TextInput as NativeTextInput, View } from 'react-native';

type PasswordInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function PasswordInput({ label, error, ...inputProps }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-slate-700">{label}</Text>
      <View
        className={`h-14 flex-row items-center rounded-2xl border bg-white pr-3 ${
          error ? 'border-red-500' : 'border-slate-200'
        }`}
      >
        <NativeTextInput
          className="h-full flex-1 px-4 text-base text-slate-900"
          placeholderTextColor="#94A3B8"
          secureTextEntry={!isVisible}
          {...inputProps}
        />
        <Pressable
          accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          className="px-2 py-2"
          onPress={() => setIsVisible((visible) => !visible)}
        >
          <Text className="text-sm font-semibold text-brand-700">
            {isVisible ? 'Hide' : 'Show'}
          </Text>
        </Pressable>
      </View>
      {error ? <Text className="mt-1.5 text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
