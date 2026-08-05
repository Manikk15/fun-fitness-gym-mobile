import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
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
      dateOfBirth: '',
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
  useFocusEffect(
    useCallback(() => {
      void userService
        .getById(params.memberId)
        .then((member) => {
          if (!member) return;
          reset({
            phone: member.phone ?? '',
            dateOfBirth: dateValue(member.dateOfBirth),
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
      dateOfBirth: timestamp(values.dateOfBirth),
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
    } catch {
      showToast({ type: 'error', message: 'Unable to update profile.' });
    }
  };
  const fields: {
    name: keyof MemberProfileFormValues;
    label: string;
    keyboardType?: 'number-pad' | 'decimal-pad' | 'phone-pad';
    multiline?: boolean;
  }[] = [
    { name: 'phone', label: 'Phone', keyboardType: 'phone-pad' },
    { name: 'dateOfBirth', label: 'Date of Birth (YYYY-MM-DD)' },
    { name: 'age', label: 'Age', keyboardType: 'number-pad' },
    { name: 'gender', label: 'Gender' },
    { name: 'heightCm', label: 'Height (cm)', keyboardType: 'decimal-pad' },
    {
      name: 'currentWeightKg',
      label: 'Current Weight (kg)',
      keyboardType: 'decimal-pad',
    },
    { name: 'joiningDate', label: 'Joining Date (YYYY-MM-DD)' },
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
        {fields.slice(0, 6).map((item) => (
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
        {fields.slice(6).map((item) => (
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
