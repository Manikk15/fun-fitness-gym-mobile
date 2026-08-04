import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../../../shared/services/firebase';
import type { Exercise } from '../../../shared/types';
import type {
  PlanExercise,
  PlanExerciseInput,
  TrainingPlan,
  TrainingPlanInput,
  WorkoutDay,
  WorkoutDayInput,
} from '../types/training-plan.types';

const plans = collection(firestore, 'trainingPlans');
const lower = (value: string) => value.trim().toLowerCase();
const asPlan = (id: string, data: Record<string, unknown>) =>
  ({ id, ...data }) as TrainingPlan;
const asDay = (id: string, data: Record<string, unknown>) =>
  ({ id, ...data }) as WorkoutDay;
const asItem = (id: string, data: Record<string, unknown>) =>
  ({ id, ...data }) as PlanExercise;
const days = (planId: string) =>
  collection(firestore, 'trainingPlans', planId, 'workoutDays');
const items = (planId: string, dayId: string) =>
  collection(firestore, 'trainingPlans', planId, 'workoutDays', dayId, 'exercises');

export const trainingPlanService = {
  async listTrainingPlans() {
    const s = await getDocs(query(plans, orderBy('nameLowercase')));
    return s.docs.map((d) => asPlan(d.id, d.data()));
  },
  async getTrainingPlan(id: string) {
    const s = await getDoc(doc(plans, id));
    return s.exists() ? asPlan(s.id, s.data()) : null;
  },
  async createTrainingPlan(input: TrainingPlanInput, uid: string) {
    const name = input.name.trim();
    const duplicate = await getDocs(
      query(
        plans,
        where('nameLowercase', '==', lower(name)),
        where('active', '==', true),
      ),
    );
    if (!duplicate.empty) throw new Error('training-plan/duplicate-name');
    const ref = doc(plans);
    await setDoc(ref, {
      id: ref.id,
      name,
      nameLowercase: lower(name),
      description: input.description?.trim() || null,
      trainingPlanType: input.trainingPlanType,
      status: 'draft',
      active: true,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: null,
      archivedAt: null,
      workoutDayCount: 0,
      exerciseCount: 0,
    });
    return ref.id;
  },
  async updateTrainingPlan(id: string, input: TrainingPlanInput) {
    await updateDoc(doc(plans, id), {
      name: input.name.trim(),
      nameLowercase: lower(input.name),
      description: input.description?.trim() || null,
      trainingPlanType: input.trainingPlanType,
      updatedAt: serverTimestamp(),
    });
  },
  async listWorkoutDays(planId: string) {
    const s = await getDocs(query(days(planId), orderBy('order')));
    return s.docs.map((d) => asDay(d.id, d.data()));
  },
  async listPlanExercises(planId: string, dayId: string) {
    const s = await getDocs(query(items(planId, dayId), orderBy('order')));
    return s.docs.map((d) => asItem(d.id, d.data()));
  },
  async createWorkoutDay(planId: string, input: WorkoutDayInput) {
    const existing = await this.listWorkoutDays(planId);
    const ref = doc(days(planId));
    await setDoc(ref, {
      id: ref.id,
      name: input.name.trim(),
      nameLowercase: lower(input.name),
      description: input.description?.trim() || null,
      order: existing.length + 1,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      exerciseCount: 0,
    });
    await this.recalculateTrainingPlanCounts(planId);
    return ref.id;
  },
  async updateWorkoutDay(planId: string, dayId: string, input: WorkoutDayInput) {
    await updateDoc(doc(days(planId), dayId), {
      name: input.name.trim(),
      nameLowercase: lower(input.name),
      description: input.description?.trim() || null,
      updatedAt: serverTimestamp(),
    });
  },
  async setWorkoutDayActiveStatus(planId: string, dayId: string, active: boolean) {
    await updateDoc(doc(days(planId), dayId), { active, updatedAt: serverTimestamp() });
    await this.recalculateTrainingPlanCounts(planId);
  },
  async reorderWorkoutDays(planId: string, ordered: WorkoutDay[]) {
    const batch = writeBatch(firestore);
    ordered.forEach((day, index) =>
      batch.update(doc(days(planId), day.id), {
        order: index + 1,
        updatedAt: serverTimestamp(),
      }),
    );
    await batch.commit();
  },
  async addExerciseToWorkoutDay(
    planId: string,
    dayId: string,
    exercise: Exercise,
    input: PlanExerciseInput,
  ) {
    const existing = await this.listPlanExercises(planId, dayId);
    if (existing.some((item) => item.active && item.exerciseId === exercise.id))
      throw new Error('training-plan/duplicate-exercise');
    const ref = doc(items(planId, dayId));
    await setDoc(ref, {
      id: ref.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      categoryId: exercise.categoryId,
      categoryName: exercise.categoryName,
      ...input,
      weightUnit: 'kg',
      order: existing.length + 1,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await this.recalculateTrainingPlanCounts(planId);
    return ref.id;
  },
  async updatePlanExercise(
    planId: string,
    dayId: string,
    itemId: string,
    input: PlanExerciseInput,
  ) {
    await updateDoc(doc(items(planId, dayId), itemId), {
      ...input,
      updatedAt: serverTimestamp(),
    });
    await this.recalculateTrainingPlanCounts(planId);
  },
  async setPlanExerciseActiveStatus(
    planId: string,
    dayId: string,
    itemId: string,
    active: boolean,
  ) {
    await updateDoc(doc(items(planId, dayId), itemId), {
      active,
      updatedAt: serverTimestamp(),
    });
    await this.recalculateTrainingPlanCounts(planId);
  },
  async reorderPlanExercises(planId: string, dayId: string, ordered: PlanExercise[]) {
    const batch = writeBatch(firestore);
    ordered.forEach((item, index) =>
      batch.update(doc(items(planId, dayId), item.id), {
        order: index + 1,
        updatedAt: serverTimestamp(),
      }),
    );
    await batch.commit();
  },
  async validatePlanForPublishing(planId: string) {
    const plan = await this.getTrainingPlan(planId);
    const issues: string[] = [];
    if (!plan?.active || plan.status === 'archived')
      issues.push('Plan must be active and not archived.');
    const activeDays = (await this.listWorkoutDays(planId)).filter((day) => day.active);
    if (!activeDays.length) issues.push('Add at least one active workout day.');
    for (const day of activeDays) {
      const activeItems = (await this.listPlanExercises(planId, day.id)).filter(
        (item) => item.active,
      );
      if (!activeItems.length)
        issues.push(`${day.name} needs at least one active exercise.`);
      if (activeItems.some((item) => item.sets < 1 || item.reps < 1))
        issues.push(`${day.name} has an invalid exercise prescription.`);
    }
    return issues;
  },
  async publishTrainingPlan(planId: string) {
    const issues = await this.validatePlanForPublishing(planId);
    if (issues.length) throw new Error(`training-plan/publish:${issues.join('|')}`);
    await updateDoc(doc(plans, planId), {
      status: 'published',
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  moveTrainingPlanToDraft(planId: string) {
    return updateDoc(doc(plans, planId), {
      status: 'draft',
      updatedAt: serverTimestamp(),
    });
  },
  archiveTrainingPlan(planId: string) {
    return updateDoc(doc(plans, planId), {
      status: 'archived',
      active: false,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
  reactivateTrainingPlan(planId: string) {
    return updateDoc(doc(plans, planId), {
      status: 'draft',
      active: true,
      archivedAt: null,
      updatedAt: serverTimestamp(),
    });
  },
  async recalculateTrainingPlanCounts(planId: string) {
    const allDays = await this.listWorkoutDays(planId);
    const activeDays = allDays.filter((day) => day.active);
    let count = 0;
    for (const day of allDays) {
      const active = (await this.listPlanExercises(planId, day.id)).filter(
        (item) => item.active,
      ).length;
      await updateDoc(doc(days(planId), day.id), {
        exerciseCount: active,
        updatedAt: serverTimestamp(),
      });
      if (day.active) count += active;
    }
    await updateDoc(doc(plans, planId), {
      workoutDayCount: activeDays.length,
      exerciseCount: count,
      updatedAt: serverTimestamp(),
    });
  },
};
