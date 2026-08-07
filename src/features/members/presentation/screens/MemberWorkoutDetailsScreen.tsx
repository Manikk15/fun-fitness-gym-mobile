import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { RootStackParamList } from '../../../../shared/navigation';
import type { MemberWorkout, MemberWorkoutExercise } from '../../../../shared/types';
import { useAuth } from '../../../auth/context';
import { workoutAssignmentService } from '../../../workoutAssignments/services';

type ActualValues = Record<string, { reps: string; weightKg: string }>;
const setKey = (exerciseId: string, setNumber: number) => `${exerciseId}-${setNumber}`;
const positive = (value: string) => Number(value) > 0;
const positiveInteger = (value: string) =>
  positive(value) && Number.isInteger(Number(value));
const exerciseCompleted = (item: MemberWorkoutExercise) =>
  item.unitType === 'sets_reps_weight' && item.setDetails?.length
    ? item.setDetails.every((set) => set.isCompleted)
    : item.isCompleted === true;

function lines(item: MemberWorkoutExercise): string[] {
  const result: string[] = [];
  if (item.unitType === 'sets_reps_weight' && item.setDetails?.length) return result;
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
  const [actualValues, setActualValues] = useState<ActualValues>({});
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
      setActualValues(
        Object.fromEntries(
          exercises.flatMap((exercise) =>
            (exercise.setDetails ?? []).map((set) => [
              setKey(exercise.id, set.setNumber),
              {
                reps: String(set.actualReps ?? set.targetReps),
                weightKg: String(set.actualWeightKg ?? set.targetWeightKg),
              },
            ]),
          ),
        ),
      );
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

  const saveSet = async (item: MemberWorkoutExercise, setNumber: number) => {
    if (workout?.status !== 'assigned') return;
    const key = setKey(item.id, setNumber);
    if (savingIds.includes(key)) return;
    const values = actualValues[key];
    if (!values || !positiveInteger(values.reps) || !positive(values.weightKg)) {
      showToast({
        type: 'error',
        message: `Enter valid Reps and Weight for Set ${setNumber}.`,
      });
      return;
    }
    const allSetsCompleted =
      item.setDetails?.every((set) => set.setNumber === setNumber || set.isCompleted) ??
      false;
    setSavingIds((current) => [...current, key]);
    try {
      await workoutAssignmentService.saveSetResult({
        exercise: item,
        setNumber,
        actualReps: Number(values.reps),
        actualWeightKg: Number(values.weightKg),
        allSetsCompleted,
      });
      setItems((current) =>
        current.map((exercise) =>
          exercise.id !== item.id
            ? exercise
            : {
                ...exercise,
                isCompleted: allSetsCompleted,
                setDetails: exercise.setDetails?.map((set) =>
                  set.setNumber === setNumber
                    ? {
                        ...set,
                        actualReps: Number(values.reps),
                        actualWeightKg: Number(values.weightKg),
                        isCompleted: true,
                      }
                    : set,
                ),
              },
        ),
      );
      showToast({ type: 'success', message: `Set ${setNumber} saved.` });
    } catch (saveError) {
      console.error('Set result save failed:', saveError);
      showToast({ type: 'error', message: `Unable to save Set ${setNumber}.` });
    } finally {
      setSavingIds((current) => current.filter((id) => id !== key));
    }
  };

  const finish = () => {
    if (!workout || finishing) return;
    const completedCount = items.filter(exerciseCompleted).length;
    const allCompleted = completedCount === items.length;
    const setItems = items.flatMap((item) => item.setDetails ?? []);
    const incompleteSets = setItems.some((set) => !set.isCompleted);
    Alert.alert(
      allCompleted
        ? 'Finish this workout?'
        : incompleteSets
          ? 'Some sets are not completed. Finish anyway?'
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

  const allSets = items.flatMap((item) => item.setDetails ?? []);
  const completedSets = allSets.filter((set) => set.isCompleted).length;
  const completedExercises = items.filter(exerciseCompleted).length;

  return (
    <ScreenContainer scroll>
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
            <View className="gap-1">
              {allSets.length ? (
                <Text className="text-slate-600">
                  {completedSets} of {allSets.length} sets completed
                </Text>
              ) : null}
              <Text className="text-slate-600">
                {completedExercises} of {items.length} exercises completed
              </Text>
            </View>
          )}
          {items.map((item) =>
            item.unitType === 'sets_reps_weight' && item.setDetails?.length ? (
              <View key={item.id} className="rounded-2xl bg-white p-4">
                <Text className="text-lg font-bold text-slate-900">
                  {item.order}. {item.exerciseNameSnapshot}
                </Text>
                {item.setDetails.map((set) => {
                  const key = setKey(item.id, set.setNumber);
                  const values = actualValues[key];
                  const readOnly = workout?.status !== 'assigned';
                  return (
                    <View
                      key={set.setNumber}
                      className="mt-4 gap-3 border-t border-slate-200 pt-4"
                    >
                      <Text className="text-lg font-bold text-slate-800">
                        Set {set.setNumber} {set.isCompleted ? '✓' : ''}
                      </Text>
                      <View>
                        <Text className="text-xs font-semibold uppercase text-slate-400">
                          Target
                        </Text>
                        <Text className="mt-1 text-slate-700">
                          {set.targetReps} reps × {set.targetWeightKg} kg
                        </Text>
                      </View>
                      {readOnly ? (
                        <View>
                          <Text className="text-xs font-semibold uppercase text-slate-400">
                            Actual
                          </Text>
                          <Text className="mt-1 text-slate-700">
                            {set.actualReps !== undefined &&
                            set.actualWeightKg !== undefined
                              ? `${set.actualReps} reps × ${set.actualWeightKg} kg`
                              : 'Not recorded'}
                          </Text>
                        </View>
                      ) : (
                        <View className="gap-3">
                          <Text className="text-xs font-semibold uppercase text-slate-400">
                            Actual
                          </Text>
                          <TextInput
                            label="Reps"
                            keyboardType="number-pad"
                            value={values?.reps ?? ''}
                            onChangeText={(reps) =>
                              setActualValues((current) => ({
                                ...current,
                                [key]: {
                                  reps,
                                  weightKg: current[key]?.weightKg ?? '',
                                },
                              }))
                            }
                          />
                          <TextInput
                            label="Weight (kg)"
                            keyboardType="decimal-pad"
                            value={values?.weightKg ?? ''}
                            onChangeText={(weightKg) =>
                              setActualValues((current) => ({
                                ...current,
                                [key]: {
                                  reps: current[key]?.reps ?? '',
                                  weightKg,
                                },
                              }))
                            }
                          />
                          <PrimaryButton
                            label={set.isCompleted ? 'Save Changes' : 'Mark Set Done'}
                            loading={savingIds.includes(key)}
                            disabled={savingIds.includes(key)}
                            onPress={() => void saveSet(item, set.setNumber)}
                          />
                        </View>
                      )}
                    </View>
                  );
                })}
                {item.notes ? (
                  <Text className="mt-3 text-slate-500">Notes: {item.notes}</Text>
                ) : null}
              </View>
            ) : (
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
            ),
          )}
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
    </ScreenContainer>
  );
}
