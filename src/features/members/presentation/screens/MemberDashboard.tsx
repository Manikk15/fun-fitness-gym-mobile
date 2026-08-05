import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
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

export function MemberDashboard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, profile, logout } = useAuth();
  const { showToast } = useToast();
  const [workout, setWorkout] = useState<MemberWorkout | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

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
        const today = await workoutAssignmentService.getTodayForMember(memberId);
        setWorkout(today);
        if (today) {
          const exercises = await workoutAssignmentService.listExercisesForMember(
            memberId,
            today.id,
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

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="flex-1 px-6 py-8">
          <Text className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Member area
          </Text>
          <Text className="mt-3 text-3xl font-bold text-slate-900">
            Today&apos;s Workout
          </Text>
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
                  onPress={() =>
                    navigation.navigate('MemberWorkoutDetails', {
                      memberWorkoutId: workout.id,
                      workoutName: workout.workoutNameSnapshot,
                    })
                  }
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
