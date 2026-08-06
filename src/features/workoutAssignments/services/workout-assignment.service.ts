import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../../../shared/services/firebase';
import type {
  AssignmentExerciseInput,
  ExerciseSetDetail,
  MemberWorkout,
  MemberWorkoutExercise,
  WorkoutMaster,
} from '../../../shared/types';

const workouts = collection(firestore, 'memberWorkouts');
const workoutExercises = collection(firestore, 'memberWorkoutExercises');

const mapWorkout = (id: string, data: Record<string, unknown>) =>
  ({ id, ...data }) as MemberWorkout;
const mapExercise = (id: string, data: Record<string, unknown>) => {
  const exercise = { id, ...data } as MemberWorkoutExercise;
  if (exercise.unitType !== 'sets_reps_weight') return exercise;

  const storedSets = Array.isArray(data.setDetails)
    ? data.setDetails.map((value, index) => {
        const set = value as Record<string, unknown>;
        return {
          setNumber: Number(set.setNumber ?? index + 1),
          targetReps: Number(set.targetReps ?? set.reps ?? 0),
          targetWeightKg: Number(set.targetWeightKg ?? set.weightKg ?? 0),
          ...(typeof set.actualReps === 'number' ? { actualReps: set.actualReps } : {}),
          ...(typeof set.actualWeightKg === 'number'
            ? { actualWeightKg: set.actualWeightKg }
            : {}),
          isCompleted: set.isCompleted === true,
          completedAt:
            (set.completedAt as MemberWorkoutExercise['completedAt']) ?? null,
        };
      })
    : [];
  if (storedSets.length) return { ...exercise, setDetails: storedSets };

  const legacySetCount =
    exercise.sets && Number.isInteger(exercise.sets) && exercise.sets > 0
      ? exercise.sets
      : exercise.reps || exercise.weightKg
        ? 1
        : 0;
  if (!legacySetCount) return exercise;

  return {
    ...exercise,
    setDetails: Array.from({ length: legacySetCount }, (_, index) => ({
      setNumber: index + 1,
      targetReps: exercise.reps ?? 0,
      targetWeightKg: exercise.weightKg ?? 0,
      isCompleted: exercise.isCompleted === true,
      completedAt: exercise.completedAt ?? null,
    })),
  };
};

const hydrateSetDetails = async (exercise: MemberWorkoutExercise) => {
  if (exercise.unitType !== 'sets_reps_weight') return exercise;
  let snapshot;
  try {
    snapshot = await getDocs(
      collection(doc(workoutExercises, exercise.id), 'setDetails'),
    );
  } catch (error) {
    if ((error as { code?: string }).code === 'permission-denied') {
      if (__DEV__)
        console.warn(
          '[member-workout] set details unavailable; deploy the latest Firestore rules',
          { exerciseId: exercise.id },
        );
      return exercise;
    }
    throw error;
  }
  if (snapshot.empty) return exercise;
  const savedSets = snapshot.docs.map((item) => item.data() as ExerciseSetDetail);
  const savedByNumber = new Map(savedSets.map((set) => [set.setNumber, set]));
  const combinedSets = (exercise.setDetails ?? []).map(
    (set) => savedByNumber.get(set.setNumber) ?? set,
  );
  savedSets.forEach((set) => {
    if (!combinedSets.some((item) => item.setNumber === set.setNumber))
      combinedSets.push(set);
  });
  return {
    ...exercise,
    setDetails: combinedSets.sort((left, right) => left.setNumber - right.setNumber),
  };
};

