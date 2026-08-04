import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { TrainingPlanStackParamList } from '../../../../shared/navigation';
import { trainingPlanService } from '../../services/training-plan.service';
import type {
  TrainingPlan,
  TrainingPlanStatus,
  TrainingPlanType,
} from '../../types/training-plan.types';

type TypeFilter = 'all' | TrainingPlanType;
type StatusFilter = 'all' | TrainingPlanStatus;

const typeLabels: Record<TrainingPlanType, string> = {
  compound_full_body: 'Compound Full Body',
  two_muscle_split: 'Two Muscle Split',
  single_muscle_split: 'Single Muscle Split',
};

const typeFilters: TypeFilter[] = [
  'all',
  'compound_full_body',
  'two_muscle_split',
  'single_muscle_split',
];
const statusFilters: StatusFilter[] = ['all', 'draft', 'published', 'archived'];

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-full px-3 py-2 ${selected ? 'bg-brand-600' : 'bg-slate-200'}`}
    >
      <Text className={`text-sm ${selected ? 'text-white' : 'text-slate-700'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TrainingPlanListScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<TrainingPlanStackParamList, 'TrainingPlanList'>
    >();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        setPlans(await trainingPlanService.listTrainingPlans());
      } catch {
        setError(true);
        showToast({ type: 'error', message: 'Could not load training plans.' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return plans.filter(
      (plan) =>
        (type === 'all' || plan.trainingPlanType === type) &&
        (status === 'all' || plan.status === status) &&
        plan.name.toLowerCase().includes(query),
    );
  }, [plans, search, status, type]);

  if (loading) {
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading training plans" />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-slate-900">
            Unable to load training plans
          </Text>
          <Text className="mt-2 text-center text-slate-500">
            Check your connection and try again.
          </Text>
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
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">Training Plans</Text>
          <View className="mt-4">
            <TextInput
              label="Search plans"
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name"
            />
          </View>

          <Text className="mb-2 mt-4 text-sm font-semibold text-slate-700">
            Plan type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {typeFilters.map((item) => (
                <FilterChip
                  key={item}
                  label={item === 'all' ? 'All' : typeLabels[item]}
                  selected={type === item}
                  onPress={() => setType(item)}
                />
              ))}
            </View>
          </ScrollView>

          <Text className="mb-2 mt-4 text-sm font-semibold text-slate-700">Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {statusFilters.map((item) => (
              <FilterChip
                key={item}
                label={item.charAt(0).toUpperCase() + item.slice(1)}
                selected={status === item}
                onPress={() => setStatus(item)}
              />
            ))}
          </View>

          <View className="mt-5 gap-3">
            {filtered.map((plan) => (
              <View key={plan.id} className="rounded-2xl bg-white p-4">
                <Text className="text-lg font-bold text-slate-900">{plan.name}</Text>
                <Text className="mt-1 text-sm text-slate-500">
                  {typeLabels[plan.trainingPlanType]} ·{' '}
                  {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                </Text>
                <Text className="mt-3 text-sm font-medium text-slate-700">
                  {plan.workoutDayCount} workout{' '}
                  {plan.workoutDayCount === 1 ? 'day' : 'days'} · {plan.exerciseCount}{' '}
                  {plan.exerciseCount === 1 ? 'exercise' : 'exercises'}
                </Text>
              </View>
            ))}
            {!filtered.length ? (
              <View className="items-center py-12">
                <Text className="text-lg font-semibold text-slate-700">
                  No training plans found
                </Text>
                <Text className="mt-1 text-center text-slate-500">
                  Try changing your search or filters.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add training plan"
        onPress={() => navigation.navigate('CreateTrainingPlan')}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-brand-600 shadow-lg"
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
    </ScreenContainer>
  );
}
