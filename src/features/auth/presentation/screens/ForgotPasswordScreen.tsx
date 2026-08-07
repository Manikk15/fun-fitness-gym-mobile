import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../../domain/auth.schemas';
import { getFriendlyFirebaseError } from '../../utils/firebase-error';
import {
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { RootStackParamList } from '../../../../shared/navigation';

export function ForgotPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>>();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
    try {
      await resetPassword(email);
      showToast({
        type: 'success',
        message: 'Password reset email sent. Check your inbox.',
      });
      navigation.goBack();
    } catch (error) {
      showToast({ type: 'error', message: getFriendlyFirebaseError(error) });
    }
  };

  return (
    <ScreenContainer scroll contentClassName="justify-center px-6 py-10">
      <View className="mb-10">
        <Text className="text-sm font-bold uppercase tracking-widest text-brand-600">
          Account recovery
        </Text>
        <Text className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Reset password
        </Text>
        <Text className="mt-3 text-base leading-6 text-slate-500">
          Enter your email and we’ll send instructions to reset your password.
        </Text>
      </View>

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

      <View className="mt-8 gap-4">
        <PrimaryButton
          label="Send Reset Email"
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
