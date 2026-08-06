import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import { DEFAULT_GYM_ID } from '../../../../shared/constants';
import type { MemberStackParamList } from '../../../../shared/navigation';
import type {
  AssignmentExerciseInput,
  DefaultUnitType,
  DistanceUnit,
  DurationUnit,
  ExerciseCategory,
  ExerciseLibraryItem,
  MemberWorkoutExercise,
  WorkoutMaster,
} from '../../../../shared/types';
import { useAuth } from '../../../auth/context';
import {
  exerciseCategoryService,
  exerciseLibraryService,
  workoutMasterService,
} from '../../../masterData/services';
import { workoutAssignmentService } from '../../services';

type DraftExercise = AssignmentExerciseInput & { localId: string };
type DraftSetDetail = { reps: string; weightKg: string };
type DetailValues = {
  sets: string;
  reps: string;
  setDetails: DraftSetDetail[];
  durationValue: string;
  durationUnit: DurationUnit;
  distanceValue: string;
  distanceUnit: DistanceUnit;
  rounds: string;
  notes: string;
};

const emptyDetails = (): DetailValues => ({
  sets: '',
  reps: '',
  setDetails: [{ reps: '', weightKg: '' }],
  durationValue: '',
  durationUnit: 'minutes',
  distanceValue: '',
  distanceUnit: 'metres',
  rounds: '',
  notes: '',
});
const positive = (value: string) => Number(value) > 0;
const positiveInteger = (value: string) =>
  positive(value) && Number.isInteger(Number(value));

function detailsError(type: DefaultUnitType, values: DetailValues): string | null {
  if (type === 'sets_reps_weight') {
    if (!values.setDetails.length) return 'Add at least one Set.';
    const invalidSetIndex = values.setDetails.findIndex(
      (set) => !positiveInteger(set.reps) || !positive(set.weightKg),
    );
    if (invalidSetIndex >= 0)
      return `Enter valid Reps and Weight for Set ${invalidSetIndex + 1}.`;
  }
  if (type === 'sets_reps') {
    if (!positiveInteger(values.sets)) return 'Enter valid Sets.';
    if (!positiveInteger(values.reps)) return 'Enter valid Reps.';
  }
  if (type === 'sets_duration') {
    if (!positiveInteger(values.sets)) return 'Enter valid Sets.';
    if (!positive(values.durationValue)) return 'Enter a valid Time.';
  }
  if (type === 'duration' && !positive(values.durationValue))
    return 'Enter a valid Time.';
  if (type === 'distance' && !positive(values.distanceValue))
    return 'Enter a valid Distance.';
  if (type === 'rounds' && !positiveInteger(values.rounds))
    return 'Enter valid Rounds.';
  if (type === 'custom') return 'This exercise needs a supported unit type.';
  return null;
}

function exerciseSummary(item: DraftExercise | MemberWorkoutExercise) {
  const parts: string[] = [];
  if (item.unitType === 'sets_reps_weight' && item.setDetails?.length)
    return `${item.setDetails.length} ${item.setDetails.length === 1 ? 'set' : 'sets'}`;
  if (item.sets) parts.push(`${item.sets} sets`);
  if (item.reps) parts.push(`${item.reps} reps`);
  if (item.weightKg) parts.push(`${item.weightKg} kg`);
  if (item.durationValue)
    parts.push(`${item.durationValue} ${item.durationUnit ?? 'seconds'}`);
  if (item.distanceValue)
    parts.push(`${item.distanceValue} ${item.distanceUnit ?? 'metres'}`);
  if (item.rounds) parts.push(`${item.rounds} rounds`);
  return parts.join(' · ');
}

function ChoiceRow({
  name,
  detail,
  onPress,
}: {
  name: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable className="rounded-2xl bg-white p-4" onPress={onPress}>
      <Text className="text-lg font-bold text-slate-900">{name}</Text>
      {detail ? <Text className="mt-1 text-slate-500">{detail}</Text> : null}
    </Pressable>
  );
}

