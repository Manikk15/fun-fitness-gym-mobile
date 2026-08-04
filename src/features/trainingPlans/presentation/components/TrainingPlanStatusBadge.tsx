import { Text, View } from 'react-native';
import type { TrainingPlanStatus } from '../../types/training-plan.types';

const badgeClasses: Record<TrainingPlanStatus, string> = {
  draft: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-200 text-slate-700',
};

export function TrainingPlanStatusBadge({ status }: { status: TrainingPlanStatus }) {
  return (
    <View className="self-start">
      <Text
        className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClasses[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}
