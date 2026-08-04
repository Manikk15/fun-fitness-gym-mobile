import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { categoryService, exerciseService } from '../../../../shared/services';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { TrainingPlanStackParamList } from '../../../../shared/navigation';
import type { Category, Exercise } from '../../../../shared/types';
import { getFriendlyFirebaseError } from '../../../auth/utils/firebase-error';
import { planExerciseSchema } from '../../schemas/training-plan.schemas';
import { trainingPlanService } from '../../services/training-plan.service';
import type { PlanExercise, PlanExerciseInput } from '../../types/training-plan.types';

type ExerciseFormValues = {
  sets: string;
  reps: string;
  targetWeight: string;
  restSeconds: string;
};

const formResolver = zodResolver(planExerciseSchema) as unknown as Resolver<
  ExerciseFormValues,
  unknown,
  PlanExerciseInput
>;

export function WorkoutExerciseListScreen() {
  const { params } =
    useRoute<RouteProp<TrainingPlanStackParamList, 'WorkoutExerciseList'>>();
  const { showToast } = useToast();
  const [items, setItems] = useState<PlanExercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editing, setEditing] = useState<PlanExercise | null>(null);
  const [deleting, setDeleting] = useState<PlanExercise | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues, unknown, PlanExerciseInput>({
    resolver: formResolver,
    defaultValues: { sets: '3', reps: '10', targetWeight: '', restSeconds: '' },
  });

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const [planItems, allExercises, allCategories] = await Promise.all([
          trainingPlanService.listPlanExercises(params.planId, params.dayId),
          exerciseService.getAll(),
          categoryService.getAll(),
        ]);
        setItems(planItems.filter((item) => item.active));
        setExercises(allExercises.filter((exercise) => exercise.active));
        setCategories(allCategories.filter((category) => category.active));
      } catch (loadError) {
        setError(true);
        showToast({ type: 'error', message: getFriendlyFirebaseError(loadError) });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params.dayId, params.planId, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const orderedItems = useMemo(
    () => [...items].sort((left, right) => left.displayOrder - right.displayOrder),
    [items],
  );
  const usedExerciseIds = useMemo(
    () => new Set(orderedItems.map((item) => item.exerciseId)),
    [orderedItems],
  );
  const pickerItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter(
      (exercise) =>
        !usedExerciseIds.has(exercise.id) &&
        (categoryId === 'all' || exercise.categoryId === categoryId) &&
        exercise.nameLowercase.includes(query),
    );
  }, [categoryId, exercises, search, usedExerciseIds]);

  const openPicker = () => {
    if (params.readOnly) return;
    setSearch('');
    setCategoryId('all');
    setPickerVisible(true);
  };

  const selectExercise = (exercise: Exercise) => {
    reset({ sets: '3', reps: '10', targetWeight: '', restSeconds: '' });
    setSelectedExercise(exercise);
    setPickerVisible(false);
  };

  const openEdit = (item: PlanExercise) => {
    if (params.readOnly) return;
    reset({
      sets: String(item.sets),
      reps: String(item.reps),
      targetWeight: item.targetWeight === null ? '' : String(item.targetWeight),
      restSeconds: item.restSeconds === null ? '' : String(item.restSeconds),
    });
    setEditing(item);
  };

  const closeForm = () => {
    setSelectedExercise(null);
    setEditing(null);
  };

  const save = async (values: PlanExerciseInput) => {
    if (params.readOnly) return;
    try {
      if (editing) {
        await trainingPlanService.updatePlanExercise(
          params.planId,
          params.dayId,
          editing.id,
          values,
        );
        showToast({ type: 'success', message: 'Exercise updated.' });
      } else if (selectedExercise) {
        await trainingPlanService.addExerciseToWorkoutDay(
          params.planId,
          params.dayId,
          selectedExercise,
          values,
        );
        showToast({ type: 'success', message: 'Exercise added.' });
      } else {
        return;
      }
      closeForm();
      await load();
    } catch (saveError) {
      showToast({
        type: 'error',
        message:
          saveError instanceof Error &&
          saveError.message === 'training-plan/duplicate-exercise'
            ? 'This exercise is already in the workout day.'
            : getFriendlyFirebaseError(saveError),
      });
    }
  };

  const remove = async () => {
    if (!deleting || busy || params.readOnly) return;
    setBusy(true);
    try {
      await trainingPlanService.setPlanExerciseActiveStatus(
        params.planId,
        params.dayId,
        deleting.id,
        false,
      );
      setDeleting(null);
      showToast({ type: 'success', message: 'Exercise removed.' });
      await load();
    } catch (removeError) {
      showToast({ type: 'error', message: getFriendlyFirebaseError(removeError) });
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (busy || params.readOnly) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;
    const reordered = [...orderedItems];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];
    setItems(
      reordered.map((item, position) => ({ ...item, displayOrder: position + 1 })),
    );
    setBusy(true);
    try {
      await trainingPlanService.reorderPlanExercises(
        params.planId,
        params.dayId,
        reordered,
      );
    } catch (reorderError) {
      showToast({ type: 'error', message: getFriendlyFirebaseError(reorderError) });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading exercises" />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-slate-900">
            Unable to load exercises
          </Text>
          <Text className="mt-2 text-center text-slate-500">Please try again.</Text>
          <View className="mt-5 w-full">
            <PrimaryButton label="Retry" onPress={() => void load()} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 112 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="px-6 py-8">
          <Text className="text-sm font-semibold text-brand-700">
            {params.planName}
          </Text>
          <Text className="mt-1 text-3xl font-bold text-slate-900">
            {params.dayName}
          </Text>
          <Text className="mt-2 text-slate-500">
            {orderedItems.length} {orderedItems.length === 1 ? 'exercise' : 'exercises'}
          </Text>
          {params.readOnly ? (
            <View className="mt-4 rounded-2xl bg-slate-200 p-4">
              <Text className="font-semibold text-slate-700">
                This archived plan is read-only.
              </Text>
            </View>
          ) : null}

          <View className="mt-6 gap-3">
            {orderedItems.map((item, index) => (
              <View key={item.id} className="rounded-2xl bg-white p-4">
                <View className="flex-row items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-900">
                      {item.exerciseNameSnapshot}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {item.categoryNameSnapshot}
                    </Text>
                    <Text className="mt-3 font-semibold text-slate-700">
                      {item.sets} × {item.reps}
                    </Text>
                    {item.restSeconds !== null ? (
                      <Text className="mt-1 text-sm text-slate-600">
                        Rest {item.restSeconds} sec
                      </Text>
                    ) : null}
                    {item.targetWeight !== null ? (
                      <Text className="mt-1 text-sm text-slate-600">
                        Target {item.targetWeight} kg
                      </Text>
                    ) : null}
                  </View>
                  {!params.readOnly ? (
                    <View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${item.exerciseNameSnapshot} up`}
                        disabled={busy || index === 0}
                        onPress={() => void move(index, -1)}
                        className={`p-2 ${index === 0 ? 'opacity-30' : ''}`}
                      >
                        <Ionicons name="chevron-up" size={22} color="#047857" />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${item.exerciseNameSnapshot} down`}
                        disabled={busy || index === orderedItems.length - 1}
                        onPress={() => void move(index, 1)}
                        className={`p-2 ${index === orderedItems.length - 1 ? 'opacity-30' : ''}`}
                      >
                        <Ionicons name="chevron-down" size={22} color="#047857" />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                {!params.readOnly ? (
                  <View className="mt-3 flex-row gap-5">
                    <Pressable disabled={busy} onPress={() => openEdit(item)}>
                      <Text className="font-semibold text-brand-700">Edit</Text>
                    </Pressable>
                    <Pressable disabled={busy} onPress={() => setDeleting(item)}>
                      <Text className="font-semibold text-red-600">Delete</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
            {!orderedItems.length ? (
              <View className="items-center py-12">
                <Text className="text-lg font-semibold text-slate-700">
                  No exercises yet
                </Text>
                <Text className="mt-1 text-center text-slate-500">
                  Add an exercise to start building this workout day.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {!params.readOnly ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add exercise"
          disabled={busy}
          onPress={openPicker}
          className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-brand-600 shadow-lg"
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <ScreenContainer>
          <View className="flex-1 px-6 py-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-slate-900">Select exercise</Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <Text className="font-semibold text-brand-700">Cancel</Text>
              </Pressable>
            </View>
            <View className="mt-5">
              <TextInput
                label="Search exercises"
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name"
              />
            </View>
            <ScrollView
              horizontal
              className="mt-3"
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row gap-2">
                {[{ id: 'all', name: 'All' }, ...categories].map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    className={`rounded-full px-3 py-2 ${
                      categoryId === category.id ? 'bg-brand-600' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        categoryId === category.id ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <ScrollView className="mt-4" keyboardShouldPersistTaps="handled">
              <View className="gap-3 pb-8">
                {pickerItems.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    onPress={() => selectExercise(exercise)}
                    className="rounded-2xl bg-white p-4"
                  >
                    <Text className="font-bold text-slate-900">{exercise.name}</Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {exercise.categoryName}
                    </Text>
                  </Pressable>
                ))}
                {!pickerItems.length ? (
                  <Text className="py-10 text-center text-slate-500">
                    No available exercises found.
                  </Text>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </ScreenContainer>
      </Modal>

      <Modal
        transparent
        visible={selectedExercise !== null || editing !== null}
        animationType="fade"
        onRequestClose={closeForm}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">
              {editing?.exerciseNameSnapshot ?? selectedExercise?.name}
            </Text>
            <View className="mt-5 flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="sets"
                  render={({ field }) => (
                    <TextInput
                      label="Sets"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      error={errors.sets?.message}
                      keyboardType="number-pad"
                      editable={!isSubmitting}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="reps"
                  render={({ field }) => (
                    <TextInput
                      label="Reps"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      error={errors.reps?.message}
                      keyboardType="number-pad"
                      editable={!isSubmitting}
                    />
                  )}
                />
              </View>
            </View>
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="targetWeight"
                  render={({ field }) => (
                    <TextInput
                      label="Target kg (optional)"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      error={errors.targetWeight?.message}
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="restSeconds"
                  render={({ field }) => (
                    <TextInput
                      label="Rest sec (optional)"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      error={errors.restSeconds?.message}
                      keyboardType="number-pad"
                      editable={!isSubmitting}
                    />
                  )}
                />
              </View>
            </View>
            <View className="mt-6 gap-3">
              <PrimaryButton
                label={editing ? 'Save Exercise' : 'Add Exercise'}
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleSubmit(save)}
              />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                disabled={isSubmitting}
                onPress={closeForm}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={deleting !== null}
        animationType="fade"
        onRequestClose={() => setDeleting(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">Remove exercise?</Text>
            <Text className="mt-2 text-slate-500">
              {deleting?.exerciseNameSnapshot} will be removed from this workout day.
            </Text>
            <View className="mt-5 gap-3">
              <PrimaryButton
                label="Remove Exercise"
                loading={busy}
                onPress={() => void remove()}
              />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                disabled={busy}
                onPress={() => setDeleting(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
