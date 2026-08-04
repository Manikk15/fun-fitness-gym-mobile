import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../auth/context';
import {
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { TrainingPlanStackParamList } from '../../../../shared/navigation';
import { getFriendlyFirebaseError } from '../../../auth/utils/firebase-error';
import { trainingPlanSchema } from '../../schemas/training-plan.schemas';
import { trainingPlanService } from '../../services/training-plan.service';
import type {
  TrainingPlanInput,
  TrainingPlanType,
} from '../../types/training-plan.types';

const planTypes: { label: string; value: TrainingPlanType }[] = [
  { label: 'Compound Full Body', value: 'compound_full_body' },
  { label: 'Two-Muscle Split', value: 'two_muscle_split' },
  { label: 'Single-Muscle Split', value: 'single_muscle_split' },
];

export function CreateTrainingPlanScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<TrainingPlanStackParamList, 'CreateTrainingPlan'>
    >();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrainingPlanInput>({
    resolver: zodResolver(trainingPlanSchema),
    defaultValues: {
      name: '',
      description: null,
      trainingPlanType: undefined,
    },
  });

  const submit = async (values: TrainingPlanInput) => {
    try {
      if (!user || profile?.role !== 'admin' || profile.status !== 'active') {
        showToast({
          type: 'error',
          message: 'Only active administrators can create training plans.',
        });
        return;
      }

      await trainingPlanService.createTrainingPlan(values, user.uid);
      showToast({ type: 'success', message: 'Training plan created.' });
      navigation.goBack();
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error && error.message === 'training-plan/duplicate-name'
            ? 'An active training plan with this name already exists.'
            : getFriendlyFirebaseError(error),
      });
    }
  };

  return (
    <ScreenContainer scroll>
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">Create training plan</Text>
        <Text className="mt-2 text-slate-500">
          Add the plan details. Workout days and exercises can be added later.
        </Text>

        <View className="mt-6 gap-5">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Plan name"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.name?.message}
                placeholder="Plan name"
                maxLength={80}
                editable={!isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextInput
                label="Description (optional)"
                value={field.value ?? ''}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.description?.message}
                placeholder="Describe this training plan"
                multiline
                numberOfLines={4}
                maxLength={300}
                textAlignVertical="top"
                editable={!isSubmitting}
                className={`min-h-28 rounded-2xl border bg-white px-4 py-4 text-base text-slate-900 ${
                  errors.description ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            )}
          />

          <Controller
            control={control}
            name="trainingPlanType"
            render={({ field }) => (
              <View>
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                  Training plan type
                </Text>
                <View className="gap-2">
                  {planTypes.map((option) => {
                    const selected = field.value === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        disabled={isSubmitting}
                        onPress={() => field.onChange(option.value)}
                        className={`rounded-2xl border p-4 ${
                          selected
                            ? 'border-brand-600 bg-emerald-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            selected ? 'text-brand-700' : 'text-slate-700'
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.trainingPlanType ? (
                  <Text className="mt-1.5 text-sm text-red-600">
                    Select a training plan type.
                  </Text>
                ) : null}
              </View>
            )}
          />
        </View>

        <View className="mt-8 gap-3">
          <PrimaryButton
            label="Save Plan"
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSubmit(submit)}
          />
          <PrimaryButton
            label="Cancel"
            variant="ghost"
            disabled={isSubmitting}
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