export const workoutAssignmentService = {
  async assign({
    gymId,
    memberId,
    workout,
    assignedBy,
    exercises,
  }: {
    gymId: string;
    memberId: string;
    workout: WorkoutMaster;
    assignedBy: string;
    exercises: AssignmentExerciseInput[];
  }): Promise<string> {
    const workoutReference = doc(workouts);
    const batch = writeBatch(firestore);
    const now = new Date();
    const workoutDate = Timestamp.fromDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    batch.set(workoutReference, {
      id: workoutReference.id,
      gymId,
      memberId,
      workoutId: workout.id,
      workoutNameSnapshot: workout.name,
      assignedBy,
      assignedAt: serverTimestamp(),
      workoutDate,
      status: 'assigned',
      exerciseCount: exercises.length,
      completedExerciseCount: 0,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    exercises.forEach((exercise, index) => {
      const exerciseReference = doc(workoutExercises);
      batch.set(exerciseReference, {
        id: exerciseReference.id,
        gymId,
        memberWorkoutId: workoutReference.id,
        memberId,
        ...exercise,
        order: index + 1,
        isCompleted: false,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      exercise.setDetails?.forEach((set) => {
        batch.set(doc(exerciseReference, 'setDetails', String(set.setNumber)), set);
      });
    });
    await batch.commit();
    return workoutReference.id;
  },

  async listForMember(gymId: string, memberId: string): Promise<MemberWorkout[]> {
    const snapshot = await getDocs(
      query(
        workouts,
        where('gymId', '==', gymId),
        where('memberId', '==', memberId),
        orderBy('workoutDate', 'desc'),
        limit(25),
      ),
    );
    return snapshot.docs.map((item) => mapWorkout(item.id, item.data()));
  },

  async getTodayForMember(memberId: string): Promise<MemberWorkout | null> {
    const now = new Date();
    const start = Timestamp.fromDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    const end = Timestamp.fromDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    );
    if (__DEV__)
      console.log('[member-workout] query', {
        memberId,
        status: ['assigned', 'completed'],
        date: start.toDate().toISOString(),
      });
    const snapshot = await getDocs(
      query(
        workouts,
        where('memberId', '==', memberId),
        where('status', 'in', ['assigned', 'completed']),
        where('workoutDate', '>=', start),
        where('workoutDate', '<', end),
        orderBy('workoutDate', 'desc'),
      ),
    );
    const matches = snapshot.docs
      .map((item) => mapWorkout(item.id, item.data()))
      .sort(
        (left, right) =>
          (right.assignedAt?.toMillis() ?? 0) - (left.assignedAt?.toMillis() ?? 0),
      );
    if (__DEV__)
      console.log('[member-workout] result', {
        count: matches.length,
        selectedWorkoutId: matches[0]?.id ?? null,
      });
    return matches[0] ?? null;
  },

  async listExercises(
    gymId: string,
    memberWorkoutId: string,
  ): Promise<MemberWorkoutExercise[]> {
    const snapshot = await getDocs(
      query(
        workoutExercises,
        where('gymId', '==', gymId),
        where('memberWorkoutId', '==', memberWorkoutId),
      ),
    );
    const items = snapshot.docs
      .map((item) => mapExercise(item.id, item.data()))
      .sort((left, right) => left.order - right.order);
    return Promise.all(items.map(hydrateSetDetails));
  },

  async listExercisesForMember(
    memberId: string,
    memberWorkoutId: string,
    includeSetDetails = true,
  ): Promise<MemberWorkoutExercise[]> {
    const snapshot = await getDocs(
      query(
        workoutExercises,
        where('memberId', '==', memberId),
        where('memberWorkoutId', '==', memberWorkoutId),
      ),
    );
    const items = snapshot.docs
      .map((item) => mapExercise(item.id, item.data()))
      .sort((left, right) => left.order - right.order);
    if (__DEV__)
      console.log('[member-workout] exercises', {
        memberWorkoutId,
        count: items.length,
      });
    return includeSetDetails ? Promise.all(items.map(hydrateSetDetails)) : items;
  },

  async getForMember(
    memberWorkoutId: string,
    memberId: string,
  ): Promise<MemberWorkout | null> {
    const snapshot = await getDoc(doc(workouts, memberWorkoutId));
    if (!snapshot.exists() || snapshot.data().memberId !== memberId) return null;
    return mapWorkout(snapshot.id, snapshot.data());
  },

  async setExerciseCompleted(exerciseId: string, isCompleted: boolean): Promise<void> {
    const batch = writeBatch(firestore);
    batch.update(doc(workoutExercises, exerciseId), {
      isCompleted,
      completedAt: isCompleted ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  },

  async saveSetResult({
    exercise,
    setNumber,
    actualReps,
    actualWeightKg,
    allSetsCompleted,
  }: {
    exercise: MemberWorkoutExercise;
    setNumber: number;
    actualReps: number;
    actualWeightKg: number;
    allSetsCompleted: boolean;
  }): Promise<void> {
    const target = exercise.setDetails?.find((set) => set.setNumber === setNumber);
    if (!target) throw new Error('member-workout/set-not-found');
    const batch = writeBatch(firestore);
    const exerciseReference = doc(workoutExercises, exercise.id);
    batch.set(
      doc(exerciseReference, 'setDetails', String(setNumber)),
      {
        setNumber,
        targetReps: target.targetReps,
        targetWeightKg: target.targetWeightKg,
        actualReps,
        actualWeightKg,
        isCompleted: true,
        completedAt: serverTimestamp(),
      },
      { merge: true },
    );
    batch.update(exerciseReference, {
      isCompleted: allSetsCompleted,
      completedAt: allSetsCompleted ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  },

  async finish(memberWorkoutId: string, completedExerciseCount: number) {
    const batch = writeBatch(firestore);
    batch.update(doc(workouts, memberWorkoutId), {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedExerciseCount,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  },
};
