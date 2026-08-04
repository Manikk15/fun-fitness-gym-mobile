import { ActivityIndicator, Pressable, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
};

const variantClasses = {
  primary: 'bg-brand-600',
  secondary: 'border border-brand-600 bg-white',
  ghost: 'bg-transparent',
} as const;

const labelClasses = {
  primary: 'text-white',
  secondary: 'text-brand-700',
  ghost: 'text-brand-700',
} as const;

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      className={`h-14 items-center justify-center rounded-2xl ${variantClasses[variant]} ${
        isDisabled ? 'opacity-60' : ''
      }`}
      disabled={isDisabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#047857'} />
      ) : (
        <Text className={`text-base font-bold ${labelClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
