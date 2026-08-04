import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { PrimaryButton, useToast } from '../../../../shared/components';
import { getFriendlyFirebaseError } from '../../../auth/utils/firebase-error';
import { trainingPlanService } from '../../services/training-plan.service';
import type { TrainingPlan } from '../../types/training-plan.types';

type LifecycleAction = 'publish' | 'draft' | 'archive' | 'reactivate';

const actionCopy: Record<
  LifecycleAction,
  { button: string; title: string; message: string; success: string }
> = {
  publish: {
    button: 'Publish',
    title: 'Publish training plan?',
    message: 'The plan will become available as a published plan.',
    success: 'Training plan published.',
  },
  draft: {
    button: 'Return to Draft',
    title: 'Return plan to draft?',
    message: 'The published timestamp will be kept as historical metadata.',
    success: 'Training plan returned to draft.',
  },
  archive: {
    button: 'Archive',
    title: 'Archive training plan?',
    message: 'The plan will become read-only until it is reactivated.',
    success: 'Training plan archived.',
  },
  reactivate: {
    button: 'Reactivate',
    title: 'Reactivate training plan?',
    message: 'The plan will return to draft and become editable again.',
    success: 'Training plan reactivated.',
  },
};

export function TrainingPlanLifecycleActions({
  plan,
  onChanged,
}: {
  plan: TrainingPlan;
  onChanged: () => void | Promise<void>;
}) {
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState<LifecycleAction | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const availableActions: LifecycleAction[] =
    plan.status === 'archived'
      ? ['reactivate']
      : plan.status === 'published'
        ? ['draft', 'archive']
        : ['publish', 'archive'];

  const runAction = async () => {
    if (!confirming || submitting) return;
    const action = confirming;
    setSubmitting(true);
    try {
      if (action === 'publish') {
        await trainingPlanService.publishTrainingPlan(plan.id);
      } else if (action === 'draft') {
        await trainingPlanService.moveTrainingPlanToDraft(plan.id);
      } else if (action === 'archive') {
        await trainingPlanService.archiveTrainingPlan(plan.id);
      } else {
        await trainingPlanService.reactivateTrainingPlan(plan.id);
      }
      setConfirming(null);
      showToast({ type: 'success', message: actionCopy[action].success });
      await onChanged();
    } catch (error) {
      if (
        action === 'publish' &&
        error instanceof Error &&
        error.message.startsWith('training-plan/publish:')
      ) {
        setConfirming(null);
        setIssues(
          error.message
            .slice('training-plan/publish:'.length)
            .split('|')
            .filter(Boolean),
        );
      } else {
        showToast({ type: 'error', message: getFriendlyFirebaseError(error) });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="gap-2">
      {availableActions.map((action) => (
        <PrimaryButton
          key={action}
          label={actionCopy[action].button}
          variant={action === 'archive' ? 'ghost' : 'secondary'}
          disabled={submitting}
          onPress={() => setConfirming(action)}
        />
      ))}

      <Modal
        transparent
        visible={confirming !== null}
        animationType="fade"
        onRequestClose={() => setConfirming(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">
              {confirming ? actionCopy[confirming].title : ''}
            </Text>
            <Text className="mt-2 text-slate-500">
              {confirming ? actionCopy[confirming].message : ''}
            </Text>
            <View className="mt-5 gap-3">
              <PrimaryButton
                label={confirming ? actionCopy[confirming].button : 'Confirm'}
                loading={submitting}
                onPress={() => void runAction()}
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

      <Modal
        transparent
        visible={issues.length > 0}
        animationType="fade"
        onRequestClose={() => setIssues([])}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">
              Plan is not ready to publish
            </Text>
            <Text className="mt-2 text-slate-500">Resolve every issue below:</Text>
            <View className="mt-4 gap-3">
              {issues.map((issue) => (
                <View key={issue} className="flex-row">
                  <Text className="mr-2 text-red-600">•</Text>
                  <Text className="flex-1 text-slate-700">{issue}</Text>
                </View>
              ))}
            </View>
            <View className="mt-6">
              <PrimaryButton label="Close" onPress={() => setIssues([])} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
