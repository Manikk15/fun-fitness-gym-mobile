import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../../auth/context';
import {
  LoadingSpinner,
  PrimaryButton,
  ScreenContainer,
  TextInput,
  useToast,
} from '../../../../shared/components';
import { userService } from '../../../../shared/services';
import type { MemberStackParamList } from '../../../../shared/navigation';
import type { UserProfile } from '../../../../shared/types';
import { getFriendlyFirebaseError } from '../../../auth/utils/firebase-error';
import { trainingPlanService } from '../../../trainingPlans/services/training-plan.service';
import type {
  TrainingPlan,
  TrainingPlanType,
} from '../../../trainingPlans/types/training-plan.types';

type AssignablePlan = TrainingPlan & { status: 'published'; active: true };

const typeLabels: Record<TrainingPlanType, string> = {
  compound_full_body: 'Compound Full Body',
  two_muscle_split: 'Two-Muscle Split',
  single_muscle_split: 'Single-Muscle Split',
};

export function MemberDetailsScreen() {
  const { params } = useRoute<RouteProp<MemberStackParamList, 'MemberDetails'>>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [member, setMember] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<AssignablePlan[]>([]);
  const [assignerName, setAssignerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState<AssignablePlan | 'remove' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const [nextMember, allPlans] = await Promise.all([
          userService.getById(params.memberId),
          trainingPlanService.listTrainingPlans(),
        ]);
        if (!nextMember) throw new Error('member/not-found');
        setMember(nextMember);
        setPlans(
          allPlans.filter(
            (plan): plan is AssignablePlan =>
              plan.status === 'published' && plan.active === true,
          ),
        );
        if (nextMember.assignedBy) {
          const assigner = await userService.getById(nextMember.assignedBy);
          setAssignerName(assigner?.name ?? nextMember.assignedBy);
        } else {
          setAssignerName(null);
        }
      } catch (loadError) {
        setError(true);
        showToast({ type: 'error', message: getFriendlyFirebaseError(loadError) });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params.memberId, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    return plans.filter((plan) => plan.nameLowercase.includes(query));
  }, [plans, search]);

  const canAssign =
    member?.role === 'member' && member.status === 'active' && member.uid !== user?.uid;

  const openPicker = () => {
    if (!canAssign) return;
    setSearch('');
    setPickerVisible(true);
  };

  const confirm = async () => {
    if (!member || !user || !confirming || submitting) return;
    setSubmitting(true);
    try {
      const nextPlan = confirming === 'remove' ? null : confirming;
      await userService.assignTrainingPlan(member.uid, nextPlan, user.uid);
      setConfirming(null);
      showToast({
        type: 'success',
        message: nextPlan ? 'Training plan assigned.' : 'Assignment removed.',
      });
      await load(true);
    } catch (assignmentError) {
      const message =
        assignmentError instanceof Error &&
        assignmentError.message === 'assignment/member-not-active'
          ? 'Only approved active members can receive a training plan.'
          : assignmentError instanceof Error &&
              assignmentError.message === 'assignment/plan-not-published'
            ? 'This plan is no longer published and active.'
            : getFriendlyFirebaseError(assignmentError);
      showToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer contentClassName="items-center justify-center">
        <LoadingSpinner label="Loading member" />
      </ScreenContainer>
    );
  }

  if (error || !member) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-slate-900">
            Unable to load member
          </Text>
          <View className="mt-5 w-full">
            <PrimaryButton label="Retry" onPress={() => void load()} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
        }
      >
        <View className="px-6 py-8">
          <Text className="text-3xl font-bold text-slate-900">{member.name}</Text>
          <Text className="mt-1 text-slate-500">{member.email}</Text>
          <Text className="mt-2 text-sm font-semibold capitalize text-slate-600">
            {member.status} member
          </Text>

          <View className="mt-8 rounded-2xl bg-white p-5">
            <Text className="text-xl font-bold text-slate-900">
              Assigned Training Plan
            </Text>
            {member.assignedTrainingPlanId ? (
              <View className="mt-4 gap-2">
                <Text className="text-lg font-bold text-slate-900">
                  {member.assignedTrainingPlanNameSnapshot}
                </Text>
                <Text className="text-slate-600">
                  Training type:{' '}
                  {member.assignedTrainingPlanType
                    ? typeLabels[member.assignedTrainingPlanType]
                    : 'Unknown'}
                </Text>
                <Text className="text-slate-600">
                  Assigned date:{' '}
                  {member.assignedAt?.toDate().toLocaleDateString() ?? 'Pending sync'}
                </Text>
                <Text className="text-slate-600">
                  Assigned by: {assignerName ?? member.assignedBy ?? 'Unknown'}
                </Text>
                <Text className="text-slate-600">Status: Published</Text>
              </View>
            ) : (
              <Text className="mt-4 text-slate-500">No training plan assigned.</Text>
            )}

            {canAssign ? (
              <View className="mt-6 gap-3">
                <PrimaryButton
                  label={
                    member.assignedTrainingPlanId
                      ? 'Change Assigned Plan'
                      : 'Assign Plan'
                  }
                  onPress={openPicker}
                />
                {member.assignedTrainingPlanId ? (
                  <PrimaryButton
                    label="Clear Assignment"
                    variant="ghost"
                    onPress={() => setConfirming('remove')}
                  />
                ) : null}
              </View>
            ) : (
              <View className="mt-5 rounded-2xl bg-amber-50 p-4">
                <Text className="font-semibold text-amber-800">
                  Only approved active members can receive training plans.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <ScreenContainer>
          <View className="flex-1 px-6 py-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-slate-900">Select plan</Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <Text className="font-semibold text-brand-700">Cancel</Text>
              </Pressable>
            </View>
            <View className="mt-5">
              <TextInput
                label="Search published plans"
                value={search}
                onChangeText={setSearch}
                placeholder="Search by plan name"
              />
            </View>
            <ScrollView className="mt-4" keyboardShouldPersistTaps="handled">
              <View className="gap-3 pb-8">
                {filteredPlans.map((plan) => (
                  <Pressable
                    key={plan.id}
                    disabled={plan.id === member.assignedTrainingPlanId}
                    onPress={() => {
                      setPickerVisible(false);
                      setConfirming(plan);
                    }}
                    className={`rounded-2xl bg-white p-4 ${
                      plan.id === member.assignedTrainingPlanId ? 'opacity-50' : ''
                    }`}
                  >
                    <Text className="font-bold text-slate-900">{plan.name}</Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {typeLabels[plan.trainingPlanType]}
                    </Text>
                  </Pressable>
                ))}
                {!filteredPlans.length ? (
                  <Text className="py-10 text-center text-slate-500">
                    No published active plans found.
                  </Text>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </ScreenContainer>
      </Modal>

      <Modal
        transparent
        visible={confirming !== null}
        animationType="fade"
        onRequestClose={() => setConfirming(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">
              {confirming === 'remove'
                ? 'Clear training plan assignment?'
                : member.assignedTrainingPlanId
                  ? 'Change assigned training plan?'
                  : 'Assign training plan?'}
            </Text>
            <Text className="mt-2 text-slate-500">
              {confirming === 'remove'
                ? `${member.name} will no longer have an assigned training plan.`
                : `${confirming ? confirming.name : ''} will be assigned to ${member.name}.`}
            </Text>
            <View className="mt-5 gap-3">
              <PrimaryButton
                label={
                  confirming === 'remove' ? 'Clear Assignment' : 'Confirm Assignment'
                }
                loading={submitting}
                onPress={() => void confirm()}
              />
              <PrimaryButton
                label="Cancel"
                variant="ghost"
                disabled={submitting}
                onPress={() => setConfirming(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
