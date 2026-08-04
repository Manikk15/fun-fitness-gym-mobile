import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboard } from '../../features/members/presentation/screens/AdminDashboard';
import { MembersListScreen } from '../../features/members/presentation/screens/MembersListScreen';
import { AdminProfileScreen } from '../../features/profile/presentation/screens/AdminProfileScreen';
import { CategoryListScreen } from '../../features/categories/presentation/screens/CategoryListScreen';
import { AddCategoryScreen } from '../../features/categories/presentation/screens/AddCategoryScreen';
import { EditCategoryScreen } from '../../features/categories/presentation/screens/EditCategoryScreen';
import { ExerciseListScreen } from '../../features/exercises/presentation/screens/ExerciseListScreen';
import { AddExerciseScreen } from '../../features/exercises/presentation/screens/AddExerciseScreen';
import { EditExerciseScreen } from '../../features/exercises/presentation/screens/EditExerciseScreen';
import type { AdminTabParamList, ExerciseStackParamList } from './admin-types';

const Tabs = createBottomTabNavigator<AdminTabParamList>();
const ExerciseStack = createNativeStackNavigator<ExerciseStackParamList>();

function ExerciseNavigator() {
  return (
    <ExerciseStack.Navigator>
      <ExerciseStack.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{ title: 'Exercises' }}
      />
      <ExerciseStack.Screen
        name="CategoryList"
        component={CategoryListScreen}
        options={{ title: 'Categories' }}
      />
      <ExerciseStack.Screen
        name="AddCategory"
        component={AddCategoryScreen}
        options={{ title: 'Add Category' }}
      />
      <ExerciseStack.Screen
        name="EditCategory"
        component={EditCategoryScreen}
        options={{ title: 'Edit Category' }}
      />
      <ExerciseStack.Screen
        name="AddExercise"
        component={AddExerciseScreen}
        options={{ title: 'Add Exercise' }}
      />
      <ExerciseStack.Screen
        name="EditExercise"
        component={EditExerciseScreen}
        options={{ title: 'Edit Exercise' }}
      />
    </ExerciseStack.Navigator>
  );
}

const icons: Record<keyof AdminTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Exercises: 'barbell-outline',
  Members: 'people-outline',
  Profile: 'person-outline',
};
export function AdminNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="Home" component={AdminDashboard} />
      <Tabs.Screen
        name="Exercises"
        component={ExerciseNavigator}
        options={{ title: 'Exercises' }}
      />
      <Tabs.Screen name="Members" component={MembersListScreen} />
      <Tabs.Screen name="Profile" component={AdminProfileScreen} />
    </Tabs.Navigator>
  );
}
