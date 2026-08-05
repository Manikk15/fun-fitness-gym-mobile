import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import { DEFAULT_GYM_ID } from '../../../../shared/constants';
import type { MasterDataStackParamList } from '../../../../shared/navigation/admin-types';
import type {
  DefaultUnitType,
  ExerciseCategory,
  ExerciseLibraryItem,
  WorkoutMaster,
  WorkoutMasterType,
} from '../../../../shared/types';
import { useAuth } from '../../../auth/context';
import {
  exerciseCategorySchema,
  exerciseLibrarySchema,
  workoutMasterSchema,
  type ExerciseCategoryFormValues,
  type ExerciseLibraryFormValues,
  type WorkoutMasterFormValues,
} from '../../domain/master-data.schemas';
import {
  exerciseCategoryService,
  exerciseLibraryService,
  type ExerciseLibraryCursor,
  workoutMasterService,
  seedMasterData,
} from '../../services';

const unitLabels: Record<DefaultUnitType, string> = {
  sets_reps_weight: 'Sets, Reps & Weight',
  sets_reps: 'Sets & Reps',
  duration: 'Duration',
  distance: 'Distance',
  rounds: 'Rounds',
  sets_duration: 'Sets & Duration',
  custom: 'Custom',
};
const workoutTypeLabels: Record<WorkoutMasterType, string> = {
  compound: 'Compound',
  dual: 'Dual',
  single: 'Single',
  cardio: 'Cardio',
  custom: 'Custom',
};
const gymIdFor = (gymId?: string) => gymId || DEFAULT_GYM_ID;
const duplicateMessage = (error: unknown, noun: string) =>
  error instanceof Error && error.message === 'master-data/duplicate-name'
    ? `A ${noun} with this name already exists in this gym.`
    : `Unable to save ${noun}.`;

