import { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useAuth } from '../../../auth/context';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
} from '../../../../shared/components';
import type { AdminTabParamList } from '../../../../shared/navigation';
import { userService } from '../../../../shared/services';
import { attendanceDate } from '../../../../shared/types';
import { DEFAULT_GYM_ID } from '../../../../shared/constants';
import { attendanceService } from '../../../attendance';

type DashboardData = { members: number; present: number; absent: number };

export function AdminDashboard() {
  const navigation =
    useNavigation<BottomTabNavigationProp<AdminTabParamList, 'Home'>>();
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const gymId = profile?.gymId || DEFAULT_GYM_ID;

  const load = useCallback(async () => {
    setError(false);
    try {
      const [allMembers, attendance] = await Promise.all([
        userService.getMembers(),
        attendanceService.listForDate(gymId, attendanceDate()),
      ]);
      const members = allMembers.filter(
        (member) =>
          member.status === 'active' && (member.gymId || DEFAULT_GYM_ID) === gymId,
      );
      setData({
        members: members.length,
        present: attendance.filter((record) => record.status === 'present').length,
        absent: attendance.filter((record) => record.status === 'absent').length,
      });
    } catch {
      setError(true);
    }
  }, [gymId]);

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
          <View className="flex-row items-center gap-3">
            <Image
              accessibilityLabel="Fun Fitness Gym logo"
              className="h-12 w-12 rounded-2xl"
              resizeMode="contain"
              source={require('../../../../../assets/fun-fitness-logo-full.png')}
            />
            <View>
              <Text className="text-base font-bold text-slate-900">
                Fun Fitness Gym
              </Text>
              <Text className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Admin workspace
              </Text>
            </View>
          </View>
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
          <View className="mt-7 flex-row gap-3">
            {[
              ['Total Members', data?.members ?? 0],
              ['Present Today', data?.present ?? 0],
              ['Absent Today', data?.absent ?? 0],
            ].map(([label, value]) => (
              <View key={String(label)} className="flex-1 rounded-2xl bg-white p-4">
                <Text className="text-2xl font-bold text-slate-900">{value}</Text>
                <Text className="mt-1 text-xs text-slate-500">{label}</Text>
              </View>
            ))}
          </View>
          <Text className="mt-8 text-lg font-bold text-slate-900">Quick actions</Text>
          <View className="mt-3 gap-3">
            <PrimaryButton
              label="Manage Master Data"
              onPress={() => navigation.navigate('MasterData')}
            />
            <PrimaryButton
              label="Attendance"
              variant="secondary"
              onPress={() => navigation.navigate('Attendance')}
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
