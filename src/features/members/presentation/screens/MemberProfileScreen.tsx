import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import type { MemberTabParamList } from '../../../../shared/navigation';
import type { MemberMeasurement } from '../../../../shared/types';
import { useAuth } from '../../../auth/context';
import { memberMeasurementService } from '../../services';

const measurementRows = (item: MemberMeasurement) =>
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

export function MemberProfileScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<MemberTabParamList, 'Profile'>>();
  const { user, profile, refreshProfile, logout } = useAuth();
  const { showToast } = useToast();
  const [measurements, setMeasurements] = useState<MemberMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (!user) return;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const currentProfile = await refreshProfile();
        if (!currentProfile || currentProfile.uid !== user.uid)
          throw new Error('member/id-mismatch');
        setMeasurements(
          await memberMeasurementService.listForMember(currentProfile.uid),
        );
      } catch (loadError) {
        console.error('Member profile and measurements load failed:', loadError);
        setError(true);
        showToast({ type: 'error', message: 'Unable to load Profile.' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [refreshProfile, showToast, user],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const signOut = async () => {
    try {
      await logout();
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      showToast({ type: 'error', message: 'Unable to sign out. Please try again.' });
    }
  };

  if (loading)
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading Profile..." />
      </ScreenContainer>
    );

  const profileRows = [
    ['Phone', profile?.phone],
    ['Age', profile?.age],
    ['Gender', profile?.gender],
    ['Height', profile?.heightCm ? `${profile.heightCm} cm` : undefined],
    [
      'Current Weight',
      profile?.currentWeightKg ? `${profile.currentWeightKg} kg` : undefined,
    ],
    ['Goal', profile?.goal],
    ['Joining Date', profile?.joiningDate?.toDate().toLocaleDateString()],
    [
      'Emergency Contact',
      profile?.emergencyContactName
        ? `${profile.emergencyContactName}${profile.emergencyContactPhone ? ` · ${profile.emergencyContactPhone}` : ''}`
        : profile?.emergencyContactPhone,
    ],
    ['Address', profile?.address],
    ['Notes', profile?.notes],
  ] as const;

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">Profile</Text>
          {error ? (
            <Text className="mt-3 text-amber-700">
              Some profile information could not be loaded. Pull down to retry.
            </Text>
          ) : null}
          <View className="mt-7 rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">{profile?.name}</Text>
            <Text className="mt-2 text-slate-500">{profile?.email}</Text>
            <Text className="mt-3 self-start rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold capitalize text-emerald-800">
              {profile?.status} member
            </Text>
            {profileRows.map(([label, value]) =>
              value ? (
                <View key={label} className="mt-4">
                  <Text className="text-sm font-semibold text-slate-500">{label}</Text>
                  <Text className="mt-1 text-base text-slate-900">{value}</Text>
                </View>
              ) : null,
            )}
          </View>

          <Text className="mt-8 text-2xl font-bold text-slate-900">
            Measurement History
          </Text>
          <View className="mt-4 gap-3">
            {measurements.map((item) => (
              <View key={item.id} className="rounded-2xl bg-white p-4">
                <Text className="text-lg font-bold text-slate-900">
                  {item.measuredAt.toDate().toLocaleDateString()}
                </Text>
                {measurementRows(item)
                  .filter(([, value]) => value !== undefined)
                  .map(([label, value, unit]) => (
                    <Text key={label} className="mt-1 text-slate-600">
                      {label}: {value} {unit}
                    </Text>
                  ))}
                {item.notes ? (
                  <Text className="mt-2 text-slate-500">Notes: {item.notes}</Text>
                ) : null}
              </View>
            ))}
            {!measurements.length && !error ? (
              <Text className="text-center text-slate-500">No measurements yet.</Text>
            ) : null}
          </View>
          <View className="mt-8">
            <PrimaryButton
              label="Sign Out"
              variant="ghost"
              onPress={() => void signOut()}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
