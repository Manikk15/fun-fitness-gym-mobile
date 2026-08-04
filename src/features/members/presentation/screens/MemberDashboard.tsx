import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../../auth/context';
import {
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import type { RootStackParamList } from '../../../../shared/navigation';

export function MemberDashboard() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'MemberDashboard'>>();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      showToast({ type: 'error', message: 'Unable to sign out. Please try again.' });
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 px-6 py-8">
        <Text className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          Member area
        </Text>
        <Text className="mt-3 text-3xl font-bold text-slate-900">Your training</Text>
        <View className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
          <Text className="text-lg font-semibold text-slate-900">
            A stronger routine awaits
          </Text>
          <Text className="mt-2 text-base leading-6 text-slate-500">
            Workouts, progress, and profile details will be added in future features.
          </Text>
        </View>
        <View className="mt-auto">
          <PrimaryButton label="Sign Out" variant="ghost" onPress={handleLogout} />
        </View>
      </View>
    </ScreenContainer>
  );
}
