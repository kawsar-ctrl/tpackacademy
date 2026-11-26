import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  ArrowRight,
  Award,
  BookOpen,
  ClipboardCheck,
  Leaf,
  PlayCircle,
  Trophy,
  X
} from 'lucide-react';
import {
  COURSES,
  CPD_DEADLINES,
  HERO_IMAGE_PATH,
  TRAINING_SESSIONS
} from './data/coursesData';
import { evaluateAchievements } from './data/achievementsData';
import {
  CourseCategory,
  CustomCourseRecord,
  DiscussionPost,
  DiscussionPostType,
  DiscussionReply,
  EvaluatedAchievement,
  LearnerProgress,
  NavTab,
  QuizResult,
  UploadedMaterialItem,
  VoiceReflectionMeta
} from './types/lms';
import {
  auth,
  createInitialProgressDoc,
  createInitialUserAndProgress,
  db,
  deleteCloudCourse,
  deleteCloudMaterial,
  handleFirestoreError,
  isVerifiedAdminUser,
  OperationType,
  saveCloudCourse,
  saveCloudMaterial,
  signOutAccount,
  updateCloudLearnerProgress,
  updateCloudUserProfile
} from './firebase';
import { TopBar } from './components/TopBar';
import { EcoImage } from './components/EcoImage';
import { ClassroomView } from './components/ClassroomView';
import { MaterialsLibraryView } from './components/MaterialsLibraryView';
import { QuizCenterView } from './components/QuizCenterView';
import { AchievementsView } from './components/AchievementsView';
import { AchievementBadgeEmblem } from './components/AchievementBadgeEmblem';
import { LearningDashboard } from './components/LearningDashboard';
import { DailyPedagogyTip } from './components/DailyPedagogyTip';
import { TeacherLeaderboard } from './components/TeacherLeaderboard';
import { CertificateStudioView } from './components/CertificateStudioView';
import { ProfileModal } from './components/ProfileModal';
import { LoginPanelModal, InlineLoginPanel } from './components/LoginPanel';
import { TrainingScheduleSection } from './components/TrainingScheduleSection';
import { GlassTiltCard } from './components/GlassTiltCard';
import { CourseCarouselSection } from './components/CourseCarouselSection';
import { SmartPdFrameworkSection } from './components/SmartPdFrameworkSection';
import { TeacherTrainingCalendarView } from './components/TeacherTrainingCalendarView';
import { AdminPanelView } from './components/AdminPanelView';
import {
  getLocalDateKey,
  hasLessonNoteContent,
  toBengaliDigits
} from './utils/lmsHelpers';
import { deleteVoiceClipBlobs } from './utils/audioStorage';

const STORAGE_KEY = 'tpack-academy-lms-v1';
const CUSTOM_COURSES_STORAGE_KEY = 'tpack-custom-courses-v1';
const UPLOADED_MATERIALS_STORAGE_KEY = 'tpack-uploaded-materials-v1';

function loadCustomCourses(): CustomCourseRecord[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_COURSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomCourseRecord[]) : [];
  } catch {
    return [];
  }
}

function loadUploadedMaterials(): UploadedMaterialItem[] {
  try {
    const raw = window.localStorage.getItem(UPLOADED_MATERIALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UploadedMaterialItem[]) : [];
  } catch {
    return [];
  }
}

function parseCloudCourseDoc(
  docId: string,
  data: Record<string, unknown>
): CustomCourseRecord {
  const category =
    data.category === 'pedagogy-eval' || data.category === 'research-leadership'
      ? data.category
      : 'tpack-tech';
  return {
    id: typeof data.id === 'string' && data.id ? data.id : docId,
    title: typeof data.title === 'string' ? data.title : 'কোর্স',
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : '',
    category,
    categoryLabel:
      typeof data.categoryLabel === 'string'
        ? data.categoryLabel
        : 'টিপ্যাক ও প্রযুক্তি',
    levelLabel:
      typeof data.levelLabel === 'string'
        ? data.levelLabel
        : 'সকল স্তরের শিক্ষক',
    cpdHoursLabel:
      typeof data.cpdHoursLabel === 'string'
        ? data.cpdHoursLabel
        : '৬ CPD ঘণ্টা',
    totalDurationLabel:
      typeof data.totalDurationLabel === 'string'
        ? data.totalDurationLabel
        : '২টি মডিউল · ৬ CPD ঘণ্টা',
    instructor:
      typeof data.instructor === 'string' ? data.instructor : 'প্রশিক্ষক প্যানেল',
    instructorRole:
      typeof data.instructorRole === 'string' ? data.instructorRole : '',
    imagePath: typeof data.imagePath === 'string' ? data.imagePath : '',
    description: typeof data.description === 'string' ? data.description : '',
    lessons: Array.isArray(data.lessons)
      ? (data.lessons as CustomCourseRecord['lessons'])
      : [],
    quiz: Array.isArray(data.quiz)
      ? (data.quiz as CustomCourseRecord['quiz'])
      : [],
    published: Boolean(data.published),
    createdByUid:
      typeof data.createdByUid === 'string' ? data.createdByUid : undefined,
    isCustom: true
  };
}

function parseCloudMaterialDoc(
  docId: string,
  data: Record<string, unknown>
): UploadedMaterialItem {
  const category =
    data.category === 'pedagogy-eval' || data.category === 'research-leadership'
      ? data.category
      : 'tpack-tech';
  const rawActivity =
    data.classroomActivity && typeof data.classroomActivity === 'object'
      ? (data.classroomActivity as Record<string, unknown>)
      : {};
  return {
    id: typeof data.id === 'string' && data.id ? data.id : docId,
    courseId:
      typeof data.courseId === 'string' && data.courseId
        ? data.courseId
        : COURSES[0].id,
    courseTitle:
      typeof data.courseTitle === 'string'
        ? data.courseTitle
        : 'TPACK Academy কোর্স',
    category,
    categoryLabel:
      typeof data.categoryLabel === 'string'
        ? data.categoryLabel
        : 'টিপ্যাক ও প্রযুক্তি',
    title: typeof data.title === 'string' ? data.title : 'প্রশিক্ষণ উপকরণ',
    formatLabel:
      typeof data.formatLabel === 'string' ? data.formatLabel : 'হ্যান্ডআউট',
    readTime:
      typeof data.readTime === 'string' ? data.readTime : '৫ মিনিট পাঠ',
    summary: typeof data.summary === 'string' ? data.summary : '',
    keyPoints: Array.isArray(data.keyPoints)
      ? (data.keyPoints as string[])
      : [],
    actionChecklist: Array.isArray(data.actionChecklist)
      ? (data.actionChecklist as string[])
      : [],
    classroomActivity: {
      gradeLevel:
        typeof rawActivity.gradeLevel === 'string'
          ? rawActivity.gradeLevel
          : '৬ষ্ঠ – ১০ম শ্রেণি',
      duration:
        typeof rawActivity.duration === 'string'
          ? rawActivity.duration
          : '৪৫ মিনিট',
      objective:
        typeof rawActivity.objective === 'string' ? rawActivity.objective : ''
    },
    attachmentName:
      typeof data.attachmentName === 'string' ? data.attachmentName : '',
    attachmentContent:
      typeof data.attachmentContent === 'string' ? data.attachmentContent : '',
    attachmentMimeType:
      typeof data.attachmentMimeType === 'string'
        ? data.attachmentMimeType
        : 'text/plain',
    published: Boolean(data.published),
    createdByUid:
      typeof data.createdByUid === 'string' ? data.createdByUid : undefined
  };
}

