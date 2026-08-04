import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboard } from '../../features/members/presentation/screens/AdminDashboard';
import { MembersListScreen } from '../../features/members/presentation/screens/MembersListScreen';
import { MemberDetailsScreen } from '../../features/members/presentation/screens/MemberDetailsScreen';
import { AdminProfileScreen } from '../../features/profile/presentation/screens/AdminProfileScreen';
import { CategoryListScreen } from '../../features/categories/presentation/screens/CategoryListScreen';
import { AddCategoryScreen } from '../../features/categories/presentation/screens/AddCategoryScreen';
import { EditCategoryScreen } from '../../features/categories/presentation/screens/EditCategoryScreen';
import { ExerciseListScreen } from '../../features/exercises/presentation/screens/ExerciseListScreen';
import { AddExerciseScreen } from '../../features/exercises/presentation/screens/AddExerciseScreen';
import { EditExerciseScreen } from '../../features/exercises/presentation/screens/EditExerciseScreen';
import { TrainingPlanListScreen } from '../../features/trainingPlans/presentation/screens/TrainingPlanListScreen';
import { CreateTrainingPlanScreen } from '../../features/trainingPlans/presentation/screens/CreateTrainingPlanScreen';
import { WorkoutDayListScreen } from '../../features/trainingPlans/presentation/screens/WorkoutDayListScreen';
import { WorkoutExerciseListScreen } from '../../features/trainingPlans/presentation/screens/WorkoutExerciseListScreen';
import { TrainingPlanDetailsScreen } from '../../features/trainingPlans/presentation/screens/TrainingPlanDetailsScreen';
import type {
  AdminTabParamList,
  ExerciseStackParamList,
  TrainingPlanStackParamList,
  MemberStackParamList,
} from './admin-types';

const Tabs = createBottomTabNavigator<AdminTabParamList>();
const ExerciseStack = createNativeStackNavigator<ExerciseStackParamList>();
const TrainingPlanStack = createNativeStackNavigator<TrainingPlanStackParamList>();
const MemberStack = createNativeStackNavigator<MemberStackParamList>();

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

function TrainingPlanNavigator() {
  return (
    <TrainingPlanStack.Navigator>
      <TrainingPlanStack.Screen
        name="TrainingPlanList"
        component={TrainingPlanListScreen}
        options={{ title: 'Training Plans' }}
      />
      <TrainingPlanStack.Screen
        name="CreateTrainingPlan"
        component={CreateTrainingPlanScreen}
        options={{ title: 'Add Training Plan' }}
      />
      <TrainingPlanStack.Screen
        name="TrainingPlanDetails"
        component={TrainingPlanDetailsScreen}
        options={{ title: 'Plan Details' }}
      />
      <TrainingPlanStack.Screen
        name="WorkoutDayList"
        component={WorkoutDayListScreen}
        options={{ title: 'Workout Days' }}
      />
      <TrainingPlanStack.Screen
        name="WorkoutExerciseList"
        component={WorkoutExerciseListScreen}
        options={{ title: 'Exercises' }}
      />
    </TrainingPlanStack.Navigator>
  );
}

function MemberNavigator() {
  return (
    <MemberStack.Navigator>
      <MemberStack.Screen
        name="MemberList"
        component={MembersListScreen}
        options={{ title: 'Members' }}
      />
      <MemberStack.Screen
        name="MemberDetails"
        component={MemberDetailsScreen}
        options={{ title: 'Member Details' }}
      />
    </MemberStack.Navigator>
  );
}

const icons: Record<keyof AdminTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Exercises: 'barbell-outline',
  Plans: 'clipboard-outline',
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
      <Tabs.Screen name="Plans" component={TrainingPlanNavigator} />
      <Tabs.Screen name="Members" component={MemberNavigator} />
      <Tabs.Screen name="Profile" component={AdminProfileScreen} />
    </Tabs.Navigator>
  );
}
