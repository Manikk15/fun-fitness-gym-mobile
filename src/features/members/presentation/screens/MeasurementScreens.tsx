import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  MemberMeasurement,
  MemberMeasurementInput,
} from '../../../../shared/types';
import { useAuth } from '../../../auth/context';
import {
  measurementSchema,
  type MeasurementFormValues,
} from '../../domain/member-profile.schemas';
import { memberMeasurementService } from '../../services';

const fields: { name: Exclude<keyof MeasurementFormValues, 'notes'>; label: string }[] =
  [
    { name: 'weightKg', label: 'Weight (kg)' },
    { name: 'chestCm', label: 'Chest (cm)' },
    { name: 'waistCm', label: 'Waist (cm)' },
    { name: 'armsCm', label: 'Arms (cm)' },
    { name: 'thighsCm', label: 'Thighs (cm)' },
    { name: 'shouldersCm', label: 'Shoulders (cm)' },
    { name: 'hipsCm', label: 'Hips (cm)' },
    { name: 'bodyFatPercent', label: 'Body Fat %' },
  ];
const initial: MeasurementFormValues = {
  weightKg: '',
  chestCm: '',
  waistCm: '',
  armsCm: '',
  thighsCm: '',
  shouldersCm: '',
  hipsCm: '',
  bodyFatPercent: '',
  notes: '',
};
const valuesFor = (item: MemberMeasurement): MeasurementFormValues => ({
  weightKg: item.weightKg ? String(item.weightKg) : '',
  chestCm: item.chestCm ? String(item.chestCm) : '',
  waistCm: item.waistCm ? String(item.waistCm) : '',
  armsCm: item.armsCm ? String(item.armsCm) : '',
  thighsCm: item.thighsCm ? String(item.thighsCm) : '',
  shouldersCm: item.shouldersCm ? String(item.shouldersCm) : '',
  hipsCm: item.hipsCm ? String(item.hipsCm) : '',
  bodyFatPercent: item.bodyFatPercent ? String(item.bodyFatPercent) : '',
  notes: item.notes ?? '',
});
const displayRows = (item: MemberMeasurement) =>
  [
    ['Weight', item.weightKg, 'kg'],
    ['Chest', item.chestCm, 'cm'],
    ['Waist', item.waistCm, 'cm'],
    ['Arms', item.armsCm, 'cm'],
    ['Thighs', item.thighsCm, 'cm'],
    ['Shoulders', item.shouldersCm, 'cm'],
    ['Hips', item.hipsCm, 'cm'],
    ['Body Fat', item.bodyFatPercent, '%'],
  ] as const;

export function MeasurementFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MemberStackParamList>>();
  const { params } = useRoute<RouteProp<MemberStackParamList, 'MeasurementForm'>>();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [formLoading, setFormLoading] = useState(Boolean(params.measurementId));
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: initial,
  });
  useFocusEffect(
    useCallback(() => {
      if (!params.measurementId) return;
      void memberMeasurementService
        .get(params.measurementId)
        .then((item) => {
          if (item) reset(valuesFor(item));
        })
        .catch(() =>
          showToast({ type: 'error', message: 'Unable to load measurement.' }),
        )
        .finally(() => setFormLoading(false));
    }, [params.measurementId, reset, showToast]),
  );
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!isDirty || isSubmitting) return;
        event.preventDefault();
        Alert.alert('Discard changes?', 'Your unsaved measurement will be lost.', [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(event.data.action),
          },
        ]);
      }),
    [isDirty, isSubmitting, navigation],
  );
  const submit = async (values: MeasurementFormValues) => {
    if (!user) return;
    const number = (value: string) => (value ? Number(value) : undefined);
    const input: MemberMeasurementInput = {
      weightKg: number(values.weightKg),
      chestCm: number(values.chestCm),
      waistCm: number(values.waistCm),
      armsCm: number(values.armsCm),
      thighsCm: number(values.thighsCm),
      shouldersCm: number(values.shouldersCm),
      hipsCm: number(values.hipsCm),
      bodyFatPercent: number(values.bodyFatPercent),
      notes: values.notes || undefined,
    };
    try {
      if (params.measurementId)
        await memberMeasurementService.update(
          params.measurementId,
          params.memberId,
          input,
        );
      else
        await memberMeasurementService.create(
          profile?.gymId || DEFAULT_GYM_ID,
          params.memberId,
          user.uid,
          input,
        );
      reset(values);
      showToast({
        type: 'success',
        message: `Measurement ${params.measurementId ? 'updated' : 'added'}.`,
      });
      navigation.goBack();
    } catch {
      showToast({ type: 'error', message: 'Unable to save measurement.' });
    }
  };
  if (formLoading)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading Measurement..." />
      </ScreenContainer>
    );
  return (
    <ScreenContainer scroll>
      <View className="gap-5 px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">
          {params.measurementId ? 'Edit' : 'Add'} Measurement
        </Text>
        {fields.map((item) => (
          <Controller
            key={item.name}
            control={control}
            name={item.name}
            render={({ field }) => (
              <TextInput
                label={item.label}
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                keyboardType="decimal-pad"
                error={errors[item.name]?.message}
              />
            )}
          />
        ))}
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <TextInput
              label="Notes"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              multiline
              error={errors.notes?.message}
            />
          )}
        />
        <PrimaryButton
          label="Save Measurement"
          loading={isSubmitting}
          onPress={handleSubmit(submit)}
        />
      </View>
    </ScreenContainer>
  );
}

