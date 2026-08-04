import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categorySchema, type CategoryFormValues } from '../../domain/category.schema';
import { categoryService } from '../../../../shared/services';
import {
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { ExerciseStackParamList } from '../../../../shared/navigation';
export function EditCategoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ExerciseStackParamList, 'EditCategory'>>();
  const id = (useRoute().params as { categoryId: string }).categoryId;
  const { showToast } = useToast();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });
  useEffect(() => {
    void categoryService.getAll().then((items) => {
      const item = items.find((value) => value.id === id);
      if (item) reset({ name: item.name });
    });
  }, [id, reset]);
  const submit = async (values: CategoryFormValues) => {
    try {
      await categoryService.update(id, values);
      showToast({ type: 'success', message: 'Category updated.' });
      navigation.goBack();
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error && error.message === 'category/duplicate-name'
            ? 'A category with this name already exists.'
            : 'Unable to update category.',
      });
    }
  };
  return (
    <ScreenContainer>
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">Edit category</Text>
        <View className="mt-6">
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Category name"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />
        </View>
        <View className="mt-8">
          <PrimaryButton
            label="Save Changes"
            loading={isSubmitting}
            onPress={handleSubmit(submit)}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