export function AssignWorkoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MemberStackParamList>>();
  const { params } = useRoute<RouteProp<MemberStackParamList, 'AssignWorkout'>>();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const gymId = profile?.gymId || DEFAULT_GYM_ID;
  const [workouts, setWorkouts] = useState<WorkoutMaster[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [workout, setWorkout] = useState<WorkoutMaster>();
  const [draft, setDraft] = useState<DraftExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ExerciseLibraryItem>();
  const [editingIndex, setEditingIndex] = useState<number>();
  const [values, setValues] = useState<DetailValues>(emptyDetails());
  const [validation, setValidation] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const dirty = Boolean(workout || draft.length);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!dirty || saving) return;
        event.preventDefault();
        Alert.alert('Discard assignment?', 'Your unfinished assignment will be lost.', [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(event.data.action),
          },
        ]);
      }),
    [dirty, navigation, saving],
  );

  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        workoutMasterService.listActive(gymId),
        exerciseCategoryService.listActive(gymId),
        exerciseLibraryService.listActive(gymId),
      ])
        .then(([activeWorkouts, activeCategories, activeExercises]) => {
          setWorkouts(activeWorkouts);
          setCategories(activeCategories);
          setLibrary(activeExercises);
        })
        .catch(() =>
          showToast({
            type: 'error',
            message: 'Unable to load workouts and exercises.',
          }),
        )
        .finally(() => setLoading(false));
    }, [gymId, showToast]),
  );

  const filteredExercises = useMemo(
    () =>
      library.filter(
        (item) =>
          (categoryId === 'all' || item.categoryId === categoryId) &&
          item.nameLowercase.includes(search.trim().toLowerCase()),
      ),
    [categoryId, library, search],
  );

  const openDetails = (item: ExerciseLibraryItem, index?: number) => {
    setPickerOpen(false);
    setDetailItem(item);
    setEditingIndex(index);
    const existing = index === undefined ? undefined : draft[index];
    setValues(
      existing
        ? {
            sets: existing.sets ? String(existing.sets) : '',
            reps: existing.reps ? String(existing.reps) : '',
            setDetails: existing.setDetails?.map((set) => ({
              reps: String(set.targetReps),
              weightKg: String(set.targetWeightKg),
            })) ?? [{ reps: '', weightKg: '' }],
            durationValue: existing.durationValue ? String(existing.durationValue) : '',
            durationUnit: existing.durationUnit ?? 'minutes',
            distanceValue: existing.distanceValue ? String(existing.distanceValue) : '',
            distanceUnit: existing.distanceUnit ?? 'metres',
            rounds: existing.rounds ? String(existing.rounds) : '',
            notes: existing.notes ?? '',
          }
        : emptyDetails(),
    );
    setValidation('');
  };

  const selectExercise = (item: ExerciseLibraryItem) => {
    if (draft.some((entry) => entry.exerciseId === item.id)) {
      Alert.alert(
        'Add this exercise again?',
        `${item.name} is already in this workout.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add again', onPress: () => openDetails(item) },
        ],
      );
    } else openDetails(item);
  };

  const saveDetails = () => {
    if (!detailItem) return;
    const error = detailsError(detailItem.defaultUnitType, values);
    if (error) return setValidation(error);
    const category = categories.find((item) => item.id === detailItem.categoryId);
    const item: DraftExercise = {
      localId:
        editingIndex === undefined
          ? `${detailItem.id}-${Date.now()}`
          : draft[editingIndex].localId,
      exerciseId: detailItem.id,
      exerciseNameSnapshot: detailItem.name,
      categoryId: detailItem.categoryId,
      categoryNameSnapshot: category?.name ?? 'Uncategorized',
      unitType: detailItem.defaultUnitType,
      order: (editingIndex ?? draft.length) + 1,
      ...(values.sets ? { sets: Number(values.sets) } : {}),
      ...(values.reps ? { reps: Number(values.reps) } : {}),
      ...(detailItem.defaultUnitType === 'sets_reps_weight'
        ? {
            setDetails: values.setDetails.map((set, index) => ({
              setNumber: index + 1,
              targetReps: Number(set.reps),
              targetWeightKg: Number(set.weightKg),
              isCompleted: false,
              completedAt: null,
            })),
          }
        : {}),
      ...(values.durationValue
        ? {
            durationValue: Number(values.durationValue),
            durationUnit:
              detailItem.defaultUnitType === 'sets_duration'
                ? ('seconds' as const)
                : values.durationUnit,
          }
        : {}),
      ...(values.distanceValue
        ? {
            distanceValue: Number(values.distanceValue),
            distanceUnit: values.distanceUnit,
          }
        : {}),
      ...(values.rounds ? { rounds: Number(values.rounds) } : {}),
      ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
    };
    setDraft((current) =>
      editingIndex === undefined
        ? [...current, item]
        : current.map((entry, index) => (index === editingIndex ? item : entry)),
    );
    setDetailItem(undefined);
    setEditingIndex(undefined);
  };

  const move = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= draft.length) return;
    setDraft((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  const remove = (index: number) =>
    Alert.alert('Remove exercise?', 'This exercise will be removed from the workout.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index)),
      },
    ]);

  const assign = async () => {
    if (!workout) return showToast({ type: 'error', message: 'Select a Workout.' });
    if (!draft.length)
      return showToast({ type: 'error', message: 'Add at least one Exercise.' });
    if (!user) return;
    setSaving(true);
    try {
      await workoutAssignmentService.assign({
        gymId,
        memberId: params.memberId,
        workout,
        assignedBy: user.uid,
        exercises: draft.map(({ localId: _localId, ...item }, index) => ({
          ...item,
          order: index + 1,
        })),
      });
      showToast({ type: 'success', message: 'Workout assigned successfully' });
      navigation.goBack();
    } catch (error) {
      console.error('Workout assignment failed:', error);
      showToast({ type: 'error', message: 'Unable to assign workout.' });
      setSaving(false);
    }
  };

  if (loading)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading workouts..." />
      </ScreenContainer>
    );

  return (
    <ScreenContainer>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="gap-4 px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">Assign Workout</Text>
          {!workout ? (
            <>
              <Text className="text-lg font-semibold text-slate-700">
                Select Workout
              </Text>
              {workouts.map((item) => (
                <ChoiceRow
                  key={item.id}
                  name={item.name}
                  onPress={() => setWorkout(item)}
                />
              ))}
              {!workouts.length ? (
                <Text className="text-slate-500">No active Workouts.</Text>
              ) : null}
            </>
          ) : (
            <>
              <View className="rounded-2xl bg-brand-50 p-4">
                <Text className="text-sm font-semibold text-brand-700">Workout</Text>
                <Text className="mt-1 text-xl font-bold text-slate-900">
                  {workout.name}
                </Text>
              </View>
              {draft.map((item, index) => (
                <View key={item.localId} className="rounded-2xl bg-white p-4">
                  <Text className="font-bold text-slate-900">
                    {index + 1}. {item.exerciseNameSnapshot}
                  </Text>
                  <Text className="mt-1 text-slate-500">{exerciseSummary(item)}</Text>
                  {item.notes ? (
                    <Text className="mt-1 text-slate-500">Notes: {item.notes}</Text>
                  ) : null}
                  <View className="mt-3 flex-row flex-wrap gap-4">
                    <Pressable disabled={index === 0} onPress={() => move(index, -1)}>
                      <Text className="font-semibold text-brand-700">Move up</Text>
                    </Pressable>
                    <Pressable
                      disabled={index === draft.length - 1}
                      onPress={() => move(index, 1)}
                    >
                      <Text className="font-semibold text-brand-700">Move down</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const source = library.find(
                          (entry) => entry.id === item.exerciseId,
                        );
                        if (source) openDetails(source, index);
                      }}
                    >
                      <Text className="font-semibold text-brand-700">Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => remove(index)}>
                      <Text className="font-semibold text-red-600">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              {!draft.length ? (
                <Text className="text-center text-slate-500">No Exercises added.</Text>
              ) : null}
              <PrimaryButton
                label="Add Exercise"
                variant="secondary"
                onPress={() => setPickerOpen(true)}
              />
              <PrimaryButton
                label="Assign"
                loading={saving}
                onPress={() => void assign()}
              />
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <ScreenContainer>
          <View className="flex-1 px-6 py-6">
            <Text className="text-2xl font-bold text-slate-900">Add Exercise</Text>
            <View className="mt-4">
              <TextInput label="Search" value={search} onChangeText={setSearch} />
            </View>
            <ScrollView horizontal className="mt-3" style={{ flexGrow: 0 }}>
              <View className="flex-row gap-2">
                {[{ id: 'all', name: 'All' }, ...categories].map((item) => (
                  <Pressable key={item.id} onPress={() => setCategoryId(item.id)}>
                    <Text
                      className={`rounded-full px-3 py-2 ${categoryId === item.id ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <ScrollView className="mt-4" keyboardShouldPersistTaps="handled">
              <View className="gap-3">
                {filteredExercises.map((item) => (
                  <ChoiceRow
                    key={item.id}
                    name={item.name}
                    detail={
                      categories.find((category) => category.id === item.categoryId)
                        ?.name
                    }
                    onPress={() => selectExercise(item)}
                  />
                ))}
                {!filteredExercises.length ? (
                  <Text className="text-center text-slate-500">
                    No active Exercises found.
                  </Text>
                ) : null}
              </View>
            </ScrollView>
            <PrimaryButton
              label="Cancel"
              variant="ghost"
              onPress={() => setPickerOpen(false)}
            />
          </View>
        </ScreenContainer>
      </Modal>

      <Modal
        visible={Boolean(detailItem)}
        animationType="slide"
        onRequestClose={() => setDetailItem(undefined)}
      >
        <ScreenContainer scroll>
          <View className="gap-4 px-6 py-8">
            <Text className="text-2xl font-bold text-slate-900">
              {detailItem?.name}
            </Text>
            {detailItem?.defaultUnitType === 'sets_reps' ||
            detailItem?.defaultUnitType === 'sets_duration' ? (
              <TextInput
                label="Sets"
                keyboardType="number-pad"
                value={values.sets}
                onChangeText={(sets) => setValues((current) => ({ ...current, sets }))}
              />
            ) : null}
            {detailItem?.defaultUnitType === 'sets_reps' ? (
              <TextInput
                label="Reps"
                keyboardType="number-pad"
                value={values.reps}
                onChangeText={(reps) => setValues((current) => ({ ...current, reps }))}
              />
            ) : null}
            {detailItem?.defaultUnitType === 'sets_reps_weight' ? (
              <View className="gap-4">
                {values.setDetails.map((set, index) => (
                  <View
                    key={`set-${index + 1}`}
                    className="gap-3 border-b border-slate-200 pb-4"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-bold text-slate-900">
                        Set {index + 1}
                      </Text>
                      {values.setDetails.length > 1 ? (
                        <Pressable
                          onPress={() =>
                            setValues((current) => ({
                              ...current,
                              setDetails: current.setDetails.filter(
                                (_, setIndex) => setIndex !== index,
                              ),
                            }))
                          }
                        >
                          <Text className="font-semibold text-red-600">Delete Set</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <TextInput
                      label="Reps"
                      keyboardType="number-pad"
                      value={set.reps}
                      onChangeText={(reps) =>
                        setValues((current) => ({
                          ...current,
                          setDetails: current.setDetails.map((entry, setIndex) =>
                            setIndex === index ? { ...entry, reps } : entry,
                          ),
                        }))
                      }
                    />
                    <TextInput
                      label="Weight (kg)"
                      keyboardType="decimal-pad"
                      value={set.weightKg}
                      onChangeText={(weightKg) =>
                        setValues((current) => ({
                          ...current,
                          setDetails: current.setDetails.map((entry, setIndex) =>
                            setIndex === index ? { ...entry, weightKg } : entry,
                          ),
                        }))
                      }
                    />
                  </View>
                ))}
                <Pressable
                  className="self-start rounded-xl bg-brand-50 px-4 py-3"
                  onPress={() =>
                    setValues((current) => ({
                      ...current,
                      setDetails: [...current.setDetails, { reps: '', weightKg: '' }],
                    }))
                  }
                >
                  <Text className="font-bold text-brand-700">+ Add Set</Text>
                </Pressable>
              </View>
            ) : null}
            {detailItem?.defaultUnitType === 'duration' ||
            detailItem?.defaultUnitType === 'sets_duration' ? (
              <>
                <TextInput
                  label="Time"
                  keyboardType="decimal-pad"
                  value={values.durationValue}
                  onChangeText={(durationValue) =>
                    setValues((current) => ({ ...current, durationValue }))
                  }
                />
                {detailItem.defaultUnitType === 'duration' ? (
                  <View className="flex-row gap-3">
                    {(['minutes', 'seconds'] as DurationUnit[]).map((unit) => (
                      <Pressable
                        key={unit}
                        onPress={() =>
                          setValues((current) => ({ ...current, durationUnit: unit }))
                        }
                      >
                        <Text
                          className={`rounded-full px-3 py-2 capitalize ${values.durationUnit === unit ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}
                        >
                          {unit}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text className="text-slate-500">Time is in seconds.</Text>
                )}
              </>
            ) : null}
            {detailItem?.defaultUnitType === 'distance' ? (
              <>
                <TextInput
                  label="Distance"
                  keyboardType="decimal-pad"
                  value={values.distanceValue}
                  onChangeText={(distanceValue) =>
                    setValues((current) => ({ ...current, distanceValue }))
                  }
                />
                <View className="flex-row gap-3">
                  {(['metres', 'kilometres'] as DistanceUnit[]).map((unit) => (
                    <Pressable
                      key={unit}
                      onPress={() =>
                        setValues((current) => ({ ...current, distanceUnit: unit }))
                      }
                    >
                      <Text
                        className={`rounded-full px-3 py-2 capitalize ${values.distanceUnit === unit ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}
                      >
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            {detailItem?.defaultUnitType === 'rounds' ? (
              <TextInput
                label="Rounds"
                keyboardType="number-pad"
                value={values.rounds}
                onChangeText={(rounds) =>
                  setValues((current) => ({ ...current, rounds }))
                }
              />
            ) : null}
            <TextInput
              label="Notes (optional)"
              multiline
              value={values.notes}
              onChangeText={(notes) => setValues((current) => ({ ...current, notes }))}
            />
            {validation ? <Text className="text-red-600">{validation}</Text> : null}
            <PrimaryButton label="Save Exercise" onPress={saveDetails} />
            <PrimaryButton
              label="Cancel"
              variant="ghost"
              onPress={() => setDetailItem(undefined)}
            />
          </View>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}

export function AssignedWorkoutDetailsScreen() {
  const { params } =
    useRoute<RouteProp<MemberStackParamList, 'AssignedWorkoutDetails'>>();
  const { profile } = useAuth();
  const gymId = profile?.gymId || DEFAULT_GYM_ID;
  const [items, setItems] = useState<MemberWorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(
        await workoutAssignmentService.listExercises(gymId, params.memberWorkoutId),
      );
    } catch (loadError) {
      console.error('Assigned exercise load failed:', loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [gymId, params.memberWorkoutId]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  if (loading)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading Workout..." />
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
          {items.map((item) => (
            <View key={item.id} className="rounded-2xl bg-white p-4">
              <Text className="text-lg font-bold text-slate-900">
                {item.order}. {item.exerciseNameSnapshot}
              </Text>
              <Text className="mt-1 text-slate-500">{exerciseSummary(item)}</Text>
              {item.unitType === 'sets_reps_weight'
                ? item.setDetails?.map((set) => (
                    <View
                      key={set.setNumber}
                      className="mt-3 border-t border-slate-200 pt-3"
                    >
                      <Text className="font-bold text-slate-800">
                        Set {set.setNumber}
                      </Text>
                      <Text className="mt-1 text-slate-600">
                        Target: {set.targetReps} reps × {set.targetWeightKg} kg
                      </Text>
                      {set.actualReps !== undefined &&
                      set.actualWeightKg !== undefined ? (
                        <Text
                          className={`mt-1 ${set.actualReps !== set.targetReps || set.actualWeightKg !== set.targetWeightKg ? 'font-semibold text-amber-700' : 'text-slate-600'}`}
                        >
                          Actual: {set.actualReps} reps × {set.actualWeightKg} kg
                        </Text>
                      ) : (
                        <Text className="mt-1 text-slate-400">
                          Actual: Not recorded
                        </Text>
                      )}
                    </View>
                  ))
                : null}
              {item.notes ? (
                <Text className="mt-1 text-slate-500">Notes: {item.notes}</Text>
              ) : null}
            </View>
          ))}
          {!items.length ? (
            <Text className="text-slate-500">No Exercises found.</Text>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
