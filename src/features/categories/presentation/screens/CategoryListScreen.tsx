import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categoryService, exerciseService } from '../../../../shared/services';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import type { Category } from '../../../../shared/types';
import type { ExerciseStackParamList } from '../../../../shared/navigation';

export function CategoryListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ExerciseStackParamList, 'CategoryList'>>();
  const { showToast } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [confirm, setConfirm] = useState<Category | null>(null);
  const load = useCallback(async () => {
    try {
      const [categories, exercises] = await Promise.all([
        categoryService.getAll(),
        exerciseService.getAll(),
      ]);
      setItems(categories);
      setCounts(
        Object.fromEntries(
          categories.map((category) => [
            category.id,
            exercises.filter(
              (exercise) => exercise.categoryId === category.id && exercise.active,
            ).length,
          ]),
        ),
      );
    } catch {
      showToast({ type: 'error', message: 'Could not load categories.' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const filtered = useMemo(
    () =>
      items.filter((item) =>
        item.nameLowercase.includes(queryText.trim().toLowerCase()),
      ),
    [items, queryText],
  );
  const toggle = async () => {
    if (!confirm) return;
    try {
      await categoryService.setActive(confirm.id, !confirm.active);
      setConfirm(null);
      await load();
    } catch {
      showToast({ type: 'error', message: 'Unable to update category.' });
    }
  };
  if (loading)
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading categories" />
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
          <Text className="text-3xl font-bold text-slate-900">Categories</Text>
          <View className="mt-4">
            <TextInput
              label="Search categories"
              value={queryText}
              onChangeText={setQueryText}
              placeholder="Search"
            />
          </View>
          <View className="mt-4 gap-3">
            <PrimaryButton
              label="Add Category"
              onPress={() => navigation.navigate('AddCategory')}
            />
            {filtered.map((item) => (
              <View key={item.id} className="rounded-2xl bg-white p-4">
                <Text className="font-bold text-slate-900">{item.name}</Text>
                <Text className="mt-1 text-sm text-slate-500">
                  {item.active ? 'Active' : 'Inactive'} · {counts[item.id] ?? 0} active
                  exercises
                </Text>
                <View className="mt-3 flex-row gap-4">
                  <Pressable
                    onPress={() =>
                      navigation.navigate('EditCategory', { categoryId: item.id })
                    }
                  >
                    <Text className="font-semibold text-brand-700">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirm(item)}>
                    <Text className="font-semibold text-brand-700">
                      {item.active ? 'Disable' : 'Reactivate'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {!filtered.length ? (
              <Text className="py-10 text-center text-slate-500">
                No categories found.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
      <Modal transparent visible={!!confirm} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">
              {confirm?.active ? 'Disable' : 'Reactivate'} category?
            </Text>
            <Text className="mt-2 text-slate-500">Exercises will not be deleted.</Text>
            <View className="mt-5 gap-3">
              <PrimaryButton
                label={confirm?.active ? 'Disable' : 'Reactivate'}
                onPress={() => void toggle()}
              />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={() => setConfirm(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
