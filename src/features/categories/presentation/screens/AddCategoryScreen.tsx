import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categorySchema, type CategoryFormValues } from '../../domain/category.schema';
import { useAuth } from '../../../auth/context';
import { categoryService } from '../../../../shared/services';
import {
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { ExerciseStackParamList } from '../../../../shared/navigation';
export function AddCategoryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ExerciseStackParamList, 'AddCategory'>>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });
  const submit = async (values: CategoryFormValues) => {
    try {
      if (!user) throw new Error();
      await categoryService.create(values, user.uid);
      showToast({ type: 'success', message: 'Category added.' });
      navigation.goBack();
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error && error.message === 'category/duplicate-name'
            ? 'A category with this name already exists.'
            : 'Unable to add category.',
      });
    }
  };
  return (
    <ScreenContainer>
      <View className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-slate-900">Add category</Text>
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
                placeholder="Category name"
              />
            )}
          />
        </View>
        <View className="mt-8">
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
