import { useEffect, useRef } from 'react';
import { Image, Text, View } from 'react-native';
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
    <ScreenContainer contentClassName="items-center px-6 py-10">
      <View className="flex-1 items-center justify-center">
        <Image
          accessibilityLabel="Fun Fitness Gym logo"
          className="h-64 w-64"
          resizeMode="contain"
          source={require('../../../../../assets/fun-fitness-logo-full.png')}
        />
        <Text className="mt-6 text-center text-4xl font-bold tracking-tight text-slate-900">
          {APP_NAME}
        </Text>
        <Text className="mt-3 text-center text-base text-slate-500">{APP_TAGLINE}</Text>
      </View>

      <LoadingSpinner label="Setting up your session" />
    </ScreenContainer>
  );
}
