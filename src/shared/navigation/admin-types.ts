export type AdminTabParamList = {
  Home: undefined;
  Exercises: undefined;
  Plans: undefined;
  Members: undefined;
  Profile: undefined;
};

export type MemberStackParamList = {
  MemberList: undefined;
  MemberDetails: { memberId: string };
};

export type TrainingPlanStackParamList = {
  TrainingPlanList: undefined;
  CreateTrainingPlan: undefined;
  TrainingPlanDetails: { planId: string };
  WorkoutDayList: { planId: string; planName: string; readOnly: boolean };
  WorkoutExerciseList: {
    planId: string;
    planName: string;
    dayId: string;
    dayName: string;
    readOnly: boolean;
  };
};

export type ExerciseStackParamList = {
  ExerciseList: undefined;
  CategoryList: undefined;
  AddCategory: undefined;
  EditCategory: { categoryId: string };
  AddExercise: undefined;
  EditExercise: { exerciseId: string };
};
