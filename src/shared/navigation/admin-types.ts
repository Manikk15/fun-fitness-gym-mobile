export type AdminTabParamList = {
  Home: undefined;
  MasterData: undefined;
  Members: undefined;
  Profile: undefined;
};

export type MasterDataStackParamList = {
  MasterDataHome: undefined;
  WorkoutMasterList: undefined;
  WorkoutMasterForm: { id?: string };
  ExerciseCategoryList: undefined;
  ExerciseCategoryForm: { id?: string };
  ExerciseLibraryList: undefined;
  ExerciseLibraryForm: { id?: string };
};

export type MemberStackParamList = {
  MemberList: undefined;
  MemberDetails: { memberId: string };
  AssignWorkout: { memberId: string };
  AssignedWorkoutDetails: { memberWorkoutId: string; workoutName: string };
  EditMemberProfile: { memberId: string };
  MeasurementForm: { memberId: string; measurementId?: string };
  MeasurementHistory: { memberId: string };
};
