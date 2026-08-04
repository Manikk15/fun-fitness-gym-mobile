import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../context';
import {
  LoadingSpinner,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import { APP_NAME, APP_TAGLINE } from '../../../../shared/constants';
import type { RootStackParamList } from '../../../../shared/navigation';

export function SplashScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Splash'>>();
  const { loading, logout, profile, user } = useAuth();
  const { showToast } = useToast();
  const hasRouted = useRef(false);

  useEffect(() => {
    if (loading || hasRouted.current) {
      return;
    }

    hasRouted.current = true;

    if (!user) {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
      );
      return;
    }

    if (!profile) {
      showToast({
        type: 'error',
        message: 'We could not load your member profile. Please sign in again.',
      });
      void logout();
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
      );
      return;
    }

    const destination =
      profile.status === 'pending'
        ? 'PendingApproval'
        : profile.status === 'active'
          ? profile.role === 'admin'
            ? 'AdminDashboard'
            : 'MemberDashboard'
          : 'AccessRestricted';

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: destination }],
      }),
    );
  }, [loading, logout, navigation, profile, showToast, user]);

  return (
    <ScreenContainer className="bg-ink" contentClassName="justify-between px-6 py-10">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
        <Text className="text-xl font-bold text-white">FF</Text>
      </View>

      <View>
        <Text className="text-4xl font-bold tracking-tight text-white">{APP_NAME}</Text>
        <Text className="mt-3 text-base text-slate-300">{APP_TAGLINE}</Text>
      </View>

      <LoadingSpinner label="Setting up your session" light />
    </ScreenContainer>
  );
}
