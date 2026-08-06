import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  useToast,
} from '../../../../shared/components';
import { DEFAULT_GYM_ID } from '../../../../shared/constants';
import { userService } from '../../../../shared/services';
import {
  attendanceDate,
  type AttendanceRecord,
  type AttendanceStatus,
  type UserProfile,
} from '../../../../shared/types';
import { useAuth } from '../../../auth/context';
import { attendanceService } from '../../services';

export function TodayAttendanceScreen() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const gymId = profile?.gymId || DEFAULT_GYM_ID;
  const date = attendanceDate();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [dirtyIds, setDirtyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const [allMembers, todayRecords] = await Promise.all([
          userService.getMembers(),
          attendanceService.listForDate(gymId, date),
        ]);
        setMembers(
          allMembers.filter(
            (member) =>
              member.status === 'active' && (member.gymId || DEFAULT_GYM_ID) === gymId,
          ),
        );
        setRecords(todayRecords);
        setStatuses(
          Object.fromEntries(
            todayRecords.map((record) => [record.memberId, record.status]),
          ),
        );
        setDirtyIds([]);
      } catch (loadError) {
        console.error('Attendance load failed:', loadError);
        setError(true);
        showToast({ type: 'error', message: "Unable to load today's Attendance." });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [date, gymId, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggle = (memberId: string) => {
    setStatuses((current) => ({
      ...current,
      [memberId]: current[memberId] === 'present' ? 'absent' : 'present',
    }));
    setDirtyIds((current) =>
      current.includes(memberId) ? current : [...current, memberId],
    );
  };

  const save = async () => {
    if (!user || !dirtyIds.length || saving) return;
    setSaving(true);
    try {
      await attendanceService.save({
        gymId,
        date,
        markedBy: user.uid,
        statuses: dirtyIds.map((memberId) => ({
          memberId,
          status: statuses[memberId],
        })),
        existingMemberIds: new Set(records.map((record) => record.memberId)),
      });
      showToast({ type: 'success', message: 'Attendance saved.' });
      await load();
    } catch (saveError) {
      console.error('Attendance save failed:', saveError);
      showToast({ type: 'error', message: 'Unable to save Attendance.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading attendance" />
      </ScreenContainer>
    );

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="gap-4 px-6 py-8">
          <View>
            <Text className="text-3xl font-bold text-slate-900">
              Today&apos;s Attendance
            </Text>
            <Text className="mt-1 text-slate-500">{date}</Text>
          </View>
          {error ? (
            <View className="gap-3 rounded-2xl bg-red-50 p-4">
              <Text className="text-red-700">Unable to load Attendance.</Text>
              <PrimaryButton
                label="Try Again"
                variant="ghost"
                onPress={() => void load()}
              />
            </View>
          ) : (
            <>
              <Text className="text-sm text-slate-500">
                Tap a member to mark Present. Tap again to mark Absent.
              </Text>
              <View className="gap-3">
                {members.map((member) => {
                  const status = statuses[member.uid];
                  return (
                    <Pressable
                      key={member.uid}
                      className={`rounded-2xl border p-4 ${status === 'present' ? 'border-green-300 bg-green-50' : status === 'absent' ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
                      onPress={() => toggle(member.uid)}
                    >
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-1">
                          <Text className="font-bold text-slate-900">
                            {member.name}
                          </Text>
                          <Text className="mt-1 text-slate-500">{member.email}</Text>
                        </View>
                        <Text
                          className={`font-bold capitalize ${status === 'present' ? 'text-green-700' : status === 'absent' ? 'text-red-700' : 'text-slate-400'}`}
                        >
                          {status ?? 'Not marked'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
                {!members.length ? (
                  <Text className="py-8 text-center text-slate-500">
                    No active members found.
                  </Text>
                ) : null}
              </View>
              <PrimaryButton
                label="Save Attendance"
                loading={saving}
                disabled={!dirtyIds.length}
                onPress={() => void save()}
              />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
