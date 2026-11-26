import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  CustomCourseRecord,
  LearnerProgress,
  UploadedMaterialItem
} from './types/lms';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function clampStringList(items: string[], maxItems: number): string[] {
  return Array.from(new Set(items.filter((i) => typeof i === 'string'))).slice(
    0,
    maxItems
  );
}

function clampRecord<T>(
  record: Record<string, T> | undefined,
  maxEntries: number
): Record<string, T> {
  if (!record || typeof record !== 'object') return {};
  const entries = Object.entries(record).slice(0, maxEntries);
  return Object.fromEntries(entries);
}

export async function createInitialUserAndProgress(
  user: User,
  localProgress: LearnerProgress
): Promise<void> {
  const userPath = `users/${user.uid}`;
  const progressPath = `users/${user.uid}/progress/main`;

  const displayName =
    clampString(localProgress.learnerName, 120) ||
    clampString(user.displayName ?? '', 120) ||
    'সম্মানিত শিক্ষক';
  const email = clampString(user.email ?? '', 254);
  const designation = clampString(localProgress.designation, 120);
  const schoolName = clampString(localProgress.schoolName, 160);
  const photoUrl = user.photoURL ? clampString(user.photoURL, 500) : undefined;

  const profilePayload: Record<string, unknown> = {
    uid: user.uid,
    email,
    displayName,
    designation,
    schoolName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  if (photoUrl) {
    profilePayload.photoUrl = photoUrl;
  }

  const progressPayload = {
    userId: user.uid,
    completedLessonIds: clampStringList(localProgress.completedLessonIds, 50),
    readMaterialIds: clampStringList(localProgress.readMaterialIds, 50),
    registeredSessionIds: clampStringList(localProgress.registeredSessionIds, 50),
    quizResults: clampRecord(localProgress.quizResults, 20),
    unlockedAchievementDates: clampRecord(
      localProgress.unlockedAchievementDates,
      30
    ),
    lessonNotes: clampRecord(localProgress.lessonNotes, 50),
    studySecondsByDate: clampRecord(localProgress.studySecondsByDate, 366),
    activityCountByDate: clampRecord(localProgress.activityCountByDate, 366),
    helpfulDiscussionIds: clampStringList(
      localProgress.helpfulDiscussionIds ?? [],
      200
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.uid), profilePayload);
    batch.set(doc(db, 'users', user.uid, 'progress', 'main'), progressPayload);
    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `${userPath} & ${progressPath}`
    );
  }
}

export async function createInitialProgressDoc(
  uid: string,
  localProgress: LearnerProgress
): Promise<void> {
  const progressPath = `users/${uid}/progress/main`;
  const progressPayload = {
    userId: uid,
    completedLessonIds: clampStringList(localProgress.completedLessonIds, 50),
    readMaterialIds: clampStringList(localProgress.readMaterialIds, 50),
    registeredSessionIds: clampStringList(localProgress.registeredSessionIds, 50),
    quizResults: clampRecord(localProgress.quizResults, 20),
    unlockedAchievementDates: clampRecord(
      localProgress.unlockedAchievementDates,
      30
    ),
    lessonNotes: clampRecord(localProgress.lessonNotes, 50),
    studySecondsByDate: clampRecord(localProgress.studySecondsByDate, 366),
    activityCountByDate: clampRecord(localProgress.activityCountByDate, 366),
    helpfulDiscussionIds: clampStringList(
      localProgress.helpfulDiscussionIds ?? [],
      200
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'users', uid, 'progress', 'main'), progressPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, progressPath);
  }
}