export function MeasurementHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MemberStackParamList>>();
  const { params } = useRoute<RouteProp<MemberStackParamList, 'MeasurementHistory'>>();
  const { profile } = useAuth();
  const gymId = profile?.gymId || DEFAULT_GYM_ID;
  const { showToast } = useToast();
  const [items, setItems] = useState<MemberMeasurement[]>([]);
  const [selected, setSelected] = useState<MemberMeasurement>();
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      setItems(await memberMeasurementService.list(gymId, params.memberId));
    } catch {
      showToast({ type: 'error', message: 'Unable to load Measurement History.' });
    } finally {
      setLoading(false);
    }
  }, [gymId, params.memberId, showToast]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const remove = (item: MemberMeasurement) =>
    Alert.alert(
      'Delete measurement?',
      'This measurement will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await memberMeasurementService.delete(item.id);
              setSelected(undefined);
              await load();
              showToast({ type: 'success', message: 'Measurement deleted.' });
            } catch {
              showToast({ type: 'error', message: 'Unable to delete measurement.' });
            }
          },
        },
      ],
    );
  if (loading)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading Measurements..." />
      </ScreenContainer>
    );
  return (
    <ScreenContainer>
      <ScrollView>
        <View className="gap-3 px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">Measurement History</Text>
          {items.map((item) => (
            <Pressable
              key={item.id}
              className="rounded-2xl bg-white p-4"
              onPress={() => setSelected(item)}
            >
              <Text className="text-lg font-bold text-slate-900">
                {item.measuredAt.toDate().toLocaleDateString()}
              </Text>
              {displayRows(item)
                .filter(([, value]) => value !== undefined)
                .slice(0, 4)
                .map(([label, value, unit]) => (
                  <Text key={label} className="mt-1 text-slate-500">
                    {label}: {value} {unit}
                  </Text>
                ))}
            </Pressable>
          ))}
          {!items.length ? (
            <Text className="text-center text-slate-500">No measurements yet.</Text>
          ) : null}
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={Boolean(selected)}
        animationType="slide"
        onRequestClose={() => setSelected(undefined)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <ScrollView className="max-h-[80%] rounded-t-3xl bg-white">
            <View className="gap-3 p-6">
              <Text className="text-2xl font-bold text-slate-900">Measurement</Text>
              <Text className="text-slate-500">
                {selected?.measuredAt.toDate().toLocaleString()}
              </Text>
              {selected
                ? displayRows(selected)
                    .filter(([, value]) => value !== undefined)
                    .map(([label, value, unit]) => (
                      <Text key={label} className="text-base text-slate-700">
                        {label}: {value} {unit}
                      </Text>
                    ))
                : null}
              {selected?.notes ? (
                <Text className="text-slate-600">Notes: {selected.notes}</Text>
              ) : null}
              <PrimaryButton
                label="Edit Measurement"
                onPress={() => {
                  if (!selected) return;
                  setSelected(undefined);
                  navigation.navigate('MeasurementForm', {
                    memberId: params.memberId,
                    measurementId: selected.id,
                  });
                }}
              />
              <PrimaryButton
                label="Delete Measurement"
                variant="secondary"
                onPress={() => {
                  if (selected) remove(selected);
                }}
              />
              <PrimaryButton
                label="Close"
                variant="ghost"
                onPress={() => setSelected(undefined)}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