const DEFAULT_PROGRESS: LearnerProgress = {
  learnerName: 'মো. রাফিউল ইসলাম',
  designation: 'সহকারী শিক্ষক (বিজ্ঞান)',
  schoolName: 'সবুজপুর আদর্শ উচ্চ বিদ্যালয়',
  completedLessonIds: [],
  readMaterialIds: [],
  registeredSessionIds: [],
  quizResults: {},
  unlockedAchievementDates: {},
  lessonNotes: {},
  studySecondsByDate: {},
  activityCountByDate: {},
  customDiscussionPosts: [],
  customDiscussionReplies: {},
  helpfulDiscussionIds: []
};

function loadProgress(): LearnerProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<LearnerProgress>;
    return {
      learnerName:
        typeof parsed.learnerName === 'string'
          ? parsed.learnerName
          : DEFAULT_PROGRESS.learnerName,
      designation:
        typeof parsed.designation === 'string'
          ? parsed.designation
          : DEFAULT_PROGRESS.designation,
      schoolName:
        typeof parsed.schoolName === 'string'
          ? parsed.schoolName
          : DEFAULT_PROGRESS.schoolName,
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds
        : [],
      readMaterialIds: Array.isArray(parsed.readMaterialIds)
        ? parsed.readMaterialIds
        : [],
      registeredSessionIds: Array.isArray(parsed.registeredSessionIds)
        ? parsed.registeredSessionIds
        : [],
      quizResults:
        parsed.quizResults && typeof parsed.quizResults === 'object'
          ? parsed.quizResults
          : {},
      unlockedAchievementDates:
        parsed.unlockedAchievementDates &&
        typeof parsed.unlockedAchievementDates === 'object'
          ? parsed.unlockedAchievementDates
          : {},
      lessonNotes:
        parsed.lessonNotes && typeof parsed.lessonNotes === 'object'
          ? parsed.lessonNotes
          : {},
      studySecondsByDate:
        parsed.studySecondsByDate &&
        typeof parsed.studySecondsByDate === 'object'
          ? parsed.studySecondsByDate
          : {},
      activityCountByDate:
        parsed.activityCountByDate &&
        typeof parsed.activityCountByDate === 'object'
          ? parsed.activityCountByDate
          : {},
      customDiscussionPosts: Array.isArray(parsed.customDiscussionPosts)
        ? parsed.customDiscussionPosts
        : [],
      customDiscussionReplies:
        parsed.customDiscussionReplies &&
        typeof parsed.customDiscussionReplies === 'object'
          ? parsed.customDiscussionReplies
          : {},
      helpfulDiscussionIds: Array.isArray(parsed.helpfulDiscussionIds)
        ? parsed.helpfulDiscussionIds
        : []
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function buildProfileSnapshotKey(p: LearnerProgress): string {
  return JSON.stringify({
    displayName: p.learnerName.trim() || 'সম্মানিত শিক্ষক',
    designation: p.designation.trim(),
    schoolName: p.schoolName.trim()
  });
}

function buildProgressSnapshotKey(p: LearnerProgress): string {
  return JSON.stringify({
    completedLessonIds: [...p.completedLessonIds].sort(),
    readMaterialIds: [...p.readMaterialIds].sort(),
    registeredSessionIds: [...p.registeredSessionIds].sort(),
    quizResults: p.quizResults,
    unlockedAchievementDates: p.unlockedAchievementDates ?? {},
    lessonNotes: p.lessonNotes ?? {},
    studySecondsByDate: p.studySecondsByDate ?? {},
    activityCountByDate: p.activityCountByDate ?? {},
    helpfulDiscussionIds: [...(p.helpfulDiscussionIds ?? [])].sort()
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('courses');
  const [activeCourseId, setActiveCourseId] = useState<string>(COURSES[0].id);
  const [activeLessonId, setActiveLessonId] = useState<string>(
    COURSES[0].lessons[0].id
  );
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudError, setCloudError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<LearnerProgress>(loadProgress);
  const [customCourses, setCustomCourses] =
    useState<CustomCourseRecord[]>(loadCustomCourses);
  const [uploadedMaterials, setUploadedMaterials] = useState<
    UploadedMaterialItem[]
  >(loadUploadedMaterials);
  const [unlockedToast, setUnlockedToast] =
    useState<EvaluatedAchievement | null>(null);
  const prevUnlockedRef = useRef<Set<string> | null>(null);
  const progressRef = useRef<LearnerProgress>(progress);
  const cloudReadyUidRef = useRef<string | null>(null);
  const lastSyncedProfileJsonRef = useRef<string>('');
  const lastSyncedProgressJsonRef = useRef<string>('');

  if (cloudError) {
    throw cloudError;
  }

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const isAdmin = useMemo(() => isVerifiedAdminUser(authUser), [authUser]);

  const allCourses = useMemo(
    () => [
      ...COURSES,
      ...customCourses.filter((c) => c.published || isAdmin)
    ],
    [customCourses, isAdmin]
  );

  const visibleUploadedMaterials = useMemo(
    () => uploadedMaterials.filter((m) => m.published || isAdmin),
    [uploadedMaterials, isAdmin]
  );

  const evaluatedAchievements = useMemo(
    () => evaluateAchievements(progress, allCourses),
    [progress, allCourses]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CUSTOM_COURSES_STORAGE_KEY,
        JSON.stringify(customCourses)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [customCourses]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        UPLOADED_MATERIALS_STORAGE_KEY,
        JSON.stringify(uploadedMaterials)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [uploadedMaterials]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore courses & materials catalog
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const adminView = isVerifiedAdminUser(authUser);

    const coursesQuery = adminView
      ? collection(db, 'courses')
      : query(collection(db, 'courses'), where('published', '==', true));

    const materialsQuery = adminView
      ? collection(db, 'materials')
      : query(collection(db, 'materials'), where('published', '==', true));

    const unsubCourses = onSnapshot(
      coursesQuery,
      (snapshot) => {
        if (cancelled) return;
        const cloudCourses = snapshot.docs.map((d) =>
          parseCloudCourseDoc(d.id, d.data() as Record<string, unknown>)
        );
        const cloudIds = new Set(cloudCourses.map((c) => c.id));
        setCustomCourses((prev) => [
          ...cloudCourses,
          ...prev.filter((c) => !c.createdByUid && !cloudIds.has(c.id))
        ]);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'courses');
        } catch (err) {
          if (!cancelled) {
            setCloudError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      }
    );

    const unsubMaterials = onSnapshot(
      materialsQuery,
      (snapshot) => {
        if (cancelled) return;
        const cloudMaterials = snapshot.docs.map((d) =>
          parseCloudMaterialDoc(d.id, d.data() as Record<string, unknown>)
        );
        const cloudIds = new Set(cloudMaterials.map((m) => m.id));
        setUploadedMaterials((prev) => [
          ...cloudMaterials,
          ...prev.filter((m) => !m.createdByUid && !cloudIds.has(m.id))
        ]);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'materials');
        } catch (err) {
          if (!cancelled) {
            setCloudError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      }
    );

    return () => {
      cancelled = true;
      unsubCourses();
      unsubMaterials();
    };
  }, [authUser, authLoading]);

  // Subscribe to Firestore user profile and progress when signed in
  useEffect(() => {
    cloudReadyUidRef.current = null;
    lastSyncedProfileJsonRef.current = '';
    lastSyncedProgressJsonRef.current = '';

    if (!authUser || !authUser.emailVerified) {
      return;
    }

    let cancelled = false;
    let bootstrapping = false;
    let userDocHydrated = false;
    let progressDocHydrated = false;
    let unsubProgress: (() => void) | null = null;

    const uid = authUser.uid;
    const userPath = `users/${uid}`;
    const progressPath = `users/${uid}/progress/main`;

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (userSnap) => {
        if (cancelled) return;
        if (!userSnap.exists()) {
          if (!bootstrapping) {
            bootstrapping = true;
            void createInitialUserAndProgress(authUser, progressRef.current).catch(
              (err) => {
                if (!cancelled) {
                  setCloudError(
                    err instanceof Error ? err : new Error(String(err))
                  );
                }
              }
            );
          }
          return;
        }

        if (!userSnap.metadata.hasPendingWrites) {
          const data = userSnap.data();
          const cloudProfile = {
            learnerName:
              typeof data.displayName === 'string' && data.displayName.trim()
                ? data.displayName
                : 'সম্মানিত শিক্ষক',
            designation:
              typeof data.designation === 'string' ? data.designation : '',
            schoolName:
              typeof data.schoolName === 'string' ? data.schoolName : ''
          };
          const incomingKey = JSON.stringify({
            displayName: cloudProfile.learnerName.trim() || 'সম্মানিত শিক্ষক',
            designation: cloudProfile.designation.trim(),
            schoolName: cloudProfile.schoolName.trim()
          });
          if (incomingKey !== lastSyncedProfileJsonRef.current) {
            lastSyncedProfileJsonRef.current = incomingKey;
            setProgress((prev) => ({
              ...prev,
              ...cloudProfile
            }));
          }
        }

        userDocHydrated = true;

        if (!unsubProgress) {
          unsubProgress = onSnapshot(
            doc(db, 'users', uid, 'progress', 'main'),
            (progSnap) => {
              if (cancelled) return;
              if (!progSnap.exists()) {
                if (!bootstrapping) {
                  bootstrapping = true;
                  void createInitialProgressDoc(uid, progressRef.current).catch(
                    (err) => {
                      if (!cancelled) {
                        setCloudError(
                          err instanceof Error ? err : new Error(String(err))
                        );
                      }
                    }
                  );
                }
                return;
              }

              if (!progSnap.metadata.hasPendingWrites) {
                const data = progSnap.data();
                const nextFields = {
                  completedLessonIds: Array.isArray(data.completedLessonIds)
                    ? (data.completedLessonIds as string[])
                    : [],
                  readMaterialIds: Array.isArray(data.readMaterialIds)
                    ? (data.readMaterialIds as string[])
                    : [],
                  registeredSessionIds: Array.isArray(data.registeredSessionIds)
                    ? (data.registeredSessionIds as string[])
                    : [],
                  quizResults:
                    data.quizResults && typeof data.quizResults === 'object'
                      ? (data.quizResults as LearnerProgress['quizResults'])
                      : {},
                  unlockedAchievementDates:
                    data.unlockedAchievementDates &&
                    typeof data.unlockedAchievementDates === 'object'
                      ? (data.unlockedAchievementDates as Record<string, string>)
                      : {},
                  lessonNotes:
                    data.lessonNotes && typeof data.lessonNotes === 'object'
                      ? (data.lessonNotes as LearnerProgress['lessonNotes'])
                      : {},
                  studySecondsByDate:
                    data.studySecondsByDate &&
                    typeof data.studySecondsByDate === 'object'
                      ? (data.studySecondsByDate as Record<string, number>)
                      : {},
                  activityCountByDate:
                    data.activityCountByDate &&
                    typeof data.activityCountByDate === 'object'
                      ? (data.activityCountByDate as Record<string, number>)
                      : {},
                  helpfulDiscussionIds: Array.isArray(data.helpfulDiscussionIds)
                    ? (data.helpfulDiscussionIds as string[])
                    : []
                };

                const incomingProgKey = JSON.stringify({
                  completedLessonIds: [...nextFields.completedLessonIds].sort(),
                  readMaterialIds: [...nextFields.readMaterialIds].sort(),
                  registeredSessionIds: [
                    ...nextFields.registeredSessionIds
                  ].sort(),
                  quizResults: nextFields.quizResults,
                  unlockedAchievementDates: nextFields.unlockedAchievementDates,
                  lessonNotes: nextFields.lessonNotes,
                  studySecondsByDate: nextFields.studySecondsByDate,
                  activityCountByDate: nextFields.activityCountByDate,
                  helpfulDiscussionIds: [
                    ...nextFields.helpfulDiscussionIds
                  ].sort()
                });

                if (incomingProgKey !== lastSyncedProgressJsonRef.current) {
                  lastSyncedProgressJsonRef.current = incomingProgKey;
                  setProgress((prev) => ({
                    ...prev,
                    ...nextFields
                  }));
                }
              }

              progressDocHydrated = true;
              if (userDocHydrated && progressDocHydrated && !cancelled) {
                cloudReadyUidRef.current = uid;
              }
            },
            (error) => {
              try {
                handleFirestoreError(error, OperationType.GET, progressPath);
              } catch (err) {
                if (!cancelled) {
                  setCloudError(
                    err instanceof Error ? err : new Error(String(err))
                  );
                }
              }
            }
          );
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, userPath);
        } catch (err) {
          if (!cancelled) {
            setCloudError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      }
    );

    return () => {
      cancelled = true;
      unsubUser();
      if (unsubProgress) unsubProgress();
      cloudReadyUidRef.current = null;
    };
  }, [authUser]);

  // Debounced cloud sync for profile edits
  useEffect(() => {
    if (!authUser || cloudReadyUidRef.current !== authUser.uid) return;
    const nextKey = buildProfileSnapshotKey(progress);
    if (nextKey === lastSyncedProfileJsonRef.current) return;

    const timer = window.setTimeout(() => {
      if (!authUser || cloudReadyUidRef.current !== authUser.uid) return;
      lastSyncedProfileJsonRef.current = nextKey;
      void updateCloudUserProfile(authUser.uid, {
        displayName: progress.learnerName,
        designation: progress.designation,
        schoolName: progress.schoolName,
        photoUrl: authUser.photoURL ?? undefined
      }).catch((err) => {
        setCloudError(err instanceof Error ? err : new Error(String(err)));
      });
    }, 650);

    return () => window.clearTimeout(timer);
  }, [
    authUser,
    progress.learnerName,
    progress.designation,
    progress.schoolName
  ]);

  // Debounced cloud sync for learning progress updates
  useEffect(() => {
    if (!authUser || cloudReadyUidRef.current !== authUser.uid) return;
    const nextKey = buildProgressSnapshotKey(progress);
    if (nextKey === lastSyncedProgressJsonRef.current) return;

    const timer = window.setTimeout(() => {
      if (!authUser || cloudReadyUidRef.current !== authUser.uid) return;
      lastSyncedProgressJsonRef.current = nextKey;
      void updateCloudLearnerProgress(authUser.uid, progress).catch((err) => {
        setCloudError(err instanceof Error ? err : new Error(String(err)));
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [authUser, progress]);

  // Record earned dates & show non-intrusive toast when a new badge is unlocked
  useEffect(() => {
    const currentlyUnlocked = evaluatedAchievements.filter(
      (a) => a.status.unlocked
    );
    const currentSet = new Set(currentlyUnlocked.map((a) => a.id));

    if (prevUnlockedRef.current === null) {
      prevUnlockedRef.current = currentSet;
      // Backfill missing earned dates on first evaluation if pre-existing progress exists
      const missingDates = currentlyUnlocked.filter(
        (a) => !progress.unlockedAchievementDates?.[a.id]
      );
      if (missingDates.length > 0) {
        const todayBn = new Date().toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        setProgress((prev) => {
          const nextDates = { ...(prev.unlockedAchievementDates ?? {}) };
          missingDates.forEach((a) => {
            if (!nextDates[a.id]) nextDates[a.id] = todayBn;
          });
          return { ...prev, unlockedAchievementDates: nextDates };
        });
      }
      return;
    }

    const newlyUnlocked = currentlyUnlocked.filter(
      (a) => !prevUnlockedRef.current!.has(a.id)
    );
    prevUnlockedRef.current = currentSet;

    if (newlyUnlocked.length > 0) {
      const todayBn = new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setProgress((prev) => {
        const nextDates = { ...(prev.unlockedAchievementDates ?? {}) };
        newlyUnlocked.forEach((a) => {
          if (!nextDates[a.id]) nextDates[a.id] = todayBn;
        });
        return { ...prev, unlockedAchievementDates: nextDates };
      });
      setUnlockedToast(newlyUnlocked[0]);
    }
  }, [evaluatedAchievements, progress.unlockedAchievementDates]);

  useEffect(() => {
    if (!unlockedToast) return;
    const timer = window.setTimeout(() => setUnlockedToast(null), 6500);
    return () => window.clearTimeout(timer);
  }, [unlockedToast]);

  const activeCourse =
    allCourses.find((c) => c.id === activeCourseId) ?? allCourses[0] ?? COURSES[0];

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCourses.filter((course) => {
      const catMatch =
        categoryFilter === 'all' || course.category === categoryFilter;
      const searchMatch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.subtitle.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [allCourses, categoryFilter, searchQuery]);

  const totalLessonsCount = allCourses.reduce(
    (sum, c) => sum + c.lessons.length,
    0
  );
  const earnedCertificatesCount = Object.values(progress.quizResults).filter(
    (r) => r.passed
  ).length;
  const earnedBadgesCount = evaluatedAchievements.filter(
    (a) => a.status.unlocked
  ).length;

  const handleOpenCourse = (courseId: string, lessonId?: string) => {
    const targetCourse =
      allCourses.find((c) => c.id === courseId) ?? allCourses[0] ?? COURSES[0];
    setActiveCourseId(targetCourse.id);
    setActiveLessonId(lessonId ?? targetCourse.lessons[0]?.id ?? '');
    setActiveTab('classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStudySecondsTick = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    const todayKey = getLocalDateKey();
    setProgress((prev) => ({
      ...prev,
      studySecondsByDate: {
        ...(prev.studySecondsByDate ?? {}),
        [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + seconds
      }
    }));
  }, []);

  const handleLogPracticeMinutes = useCallback((minutes: number) => {
    if (minutes <= 0) return;
    const todayKey = getLocalDateKey();
    setProgress((prev) => ({
      ...prev,
      studySecondsByDate: {
        ...(prev.studySecondsByDate ?? {}),
        [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + minutes * 60
      },
      activityCountByDate: {
        ...(prev.activityCountByDate ?? {}),
        [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
      }
    }));
  }, []);

  const handleToggleLessonComplete = (lessonId: string) => {
    const todayKey = getLocalDateKey();
    setProgress((prev) => {
      const exists = prev.completedLessonIds.includes(lessonId);
      if (exists) {
        return {
          ...prev,
          completedLessonIds: prev.completedLessonIds.filter(
            (id) => id !== lessonId
          )
        };
      }
      return {
        ...prev,
        completedLessonIds: [...prev.completedLessonIds, lessonId],
        studySecondsByDate: {
          ...(prev.studySecondsByDate ?? {}),
          [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + 180
        },
        activityCountByDate: {
          ...(prev.activityCountByDate ?? {}),
          [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
        }
      };
    });
  };

  const handleMarkMaterialRead = (materialId: string) => {
    const todayKey = getLocalDateKey();
    setProgress((prev) => {
      if (prev.readMaterialIds.includes(materialId)) return prev;
      return {
        ...prev,
        readMaterialIds: [...prev.readMaterialIds, materialId],
        studySecondsByDate: {
          ...(prev.studySecondsByDate ?? {}),
          [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + 300
        },
        activityCountByDate: {
          ...(prev.activityCountByDate ?? {}),
          [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
        }
      };
    });
  };

  const handleCompleteQuiz = (result: QuizResult) => {
    const todayKey = getLocalDateKey();
    setProgress((prev) => {
      const prevBest = prev.quizResults[result.courseId];
      const shouldKeepBest =
        prevBest && prevBest.passed && prevBest.score > result.score;
      return {
        ...prev,
        quizResults: {
          ...prev.quizResults,
          [result.courseId]: shouldKeepBest ? prevBest : result
        },
        studySecondsByDate: {
          ...(prev.studySecondsByDate ?? {}),
          [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + 300
        },
        activityCountByDate: {
          ...(prev.activityCountByDate ?? {}),
          [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
        }
      };
    });
  };

  const handleToggleSessionRegister = (sessionId: string) => {
    setProgress((prev) => {
      const exists = prev.registeredSessionIds.includes(sessionId);
      return {
        ...prev,
        registeredSessionIds: exists
          ? prev.registeredSessionIds.filter((id) => id !== sessionId)
          : [...prev.registeredSessionIds, sessionId]
      };
    });
  };

  const handleSaveLessonNote = useCallback(
    (
      lessonId: string,
      content: string,
      voiceReflections?: VoiceReflectionMeta[]
    ) => {
      const todayKey = getLocalDateKey();
      const updatedAt = new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      setProgress((prev) => {
        const prevNote = prev.lessonNotes?.[lessonId];
        const isNewNote = !hasLessonNoteContent(prevNote);
        const resolvedReflections =
          voiceReflections !== undefined
            ? voiceReflections
            : prevNote?.voiceReflections;
        const nextNote: {
          content: string;
          updatedAt: string;
          voiceReflections?: VoiceReflectionMeta[];
        } = {
          content,
          updatedAt
        };
        if (resolvedReflections && resolvedReflections.length > 0) {
          nextNote.voiceReflections = resolvedReflections;
        }
        return {
          ...prev,
          lessonNotes: {
            ...(prev.lessonNotes ?? {}),
            [lessonId]: nextNote
          },
          ...(isNewNote
            ? {
                studySecondsByDate: {
                  ...(prev.studySecondsByDate ?? {}),
                  [todayKey]: (prev.studySecondsByDate?.[todayKey] ?? 0) + 180
                },
                activityCountByDate: {
                  ...(prev.activityCountByDate ?? {}),
                  [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
                }
              }
            : {})
        };
      });
    },
    []
  );

  const handleDeleteLessonNote = useCallback((lessonId: string) => {
    const existingClips =
      progressRef.current.lessonNotes?.[lessonId]?.voiceReflections ?? [];
    if (existingClips.length > 0) {
      void deleteVoiceClipBlobs(existingClips.map((c) => c.id));
    }
    setProgress((prev) => {
      const nextNotes = { ...(prev.lessonNotes ?? {}) };
      delete nextNotes[lessonId];
      return {
        ...prev,
        lessonNotes: nextNotes
      };
    });
  }, []);

  const handleCreateDiscussionPost = useCallback(
    (input: {
      courseId: string;
      lessonId: string;
      type: DiscussionPostType;
      title: string;
      body: string;
    }) => {
      const todayKey = getLocalDateKey();
      const createdAt = new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setProgress((prev) => {
        const newPost: DiscussionPost = {
          id: `disc-own-${Date.now()}`,
          courseId: input.courseId,
          lessonId: input.lessonId,
          type: input.type,
          title: input.title,
          body: input.body,
          authorName: prev.learnerName.trim() || 'সম্মানিত শিক্ষক',
          authorRole: prev.designation.trim() || 'শিক্ষক',
          schoolName: prev.schoolName.trim() || undefined,
          createdAt,
          helpfulCount: 0,
          replies: [],
          isOwn: true
        };
        return {
          ...prev,
          customDiscussionPosts: [newPost, ...(prev.customDiscussionPosts ?? [])],
          activityCountByDate: {
            ...(prev.activityCountByDate ?? {}),
            [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
          }
        };
      });
    },
    []
  );

  const handleDeleteDiscussionPost = useCallback((postId: string) => {
    setProgress((prev) => {
      const nextReplies = { ...(prev.customDiscussionReplies ?? {}) };
      delete nextReplies[postId];
      return {
        ...prev,
        customDiscussionPosts: (prev.customDiscussionPosts ?? []).filter(
          (p) => p.id !== postId
        ),
        customDiscussionReplies: nextReplies
      };
    });
  }, []);

  const handleAddDiscussionReply = useCallback((postId: string, body: string) => {
    const todayKey = getLocalDateKey();
    const createdAt = new Date().toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    setProgress((prev) => {
      const newReply: DiscussionReply = {
        id: `rep-own-${Date.now()}`,
        authorName: prev.learnerName.trim() || 'সম্মানিত শিক্ষক',
        authorRole: prev.designation.trim() || 'সহকর্মী শিক্ষক',
        body,
        createdAt,
        isOwn: true
      };
      const existing = prev.customDiscussionReplies?.[postId] ?? [];
      return {
        ...prev,
        customDiscussionReplies: {
          ...(prev.customDiscussionReplies ?? {}),
          [postId]: [...existing, newReply]
        },
        activityCountByDate: {
          ...(prev.activityCountByDate ?? {}),
          [todayKey]: (prev.activityCountByDate?.[todayKey] ?? 0) + 1
        }
      };
    });
  }, []);

  const handleToggleDiscussionHelpful = useCallback((postId: string) => {
    setProgress((prev) => {
      const current = prev.helpfulDiscussionIds ?? [];
      const exists = current.includes(postId);
      return {
        ...prev,
        helpfulDiscussionIds: exists
          ? current.filter((id) => id !== postId)
          : [...current, postId]
      };
    });
  }, []);

  const handleResetProgress = () => {
    prevUnlockedRef.current = new Set();
    setUnlockedToast(null);
    setProgress((prev) => ({
      learnerName: prev.learnerName,
      designation: prev.designation,
      schoolName: prev.schoolName,
      completedLessonIds: [],
      readMaterialIds: [],
      registeredSessionIds: [],
      quizResults: {},
      unlockedAchievementDates: {},
      lessonNotes: prev.lessonNotes ?? {},
      studySecondsByDate: {},
      activityCountByDate: {},
      customDiscussionPosts: prev.customDiscussionPosts ?? [],
      customDiscussionReplies: prev.customDiscussionReplies ?? {},
      helpfulDiscussionIds: prev.helpfulDiscussionIds ?? []
    }));
  };

  const handleSignOut = useCallback(async () => {
    await signOutAccount();
    setLoginOpen(false);
  }, []);

  const handleSaveCourse = useCallback(
    async (course: CustomCourseRecord, isNew: boolean) => {
      if (!isVerifiedAdminUser(authUser) || !authUser) {
        throw new Error('Admin login required to save courses.');
      }

      const normalized: CustomCourseRecord = {
        ...course,
        isCustom: true,
        createdByUid: course.createdByUid ?? authUser.uid
      };

      await saveCloudCourse(authUser.uid, normalized, isNew);

      setCustomCourses((prev) => {
        const exists = prev.some((c) => c.id === normalized.id);
        if (exists) {
          return prev.map((c) => (c.id === normalized.id ? normalized : c));
        }
        return [normalized, ...prev];
      });
    },
    [authUser]
  );

  const handleDeleteCourse = useCallback(
    async (courseId: string) => {
      if (!isVerifiedAdminUser(authUser)) {
        throw new Error('Admin login required to delete courses.');
      }
      await deleteCloudCourse(courseId);
      setCustomCourses((prev) => prev.filter((c) => c.id !== courseId));
      if (activeCourseId === courseId) {
        setActiveCourseId(COURSES[0].id);
        setActiveLessonId(COURSES[0].lessons[0].id);
      }
    },
    [authUser, activeCourseId]
  );

  const handleSaveMaterial = useCallback(
    async (material: UploadedMaterialItem, isNew: boolean) => {
      if (!isVerifiedAdminUser(authUser) || !authUser) {
        throw new Error('Admin login required to save materials.');
      }

      const normalized: UploadedMaterialItem = {
        ...material,
        createdByUid: material.createdByUid ?? authUser.uid
      };

      await saveCloudMaterial(authUser.uid, normalized, isNew);

      setUploadedMaterials((prev) => {
        const exists = prev.some((m) => m.id === normalized.id);
        if (exists) {
          return prev.map((m) => (m.id === normalized.id ? normalized : m));
        }
        return [normalized, ...prev];
      });
    },
    [authUser]
  );

  const handleDeleteMaterial = useCallback(
    async (materialId: string) => {
      if (!isVerifiedAdminUser(authUser)) {
        throw new Error('Admin login required to delete materials.');
      }
      await deleteCloudMaterial(materialId);
      setUploadedMaterials((prev) => prev.filter((m) => m.id !== materialId));
    },
    [authUser]
  );

  useEffect(() => {
    if (!authLoading && !isAdmin && activeTab === 'admin') {
      setActiveTab('courses');
    }
  }, [authLoading, isAdmin, activeTab]);

  return (
    <div id="top" className="relative min-h-screen flex flex-col text-[#132219]">
      {/* Multi-layered Botanical Atmospheric Backdrop for Glass Refraction */}
      <div className="glass-atmospheric-canvas" aria-hidden="true">
        <div className="glass-orb w-[440px] h-[440px] -top-24 -left-24 bg-emerald-200/75" />
        <div className="glass-orb w-[380px] h-[380px] top-[20%] -right-24 bg-sky-200/60" />
        <div className="glass-orb w-[460px] h-[460px] bottom-[-140px] left-[28%] bg-teal-200/55" />
      </div>

      <TopBar
        activeTab={activeTab}
        authUser={authUser}
        authLoading={authLoading}
        isAdmin={isAdmin}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenLogin={() => setLoginOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'courses' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
            {/* Hero Split Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6 glass-surface rounded-2xl p-7 sm:p-10 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-[#15803D]">
                    TPACK Academy · শিক্ষক পেশাগত দক্ষতা উন্নয়ন (CPD) প্ল্যাটফর্ম
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#132219] leading-[1.18] tracking-tight [text-wrap:balance]">
                    শিক্ষকদের পেশাগত দক্ষতা উন্নয়নের আধুনিক প্রশিক্ষণ প্ল্যাটফর্ম
                  </h1>
                  <p className="text-base text-[#3F5247] leading-relaxed max-w-[60ch]">
                    TPACK ফ্রেমওয়ার্ক, আধুনিক পেডাগজি, গঠনমূলক মূল্যায়ন রুব্রিক এবং শ্রেণিকক্ষ অ্যাকশন রিসার্চের ওপর সাজানো ভিডিও মডিউল, ডাউনলোডযোগ্য লেসন প্ল্যান ও CPD সার্টিফিকেট।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCourse(allCourses[0]?.id ?? COURSES[0].id)}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                  >
                    <span>প্রশিক্ষণ শুরু করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('certificate')}
                    className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-[#15803D]" />
                    <span>CPD সার্টিফিকেট</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 min-h-[280px]">
                <GlassTiltCard
                  maxTiltDeg={3.5}
                  className="glass-card-3d rounded-2xl p-2 h-full min-h-[280px]"
                >
                  <div className="w-full h-full rounded-xl overflow-hidden border border-white/80 shadow-inner">
                    <EcoImage
                      src={HERO_IMAGE_PATH}
                      alt="TPACK Academy শিক্ষক প্রশিক্ষণ ও সহযোগিতামূলক শিক্ষণ স্টুডিও"
                      fallbackLabel="TPACK Academy শিক্ষক প্রশিক্ষণ কেন্দ্র"
                      className="w-full h-full object-cover block"
                    />
                  </div>
                </GlassTiltCard>
              </div>
            </section>

            {/* 4-Column KPI Summary Strip directly below Hero Split */}
            <section
              aria-label="প্রশিক্ষণ পরিসংখ্যান"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
                <div className="glass-3d-icon-well w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <PlayCircle className="w-5 h-5 text-[#15803D]" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
                    {toBengaliDigits(allCourses.length)}টি শিক্ষক কোর্স
                  </div>
                  <div className="text-xs text-[#3F5247] mt-0.5">
                    স্বীকৃত TPACK ও CPD কারিকুলাম
                  </div>
                </div>
              </div>

              <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
                <div className="glass-3d-icon-well w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[#15803D]" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
                    {toBengaliDigits(progress.completedLessonIds.length)}/{toBengaliDigits(totalLessonsCount)} মডিউল সম্পন্ন
                  </div>
                  <div className="text-xs text-[#3F5247] mt-0.5">
                    ভিডিও ডেমো ও রেডি-টু-ইউজ লেসন প্ল্যান
                  </div>
                </div>
              </div>

              <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
                <div className="glass-3d-icon-well w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-[#15803D]" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
                    {toBengaliDigits(allCourses.length)}টি দক্ষতা মূল্যায়ন
                  </div>
                  <div className="text-xs text-[#3F5247] mt-0.5">
                    পেডাগজি ও শ্রেণিকক্ষ প্রয়োগভিত্তিক কুইজ
                  </div>
                </div>
              </div>

              <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
                <div className="glass-3d-icon-well w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[#15803D]" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
                    {toBengaliDigits(earnedCertificatesCount)}/{toBengaliDigits(allCourses.length)} CPD সনদ
                  </div>
                  <div className="text-xs text-[#3F5247] mt-0.5">
                    পদবি ও বিদ্যালয়ের নামসহ PNG/PDF
                  </div>
                </div>
              </div>
            </section>

            {/* Inline Teacher Login & Cloud Sync Panel */}
            <InlineLoginPanel
              authUser={authUser}
              authLoading={authLoading}
              learnerName={progress.learnerName}
              onOpenLoginModal={() => setLoginOpen(true)}
              onSignOut={handleSignOut}
            />

            {/* Daily Pedagogy Tip tailored to courses currently being studied */}
            <DailyPedagogyTip
              courses={allCourses}
              sessions={TRAINING_SESSIONS}
              progress={progress}
              onOpenCourse={(courseId, lessonId) =>
                handleOpenCourse(courseId, lessonId)
              }
            />

            {/* Learning Dashboard: Total Study Time & Weekly Activity Bar Chart */}
            <LearningDashboard
              courses={allCourses}
              progress={progress}
              onLogPracticeMinutes={handleLogPracticeMinutes}
              onOpenCourse={(courseId, lessonId) =>
                handleOpenCourse(courseId, lessonId)
              }
            />

            {/* Teacher Leaderboard: Top Performers by Study Time & Completed Quiz Modules */}
            <TeacherLeaderboard
              courses={allCourses}
              progress={progress}
              onGoToQuiz={() => {
                setActiveTab('quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenClassroom={() => handleOpenCourse(activeCourse.id)}
            />

            {/* Course Catalog Section with Interactive 3D Carousel */}
            <CourseCarouselSection
              courses={filteredCourses}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              completedLessonIds={progress.completedLessonIds}
              quizResults={progress.quizResults}
              onOpenCourse={(courseId) => handleOpenCourse(courseId)}
              onOpenQuizOrCertificate={(courseId, passed) => {
                setActiveCourseId(courseId);
                setActiveTab(passed ? 'certificate' : 'quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onResetFilters={() => {
                setCategoryFilter('all');
                setSearchQuery('');
              }}
            />

            {/* Smart Teacher Professional Development Framework (22 Modules · 4 Pillars · 3 Tiers) */}
            <SmartPdFrameworkSection
              courses={allCourses}
              completedLessonIds={progress.completedLessonIds}
              quizResults={progress.quizResults}
              onOpenCourse={(courseId) => handleOpenCourse(courseId)}
              onOpenQuizOrCertificate={(courseId, passed) => {
                setActiveCourseId(courseId);
                setActiveTab(passed ? 'certificate' : 'quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Learning Achievements Preview Band */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/75">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[#15803D]">
                    Learning Achievements · ডিজিটাল দক্ষতা ব্যাজ
                  </div>
                  <h2 className="text-2xl font-bold text-[#132219] tracking-tight">
                    শিখন অর্জন ও সম্মাননা ব্যাজ ({toBengaliDigits(earnedBadgesCount)}/
                    {toBengaliDigits(evaluatedAchievements.length)})
                  </h2>
                  <p className="text-sm text-[#3F5247]">
                    কোর্স মডিউল সম্পন্ন করে এবং কুইজে উচ্চ নম্বর অর্জন করে আপনার পেশাগত ডিজিটাল ব্যাজ সংগ্রহ করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('achievements');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-[#B45309]" />
                  <span>সব ব্যাজ ও অগ্রগতি দেখুন</span>
                  <ArrowRight className="w-4 h-4 text-[#15803D]" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  'tech-savvy-educator',
                  'pedagogy-pro',
                  'quiz-ace'
                ]
                  .map((id) => evaluatedAchievements.find((a) => a.id === id))
                  .filter((a): a is EvaluatedAchievement => Boolean(a))
                  .map((badge) => (
                    <div
                      key={badge.id}
                      className={`glass-card-3d rounded-2xl p-5 flex flex-col justify-between gap-4 ${
                        badge.status.unlocked
                          ? 'ring-1 ring-[#15803D]/30'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <AchievementBadgeEmblem
                          iconKey={badge.iconKey}
                          tier={badge.tier}
                          unlocked={badge.status.unlocked}
                          size="md"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="text-xs text-[#3F5247] flex items-center gap-1.5">
                            <span className="font-semibold text-[#15803D]">
                              {badge.tierLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {badge.status.unlocked ? 'অর্জিত' : 'লক করা'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold font-display text-[#132219] leading-snug">
                            {badge.titleEn}
                          </h3>
                          <div className="text-xs font-semibold text-[#2C3E33]">
                            {badge.titleBn}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-white/75">
                        <div className="flex items-center justify-between text-xs text-[#3F5247]">
                          <span>{badge.criteriaLabel}</span>
                          <span className="font-mono tabular-nums font-semibold text-[#132219] shrink-0 ml-2">
                            {toBengaliDigits(badge.status.percentage)}%
                          </span>
                        </div>
                        <div className="w-full h-2 glass-well rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-transform duration-300 origin-left ${
                              badge.status.unlocked
                                ? badge.tier === 'gold'
                                  ? 'bg-[#B45309]'
                                  : 'bg-gradient-to-r from-[#15803D] to-[#22C55E]'
                                : 'bg-[#6A9E7D]'
                            }`}
                            style={{
                              transform: `scaleX(${badge.status.percentage / 100})`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <TrainingScheduleSection
              sessions={TRAINING_SESSIONS}
              registeredSessionIds={progress.registeredSessionIds}
              onToggleRegister={handleToggleSessionRegister}
              onOpenCourse={(courseId) => handleOpenCourse(courseId)}
              onOpenFullCalendar={() => {
                setActiveTab('calendar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {activeTab === 'classroom' && (
          <ClassroomView
            course={activeCourse}
            activeLessonId={activeLessonId}
            teacherName={progress.learnerName}
            teacherDesignation={progress.designation}
            teacherSchool={progress.schoolName}
            completedLessonIds={progress.completedLessonIds}
            readMaterialIds={progress.readMaterialIds}
            lessonNotes={progress.lessonNotes ?? {}}
            customDiscussionPosts={progress.customDiscussionPosts ?? []}
            customDiscussionReplies={progress.customDiscussionReplies ?? {}}
            helpfulDiscussionIds={progress.helpfulDiscussionIds ?? []}
            quizResult={progress.quizResults[activeCourse.id]}
            onSelectLesson={setActiveLessonId}
            onToggleLessonComplete={handleToggleLessonComplete}
            onMarkMaterialRead={handleMarkMaterialRead}
            onSaveLessonNote={handleSaveLessonNote}
            onDeleteLessonNote={handleDeleteLessonNote}
            onCreateDiscussionPost={handleCreateDiscussionPost}
            onDeleteDiscussionPost={handleDeleteDiscussionPost}
            onAddDiscussionReply={handleAddDiscussionReply}
            onToggleDiscussionHelpful={handleToggleDiscussionHelpful}
            onStudySecondsTick={handleStudySecondsTick}
            onBackToCatalog={() => setActiveTab('courses')}
            onGoToQuiz={() => setActiveTab('quiz')}
            onGoToCertificate={() => setActiveTab('certificate')}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsLibraryView
            courses={allCourses}
            uploadedMaterials={visibleUploadedMaterials}
            readMaterialIds={progress.readMaterialIds}
            onMarkMaterialRead={handleMarkMaterialRead}
            onOpenLessonInClassroom={(courseId, lessonId) =>
              handleOpenCourse(courseId, lessonId)
            }
          />
        )}

        {activeTab === 'quiz' && (
          <QuizCenterView
            courses={allCourses}
            selectedCourseId={activeCourseId}
            quizResults={progress.quizResults}
            achievements={evaluatedAchievements}
            onSelectCourse={setActiveCourseId}
            onCompleteQuiz={handleCompleteQuiz}
            onOpenCertificate={(courseId) => {
              setActiveCourseId(courseId);
              setActiveTab('certificate');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAchievements={() => {
              setActiveTab('achievements');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <TeacherTrainingCalendarView
            sessions={TRAINING_SESSIONS}
            deadlines={CPD_DEADLINES}
            progress={progress}
            onToggleRegister={handleToggleSessionRegister}
            onNavigateToAction={(tab, courseId) => {
              if (courseId) {
                const targetCourse =
                  allCourses.find((c) => c.id === courseId) ??
                  allCourses[0] ??
                  COURSES[0];
                setActiveCourseId(targetCourse.id);
                setActiveLessonId(targetCourse.lessons[0]?.id ?? '');
              }
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsView
            achievements={evaluatedAchievements}
            progress={progress}
            onNavigateToAction={(tab, courseId) => {
              if (courseId) {
                const targetCourse =
                  allCourses.find((c) => c.id === courseId) ??
                  allCourses[0] ??
                  COURSES[0];
                setActiveCourseId(targetCourse.id);
                setActiveLessonId(targetCourse.lessons[0]?.id ?? '');
              }
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'certificate' && (
          <CertificateStudioView
            courses={allCourses}
            selectedCourseId={activeCourseId}
            learnerName={progress.learnerName}
            designation={progress.designation}
            schoolName={progress.schoolName}
            quizResults={progress.quizResults}
            onSelectCourse={setActiveCourseId}
            onUpdateLearnerName={(name) =>
              setProgress((prev) => ({ ...prev, learnerName: name }))
            }
            onUpdateDesignation={(designation) =>
              setProgress((prev) => ({ ...prev, designation }))
            }
            onUpdateSchoolName={(schoolName) =>
              setProgress((prev) => ({ ...prev, schoolName }))
            }
            onGoToQuiz={(courseId) => {
              setActiveCourseId(courseId);
              setActiveTab('quiz');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminPanelView
            authUser={authUser}
            builtInCourses={COURSES}
            customCourses={customCourses}
            uploadedMaterials={uploadedMaterials}
            onSaveCourse={handleSaveCourse}
            onDeleteCourse={handleDeleteCourse}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onOpenLogin={() => setLoginOpen(true)}
            onOpenCourseInClassroom={(courseId) => handleOpenCourse(courseId)}
            onOpenMaterialsLibrary={() => {
              setActiveTab('materials');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToCourses={() => {
              setActiveTab('courses');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Clean Minimal Glassmorphic Footer */}
      <footer className="glass-footer mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#3F5247]">
          <div className="flex items-center gap-2">
            <span className="glass-3d-icon-well w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
              <Leaf className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
            </span>
            <span>© ২০২৬ TPACK Academy · শিক্ষক পেশাগত দক্ষতা উন্নয়ন ও CPD পোর্টাল</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              কোর্সসমূহ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              লেসন প্ল্যান
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              মূল্যায়ন কুইজ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              প্রশিক্ষণ ক্যালেন্ডার
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('achievements')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              অর্জন ও ব্যাজ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              CPD সনদ
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-[#132219] transition-colors cursor-pointer"
              >
                অ্যাডমিন প্যানেল
              </button>
            )}
          </div>
        </div>
      </footer>

      <ProfileModal
        isOpen={profileOpen}
        authUser={authUser}
        courses={allCourses}
        progress={progress}
        achievements={evaluatedAchievements}
        onClose={() => setProfileOpen(false)}
        onOpenLogin={() => setLoginOpen(true)}
        onSignOut={handleSignOut}
        onUpdateName={(name) =>
          setProgress((prev) => ({ ...prev, learnerName: name }))
        }
        onUpdateDesignation={(designation) =>
          setProgress((prev) => ({ ...prev, designation }))
        }
        onUpdateSchoolName={(schoolName) =>
          setProgress((prev) => ({ ...prev, schoolName }))
        }
        onResetProgress={handleResetProgress}
        onJumpToCourse={(courseId) => handleOpenCourse(courseId)}
        onOpenAchievements={() => {
          setActiveTab('achievements');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <LoginPanelModal
        isOpen={loginOpen}
        authUser={authUser}
        authLoading={authLoading}
        learnerName={progress.learnerName}
        designation={progress.designation}
        schoolName={progress.schoolName}
        onClose={() => setLoginOpen(false)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Non-intrusive Achievement Unlocked Toast */}
      {unlockedToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] glass-modal ring-1 ring-[#15803D]/35 rounded-2xl p-4 flex items-center gap-3.5"
        >
          <AchievementBadgeEmblem
            iconKey={unlockedToast.iconKey}
            tier={unlockedToast.tier}
            unlocked={true}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[#15803D]">
              নতুন ডিজিটাল ব্যাজ অর্জিত!
            </div>
            <div className="text-sm font-bold font-display text-[#132219] truncate">
              {unlockedToast.titleEn}
            </div>
            <div className="text-xs text-[#3F5247] truncate">
              {unlockedToast.titleBn}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setUnlockedToast(null);
                setActiveTab('achievements');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 text-xs font-semibold btn-3d-emerald rounded-lg cursor-pointer"
            >
              দেখুন
            </button>
            <button
              type="button"
              onClick={() => setUnlockedToast(null)}
              aria-label="নোটিফিকেশন বন্ধ করুন"
              className="p-1.5 text-[#3F5247] hover:text-[#132219] rounded-lg hover:bg-white/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
