import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import type { TrainingPlanStackParamList } from '../../../../shared/navigation';
import { getFriendlyFirebaseError } from '../../../auth/utils/firebase-error';
import { TrainingPlanLifecycleActions } from '../components/TrainingPlanLifecycleActions';
import { TrainingPlanStatusBadge } from '../components/TrainingPlanStatusBadge';
import { trainingPlanService } from '../../services/training-plan.service';
import type { TrainingPlan, TrainingPlanType } from '../../types/training-plan.types';

const typeLabels: Record<TrainingPlanType, string> = {
  compound_full_body: 'Compound Full Body',
  two_muscle_split: 'Two-Muscle Split',
  single_muscle_split: 'Single-Muscle Split',
};

export function TrainingPlanDetailsScreen() {
  const { params } =
    useRoute<RouteProp<TrainingPlanStackParamList, 'TrainingPlanDetails'>>();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<TrainingPlanStackParamList, 'TrainingPlanDetails'>
    >();
  const { showToast } = useToast();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const nextPlan = await trainingPlanService.getTrainingPlan(params.planId);
        if (!nextPlan) throw new Error('training-plan/not-found');
        setPlan(nextPlan);
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

  if (loading) {
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading training plan" />
      </ScreenContainer>
    );
  }

  if (error || !plan) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-slate-900">
            Unable to load training plan
          </Text>
          <View className="mt-5 w-full">
            <PrimaryButton label="Retry" onPress={() => void load()} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const readOnly = plan.status === 'archived' || !plan.active;

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="px-6 py-8">
          <TrainingPlanStatusBadge status={plan.status} />
          <Text className="mt-3 text-3xl font-bold text-slate-900">{plan.name}</Text>
          <Text className="mt-2 font-medium text-slate-600">
            {typeLabels[plan.trainingPlanType]}
          </Text>
          {plan.description ? (
            <Text className="mt-4 text-slate-600">{plan.description}</Text>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-white p-4">
              <Text className="text-2xl font-bold text-slate-900">
                {plan.workoutDayCount}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">Workout days</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white p-4">
              <Text className="text-2xl font-bold text-slate-900">
                {plan.exerciseCount}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">Exercises</Text>
            </View>
          </View>

          {readOnly ? (
            <View className="mt-5 rounded-2xl bg-slate-200 p-4">
              <Text className="font-semibold text-slate-700">
                Archived plans are read-only. Reactivate this plan to make changes.
              </Text>
            </View>
          ) : null}

          <View className="mt-6">
            <PrimaryButton
              label={readOnly ? 'View Workout Days' : 'Manage Workout Days'}
              onPress={() =>
                navigation.navigate('WorkoutDayList', {
                  planId: plan.id,
                  planName: plan.name,
                  readOnly,
                })
              }
            />
          </View>

          <View className="mt-8">
            <Text className="mb-3 text-lg font-bold text-slate-900">
              Lifecycle actions
            </Text>
            <TrainingPlanLifecycleActions plan={plan} onChanged={() => load(true)} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
