import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import type { MemberStackParamList } from '../../../../shared/navigation';
import { userService } from '../../../../shared/services';
import type {
  MemberMeasurement,
  MemberWorkout,
  UserProfile,
} from '../../../../shared/types';
import { DEFAULT_GYM_ID } from '../../../../shared/constants';
import { useAuth } from '../../../auth/context';
import {
  exerciseLibraryService,
  workoutMasterService,
} from '../../../masterData/services';
import { workoutAssignmentService } from '../../../workoutAssignments/services';
import { memberMeasurementService } from '../../services';

export function MemberDetailsScreen() {
  const { params } = useRoute<RouteProp<MemberStackParamList, 'MemberDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MemberStackParamList>>();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [member, setMember] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<MemberWorkout[]>([]);
  const [hasWorkouts, setHasWorkouts] = useState(false);
  const [hasExercises, setHasExercises] = useState(false);
  const [workoutDataError, setWorkoutDataError] = useState(false);
  const [measurements, setMeasurements] = useState<MemberMeasurement[]>([]);
  const [measurementError, setMeasurementError] = useState(false);
  const gymId = profile?.gymId || DEFAULT_GYM_ID;

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      setWorkoutDataError(false);
      setMeasurementError(false);
      try {
        const memberProfile = await userService.getById(params.memberId);
        if (!memberProfile) throw new Error('member/not-found');
        setMember(memberProfile);
        const [assigned, activeWorkouts, activeExercises, measurementHistory] =
          await Promise.allSettled([
            workoutAssignmentService.listForMember(gymId, params.memberId),
            workoutMasterService.hasActive(gymId),
            exerciseLibraryService.hasActive(gymId),
            memberMeasurementService.list(gymId, params.memberId),
          ]);
        const failures = [assigned, activeWorkouts, activeExercises].filter(
          (result) => result.status === 'rejected',
        );
        if (failures.length) {
          failures.forEach((failure) => {
            if (failure.status === 'rejected')
              console.error('Member workout data load failed:', failure.reason);
          });
          setWorkoutDataError(true);
          showToast({
            type: 'error',
            message: 'Member loaded, but Workout data is temporarily unavailable.',
          });
        }
        setHistory(assigned.status === 'fulfilled' ? assigned.value : []);
        setHasWorkouts(
          activeWorkouts.status === 'fulfilled' ? activeWorkouts.value : false,
        );
        setHasExercises(
          activeExercises.status === 'fulfilled' ? activeExercises.value : false,
        );
        setMeasurements(
          measurementHistory.status === 'fulfilled' ? measurementHistory.value : [],
        );
        if (measurementHistory.status === 'rejected') {
          console.error('Measurement history load failed:', measurementHistory.reason);
          setMeasurementError(true);
        }
      } catch (loadError) {
        console.error('Member profile load failed:', loadError);
        setError(true);
        showToast({ type: 'error', message: 'Unable to load member details.' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [gymId, params.memberId, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading member..." />
      </ScreenContainer>
    );
  if (error || !member)
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-5 px-6">
          <Text className="text-xl font-bold text-slate-900">
            Unable to load member
          </Text>
          <View className="w-full">
            <PrimaryButton label="Retry" onPress={() => void load()} />
          </View>
        </View>
      </ScreenContainer>
    );

  const sameGym = (member.gymId || DEFAULT_GYM_ID) === gymId;
  const assignmentUnavailable = workoutDataError
    ? 'Workout data is unavailable. Pull down to retry.'
    : member.status !== 'active'
      ? 'Workout assignment is available only for active members.'
      : !sameGym
        ? 'This member belongs to another gym.'
        : !hasWorkouts
          ? 'Create and activate at least one Workout first.'
          : !hasExercises
            ? 'Create and activate at least one Exercise first.'
            : null;
  const latest = history[0];
  const latestMeasurement = measurements[0];
  const dateLabel = (item: MemberWorkout) =>
    item.workoutDate?.toDate().toLocaleDateString() ?? 'Unknown date';
  const statusLabel = (item: MemberWorkout) =>
    item.status === 'assigned'
      ? 'Assigned'
      : item.status === 'completed'
        ? 'Completed'
        : 'Cancelled';
  const completionLabel = (item: MemberWorkout) =>
    item.status === 'completed'
      ? ` · ${item.completedExerciseCount ?? 0} of ${item.exerciseCount} completed${item.completedAt ? ` · ${item.completedAt.toDate().toLocaleString()}` : ''}`
      : '';

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">{member.name}</Text>
          <Text className="mt-2 text-slate-500">{member.email}</Text>
          <View className="mt-6 rounded-2xl bg-white p-5">
            <Text className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Account status
            </Text>
            <Text className="mt-2 text-lg font-bold capitalize text-slate-900">
              {member.status}
            </Text>
            {[
              ['Phone', member.phone],
              ['Age', member.age],
              ['Height', member.heightCm ? `${member.heightCm} cm` : undefined],
              [
                'Weight',
                member.currentWeightKg ? `${member.currentWeightKg} kg` : undefined,
              ],
              ['Goal', member.goal],
              ['Joining Date', member.joiningDate?.toDate().toLocaleDateString()],
              [
                'Emergency Contact',
                member.emergencyContactName
                  ? `${member.emergencyContactName}${member.emergencyContactPhone ? ` · ${member.emergencyContactPhone}` : ''}`
                  : member.emergencyContactPhone,
              ],
            ].map(([label, value]) =>
              value ? (
                <Text key={String(label)} className="mt-2 text-slate-600">
                  {label}: {value}
                </Text>
              ) : null,
            )}
          </View>
          <View className="mt-4">
            <PrimaryButton
              label="Edit Profile"
              variant="secondary"
              onPress={() =>
                navigation.navigate('EditMemberProfile', { memberId: member.uid })
              }
            />
          </View>
          <View className="mt-4">
            <PrimaryButton
              label="Add Measurement"
              variant="secondary"
              onPress={() =>
                navigation.navigate('MeasurementForm', { memberId: member.uid })
              }
            />
          </View>
          <View className="mt-6 rounded-2xl bg-white p-5">
            <Text className="text-xl font-bold text-slate-900">Latest Measurement</Text>
            {measurementError ? (
              <Text className="mt-2 text-amber-700">
                Measurements are temporarily unavailable.
              </Text>
            ) : latestMeasurement ? (
              <>
                <Text className="mt-2 text-slate-500">
                  {latestMeasurement.measuredAt.toDate().toLocaleDateString()}
                </Text>
                {[
                  ['Weight', latestMeasurement.weightKg, 'kg'],
                  ['Chest', latestMeasurement.chestCm, 'cm'],
                  ['Waist', latestMeasurement.waistCm, 'cm'],
                  ['Arms', latestMeasurement.armsCm, 'cm'],
                ]
                  .filter(([, value]) => value !== undefined)
                  .map(([label, value, unit]) => (
                    <Text key={String(label)} className="mt-1 text-slate-600">
                      {label}: {value} {unit}
                    </Text>
                  ))}
              </>
            ) : (
              <Text className="mt-2 text-slate-500">No measurements yet.</Text>
            )}
            <View className="mt-4">
              <PrimaryButton
                label="View Measurement History"
                variant="ghost"
                onPress={() =>
                  navigation.navigate('MeasurementHistory', { memberId: member.uid })
                }
              />
            </View>
          </View>
          <View className="mt-5">
            <PrimaryButton
              label="Assign Workout"
              disabled={Boolean(assignmentUnavailable)}
              onPress={() =>
                navigation.navigate('AssignWorkout', { memberId: member.uid })
              }
            />
            {assignmentUnavailable ? (
              <Text className="mt-2 text-center text-sm text-amber-700">
                {assignmentUnavailable}
              </Text>
            ) : null}
          </View>
          {latest ? (
            <View className="mt-6 rounded-2xl bg-brand-50 p-5">
              <Text className="text-sm font-semibold text-brand-700">
                Latest Workout
              </Text>
              <Text className="mt-2 text-xl font-bold text-slate-900">
                {latest.workoutNameSnapshot}
              </Text>
              <Text className="mt-1 text-slate-600">
                {latest.exerciseCount} exercises · {dateLabel(latest)} ·{' '}
                {statusLabel(latest)}
                {completionLabel(latest)}
              </Text>
              <View className="mt-3">
                <PrimaryButton
                  label="View Workout"
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate('AssignedWorkoutDetails', {
                      memberWorkoutId: latest.id,
                      workoutName: latest.workoutNameSnapshot,
                    })
                  }
                />
              </View>
            </View>
          ) : null}
          <Text className="mt-8 text-2xl font-bold text-slate-900">
            Workout History
          </Text>
          <View className="mt-4 gap-3">
            {workoutDataError ? (
              <View className="rounded-2xl bg-amber-50 p-4">
                <Text className="text-amber-800">
                  Workout History is temporarily unavailable. Pull down to retry.
                </Text>
              </View>
            ) : null}
            {history.map((item) => (
              <Pressable
                key={item.id}
                className="rounded-2xl bg-white p-4"
                onPress={() =>
                  navigation.navigate('AssignedWorkoutDetails', {
                    memberWorkoutId: item.id,
                    workoutName: item.workoutNameSnapshot,
                  })
                }
              >
                <Text className="text-lg font-bold text-slate-900">
                  {item.workoutNameSnapshot}
                </Text>
                <Text className="mt-1 text-slate-500">
                  {dateLabel(item)} · {item.exerciseCount} exercises ·{' '}
                  {statusLabel(item)}
                  {completionLabel(item)}
                </Text>
              </Pressable>
            ))}
            {!history.length && !workoutDataError ? (
              <Text className="text-center text-slate-500">
                No Workouts assigned yet.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
