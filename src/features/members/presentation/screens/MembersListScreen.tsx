import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../../auth/context';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import { userService } from '../../../../shared/services';
import type { UserProfile } from '../../../../shared/types';

type MemberTab = 'pending' | 'active' | 'restricted';
type Decision = { member: UserProfile; status: 'active' | 'rejected' };

export function MembersListScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [tab, setTab] = useState<MemberTab>('pending');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      setMembers(await userService.getMembers());
    } catch {
      setError(true);
      showToast({ type: 'error', message: 'Could not load members.' });
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
      members.filter(
        (member) =>
          (tab === 'restricted'
            ? member.status === 'inactive' || member.status === 'rejected'
            : member.status === tab) &&
          `${member.name} ${member.email}`
            .toLowerCase()
            .includes(queryText.toLowerCase()),
      ),
    [members, queryText, tab],
  );
  const decide = async () => {
    if (!decision || !user || decision.member.uid === user.uid) return;
    try {
      await userService.setMemberStatus(decision.member.uid, decision.status, user.uid);
      setDecision(null);
      await load();
      showToast({
        type: 'success',
        message: decision.status === 'active' ? 'Member approved.' : 'Member rejected.',
      });
    } catch {
      showToast({ type: 'error', message: 'Unable to update member approval.' });
    }
  };
  if (loading)
    return (
      <ScreenContainer>
        <LoadingSpinner label="Loading members" />
      </ScreenContainer>
    );
  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} />
        }
        className="flex-1"
      >
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">Members</Text>
          <View className="mt-5">
            <TextInput
              label="Search"
              value={queryText}
              onChangeText={setQueryText}
              placeholder="Name or email"
            />
          </View>
          <View className="mt-3 flex-row gap-2">
            {(['pending', 'active', 'restricted'] as const).map((item) => (
              <Pressable key={item} onPress={() => setTab(item)}>
                <Text
                  className={`rounded-full px-3 py-2 text-sm ${tab === item ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  {item === 'restricted' ? 'Inactive/Rejected' : item}
                </Text>
              </Pressable>
            ))}
          </View>
          {error ? (
            <Text className="mt-4 text-red-600">
              Unable to load all members. Pull to refresh.
            </Text>
          ) : null}
          <View className="mt-5 gap-3">
            {filtered.length ? (
              filtered.map((member) => (
                <View key={member.uid} className="rounded-2xl bg-white p-4">
                  <Text className="font-bold text-slate-900">{member.name}</Text>
                  <Text className="mt-1 text-slate-500">{member.email}</Text>
                  <Text className="mt-2 text-sm text-slate-500">
                    {member.status} ·{' '}
                    {member.createdAt?.toDate().toLocaleDateString() ?? 'New member'}
                  </Text>
                  {tab === 'pending' && member.uid !== user?.uid ? (
                    <View className="mt-4 flex-row gap-3">
                      <Pressable
                        onPress={() => setDecision({ member, status: 'active' })}
                      >
                        <Text className="font-semibold text-brand-700">Approve</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setDecision({ member, status: 'rejected' })}
                      >
                        <Text className="font-semibold text-red-600">Reject</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text className="py-10 text-center text-slate-500">
                No {tab} members found.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
      <Modal transparent visible={!!decision} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">
              {decision?.status === 'active' ? 'Approve' : 'Reject'} member?
            </Text>
            <Text className="mt-2 text-slate-500">
              {decision?.member.name} will be{' '}
              {decision?.status === 'active'
                ? 'given access'
                : 'unable to access the gym app'}
              .
            </Text>
            <View className="mt-5 gap-3">
              <PrimaryButton
                label={
                  decision?.status === 'active' ? 'Approve Member' : 'Reject Member'
                }
                onPress={() => void decide()}
              />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                onPress={() => setDecision(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
