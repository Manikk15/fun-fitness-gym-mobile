export type AdminTabParamList = {
  Home: undefined;
  Exercises: undefined;
  Members: undefined;
  Profile: undefined;
};

export type ExerciseStackParamList = {
  ExerciseList: undefined;
  CategoryList: undefined;
  AddCategory: undefined;
  EditCategory: { categoryId: string };
  AddExercise: undefined;
  EditExercise: { exerciseId: string };
};
