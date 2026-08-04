import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context';
import { registerSchema, type RegisterFormValues } from '../../domain/auth.schemas';
import {
  getFirebaseErrorCode,
  getFriendlyFirebaseError,
} from '../../utils/firebase-error';
import {
  PasswordInput,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { RootStackParamList } from '../../../../shared/navigation';

export function RegisterScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Register'>>();
  const { register } = useAuth();
  const { showToast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register(values);
      navigation.reset({ index: 0, routes: [{ name: 'PendingApproval' }] });
      showToast({
        type: 'success',
        message: 'Your account has been submitted for approval.',
      });
    } catch (error) {
      console.error('Firebase registration error:', error);

      const code = getFirebaseErrorCode(error);
      const message =
        __DEV__ && code
          ? `Registration failed: ${code}`
          : getFriendlyFirebaseError(error);

      showToast({ type: 'error', message });
    }
  };

  return (
    <ScreenContainer scroll contentClassName="px-6 py-10">
      <View className="mb-8">
        <Text className="text-sm font-bold uppercase tracking-widest text-brand-600">
          Join the community
        </Text>
        <Text className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Create account
        </Text>
        <Text className="mt-3 text-base leading-6 text-slate-500">
          Start with a profile built around your goals.
        </Text>
      </View>

      <View className="gap-5">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              autoCapitalize="words"
              autoComplete="name"
              label="Full name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Your full name"
              value={value}
              error={errors.fullName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email address"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="you@example.com"
              value={value}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <PasswordInput
              autoComplete="new-password"
              label="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="At least 8 characters"
              value={value}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <PasswordInput
              autoComplete="new-password"
              label="Confirm password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Repeat your password"
              value={value}
              error={errors.confirmPassword?.message}
            />
          )}
        />
      </View>

      <View className="mt-8 gap-4">
        <PrimaryButton
          label="Create Account"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
        <PrimaryButton
          label="Back to Login"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </View>
    </ScreenContainer>
  );
}
