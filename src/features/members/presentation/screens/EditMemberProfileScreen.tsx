import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { MemberStackParamList } from '../../../../shared/navigation';
import { userService } from '../../../../shared/services';
import type { AdminMemberProfileInput, MemberGoal } from '../../../../shared/types';
import {
  memberProfileSchema,
  type MemberProfileFormValues,
} from '../../domain/member-profile.schemas';

const goals: MemberGoal[] = [
  'Weight Loss',
  'Muscle Gain',
  'General Fitness',
  'Strength',
  'Other',
];
const dateValue = (value?: Timestamp | null) =>
  value ? value.toDate().toISOString().slice(0, 10) : '';
const timestamp = (value: string) =>
  value ? Timestamp.fromDate(new Date(`${value}T00:00:00`)) : undefined;
const localDateValue = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const displayDate = (value: string) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Select date';

function DatePickerField({
  label,
  value,
  maximumDate,
  error,
  onChange,
}: {
  label: string;
  value: string;
  maximumDate?: Date;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const choose = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && date) onChange(localDateValue(date));
  };
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-slate-700">{label}</Text>
      <Pressable
        className={`min-h-14 flex-row items-center justify-between rounded-2xl border bg-white px-4 ${error ? 'border-red-500' : 'border-slate-200'}`}
        onPress={() => setOpen(true)}
      >
        <Text
          className={value ? 'text-base text-slate-900' : 'text-base text-slate-400'}
        >
          {displayDate(value)}
        </Text>
        <Text className="font-semibold text-brand-700">Calendar</Text>
      </Pressable>
      {value ? (
        <Pressable className="mt-2 self-start" onPress={() => onChange('')}>
          <Text className="font-semibold text-brand-700">Clear date</Text>
        </Pressable>
      ) : null}
      {error ? <Text className="mt-1.5 text-sm text-red-600">{error}</Text> : null}
      {open ? (
        <View className="mt-2 rounded-2xl bg-white p-2">
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maximumDate}
            onChange={choose}
          />
          {Platform.OS === 'ios' ? (
            <PrimaryButton
              label="Done"
              variant="ghost"
              onPress={() => setOpen(false)}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function EditMemberProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MemberStackParamList>>();
  const { params } = useRoute<RouteProp<MemberStackParamList, 'EditMemberProfile'>>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MemberProfileFormValues>({
    resolver: zodResolver(memberProfileSchema),
    defaultValues: {
      phone: '',
      age: '',
      gender: '',
      heightCm: '',
      currentWeightKg: '',
      goal: '',
      joiningDate: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      address: '',
      notes: '',
    },
  });
  const goal = useWatch({ control, name: 'goal' });
  const gender = useWatch({ control, name: 'gender' });
  useFocusEffect(
    useCallback(() => {
      void userService
        .getById(params.memberId)
        .then((member) => {
          if (!member) return;
          reset({
            phone: member.phone ?? '',
            age: member.age ? String(member.age) : '',
            gender: member.gender ?? '',
            heightCm: member.heightCm ? String(member.heightCm) : '',
            currentWeightKg: member.currentWeightKg
              ? String(member.currentWeightKg)
              : '',
            goal: member.goal ?? '',
            joiningDate: dateValue(member.joiningDate),
            emergencyContactName: member.emergencyContactName ?? '',
            emergencyContactPhone: member.emergencyContactPhone ?? '',
            address: member.address ?? '',
            notes: member.notes ?? '',
          });
        })
        .catch(() => showToast({ type: 'error', message: 'Unable to load profile.' }))
        .finally(() => setLoading(false));
    }, [params.memberId, reset, showToast]),
  );
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!isDirty || isSubmitting) return;
        event.preventDefault();
        Alert.alert('Discard changes?', 'Your unsaved profile changes will be lost.', [
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
  const submit = async (values: MemberProfileFormValues) => {
    const number = (value: string) => (value ? Number(value) : undefined);
    const input: AdminMemberProfileInput = {
      phone: values.phone || undefined,
      age: number(values.age),
      gender: values.gender || undefined,
      heightCm: number(values.heightCm),
      currentWeightKg: number(values.currentWeightKg),
      goal: values.goal || undefined,
      joiningDate: timestamp(values.joiningDate),
      emergencyContactName: values.emergencyContactName || undefined,
      emergencyContactPhone: values.emergencyContactPhone || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
    };
    try {
      await userService.updateMemberProfile(params.memberId, input);
      reset(values);
      showToast({ type: 'success', message: 'Profile updated.' });
      navigation.goBack();
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'An unknown Firestore error occurred.';
      console.error('Member profile update failed:', error);
      showToast({ type: 'error', message: `Unable to update profile: ${detail}` });
    }
  };
  const fields: {
    name: keyof MemberProfileFormValues;
    label: string;
    keyboardType?: 'number-pad' | 'decimal-pad' | 'phone-pad';
    multiline?: boolean;
  }[] = [
    { name: 'phone', label: 'Phone', keyboardType: 'phone-pad' },
    { name: 'age', label: 'Age', keyboardType: 'number-pad' },
    { name: 'heightCm', label: 'Height (cm)', keyboardType: 'decimal-pad' },
    {
      name: 'currentWeightKg',
      label: 'Current Weight (kg)',
      keyboardType: 'decimal-pad',
    },
    { name: 'emergencyContactName', label: 'Emergency Contact Name' },
    {
      name: 'emergencyContactPhone',
      label: 'Emergency Contact Phone',
      keyboardType: 'phone-pad',
    },
    { name: 'address', label: 'Address', multiline: true },
    { name: 'notes', label: 'Notes', multiline: true },
  ];
  if (loading)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading Profile..." />
      </ScreenContainer>
    );
  return (
    <ScreenContainer scroll>
      <View className="gap-5 px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">Edit Profile</Text>
        {fields.slice(0, 4).map((item) => (
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
                keyboardType={item.keyboardType}
                multiline={item.multiline}
                error={errors[item.name]?.message}
              />
            )}
          />
        ))}
        <Text className="font-semibold text-slate-700">Gender</Text>
        <View className="flex-row gap-2">
          {(['Male', 'Female'] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ checked: gender === item }}
              onPress={() =>
                setValue('gender', item, { shouldDirty: true, shouldValidate: true })
              }
            >
              <Text
                className={`rounded-full px-5 py-2 ${gender === item ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                {gender === item ? '● ' : '○ '}
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text className="font-semibold text-slate-700">Goal</Text>
        <View className="flex-row flex-wrap gap-2">
          {goals.map((item) => (
            <Pressable
              key={item}
              onPress={() => setValue('goal', item, { shouldDirty: true })}
            >
              <Text
                className={`rounded-full px-3 py-2 ${goal === item ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        <Controller
          control={control}
          name="joiningDate"
          render={({ field }) => (
            <DatePickerField
              label="Joining Date"
              value={field.value}
              error={errors.joiningDate?.message}
              onChange={(value) =>
                setValue('joiningDate', value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          )}
        />
        {fields.slice(4).map((item) => (
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
                keyboardType={item.keyboardType}
                multiline={item.multiline}
                error={errors[item.name]?.message}
              />
            )}
          />
        ))}
        <PrimaryButton
          label="Save Profile"
          loading={isSubmitting}
          onPress={handleSubmit(submit)}
        />
      </View>
    </ScreenContainer>
  );
}
