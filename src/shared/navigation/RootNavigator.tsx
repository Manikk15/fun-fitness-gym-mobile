import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminNavigator } from './AdminNavigator';
import { MemberDashboard } from '../../features/members/presentation/screens/MemberDashboard';
import { LoginScreen } from '../../features/auth/presentation/screens/LoginScreen';
import { ForgotPasswordScreen } from '../../features/auth/presentation/screens/ForgotPasswordScreen';
import { RegisterScreen } from '../../features/auth/presentation/screens/RegisterScreen';
import { SplashScreen } from '../../features/auth/presentation/screens/SplashScreen';
import { PendingApprovalScreen } from '../../features/auth/presentation/screens/PendingApprovalScreen';
import { AccessRestrictedScreen } from '../../features/auth/presentation/screens/AccessRestrictedScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        <Stack.Screen name="AccessRestricted" component={AccessRestrictedScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminNavigator} />
        <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
