import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import masterData from '../../../../master-data.json';
import { firestore } from '../../../shared/services/firebase';

type SeedCollection = 'workoutMasters' | 'exerciseCategories' | 'exerciseLibrary';
type SeedCounts = Record<SeedCollection, { created: number; skipped: number }>;

export type SeedMasterDataResult = SeedCounts;

const normalizeName = (value: string) => value.trim().toLowerCase();

async function existingRecords(collectionName: SeedCollection, gymId: string) {
  const snapshot = await getDocs(
    query(collection(firestore, collectionName), where('gymId', '==', gymId)),
  );
  return snapshot.docs.map(
    (item) =>
      ({ id: item.id, ...item.data() }) as Record<string, unknown> & { id: string },
  );
}

/**
 * Imports the bundled master-data.json for one gym. Existing IDs or names are
 * skipped, making the operation safe to repeat without overwriting admin edits.
 */
export async function seedMasterData(
  gymId: string,
  adminUid: string,
): Promise<SeedMasterDataResult> {
  const result: SeedCounts = {
    workoutMasters: { created: 0, skipped: 0 },
    exerciseCategories: { created: 0, skipped: 0 },
    exerciseLibrary: { created: 0, skipped: 0 },
  };
  const [existingWorkouts, existingCategories, existingExercises] = await Promise.all([
    existingRecords('workoutMasters', gymId),
    existingRecords('exerciseCategories', gymId),
    existingRecords('exerciseLibrary', gymId),
  ]);

  const categoryIdsByName = new Map(
    existingCategories.map((item) => [normalizeName(String(item.name)), item.id]),
  );
  const categoryIds = new Set(existingCategories.map((item) => item.id));
  const categoryNames = new Set(categoryIdsByName.keys());
  const categoryBatch = writeBatch(firestore);

  for (const item of masterData.exerciseCategories) {
    const normalizedName = normalizeName(item.name);
    if (categoryIds.has(item.id) || categoryNames.has(normalizedName)) {
      result.exerciseCategories.skipped += 1;
      continue;
    }
    categoryBatch.set(doc(firestore, 'exerciseCategories', item.id), {
      ...item,
      gymId,
      description: '',
      nameLowercase: normalizedName,
      isActive: true,
      createdBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    categoryIds.add(item.id);
    categoryNames.add(normalizedName);
    categoryIdsByName.set(normalizedName, item.id);
    result.exerciseCategories.created += 1;
  }
  if (result.exerciseCategories.created) await categoryBatch.commit();

  const workoutIds = new Set(existingWorkouts.map((item) => item.id));
  const workoutNames = new Set(
    existingWorkouts.map((item) => normalizeName(String(item.name))),
  );
  const workoutBatch = writeBatch(firestore);
  for (const item of masterData.workoutMasters) {
    const normalizedName = normalizeName(item.name);
    if (workoutIds.has(item.id) || workoutNames.has(normalizedName)) {
      result.workoutMasters.skipped += 1;
      continue;
    }
    workoutBatch.set(doc(firestore, 'workoutMasters', item.id), {
      ...item,
      gymId,
      description: '',
      nameLowercase: normalizedName,
      isActive: true,
      createdBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    workoutIds.add(item.id);
    workoutNames.add(normalizedName);
    result.workoutMasters.created += 1;
  }
  if (result.workoutMasters.created) await workoutBatch.commit();

  const sourceCategoryNames = new Map(
    masterData.exerciseCategories.map((item) => [item.id, normalizeName(item.name)]),
  );
  const exerciseIds = new Set(existingExercises.map((item) => item.id));
  const exerciseNames = new Set(
    existingExercises.map((item) => normalizeName(String(item.name))),
  );

  let exerciseBatch = writeBatch(firestore);
  let exerciseBatchSize = 0;
  for (const item of masterData.exerciseLibrary) {
    const normalizedName = normalizeName(item.name);
    if (exerciseIds.has(item.id) || exerciseNames.has(normalizedName)) {
      result.exerciseLibrary.skipped += 1;
      continue;
    }
    const categoryName = sourceCategoryNames.get(item.categoryId);
    const categoryId = categoryName ? categoryIdsByName.get(categoryName) : undefined;
    if (!categoryId) {
      throw new Error(`master-data/missing-category:${item.categoryId}`);
    }
    exerciseBatch.set(doc(firestore, 'exerciseLibrary', item.id), {
      ...item,
      categoryId,
      gymId,
      description: '',
      nameLowercase: normalizedName,
      isActive: true,
      createdBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    exerciseIds.add(item.id);
    exerciseNames.add(normalizedName);
    result.exerciseLibrary.created += 1;
    exerciseBatchSize += 1;
    // Each exercise rule reads its category in addition to the current user's
    // admin profile. Stay below Firestore's access-call limit for batched writes.
    if (exerciseBatchSize === 10) {
      await exerciseBatch.commit();
      exerciseBatch = writeBatch(firestore);
      exerciseBatchSize = 0;
    }
  }
  if (exerciseBatchSize) await exerciseBatch.commit();

  return result;
}
