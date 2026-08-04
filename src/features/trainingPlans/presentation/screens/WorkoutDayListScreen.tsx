import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import type { TrainingPlanStackParamList } from '../../../../shared/navigation';
import { getFriendlyFirebaseError } from '../../../auth/utils/firebase-error';
import { workoutDaySchema } from '../../schemas/training-plan.schemas';
import { trainingPlanService } from '../../services/training-plan.service';
import type { WorkoutDay, WorkoutDayInput } from '../../types/training-plan.types';

export function WorkoutDayListScreen() {
  const { params } =
    useRoute<RouteProp<TrainingPlanStackParamList, 'WorkoutDayList'>>();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<TrainingPlanStackParamList, 'WorkoutDayList'>
    >();
  const { showToast } = useToast();
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<WorkoutDay | 'new' | null>(null);
  const [deleting, setDeleting] = useState<WorkoutDay | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkoutDayInput>({
    resolver: zodResolver(workoutDaySchema),
    defaultValues: { name: '', description: null },
  });

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const items = await trainingPlanService.listWorkoutDays(params.planId);
        setDays(items.filter((item) => item.active));
      } catch (loadError) {
        setError(true);
        showToast({ type: 'error', message: getFriendlyFirebaseError(loadError) });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params.planId, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const orderedDays = useMemo(
    () => [...days].sort((left, right) => left.order - right.order),
    [days],
  );

  const openAdd = () => {
    if (params.readOnly) return;
    reset({ name: '', description: null });
    setEditing('new');
  };

  const openRename = (day: WorkoutDay) => {
    if (params.readOnly) return;
    reset({ name: day.name, description: null });
    setEditing(day);
  };

  const save = async (values: WorkoutDayInput) => {
    if (!editing || params.readOnly) return;
    try {
      if (editing === 'new') {
        await trainingPlanService.createWorkoutDay(params.planId, values);
        showToast({ type: 'success', message: 'Workout day added.' });
      } else {
        await trainingPlanService.updateWorkoutDay(params.planId, editing.id, values);
        showToast({ type: 'success', message: 'Workout day renamed.' });
      }
      setEditing(null);
      await load();
    } catch (saveError) {
      showToast({ type: 'error', message: getFriendlyFirebaseError(saveError) });
    }
  };

  const remove = async () => {
    if (!deleting || busy || params.readOnly) return;
    setBusy(true);
    try {
      await trainingPlanService.setWorkoutDayActiveStatus(
        params.planId,
        deleting.id,
        false,
      );
      setDeleting(null);
      showToast({ type: 'success', message: 'Workout day deleted.' });
      await load();
    } catch (deleteError) {
      showToast({ type: 'error', message: getFriendlyFirebaseError(deleteError) });
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (busy || params.readOnly) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedDays.length) return;
    const reordered = [...orderedDays];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];
    setDays(reordered.map((day, position) => ({ ...day, order: position + 1 })));
    setBusy(true);
    try {
      await trainingPlanService.reorderWorkoutDays(params.planId, reordered);
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
        <LoadingSpinner label="Loading workout days" />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-slate-900">
            Unable to load workout days
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
          <Text className="text-3xl font-bold text-slate-900">{params.planName}</Text>
          <Text className="mt-2 text-slate-500">
            {orderedDays.length} workout {orderedDays.length === 1 ? 'day' : 'days'}
          </Text>
          {params.readOnly ? (
            <View className="mt-4 rounded-2xl bg-slate-200 p-4">
              <Text className="font-semibold text-slate-700">
                This archived plan is read-only.
              </Text>
            </View>
          ) : null}

          <View className="mt-6 gap-3">
            {orderedDays.map((day, index) => (
              <View key={day.id} className="rounded-2xl bg-white p-4">
                <View className="flex-row items-center">
                  <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                    <Text className="font-bold text-brand-700">{index + 1}</Text>
                  </View>
                  <Text className="flex-1 text-lg font-bold text-slate-900">
                    {day.name}
                  </Text>
                  {!params.readOnly ? (
                    <View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${day.name} up`}
                        disabled={busy || index === 0}
                        onPress={() => void move(index, -1)}
                        className={`p-2 ${index === 0 ? 'opacity-30' : ''}`}
                      >
                        <Ionicons name="chevron-up" size={22} color="#047857" />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${day.name} down`}
                        disabled={busy || index === orderedDays.length - 1}
                        onPress={() => void move(index, 1)}
                        className={`p-2 ${index === orderedDays.length - 1 ? 'opacity-30' : ''}`}
                      >
                        <Ionicons name="chevron-down" size={22} color="#047857" />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                <View className="mt-3 flex-row gap-5">
                  <Pressable
                    disabled={busy}
                    onPress={() =>
                      navigation.navigate('WorkoutExerciseList', {
                        planId: params.planId,
                        planName: params.planName,
                        dayId: day.id,
                        dayName: day.name,
                        readOnly: params.readOnly,
                      })
                    }
                  >
                    <Text className="font-semibold text-brand-700">
                      {params.readOnly ? 'View exercises' : 'Build exercises'}
                    </Text>
                  </Pressable>
                  {!params.readOnly ? (
                    <>
                      <Pressable disabled={busy} onPress={() => openRename(day)}>
                        <Text className="font-semibold text-brand-700">Rename</Text>
                      </Pressable>
                      <Pressable disabled={busy} onPress={() => setDeleting(day)}>
                        <Text className="font-semibold text-red-600">Delete</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            ))}

            {!orderedDays.length ? (
              <View className="items-center py-12">
                <Text className="text-lg font-semibold text-slate-700">
                  No workout days yet
                </Text>
                <Text className="mt-1 text-center text-slate-500">
                  Add the first day to start organizing this plan.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {!params.readOnly ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add workout day"
          disabled={busy}
          onPress={openAdd}
          className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-brand-600 shadow-lg"
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <Modal
        transparent
        visible={editing !== null}
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">
              {editing === 'new' ? 'Add workout day' : 'Rename workout day'}
            </Text>
            <View className="mt-5">
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextInput
                    label="Workout day name"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    error={errors.name?.message}
                    placeholder="For example, Upper Body"
                    maxLength={80}
                    editable={!isSubmitting}
                    autoFocus
                  />
                )}
              />
            </View>
            <View className="mt-5 gap-3">
              <PrimaryButton
                label={editing === 'new' ? 'Add Day' : 'Save Name'}
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleSubmit(save)}
              />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                disabled={isSubmitting}
                onPress={() => setEditing(null)}
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
            <Text className="text-xl font-bold text-slate-900">
              Delete workout day?
            </Text>
            <Text className="mt-2 text-slate-500">
              {deleting?.name} will be removed from this training plan.
            </Text>
            <View className="mt-5 gap-3">
              <PrimaryButton
                label="Delete Day"
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
