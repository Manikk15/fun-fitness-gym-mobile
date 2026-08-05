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
  MemberWorkout,
  MemberWorkoutExercise,
  WorkoutMaster,
} from '../../../shared/types';

const workouts = collection(firestore, 'memberWorkouts');
const workoutExercises = collection(firestore, 'memberWorkoutExercises');

const mapWorkout = (id: string, data: Record<string, unknown>) =>
  ({ id, ...data }) as MemberWorkout;
const mapExercise = (id: string, data: Record<string, unknown>) =>
  ({ id, ...data }) as MemberWorkoutExercise;

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
    return snapshot.docs
      .map((item) => mapExercise(item.id, item.data()))
      .sort((left, right) => left.order - right.order);
  },

  async listExercisesForMember(
    memberId: string,
    memberWorkoutId: string,
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
    return items;
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
