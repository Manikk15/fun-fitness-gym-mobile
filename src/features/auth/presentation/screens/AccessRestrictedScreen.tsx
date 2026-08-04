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
export function AccessRestrictedScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'AccessRestricted'>>();
  const { logout, profile } = useAuth();
  const { showToast } = useToast();
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
        <Text className="text-sm font-bold uppercase tracking-widest text-red-600">
          Access restricted
        </Text>
        <Text className="mt-3 text-3xl font-bold text-slate-900">
          Your account is not active
        </Text>
        <Text className="mt-4 text-base leading-6 text-slate-500">
          Your account has been {profile?.status}. Please contact the gym administrator
          if you believe this is an error.
        </Text>
        <View className="mt-8">
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
