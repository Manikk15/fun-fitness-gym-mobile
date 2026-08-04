import { Text, View } from 'react-native';
import { ScreenContainer } from '../../../../shared/components';

export function CreateTrainingPlanScreen() {
  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-xl font-bold text-slate-900">Create Training Plan</Text>
        <Text className="mt-2 text-center text-slate-500">
          Training plan creation will be added in a future task.
        </Text>
      </View>
    </ScreenContainer>
  );
}
