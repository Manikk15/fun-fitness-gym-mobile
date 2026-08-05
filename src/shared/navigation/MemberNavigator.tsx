import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MemberDashboard } from '../../features/members/presentation/screens/MemberDashboard';
import { MemberProfileScreen } from '../../features/members/presentation/screens/MemberProfileScreen';
import type { MemberTabParamList } from './types';

const Tabs = createBottomTabNavigator<MemberTabParamList>();
const icons: Record<keyof MemberTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Profile: 'person-outline',
};

export function MemberNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="Home" component={MemberDashboard} />
      <Tabs.Screen name="Profile" component={MemberProfileScreen} />
    </Tabs.Navigator>
  );
}
