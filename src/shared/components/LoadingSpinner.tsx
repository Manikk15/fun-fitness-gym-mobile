import { ActivityIndicator, Text, View } from 'react-native';

type LoadingSpinnerProps = {
  label?: string;
  light?: boolean;
};

export function LoadingSpinner({ label, light = false }: LoadingSpinnerProps) {
  const textClassName = light ? 'text-slate-300' : 'text-slate-500';

  return (
    <View className="items-center justify-center gap-4">
      <ActivityIndicator color={light ? '#FFFFFF' : '#059669'} size="large" />
      {label ? <Text className={`text-sm ${textClassName}`}>{label}</Text> : null}
    </View>
  );
}
