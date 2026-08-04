import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { exerciseSchema, type ExerciseFormValues } from '../../domain/exercise.schema';
import { useAuth } from '../../../auth/context';
import { categoryService, exerciseService } from '../../../../shared/services';
import {
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { Category } from '../../../../shared/types';
import type { ExerciseStackParamList } from '../../../../shared/navigation';
export function AddExerciseScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ExerciseStackParamList, 'AddExercise'>>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [picker, setPicker] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: { name: '', categoryId: '', categoryName: '' },
  });
  const categoryName = useWatch({ control, name: 'categoryName' });
  useEffect(() => {
    void categoryService
      .getAll()
      .then((items) => setCategories(items.filter((item) => item.active)));
  }, []);
  const submit = async (values: ExerciseFormValues) => {
    try {
      if (!user) throw new Error();
      await exerciseService.create(values, user.uid);
      showToast({ type: 'success', message: 'Exercise added.' });
      navigation.goBack();
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error && error.message === 'exercise/duplicate-name'
            ? 'This exercise already exists in the selected category.'
            : 'Unable to add exercise.',
      });
    }
  };
  return (
    <ScreenContainer scroll>
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">Add exercise</Text>
        <View className="mt-6 gap-5">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Exercise name"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />
          <Pressable
            onPress={() => setPicker(true)}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <Text className="text-sm font-semibold text-slate-700">Category</Text>
            <Text className="mt-1 text-slate-500">
              {categoryName || 'Select category'}
            </Text>
          </Pressable>
          {errors.categoryId ? (
            <Text className="text-sm text-red-600">{errors.categoryId.message}</Text>
          ) : null}
        </View>
        <View className="mt-8">
          <PrimaryButton
            label="Save Exercise"
            loading={isSubmitting}
            onPress={handleSubmit(submit)}
          />
        </View>
      </View>
      <Modal visible={picker} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[70%] rounded-t-3xl bg-white p-6">
            <Text className="text-xl font-bold">Select category</Text>
            <ScrollView className="mt-4">
              {categories.map((item) => (
                <Pressable
                  key={item.id}
                  className="border-b border-slate-100 py-4"
                  onPress={() => {
                    setValue('categoryId', item.id, { shouldValidate: true });
                    setValue('categoryName', item.name, { shouldValidate: true });
                    setPicker(false);
                  }}
                >
                  <Text className="text-base text-slate-900">{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <PrimaryButton
              label="Cancel"
              variant="ghost"
              onPress={() => setPicker(false)}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
