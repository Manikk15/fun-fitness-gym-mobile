import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../../auth/context';
import {
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import type { MemberTabParamList } from '../../../../shared/navigation';

export function MemberProfileScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<MemberTabParamList, 'Profile'>>();
  const { profile, logout } = useAuth();
  const { showToast } = useToast();

  const signOut = async () => {
    try {
      await logout();
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      showToast({ type: 'error', message: 'Unable to sign out. Please try again.' });
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">Profile</Text>
        <View className="mt-7 rounded-3xl bg-white p-6">
          <Text className="text-xl font-bold text-slate-900">{profile?.name}</Text>
          <Text className="mt-2 text-slate-500">{profile?.email}</Text>
          <Text className="mt-3 self-start rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold capitalize text-emerald-800">
            {profile?.status} member
          </Text>
        </View>
        <View className="mt-auto">
          <PrimaryButton
            label="Sign Out"
            variant="ghost"
            onPress={() => void signOut()}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
