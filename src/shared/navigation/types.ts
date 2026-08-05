export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PendingApproval: undefined;
  AccessRestricted: undefined;
  AdminDashboard: undefined;
  MemberDashboard: undefined;
  MemberWorkoutDetails: { memberWorkoutId: string; workoutName: string };
};

export type MemberTabParamList = {
  Home: undefined;
  Profile: undefined;
};
