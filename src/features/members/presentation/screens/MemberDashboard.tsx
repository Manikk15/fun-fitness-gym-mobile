import { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import type { RootStackParamList } from '../../../../shared/navigation';
import type { MemberWorkout } from '../../../../shared/types';
import { useAuth } from '../../../auth/context';
import { workoutAssignmentService } from '../../../workoutAssignments/services';
import { attendanceService } from '../../../attendance';
import { attendanceDate } from '../../../../shared/types';
import { DEFAULT_GYM_ID } from '../../../../shared/constants';

export function MemberDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, profile, logout } = useAuth();
  const { showToast } = useToast();
  const [workout, setWorkout] = useState<MemberWorkout | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [attendancePresent, setAttendancePresent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (!user || !profile) return;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      const memberId = profile.uid;
      if (__DEV__)
        console.log('[member-workout] identity', {
          authenticatedUid: user.uid,
          resolvedMemberDocumentId: profile.uid,
          queryMemberId: memberId,
          idsMatch: user.uid === profile.uid,
        });
      try {
        if (memberId !== user.uid) throw new Error('member/id-mismatch');
        try {
          const attendance = await attendanceService.getForMemberDate(
            memberId,
            attendanceDate(),
          );
          setAttendancePresent(attendance?.status === 'present');
        } catch (attendanceError) {
          console.error('Today attendance load failed:', attendanceError);
          setAttendancePresent(false);
        }
        const today = await workoutAssignmentService.getTodayForMember(memberId);
        setWorkout(today);
        if (today) {
          const exercises = await workoutAssignmentService.listExercisesForMember(
            memberId,
            today.id,
            false,
          );
          setCompletedCount(exercises.filter((item) => item.isCompleted).length);
        } else setCompletedCount(0);
      } catch (loadError) {
        console.error('Today workout load failed:', loadError);
        setError(true);
        showToast({ type: 'error', message: "Unable to load today's Workout." });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profile, showToast, user],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      showToast({ type: 'error', message: 'Unable to sign out. Please try again.' });
    }
  };

  const openWorkout = async () => {
    if (!workout || !user || !profile || startingWorkout) return;
    if (workout.status === 'assigned' && !attendancePresent) {
      setStartingWorkout(true);
      try {
        await attendanceService.markPresent({
          gymId: profile.gymId || DEFAULT_GYM_ID,
          memberId: user.uid,
          date: attendanceDate(),
        });
        setAttendancePresent(true);
      } catch (attendanceError) {
        console.error('Automatic attendance failed:', attendanceError);
        showToast({
          type: 'error',
          message: 'Workout opened, but Attendance could not be marked.',
        });
      } finally {
        setStartingWorkout(false);
      }
    }
    navigation.navigate('MemberWorkoutDetails', {
      memberWorkoutId: workout.id,
      workoutName: workout.workoutNameSnapshot,
    });
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="flex-1 px-6 py-8">
          <View className="flex-row items-center gap-3">
            <Image
              accessibilityLabel="Fun Fitness Gym logo"
              className="h-12 w-12 rounded-2xl"
              resizeMode="contain"
              source={require('../../../../../assets/fun-fitness-logo-full.png')}
            />
            <View>
              <Text className="text-base font-bold text-slate-900">
                Fun Fitness Gym
              </Text>
              <Text className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Member area
              </Text>
            </View>
          </View>
          <Text className="mt-3 text-3xl font-bold text-slate-900">
            Today&apos;s Workout
          </Text>
          <View className="mt-6 rounded-2xl bg-white p-4">
            <Text className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Attendance
            </Text>
            <Text
              className={`mt-2 text-xl font-bold ${attendancePresent ? 'text-green-700' : 'text-slate-500'}`}
            >
              {attendancePresent ? 'Present' : 'Not Marked'}
            </Text>
          </View>
          {loading ? (
            <View className="py-16">
              <LoadingSpinner label="Loading Workout..." />
            </View>
          ) : error ? (
            <View className="mt-8 gap-4 rounded-3xl bg-white p-6">
              <Text className="text-center text-slate-600">
                Unable to load today&apos;s Workout.
              </Text>
              <PrimaryButton
                label="Retry"
                variant="secondary"
                onPress={() => void load()}
              />
            </View>
          ) : workout ? (
            <View className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
              <Text className="text-2xl font-bold text-slate-900">
                {workout.workoutNameSnapshot}
              </Text>
              <Text className="mt-2 text-slate-500">
                {workout.status === 'completed'
                  ? 'Completed'
                  : `${completedCount} of ${workout.exerciseCount} completed`}
              </Text>
              <View className="mt-5">
                <PrimaryButton
                  label={
                    workout.status === 'completed' ? 'View Workout' : 'Continue Workout'
                  }
                  loading={startingWorkout}
                  onPress={() => void openWorkout()}
                />
              </View>
            </View>
          ) : (
            <View className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
              <Text className="text-center text-base text-slate-500">
                No workout assigned for today.
              </Text>
            </View>
          )}
          <View className="mt-auto pt-8">
            <PrimaryButton label="Sign Out" variant="ghost" onPress={handleLogout} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
