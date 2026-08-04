import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useAuth } from '../../../auth/context';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
} from '../../../../shared/components';
import type { AdminTabParamList } from '../../../../shared/navigation';
import {
  categoryService,
  exerciseService,
  userService,
} from '../../../../shared/services';

type DashboardData = { members: number; categories: number; exercises: number };

export function AdminDashboard() {
  const navigation =
    useNavigation<BottomTabNavigationProp<AdminTabParamList, 'Home'>>();
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [members, categories, exercises] = await Promise.all([
        userService.getMembers(),
        categoryService.getAll(),
        exerciseService.getAll(),
      ]);
      setData({
        members: members.filter((member) => member.status === 'active').length,
        categories: categories.length,
        exercises: exercises.filter((exercise) => exercise.active).length,
      });
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!data && !error)
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading dashboard" />
      </ScreenContainer>
    );

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        className="flex-1"
      >
        <View className="px-6 py-8">
          <Text className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Admin workspace
          </Text>
          <Text className="mt-2 text-3xl font-bold text-slate-900">
            Hello, {profile?.name ?? 'Admin'}
          </Text>
          {error ? (
            <View className="mt-6 rounded-2xl bg-red-50 p-4">
              <Text className="text-red-700">Could not load dashboard data.</Text>
              <PrimaryButton
                label="Try Again"
                variant="ghost"
                onPress={() => void load()}
              />
            </View>
          ) : null}
          <View className="mt-7 flex-row flex-wrap gap-3">
            {[
              ['Active members', data?.members ?? 0],
              ['Categories', data?.categories ?? 0],
              ['Active exercises', data?.exercises ?? 0],
            ].map(([label, value]) => (
              <View key={String(label)} className="w-[30%] rounded-2xl bg-white p-4">
                <Text className="text-2xl font-bold text-slate-900">{value}</Text>
                <Text className="mt-1 text-xs text-slate-500">{label}</Text>
              </View>
            ))}
          </View>
          <Text className="mt-8 text-lg font-bold text-slate-900">Quick actions</Text>
          <View className="mt-3 gap-3">
            <PrimaryButton
              label="Add Category"
              onPress={() =>
                navigation.navigate('Exercises', { screen: 'AddCategory' } as never)
              }
            />
            <PrimaryButton
              label="Add Exercise"
              variant="secondary"
              onPress={() =>
                navigation.navigate('Exercises', { screen: 'AddExercise' } as never)
              }
            />
            <PrimaryButton
              label="View Members"
              variant="ghost"
              onPress={() => navigation.navigate('Members')}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
