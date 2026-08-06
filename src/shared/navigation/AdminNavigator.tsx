import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboard } from '../../features/members/presentation/screens/AdminDashboard';
import { MembersListScreen } from '../../features/members/presentation/screens/MembersListScreen';
import { MemberDetailsScreen } from '../../features/members/presentation/screens/MemberDetailsScreen';
import { EditMemberProfileScreen } from '../../features/members/presentation/screens/EditMemberProfileScreen';
import {
  MeasurementFormScreen,
  MeasurementHistoryScreen,
} from '../../features/members/presentation/screens/MeasurementScreens';
import {
  AssignWorkoutScreen,
  AssignedWorkoutDetailsScreen,
} from '../../features/workoutAssignments/presentation/screens/WorkoutAssignmentScreens';
import { AdminProfileScreen } from '../../features/profile/presentation/screens/AdminProfileScreen';
import { TodayAttendanceScreen } from '../../features/attendance';
import {
  ExerciseCategoryFormScreen,
  ExerciseCategoryListScreen,
  ExerciseLibraryFormScreen,
  ExerciseLibraryListScreen,
  MasterDataHomeScreen,
  WorkoutMasterFormScreen,
  WorkoutMasterListScreen,
} from '../../features/masterData/presentation/screens/MasterDataScreens';
import type {
  AdminTabParamList,
  MemberStackParamList,
  MasterDataStackParamList,
} from './admin-types';

const Tabs = createBottomTabNavigator<AdminTabParamList>();
const MemberStack = createNativeStackNavigator<MemberStackParamList>();
const MasterDataStack = createNativeStackNavigator<MasterDataStackParamList>();

function MasterDataNavigator() {
  return (
    <MasterDataStack.Navigator>
      <MasterDataStack.Screen
        name="MasterDataHome"
        component={MasterDataHomeScreen}
        options={{ title: 'Master Data' }}
      />
      <MasterDataStack.Screen
        name="WorkoutMasterList"
        component={WorkoutMasterListScreen}
        options={{ title: 'Workouts' }}
      />
      <MasterDataStack.Screen
        name="WorkoutMasterForm"
        component={WorkoutMasterFormScreen}
        options={{ title: 'Workout' }}
      />
      <MasterDataStack.Screen
        name="ExerciseCategoryList"
        component={ExerciseCategoryListScreen}
        options={{ title: 'Exercise Categories' }}
      />
      <MasterDataStack.Screen
        name="ExerciseCategoryForm"
        component={ExerciseCategoryFormScreen}
        options={{ title: 'Exercise Category' }}
      />
      <MasterDataStack.Screen
        name="ExerciseLibraryList"
        component={ExerciseLibraryListScreen}
        options={{ title: 'Exercises' }}
      />
      <MasterDataStack.Screen
        name="ExerciseLibraryForm"
        component={ExerciseLibraryFormScreen}
        options={{ title: 'Exercise' }}
      />
    </MasterDataStack.Navigator>
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
      <MemberStack.Screen
        name="AssignWorkout"
        component={AssignWorkoutScreen}
        options={{ title: 'Assign Workout' }}
      />
      <MemberStack.Screen
        name="AssignedWorkoutDetails"
        component={AssignedWorkoutDetailsScreen}
        options={{ title: 'Workout' }}
      />
      <MemberStack.Screen
        name="EditMemberProfile"
        component={EditMemberProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <MemberStack.Screen
        name="MeasurementForm"
        component={MeasurementFormScreen}
        options={{ title: 'Measurement' }}
      />
      <MemberStack.Screen
        name="MeasurementHistory"
        component={MeasurementHistoryScreen}
        options={{ title: 'Measurement History' }}
      />
    </MemberStack.Navigator>
  );
}

const icons: Record<keyof AdminTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  MasterData: 'server-outline',
  Members: 'people-outline',
  Attendance: 'calendar-outline',
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
        name="MasterData"
        component={MasterDataNavigator}
        options={{ title: 'Master Data' }}
      />
      <Tabs.Screen name="Members" component={MemberNavigator} />
      <Tabs.Screen name="Attendance" component={TodayAttendanceScreen} />
      <Tabs.Screen name="Profile" component={AdminProfileScreen} />
    </Tabs.Navigator>
  );
}
