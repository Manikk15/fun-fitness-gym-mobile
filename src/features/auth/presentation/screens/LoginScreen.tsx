import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context';
import { loginSchema, type LoginFormValues } from '../../domain/auth.schemas';
import { getFriendlyFirebaseError } from '../../utils/firebase-error';
import {
  PasswordInput,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { RootStackParamList } from '../../../../shared/navigation';

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Login'>>();
  const { login } = useAuth();
  const { showToast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      navigation.replace('Splash');
    } catch (error) {
      showToast({ type: 'error', message: getFriendlyFirebaseError(error) });
    }
  };

  return (
    <ScreenContainer scroll contentClassName="justify-center px-6 py-10">
      <View className="mb-10">
        <Image
          accessibilityLabel="Fun Fitness Gym logo"
          className="mb-6 h-40 w-full"
          resizeMode="contain"
          source={require('../../../../../assets/fun-fitness-logo-full.png')}
        />
        <Text className="text-sm font-bold uppercase tracking-widest text-brand-600">
          Fun Fitness Gym
        </Text>
        <Text className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Welcome back
        </Text>
        <Text className="mt-3 text-base leading-6 text-slate-500">
          Sign in to continue building your strongest routine.
        </Text>
      </View>

      <View className="gap-5">
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
              autoComplete="password"
              label="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter your password"
              value={value}
              error={errors.password?.message}
            />
          )}
        />
      </View>

      <View className="mt-4 items-end">
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text className="text-sm font-semibold text-brand-700">Forgot password?</Text>
        </Pressable>
      </View>

      <View className="mt-8 gap-4">
        <PrimaryButton
          label="Login"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
        <PrimaryButton
          label="Create Account"
          variant="secondary"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </ScreenContainer>
  );
}
