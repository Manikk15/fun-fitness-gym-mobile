import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../context';
import {
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import type { RootStackParamList } from '../../../../shared/navigation';

export function PendingApprovalScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'PendingApproval'>>();
  const { logout, refreshProfile, user } = useAuth();
  const { showToast } = useToast();
  const refresh = async () => {
    try {
      const profile = await refreshProfile();
      if (profile?.status === 'active')
        navigation.reset({
          index: 0,
          routes: [
            { name: profile.role === 'admin' ? 'AdminDashboard' : 'MemberDashboard' },
          ],
        });
      else if (profile?.status === 'rejected' || profile?.status === 'inactive')
        navigation.reset({ index: 0, routes: [{ name: 'AccessRestricted' }] });
      else
        showToast({
          type: 'info',
          message: 'Your account is still awaiting approval.',
        });
    } catch {
      showToast({ type: 'error', message: 'Unable to refresh your approval status.' });
    }
  };
  const signOut = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      showToast({ type: 'error', message: 'Unable to sign out. Please try again.' });
    }
  };
  return (
    <ScreenContainer>
      <View className="flex-1 justify-center px-6">
        <Text className="text-sm font-bold uppercase tracking-widest text-brand-600">
          Account pending approval
        </Text>
        <Text className="mt-3 text-3xl font-bold text-slate-900">
          We’re reviewing your account
        </Text>
        <Text className="mt-4 text-base leading-6 text-slate-500">
          The gym administrator must approve your account before you can access your
          member dashboard.
        </Text>
        <View className="mt-7 rounded-2xl bg-white p-5">
          <Text className="text-sm text-slate-500">Logged in as</Text>
          <Text className="mt-1 font-semibold text-slate-900">{user?.email}</Text>
        </View>
        <View className="mt-8 gap-3">
          <PrimaryButton label="Refresh Status" onPress={() => void refresh()} />
          <PrimaryButton
            label="Logout"
            variant="ghost"
            onPress={() => void signOut()}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
