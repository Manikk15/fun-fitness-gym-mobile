import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
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
import type { Category, Exercise } from '../../../../shared/types';
import type { ExerciseStackParamList } from '../../../../shared/navigation';
export function ExerciseListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ExerciseStackParamList, 'ExerciseList'>>();
  const { showToast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const load = useCallback(async () => {
    try {
      const [all, groups] = await Promise.all([
        exerciseService.getAll(),
        categoryService.getAll(),
      ]);
      setExercises(all);
      setCategories(groups);
    } catch {
      showToast({ type: 'error', message: 'Could not load exercises.' });
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
      exercises.filter(
        (item) =>
          (categoryId === 'all' || item.categoryId === categoryId) &&
          (status === 'all' || (status === 'active') === item.active) &&
          item.nameLowercase.includes(search.trim().toLowerCase()),
      ),
    [categoryId, exercises, search, status],
  );
  if (loading)
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading exercises" />
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
          <Text className="text-3xl font-bold text-slate-900">Exercises</Text>
          <View className="mt-4">
            <TextInput
              label="Search exercises"
              value={search}
              onChangeText={setSearch}
              placeholder="Search"
            />
          </View>
          <ScrollView horizontal className="mt-3">
            <View className="flex-row gap-2">
              {[{ id: 'all', name: 'All' }, ...categories].map((item) => (
                <Text
                  key={item.id}
                  onPress={() => setCategoryId(item.id)}
                  className={`rounded-full px-3 py-2 text-sm ${categoryId === item.id ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  {item.name}
                </Text>
              ))}
            </View>
          </ScrollView>
          <View className="mt-3 flex-row gap-2">
            {(['all', 'active', 'inactive'] as const).map((item) => (
              <Text
                key={item}
                onPress={() => setStatus(item)}
                className={`rounded-full px-3 py-2 text-sm ${status === item ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                {item}
              </Text>
            ))}
          </View>
          <View className="mt-4 gap-3">
            <PrimaryButton
              label="Add Exercise"
              onPress={() => navigation.navigate('AddExercise')}
            />
            <PrimaryButton
              label="Manage Categories"
              variant="secondary"
              onPress={() => navigation.navigate('CategoryList')}
            />
            {filtered.map((item) => (
              <View key={item.id} className="rounded-2xl bg-white p-4">
                <Text className="font-bold text-slate-900">{item.name}</Text>
                <Text className="mt-1 text-sm text-slate-500">
                  {item.categoryName} · {item.active ? 'Active' : 'Inactive'}
                </Text>
                <Pressable
                  className="mt-3"
                  onPress={() =>
                    navigation.navigate('EditExercise', { exerciseId: item.id })
                  }
                >
                  <Text className="font-semibold text-brand-700">Edit</Text>
                </Pressable>
              </View>
            ))}
            {!filtered.length ? (
              <Text className="py-10 text-center text-slate-500">
                No exercises found.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
