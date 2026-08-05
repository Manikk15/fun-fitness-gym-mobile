import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import type { RootStackParamList } from '../../../../shared/navigation';
import type { MemberWorkout, MemberWorkoutExercise } from '../../../../shared/types';
import { useAuth } from '../../../auth/context';
import { workoutAssignmentService } from '../../../workoutAssignments/services';

function lines(item: MemberWorkoutExercise): string[] {
  const result: string[] = [];
  if (item.sets && item.reps) result.push(`${item.sets} sets × ${item.reps} reps`);
  else if (item.sets) result.push(`${item.sets} sets`);
  else if (item.reps) result.push(`${item.reps} reps`);
  if (item.weightKg) result.push(`${item.weightKg} kg`);
  if (item.durationValue)
    result.push(`${item.durationValue} ${item.durationUnit ?? 'seconds'}`);
  if (item.distanceValue)
    result.push(`${item.distanceValue} ${item.distanceUnit ?? 'metres'}`);
  if (item.rounds) result.push(`${item.rounds} rounds`);
  return result;
}

export function MemberWorkoutDetailsScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'MemberWorkoutDetails'>>();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [workout, setWorkout] = useState<MemberWorkout | null>(null);
  const [items, setItems] = useState<MemberWorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [finishing, setFinishing] = useState(false);

  const load = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(false);
    try {
      if (profile.uid !== user.uid) throw new Error('member/id-mismatch');
      const [parent, exercises] = await Promise.all([
        workoutAssignmentService.getForMember(params.memberWorkoutId, profile.uid),
        workoutAssignmentService.listExercisesForMember(
          profile.uid,
          params.memberWorkoutId,
        ),
      ]);
      if (!parent) throw new Error('member-workout/not-found');
      setWorkout(parent);
      setItems(exercises);
    } catch (loadError) {
      console.error('Member assigned exercise load failed:', loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [params.memberWorkoutId, profile, user]);

  const toggle = async (item: MemberWorkoutExercise) => {
    if (workout?.status !== 'assigned' || savingIds.includes(item.id)) return;
    const next = !item.isCompleted;
    setSavingIds((current) => [...current, item.id]);
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, isCompleted: next } : entry,
      ),
    );
    try {
      await workoutAssignmentService.setExerciseCompleted(item.id, next);
    } catch (saveError) {
      console.error('Exercise completion save failed:', saveError);
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, isCompleted: item.isCompleted } : entry,
        ),
      );
      showToast({ type: 'error', message: 'Unable to update Exercise.' });
    } finally {
      setSavingIds((current) => current.filter((id) => id !== item.id));
    }
  };

  const finish = () => {
    if (!workout || finishing) return;
    const completedCount = items.filter((item) => item.isCompleted).length;
    const allCompleted = completedCount === items.length;
    Alert.alert(
      allCompleted
        ? 'Finish this workout?'
        : 'Some exercises are not completed. Finish anyway?',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish Workout',
          onPress: async () => {
            setFinishing(true);
            try {
              await workoutAssignmentService.finish(workout.id, completedCount);
              showToast({ type: 'success', message: 'Workout completed' });
              await load();
            } catch (finishError) {
              console.error('Finish workout failed:', finishError);
              showToast({ type: 'error', message: 'Unable to finish Workout.' });
            } finally {
              setFinishing(false);
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading Exercises..." />
      </ScreenContainer>
    );
  if (error)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <View className="w-full gap-4 px-6">
          <Text className="text-center text-lg font-bold text-slate-900">
            Unable to load Exercises
          </Text>
          <PrimaryButton label="Retry" onPress={() => void load()} />
        </View>
      </ScreenContainer>
    );

  return (
    <ScreenContainer>
      <ScrollView>
        <View className="gap-3 px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">
            {params.workoutName}
          </Text>
          {workout?.status === 'completed' ? (
            <View className="rounded-2xl bg-green-100 p-4">
              <Text className="font-bold text-green-800">Completed</Text>
              {workout.completedAt ? (
                <Text className="mt-1 text-green-700">
                  {workout.completedAt.toDate().toLocaleString()}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text className="text-slate-600">
              {items.filter((item) => item.isCompleted).length} of {items.length}{' '}
              exercises completed
            </Text>
          )}
          {items.map((item) => (
            <Pressable
              key={item.id}
              className="flex-row rounded-2xl bg-white p-4"
              disabled={workout?.status !== 'assigned' || savingIds.includes(item.id)}
              onPress={() => void toggle(item)}
            >
              <Ionicons
                name={item.isCompleted ? 'checkbox' : 'square-outline'}
                size={26}
                color={item.isCompleted ? '#059669' : '#64748B'}
              />
              <View className="ml-3 flex-1">
                <Text
                  className={`text-lg font-bold ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                >
                  {item.order}. {item.exerciseNameSnapshot}
                </Text>
                {lines(item).map((line) => (
                  <Text key={line} className="mt-1 text-slate-600">
                    {line}
                  </Text>
                ))}
                {item.notes ? (
                  <Text className="mt-2 text-slate-500">Notes: {item.notes}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
          {!items.length ? (
            <Text className="text-slate-500">No Exercises found.</Text>
          ) : null}
          {workout?.status === 'assigned' && items.length ? (
            <PrimaryButton
              label="Finish Workout"
              loading={finishing}
              disabled={savingIds.length > 0}
              onPress={finish}
            />
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