export async function updateCloudUserProfile(
  uid: string,
  fields: {
    displayName: string;
    designation: string;
    schoolName: string;
    photoUrl?: string;
  }
): Promise<void> {
  const userPath = `users/${uid}`;
  const payload: Record<string, unknown> = {
    displayName: clampString(fields.displayName, 120) || 'সম্মানিত শিক্ষক',
    designation: clampString(fields.designation, 120),
    schoolName: clampString(fields.schoolName, 160),
    updatedAt: serverTimestamp()
  };
  if (fields.photoUrl) {
    payload.photoUrl = clampString(fields.photoUrl, 500);
  }

  try {
    await updateDoc(doc(db, 'users', uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function updateCloudLearnerProgress(
  uid: string,
  progress: LearnerProgress
): Promise<void> {
  const progressPath = `users/${uid}/progress/main`;
  try {
    await updateDoc(doc(db, 'users', uid, 'progress', 'main'), {
      completedLessonIds: clampStringList(progress.completedLessonIds, 50),
      readMaterialIds: clampStringList(progress.readMaterialIds, 50),
      registeredSessionIds: clampStringList(progress.registeredSessionIds, 50),
      quizResults: clampRecord(progress.quizResults, 20),
      unlockedAchievementDates: clampRecord(
        progress.unlockedAchievementDates,
        30
      ),
      lessonNotes: clampRecord(progress.lessonNotes, 50),
      studySecondsByDate: clampRecord(progress.studySecondsByDate, 366),
      activityCountByDate: clampRecord(progress.activityCountByDate, 366),
      helpfulDiscussionIds: clampStringList(
        progress.helpfulDiscussionIds ?? [],
        200
      ),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, progressPath);
  }
}

export const ADMIN_EMAIL = 'aayat6666@gmail.com';

export function isVerifiedAdminUser(user: User | null): boolean {
  return Boolean(
    user &&
      user.emailVerified &&
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
}

function sanitizeId(raw: string, fallbackPrefix: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `${fallbackPrefix}-${Date.now()}`;
}

export async function saveCloudCourse(
  uid: string,
  course: CustomCourseRecord,
  isNew: boolean
): Promise<void> {
  const courseId = sanitizeId(course.id, 'course');
  const coursePath = `courses/${courseId}`;

  const baseFields = {
    title: clampString(course.title, 160) || 'নতুন প্রশিক্ষণ কোর্স',
    subtitle: clampString(course.subtitle, 240),
    category: course.category,
    categoryLabel: clampString(course.categoryLabel, 80) || 'টিপ্যাক ও প্রযুক্তি',
    levelLabel: clampString(course.levelLabel, 80) || 'সকল স্তরের শিক্ষক',
    cpdHoursLabel: clampString(course.cpdHoursLabel, 60) || '৬ CPD ঘণ্টা',
    totalDurationLabel:
      clampString(course.totalDurationLabel, 80) || '২টি মডিউল · ৬ CPD ঘণ্টা',
    instructor: clampString(course.instructor, 120) || 'প্রশিক্ষক প্যানেল',
    instructorRole: clampString(course.instructorRole, 160),
    imagePath: (course.imagePath || '').slice(0, 100000),
    description: clampString(course.description, 1500) || 'কোর্সের সংক্ষিপ্ত বিবরণ',
    lessons: (course.lessons ?? []).slice(0, 25),
    quiz: (course.quiz ?? []).slice(0, 30),
    published: Boolean(course.published),
    updatedAt: serverTimestamp()
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'courses', courseId), {
        id: courseId,
        ...baseFields,
        createdByUid: uid,
        createdAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, 'courses', courseId), baseFields);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      coursePath
    );
  }
}

export async function deleteCloudCourse(courseId: string): Promise<void> {
  const safeId = sanitizeId(courseId, 'course');
  const coursePath = `courses/${safeId}`;
  try {
    await deleteDoc(doc(db, 'courses', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, coursePath);
  }
}

export async function saveCloudMaterial(
  uid: string,
  material: UploadedMaterialItem,
  isNew: boolean
): Promise<void> {
  const materialId = sanitizeId(material.id, 'mat');
  const materialPath = `materials/${materialId}`;

  const baseFields = {
    courseId: sanitizeId(material.courseId, 'tpack-digital-teaching'),
    courseTitle: clampString(material.courseTitle, 160) || 'TPACK Academy কোর্স',
    category: material.category,
    categoryLabel: clampString(material.categoryLabel, 80) || 'টিপ্যাক ও প্রযুক্তি',
    title: clampString(material.title, 160) || 'প্রশিক্ষণ উপকরণ',
    formatLabel: clampString(material.formatLabel, 60) || 'হ্যান্ডআউট',
    readTime: clampString(material.readTime, 40) || '৫ মিনিট পাঠ',
    summary: clampString(material.summary, 2000) || 'প্রশিক্ষণ উপকরণের সারসংক্ষেপ',
    keyPoints: (material.keyPoints ?? [])
      .map((p) => clampString(p, 240))
      .filter(Boolean)
      .slice(0, 20),
    actionChecklist: (material.actionChecklist ?? [])
      .map((p) => clampString(p, 240))
      .filter(Boolean)
      .slice(0, 20),
    classroomActivity: {
      gradeLevel: clampString(
        material.classroomActivity?.gradeLevel || 'সকল শ্রেণি',
        120
      ),
      duration: clampString(
        material.classroomActivity?.duration || '৪৫ মিনিট',
        120
      ),
      objective: clampString(
        material.classroomActivity?.objective || 'শ্রেণিকক্ষ প্রয়োগ',
        400
      )
    },
    attachmentName: clampString(material.attachmentName, 180),
    attachmentContent: (material.attachmentContent || '').slice(0, 50000),
    attachmentMimeType: clampString(material.attachmentMimeType, 100),
    published: Boolean(material.published),
    updatedAt: serverTimestamp()
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'materials', materialId), {
        id: materialId,
        ...baseFields,
        createdByUid: uid,
        createdAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, 'materials', materialId), baseFields);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      materialPath
    );
  }
}

export async function deleteCloudMaterial(materialId: string): Promise<void> {
  const safeId = sanitizeId(materialId, 'mat');
  const materialPath = `materials/${safeId}`;
  try {
    await deleteDoc(doc(db, 'materials', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, materialPath);
  }
}
