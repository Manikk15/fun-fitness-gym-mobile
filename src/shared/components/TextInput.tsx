import type { TextInputProps } from 'react-native';
import { Text, TextInput as NativeTextInput, View } from 'react-native';

type AppTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextInput({
  label,
  error,
  multiline,
  ...inputProps
}: AppTextInputProps) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-slate-700">{label}</Text>
      <NativeTextInput
        className={`${multiline ? 'min-h-28 py-4' : 'h-14'} rounded-2xl border bg-white px-4 text-base text-slate-900 ${
          error ? 'border-red-500' : 'border-slate-200'
        }`}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...inputProps}
      />
      {error ? <Text className="mt-1.5 text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