function Empty({ message }: { message: string }) {
  return (
    <View className="items-center rounded-2xl bg-slate-100 px-5 py-10">
      <Text className="text-center text-slate-500">{message}</Text>
    </View>
  );
}
function Status({ active }: { active: boolean }) {
  return (
    <Text
      className={`self-start rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}
    >
      {active ? 'Active' : 'Inactive'}
    </Text>
  );
}
function Chips<T extends string>({
  values,
  selected,
  labels,
  onSelect,
  includeAll = true,
}: {
  values: readonly T[];
  selected: T | 'all';
  labels: Record<T, string>;
  onSelect: (value: T | 'all') => void;
  includeAll?: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {includeAll ? (
          <Pressable onPress={() => onSelect('all')}>
            <Text
              className={`rounded-full px-3 py-2 ${selected === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              All
            </Text>
          </Pressable>
        ) : null}
        {values.map((value) => (
          <Pressable key={value} onPress={() => onSelect(value)}>
            <Text
              className={`rounded-full px-3 py-2 ${selected === value ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              {labels[value]}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
function ConfirmStatus({
  name,
  active,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  active: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full rounded-3xl bg-white p-6">
          <Text className="text-xl font-bold text-slate-900">
            {active ? 'Deactivate' : 'Activate'} {name}?
          </Text>
          <Text className="mt-2 text-slate-500">
            {active
              ? 'It will remain stored and can be reactivated later.'
              : 'It will become available for use again.'}
          </Text>
          <View className="mt-5 gap-3">
            <PrimaryButton
              label={active ? 'Deactivate' : 'Activate'}
              loading={busy}
              onPress={onConfirm}
            />
            <PrimaryButton
              label="Cancel"
              variant="ghost"
              disabled={busy}
              onPress={onCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function MasterDataHomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MasterDataStackParamList>>();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const runSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const result = await seedMasterData(gymIdFor(profile?.gymId), user.uid);
      const created = Object.values(result).reduce(
        (total, item) => total + item.created,
        0,
      );
      const skipped = Object.values(result).reduce(
        (total, item) => total + item.skipped,
        0,
      );
      showToast({
        type: 'success',
        message: `Master data imported: ${created} created, ${skipped} skipped.`,
      });
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'An unknown Firestore error occurred.';
      console.error('Master data import failed:', error);
      showToast({ type: 'error', message: `Import failed: ${detail}` });
    } finally {
      setSeeding(false);
    }
  };
  return (
    <ScreenContainer>
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">Master Data</Text>
        <Text className="mt-2 text-slate-500">
          Set up reusable workout names, categories and exercises.
        </Text>
        <View className="mt-8 gap-4">
          <PrimaryButton
            label="Workouts"
            onPress={() => navigation.navigate('WorkoutMasterList')}
          />
          <PrimaryButton
            label="Exercise Categories"
            variant="secondary"
            onPress={() => navigation.navigate('ExerciseCategoryList')}
          />
          <PrimaryButton
            label="Exercises"
            variant="secondary"
            onPress={() => navigation.navigate('ExerciseLibraryList')}
          />
          <PrimaryButton
            label="Import master-data.json"
            variant="secondary"
            loading={seeding}
            onPress={() => void runSeed()}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

export function ExerciseCategoryListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MasterDataStackParamList>>();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const gymId = gymIdFor(profile?.gymId);
  const [items, setItems] = useState<ExerciseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState<ExerciseCategory | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      setItems(await exerciseCategoryService.list(gymId));
    } catch {
      setError(true);
      showToast({ type: 'error', message: 'Unable to load exercise categories.' });
    } finally {
      setLoading(false);
    }
  }, [gymId, showToast]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const toggle = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await exerciseCategoryService.setActive(confirm.id, !confirm.isActive);
      showToast({
        type: 'success',
        message: `Category ${confirm.isActive ? 'deactivated' : 'activated'}.`,
      });
      setConfirm(null);
      await load();
    } catch {
      showToast({ type: 'error', message: 'Unable to update category.' });
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading categories..." />
      </ScreenContainer>
    );
  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} />
        }
      >
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">Exercise Categories</Text>
          <View className="mt-5">
            <PrimaryButton
              label="Add Category"
              onPress={() => navigation.navigate('ExerciseCategoryForm', {})}
            />
          </View>
          {error ? (
            <View className="mt-4 gap-3">
              <Empty message="Categories could not be loaded." />
              <PrimaryButton
                label="Retry"
                variant="secondary"
                onPress={() => void load()}
              />
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {items.map((item) => (
                <View key={item.id} className="rounded-2xl bg-white p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-slate-900">
                        {item.name}
                      </Text>
                      <Text className="mt-1 text-sm text-slate-500">
                        Sort order {item.sortOrder}
                      </Text>
                    </View>
                    <Status active={item.isActive} />
                  </View>
                  {item.description ? (
                    <Text className="mt-2 text-slate-600">{item.description}</Text>
                  ) : null}
                  <View className="mt-3 flex-row gap-5">
                    <Pressable
                      onPress={() =>
                        navigation.navigate('ExerciseCategoryForm', { id: item.id })
                      }
                    >
                      <Text className="font-semibold text-brand-700">Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirm(item)}>
                      <Text className="font-semibold text-brand-700">
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              {!items.length ? <Empty message="No exercise categories yet." /> : null}
            </View>
          )}
        </View>
      </ScrollView>
      {confirm ? (
        <ConfirmStatus
          name={confirm.name}
          active={confirm.isActive}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void toggle()}
        />
      ) : null}
    </ScreenContainer>
  );
}

export function ExerciseCategoryFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MasterDataStackParamList>>();
  const route = useRoute<RouteProp<MasterDataStackParamList, 'ExerciseCategoryForm'>>();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const gymId = gymIdFor(profile?.gymId);
  const id = route.params?.id;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseCategoryFormValues>({
    resolver: zodResolver(exerciseCategorySchema),
    defaultValues: { name: '', description: '', sortOrder: '0' },
  });
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void exerciseCategoryService.get(id, gymId).then((item) => {
        if (item)
          reset({
            name: item.name,
            description: item.description,
            sortOrder: String(item.sortOrder),
          });
      });
    }, [gymId, id, reset]),
  );
  const submit = async (values: ExerciseCategoryFormValues) => {
    try {
      if (!user) return;
      const input = {
        name: values.name,
        description: values.description,
        sortOrder: Number(values.sortOrder),
      };
      if (id) await exerciseCategoryService.update(id, gymId, input);
      else await exerciseCategoryService.create(gymId, input, user.uid);
      showToast({
        type: 'success',
        message: `Category ${id ? 'updated' : 'created'}.`,
      });
      navigation.goBack();
    } catch (error) {
      showToast({ type: 'error', message: duplicateMessage(error, 'category') });
    }
  };
  return (
    <ScreenContainer scroll>
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">
          {id ? 'Edit' : 'Add'} Category
        </Text>
        <View className="mt-6 gap-5">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Name"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextInput
                label="Description (optional)"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.description?.message}
                multiline
              />
            )}
          />
          <Controller
            control={control}
            name="sortOrder"
            render={({ field }) => (
              <TextInput
                label="Sort order"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.sortOrder?.message}
                keyboardType="number-pad"
              />
            )}
          />
          <PrimaryButton
            label="Save Category"
            loading={isSubmitting}
            onPress={handleSubmit(submit)}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

export function WorkoutMasterListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MasterDataStackParamList>>();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const gymId = gymIdFor(profile?.gymId);
  const [items, setItems] = useState<WorkoutMaster[]>([]);
  const [filter, setFilter] = useState<WorkoutMasterType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState<WorkoutMaster | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      setItems(await workoutMasterService.list(gymId));
    } catch {
      setError(true);
      showToast({ type: 'error', message: 'Unable to load workouts.' });
    } finally {
      setLoading(false);
    }
  }, [gymId, showToast]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const filtered = useMemo(
    () => items.filter((item) => filter === 'all' || item.workoutType === filter),
    [filter, items],
  );
  const toggle = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await workoutMasterService.setActive(confirm.id, !confirm.isActive);
      showToast({
        type: 'success',
        message: `Workout ${confirm.isActive ? 'deactivated' : 'activated'}.`,
      });
      setConfirm(null);
      await load();
    } catch {
      showToast({ type: 'error', message: 'Unable to update workout.' });
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading workouts..." />
      </ScreenContainer>
    );
  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} />
        }
      >
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">Workouts</Text>
          <View className="mt-5">
            <PrimaryButton
              label="Add Workout"
              onPress={() => navigation.navigate('WorkoutMasterForm', {})}
            />
          </View>
          <View className="mt-4">
            <Chips
              values={Object.keys(workoutTypeLabels) as WorkoutMasterType[]}
              selected={filter}
              labels={workoutTypeLabels}
              onSelect={setFilter}
            />
          </View>
          {error ? (
            <View className="mt-4 gap-3">
              <Empty message="Workout masters could not be loaded." />
              <PrimaryButton
                label="Retry"
                variant="secondary"
                onPress={() => void load()}
              />
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {filtered.map((item) => (
                <View key={item.id} className="rounded-2xl bg-white p-4">
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-lg font-bold text-slate-900">
                        {item.name}
                      </Text>
                      <Text className="mt-1 text-sm text-slate-500">
                        {workoutTypeLabels[item.workoutType]} · Sort {item.sortOrder}
                      </Text>
                    </View>
                    <Status active={item.isActive} />
                  </View>
                  {item.description ? (
                    <Text className="mt-2 text-slate-600">{item.description}</Text>
                  ) : null}
                  <View className="mt-3 flex-row gap-5">
                    <Pressable
                      onPress={() =>
                        navigation.navigate('WorkoutMasterForm', { id: item.id })
                      }
                    >
                      <Text className="font-semibold text-brand-700">Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirm(item)}>
                      <Text className="font-semibold text-brand-700">
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              {!filtered.length ? (
                <Empty message="No workouts match this filter." />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
      {confirm ? (
        <ConfirmStatus
          name={confirm.name}
          active={confirm.isActive}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void toggle()}
        />
      ) : null}
    </ScreenContainer>
  );
}

export function WorkoutMasterFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MasterDataStackParamList>>();
  const route = useRoute<RouteProp<MasterDataStackParamList, 'WorkoutMasterForm'>>();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const gymId = gymIdFor(profile?.gymId);
  const id = route.params?.id;
  const [type, setType] = useState<WorkoutMasterType>('compound');
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkoutMasterFormValues>({
    resolver: zodResolver(workoutMasterSchema),
    defaultValues: {
      name: '',
      description: '',
      sortOrder: '0',
      workoutType: 'compound',
    },
  });
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void workoutMasterService.get(id, gymId).then((item) => {
        if (item) {
          reset({
            name: item.name,
            description: item.description,
            sortOrder: String(item.sortOrder),
            workoutType: item.workoutType,
          });
          setType(item.workoutType);
        }
      });
    }, [gymId, id, reset]),
  );
  const submit = async (values: WorkoutMasterFormValues) => {
    try {
      if (!user) return;
      const input = { ...values, sortOrder: Number(values.sortOrder) };
      if (id) await workoutMasterService.update(id, gymId, input);
      else await workoutMasterService.create(gymId, input, user.uid);
      showToast({
        type: 'success',
        message: `Workout ${id ? 'updated' : 'created'}.`,
      });
      navigation.goBack();
    } catch (error) {
      showToast({ type: 'error', message: duplicateMessage(error, 'workout') });
    }
  };
  return (
    <ScreenContainer scroll>
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">
          {id ? 'Edit' : 'Add'} Workout
        </Text>
        <View className="mt-6 gap-5">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Name"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />
          <Text className="font-semibold text-slate-700">Workout type</Text>
          <Chips
            values={Object.keys(workoutTypeLabels) as WorkoutMasterType[]}
            selected={type}
            labels={workoutTypeLabels}
            includeAll={false}
            onSelect={(value) => {
              if (value !== 'all') {
                setType(value);
                setValue('workoutType', value, { shouldValidate: true });
              }
            }}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextInput
                label="Description (optional)"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.description?.message}
                multiline
              />
            )}
          />
          <Controller
            control={control}
            name="sortOrder"
            render={({ field }) => (
              <TextInput
                label="Sort order"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.sortOrder?.message}
                keyboardType="number-pad"
              />
            )}
          />
          <PrimaryButton
            label="Save Workout"
            loading={isSubmitting}
            onPress={handleSubmit(submit)}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

export function ExerciseLibraryListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MasterDataStackParamList>>();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const gymId = gymIdFor(profile?.gymId);
  const [items, setItems] = useState<ExerciseLibraryItem[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<ExerciseLibraryCursor>();
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState<ExerciseLibraryItem | null>(null);
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);
  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setError(false);
    try {
      const [page, groups] = await Promise.all([
        exerciseLibraryService.listPage({
          gymId,
          categoryId: categoryId === 'all' ? undefined : categoryId,
          search: debouncedSearch,
        }),
        exerciseCategoryService.list(gymId),
      ]);
      if (currentRequest !== requestId.current) return;
      setItems(page.items);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      setCategories(groups);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setError(true);
      const detail =
        error instanceof Error ? error.message : 'An unknown Firestore error occurred.';
      console.error('Exercise page load failed:', error);
      showToast({ type: 'error', message: `Unable to load exercises: ${detail}` });
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [categoryId, debouncedSearch, gymId, showToast]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const loadMore = async () => {
    if (!cursor || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await exerciseLibraryService.listPage({
        gymId,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        search: debouncedSearch,
        cursor,
      });
      setItems((current) => [...current, ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'An unknown Firestore error occurred.';
      console.error('Exercise pagination failed:', error);
      showToast({ type: 'error', message: `Unable to load more: ${detail}` });
    } finally {
      setLoadingMore(false);
    }
  };
  const toggle = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await exerciseLibraryService.setActive(confirm.id, !confirm.isActive);
      showToast({
        type: 'success',
        message: `Exercise ${confirm.isActive ? 'deactivated' : 'activated'}.`,
      });
      setConfirm(null);
      await load();
    } catch {
      showToast({ type: 'error', message: 'Unable to update exercise.' });
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading exercises..." />
      </ScreenContainer>
    );
  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">Exercises</Text>
          <View className="mt-5">
            <PrimaryButton
              label="Add Exercise"
              onPress={() => navigation.navigate('ExerciseLibraryForm', {})}
            />
          </View>
          <View className="mt-4">
            <TextInput
              label="Search exercises"
              value={search}
              onChangeText={setSearch}
              placeholder="Exercise name"
            />
          </View>
          <ScrollView horizontal className="mt-3">
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
          {error ? (
            <View className="mt-4 gap-3">
              <Empty message="Exercise library could not be loaded." />
              <PrimaryButton
                label="Retry"
                variant="secondary"
                onPress={() => void load()}
              />
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {items.map((item) => (
                <View key={item.id} className="rounded-2xl bg-white p-4">
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-slate-900">
                        {item.name}
                      </Text>
                      <Text className="mt-1 text-sm text-slate-500">
                        {categories.find((category) => category.id === item.categoryId)
                          ?.name ?? 'Unknown category'}{' '}
                        · {unitLabels[item.defaultUnitType]}
                      </Text>
                    </View>
                    <Status active={item.isActive} />
                  </View>
                  {item.description ? (
                    <Text className="mt-2 text-slate-600">{item.description}</Text>
                  ) : null}
                  <View className="mt-3 flex-row gap-5">
                    <Pressable
                      onPress={() =>
                        navigation.navigate('ExerciseLibraryForm', { id: item.id })
                      }
                    >
                      <Text className="font-semibold text-brand-700">Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirm(item)}>
                      <Text className="font-semibold text-brand-700">
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              {!items.length ? (
                <Empty message="No exercises match your search or category." />
              ) : null}
              {hasMore ? (
                <PrimaryButton
                  label="Load More"
                  variant="secondary"
                  loading={loadingMore}
                  onPress={() => void loadMore()}
                />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
      {confirm ? (
        <ConfirmStatus
          name={confirm.name}
          active={confirm.isActive}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void toggle()}
        />
      ) : null}
    </ScreenContainer>
  );
}

export function ExerciseLibraryFormScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MasterDataStackParamList>>();
  const route = useRoute<RouteProp<MasterDataStackParamList, 'ExerciseLibraryForm'>>();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const gymId = gymIdFor(profile?.gymId);
  const id = route.params?.id;
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [categoryPicker, setCategoryPicker] = useState(false);
  const [unit, setUnit] = useState<DefaultUnitType>('sets_reps_weight');
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseLibraryFormValues>({
    resolver: zodResolver(exerciseLibrarySchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      categoryName: '',
      defaultUnitType: 'sets_reps_weight',
    },
  });
  const categoryName = useWatch({ control, name: 'categoryName' });
  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        exerciseCategoryService.list(gymId),
        id ? exerciseLibraryService.get(id, gymId) : Promise.resolve(null),
      ]).then(([groups, item]) => {
        setCategories(groups.filter((group) => group.isActive));
        if (item) {
          const category = groups.find((group) => group.id === item.categoryId);
          reset({
            name: item.name,
            description: item.description,
            categoryId: item.categoryId,
            categoryName: category?.name ?? '',
            defaultUnitType: item.defaultUnitType,
          });
          setUnit(item.defaultUnitType);
        }
      });
    }, [gymId, id, reset]),
  );
  const submit = async (values: ExerciseLibraryFormValues) => {
    try {
      if (!user) return;
      const input = {
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        defaultUnitType: values.defaultUnitType,
      };
      if (id) await exerciseLibraryService.update(id, gymId, input);
      else await exerciseLibraryService.create(gymId, input, user.uid);
      showToast({
        type: 'success',
        message: `Exercise ${id ? 'updated' : 'created'}.`,
      });
      navigation.goBack();
    } catch (error) {
      showToast({ type: 'error', message: duplicateMessage(error, 'exercise') });
    }
  };
  return (
    <ScreenContainer scroll>
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">
          {id ? 'Edit' : 'Add'} Exercise
        </Text>
        <View className="mt-6 gap-5">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Name"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />
          <Pressable
            className="rounded-2xl border border-slate-200 bg-white p-4"
            onPress={() => setCategoryPicker(true)}
          >
            <Text className="text-sm font-semibold text-slate-700">Category</Text>
            <Text className="mt-1 text-slate-500">
              {categoryName || 'Select category'}
            </Text>
          </Pressable>
          {errors.categoryId ? (
            <Text className="text-sm text-red-600">{errors.categoryId.message}</Text>
          ) : null}
          <Text className="font-semibold text-slate-700">Default unit type</Text>
          <Chips
            values={Object.keys(unitLabels) as DefaultUnitType[]}
            selected={unit}
            labels={unitLabels}
            includeAll={false}
            onSelect={(value) => {
              if (value !== 'all') {
                setUnit(value);
                setValue('defaultUnitType', value, { shouldValidate: true });
              }
            }}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextInput
                label="Description (optional)"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.description?.message}
                multiline
              />
            )}
          />
          <PrimaryButton
            label="Save Exercise"
            loading={isSubmitting}
            onPress={handleSubmit(submit)}
          />
        </View>
      </View>
      <Modal
        visible={categoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[70%] rounded-t-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">Select category</Text>
            <ScrollView className="mt-4">
              {categories.map((item) => (
                <Pressable
                  key={item.id}
                  className="border-b border-slate-100 py-4"
                  onPress={() => {
                    setValue('categoryId', item.id, { shouldValidate: true });
                    setValue('categoryName', item.name);
                    setCategoryPicker(false);
                  }}
                >
                  <Text className="text-base text-slate-900">{item.name}</Text>
                </Pressable>
              ))}
              {!categories.length ? (
                <Empty message="Create an active category first." />
              ) : null}
            </ScrollView>
            <PrimaryButton
              label="Cancel"
              variant="ghost"
              onPress={() => setCategoryPicker(false)}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
