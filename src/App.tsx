import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  Leaf,
  Lock,
  LogIn,
  PlayCircle,
  ShieldCheck,
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
  AccessControlConfig,
  AdminRoleRecord,
  CertificationPathwayProgress,
  Course,
  CourseCategory,
  CustomCourseRecord,
  DiscussionPost,
  DiscussionPostType,
  DiscussionReply,
  EvaluatedAchievement,
  InteractiveLearningResult,
  LearnerProgress,
  ModuleLayoutConfig,
  NavTab,
  PathwayStepId,
  PaymentMethodType,
  PaymentRequestRecord,
  PracticalAssignmentSubmission,
  PreAssessmentResult,
  QuizResult,
  UploadedMaterialItem,
  UserAccessRecord,
  VoiceReflectionMeta
} from './types/lms';
import {
  adminUpdateUserAccess,
  auth,
  createInitialProgressDoc,
  createInitialUserAndProgress,
  db,
  deleteCloudCourse,
  deleteCloudMaterial,
  ensureInitialUserAccess,
  grantModuleManagerRole,
  handleFirestoreError,
  isSuperAdminUser,
  OperationType,
  reviewPaymentRequestAndGrantPro,
  revokeModuleManagerRole,
  saveCloudAccessControl,
  saveCloudCourse,
  saveCloudMaterial,
  saveCloudModuleLayout,
  signOutAccount,
  submitPaymentRequest,
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
import { AccessUpgradeModal } from './components/AccessUpgradeModal';
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
import {
  computeEffectiveAccess,
  DEFAULT_ACCESS_CONTROL,
  sanitizeSafeMediaUrl
} from './utils/accessHelpers';
import { deleteVoiceClipBlobs } from './utils/audioStorage';
import { EMPTY_PATHWAY_PROGRESS } from './utils/pathwayHelpers';

const STORAGE_KEY = 'tpack-academy-lms-v1';
const PATHWAY_STORAGE_KEY = 'tpack-certification-pathway-v1';
const CUSTOM_COURSES_STORAGE_KEY = 'tpack-custom-courses-v1';
const MODULE_LAYOUT_STORAGE_KEY = 'tpack-module-layout-v1';
const UPLOADED_MATERIALS_STORAGE_KEY = 'tpack-uploaded-materials-v1';

function loadPathwayProgress(): CertificationPathwayProgress {
  try {
    const raw = window.localStorage.getItem(PATHWAY_STORAGE_KEY);
    if (!raw) return EMPTY_PATHWAY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<CertificationPathwayProgress>;
    return {
      preAssessments:
        parsed.preAssessments && typeof parsed.preAssessments === 'object'
          ? parsed.preAssessments
          : {},
      interactiveResults:
        parsed.interactiveResults &&
        typeof parsed.interactiveResults === 'object'
          ? parsed.interactiveResults
          : {},
      assignments:
        parsed.assignments && typeof parsed.assignments === 'object'
          ? parsed.assignments
          : {}
    };
  } catch {
    return EMPTY_PATHWAY_PROGRESS;
  }
}

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

function loadModuleLayout(): ModuleLayoutConfig {
  try {
    const raw = window.localStorage.getItem(MODULE_LAYOUT_STORAGE_KEY);
    if (!raw) return { orderedIds: [], hiddenCourseIds: [] };
    const parsed = JSON.parse(raw) as Partial<ModuleLayoutConfig>;
    return {
      orderedIds: Array.isArray(parsed.orderedIds)
        ? parsed.orderedIds.filter((id): id is string => typeof id === 'string')
        : [],
      hiddenCourseIds: Array.isArray(parsed.hiddenCourseIds)
        ? parsed.hiddenCourseIds.filter(
            (id): id is string => typeof id === 'string'
          )
        : []
    };
  } catch {
    return { orderedIds: [], hiddenCourseIds: [] };
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
  const rawPathway =
    data.pathwayConfig && typeof data.pathwayConfig === 'object'
      ? (data.pathwayConfig as CustomCourseRecord['pathwayConfig'])
      : undefined;
  const orderIndex =
    typeof data.orderIndex === 'number' && Number.isFinite(data.orderIndex)
      ? data.orderIndex
      : undefined;
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
    ...(rawPathway ? { pathwayConfig: rawPathway } : {}),
    ...(orderIndex !== undefined ? { orderIndex } : {}),
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
    videoSourceType:
      data.videoSourceType === 'link' || data.videoSourceType === 'upload'
        ? data.videoSourceType
        : 'none',
    videoUrl:
      typeof data.videoUrl === 'string' ? sanitizeSafeMediaUrl(data.videoUrl) : '',
    videoFileName:
      typeof data.videoFileName === 'string' ? data.videoFileName : '',
    videoFileSizeLabel:
      typeof data.videoFileSizeLabel === 'string' ? data.videoFileSizeLabel : '',
    videoMimeType:
      typeof data.videoMimeType === 'string' ? data.videoMimeType : '',
    published: Boolean(data.published),
    createdByUid:
      typeof data.createdByUid === 'string' ? data.createdByUid : undefined
  };
}

function extractTimestampMs(val: unknown, fallbackMs = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (
    val &&
    typeof val === 'object' &&
    'toMillis' in val &&
    typeof (val as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (val as { toMillis: () => number }).toMillis();
  }
  return fallbackMs;
}

function parseCloudUserAccessDoc(
  docId: string,
  data: Record<string, unknown>
): UserAccessRecord {
  const tier =
    data.planTier === 'annual_pro' || data.planTier === 'suspended'
      ? data.planTier
      : 'free_trial';
  return {
    uid: typeof data.uid === 'string' && data.uid ? data.uid : docId,
    email: typeof data.email === 'string' ? data.email : '',
    displayName:
      typeof data.displayName === 'string' ? data.displayName : 'সম্মানিত শিক্ষক',
    planTier: tier,
    trialStartedAtMs:
      typeof data.trialStartedAtMs === 'number' ? data.trialStartedAtMs : Date.now(),
    trialEndsAtMs:
      typeof data.trialEndsAtMs === 'number' ? data.trialEndsAtMs : Date.now(),
    proActivatedAtMs:
      typeof data.proActivatedAtMs === 'number' ? data.proActivatedAtMs : 0,
    proExpiresAtMs:
      typeof data.proExpiresAtMs === 'number' ? data.proExpiresAtMs : 0,
    allowFullOverride: Boolean(data.allowFullOverride),
    customNote: typeof data.customNote === 'string' ? data.customNote : '',
    updatedAtMs: extractTimestampMs(data.updatedAt ?? data.updatedAtMs, Date.now())
  };
}

function parseCloudPaymentRequestDoc(
  docId: string,
  data: Record<string, unknown>
): PaymentRequestRecord {
  const rawMethod =
    typeof data.method === 'string'
      ? data.method
      : typeof data.paymentMethod === 'string'
        ? data.paymentMethod
        : 'bKash';
  const method: PaymentMethodType =
    rawMethod === 'Nagad' || rawMethod === 'nagad'
      ? 'Nagad'
      : rawMethod === 'Rocket' || rawMethod === 'rocket'
        ? 'Rocket'
        : rawMethod === 'Bank' || rawMethod === 'bank'
          ? 'Bank'
          : 'bKash';
  const status =
    data.status === 'approved' || data.status === 'rejected'
      ? data.status
      : 'pending';
  return {
    id: typeof data.id === 'string' && data.id ? data.id : docId,
    userId: typeof data.userId === 'string' ? data.userId : '',
    userEmail: typeof data.userEmail === 'string' ? data.userEmail : '',
    userName: typeof data.userName === 'string' ? data.userName : 'শিক্ষক',
    method,
    senderPhone:
      typeof data.senderPhone === 'string'
        ? data.senderPhone
        : typeof data.senderNumber === 'string'
          ? data.senderNumber
          : '',
    transactionId: typeof data.transactionId === 'string' ? data.transactionId : '',
    amountBdt: typeof data.amountBdt === 'number' ? data.amountBdt : 1000,
    note: typeof data.note === 'string' ? data.note : '',
    status,
    reviewedByUid:
      typeof data.reviewedByUid === 'string' ? data.reviewedByUid : '',
    reviewNote: typeof data.reviewNote === 'string' ? data.reviewNote : '',
    createdAtMs: extractTimestampMs(data.createdAt ?? data.createdAtMs, Date.now()),
    updatedAtMs: extractTimestampMs(data.updatedAt ?? data.updatedAtMs, Date.now())
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
  const [activePathwayStep, setActivePathwayStep] = useState<
    PathwayStepId | undefined
  >(undefined);
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudError, setCloudError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<LearnerProgress>(loadProgress);
  const [pathwayProgress, setPathwayProgress] =
    useState<CertificationPathwayProgress>(loadPathwayProgress);
  const [customCourses, setCustomCourses] =
    useState<CustomCourseRecord[]>(loadCustomCourses);
  const [moduleLayout, setModuleLayout] =
    useState<ModuleLayoutConfig>(loadModuleLayout);
  const [uploadedMaterials, setUploadedMaterials] = useState<
    UploadedMaterialItem[]
  >(loadUploadedMaterials);
  const [accessConfig, setAccessConfig] = useState<AccessControlConfig>(
    DEFAULT_ACCESS_CONTROL
  );
  const [userAccess, setUserAccess] = useState<UserAccessRecord | null>(null);
  const [isDelegatedModuleManager, setIsDelegatedModuleManager] =
    useState(false);
  const [userPaymentRequests, setUserPaymentRequests] = useState<
    PaymentRequestRecord[]
  >([]);
  const [allUserAccessList, setAllUserAccessList] = useState<
    UserAccessRecord[]
  >([]);
  const [allPaymentRequests, setAllPaymentRequests] = useState<
    PaymentRequestRecord[]
  >([]);
  const [allAdminRoles, setAllAdminRoles] = useState<AdminRoleRecord[]>([]);
  const [unlockedToast, setUnlockedToast] =
    useState<EvaluatedAchievement | null>(null);
  const prevUnlockedRef = useRef<Set<string> | null>(null);
  const progressRef = useRef<LearnerProgress>(progress);
  const accessConfigRef = useRef<AccessControlConfig>(accessConfig);
  const cloudReadyUidRef = useRef<string | null>(null);
  const cloudCourseIdsRef = useRef<Set<string>>(new Set());
  const lastSyncedProfileJsonRef = useRef<string>('');
  const lastSyncedProgressJsonRef = useRef<string>('');

  if (cloudError) {
    throw cloudError;
  }

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    accessConfigRef.current = accessConfig;
  }, [accessConfig]);

  const isSuperAdmin = useMemo(() => isSuperAdminUser(authUser), [authUser]);
  const canManageModules = isSuperAdmin || isDelegatedModuleManager;

  const effectiveAccess = useMemo(
    () =>
      computeEffectiveAccess({
        authUser,
        isSuperAdmin,
        isDelegatedModuleManager,
        userAccess,
        accessConfig
      }),
    [authUser, isSuperAdmin, isDelegatedModuleManager, userAccess, accessConfig]
  );

  const builtInIds = useMemo(
    () => new Set(COURSES.map((c) => c.id)),
    []
  );

  const overrideIds = useMemo(
    () =>
      new Set(
        customCourses.filter((c) => builtInIds.has(c.id)).map((c) => c.id)
      ),
    [customCourses, builtInIds]
  );

  const allManagedCourses = useMemo<Course[]>(() => {
    const customMap = new Map<string, CustomCourseRecord>();
    customCourses.forEach((c) => customMap.set(c.id, c));

    const mergedBuiltIns: Course[] = COURSES.map((base) => {
      const override = customMap.get(base.id);
      return override ? { ...base, ...override } : base;
    });

    const pureCustom: Course[] = customCourses
      .filter((c) => !builtInIds.has(c.id))
      .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999));

    const combined = [...mergedBuiltIns, ...pureCustom];
    if (moduleLayout.orderedIds.length === 0) {
      return combined;
    }

    const orderRank = new Map<string, number>();
    moduleLayout.orderedIds.forEach((id, idx) => orderRank.set(id, idx));

    return [...combined].sort((a, b) => {
      const ra = orderRank.get(a.id);
      const rb = orderRank.get(b.id);
      if (ra !== undefined && rb !== undefined) return ra - rb;
      if (ra !== undefined) return -1;
      if (rb !== undefined) return 1;
      return 0;
    });
  }, [customCourses, builtInIds, moduleLayout.orderedIds]);

  const allCourses = useMemo(() => {
    const hiddenSet = new Set(moduleLayout.hiddenCourseIds);
    const customMap = new Map<string, CustomCourseRecord>();
    customCourses.forEach((c) => customMap.set(c.id, c));

    return allManagedCourses.filter((course) => {
      if (hiddenSet.has(course.id)) return false;
      const customRec = customMap.get(course.id);
      if (customRec && !customRec.published && !canManageModules) return false;
      return true;
    });
  }, [allManagedCourses, moduleLayout.hiddenCourseIds, customCourses, canManageModules]);

  const unlockedCourseIds = useMemo(() => {
    if (!Number.isFinite(effectiveAccess.allowedModuleCount)) {
      return undefined;
    }
    return new Set(
      allCourses
        .slice(0, Math.max(0, effectiveAccess.allowedModuleCount))
        .map((c) => c.id)
    );
  }, [allCourses, effectiveAccess.allowedModuleCount]);

  const visibleUploadedMaterials = useMemo(
    () => uploadedMaterials.filter((m) => m.published || canManageModules),
    [uploadedMaterials, canManageModules]
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
        PATHWAY_STORAGE_KEY,
        JSON.stringify(pathwayProgress)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [pathwayProgress]);

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
        MODULE_LAYOUT_STORAGE_KEY,
        JSON.stringify(moduleLayout)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [moduleLayout]);

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
    const superAdminListView = isSuperAdminUser(authUser);

    const coursesQuery = superAdminListView
      ? collection(db, 'courses')
      : query(collection(db, 'courses'), where('published', '==', true));

    const materialsQuery = superAdminListView
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
        cloudCourseIdsRef.current = cloudIds;
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

    const unsubLayout = onSnapshot(
      doc(db, 'siteConfig', 'moduleLayout'),
      (snap) => {
        if (cancelled || !snap.exists()) return;
        const data = snap.data();
        setModuleLayout({
          orderedIds: Array.isArray(data.orderedIds)
            ? data.orderedIds.filter((id): id is string => typeof id === 'string')
            : [],
          hiddenCourseIds: Array.isArray(data.hiddenCourseIds)
            ? data.hiddenCourseIds.filter(
                (id): id is string => typeof id === 'string'
              )
            : []
        });
      },
      (error) => {
        try {
          handleFirestoreError(
            error,
            OperationType.GET,
            'siteConfig/moduleLayout'
          );
        } catch (err) {
          if (!cancelled) {
            setCloudError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      }
    );

    const unsubAccessConfig = onSnapshot(
      doc(db, 'siteConfig', 'accessControl'),
      (snap) => {
        if (cancelled || !snap.exists()) return;
        const data = snap.data();
        setAccessConfig({
          freeTrialDays:
            typeof data.freeTrialDays === 'number'
              ? data.freeTrialDays
              : DEFAULT_ACCESS_CONTROL.freeTrialDays,
          freeTrialMaxModules:
            typeof data.freeTrialMaxModules === 'number'
              ? data.freeTrialMaxModules
              : DEFAULT_ACCESS_CONTROL.freeTrialMaxModules,
          freeTrialAllowVideos:
            typeof data.freeTrialAllowVideos === 'boolean'
              ? data.freeTrialAllowVideos
              : DEFAULT_ACCESS_CONTROL.freeTrialAllowVideos,
          freeTrialAllowMaterialsDownload:
            typeof data.freeTrialAllowMaterialsDownload === 'boolean'
              ? data.freeTrialAllowMaterialsDownload
              : DEFAULT_ACCESS_CONTROL.freeTrialAllowMaterialsDownload,
          freeTrialAllowQuiz:
            typeof data.freeTrialAllowQuiz === 'boolean'
              ? data.freeTrialAllowQuiz
              : DEFAULT_ACCESS_CONTROL.freeTrialAllowQuiz,
          freeTrialAllowCertificate:
            typeof data.freeTrialAllowCertificate === 'boolean'
              ? data.freeTrialAllowCertificate
              : DEFAULT_ACCESS_CONTROL.freeTrialAllowCertificate,
          annualPriceBdt:
            typeof data.annualPriceBdt === 'number'
              ? data.annualPriceBdt
              : DEFAULT_ACCESS_CONTROL.annualPriceBdt,
          annualDurationDays:
            typeof data.annualDurationDays === 'number'
              ? data.annualDurationDays
              : DEFAULT_ACCESS_CONTROL.annualDurationDays,
          paymentInstructions:
            typeof data.paymentInstructions === 'string'
              ? data.paymentInstructions
              : DEFAULT_ACCESS_CONTROL.paymentInstructions,
          maintenanceMode: Boolean(data.maintenanceMode)
        });
      },
      (error) => {
        try {
          handleFirestoreError(
            error,
            OperationType.GET,
            'siteConfig/accessControl'
          );
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
      unsubLayout();
      unsubAccessConfig();
    };
  }, [authUser, authLoading]);

  // Subscribe to per-user access record, module manager role, payment requests, and Super Admin queues
  useEffect(() => {
    if (!authUser || !authUser.emailVerified) {
      setUserAccess(null);
      setIsDelegatedModuleManager(false);
      setUserPaymentRequests([]);
      setAllUserAccessList([]);
      setAllPaymentRequests([]);
      setAllAdminRoles([]);
      return;
    }

    let cancelled = false;
    let bootstrappingAccess = false;
    const uid = authUser.uid;
    const superAdminView = isSuperAdminUser(authUser);

    const unsubUserAccess = onSnapshot(
      doc(db, 'userAccess', uid),
      (snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          if (!bootstrappingAccess) {
            bootstrappingAccess = true;
            void ensureInitialUserAccess(
              authUser,
              accessConfigRef.current
            ).catch((err) => {
              if (!cancelled) {
                setCloudError(err instanceof Error ? err : new Error(String(err)));
              }
            });
          }
          return;
        }
        setUserAccess(
          parseCloudUserAccessDoc(snap.id, snap.data() as Record<string, unknown>)
        );
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, `userAccess/${uid}`);
        } catch (err) {
          if (!cancelled) {
            setCloudError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      }
    );

    const unsubAdminRole = onSnapshot(
      doc(db, 'admins', uid),
      (snap) => {
        if (cancelled) return;
        setIsDelegatedModuleManager(snap.exists());
      },
      () => {
        if (!cancelled) {
          setIsDelegatedModuleManager(false);
        }
      }
    );

    const unsubUserPayments = onSnapshot(
      query(collection(db, 'paymentRequests'), where('userId', '==', uid)),
      (snapshot) => {
        if (cancelled) return;
        const rows = snapshot.docs
          .map((d) =>
            parseCloudPaymentRequestDoc(d.id, d.data() as Record<string, unknown>)
          )
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setUserPaymentRequests(rows);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'paymentRequests');
        } catch (err) {
          if (!cancelled) {
            setCloudError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      }
    );

    let unsubAllUsers: (() => void) | null = null;
    let unsubAllPayments: (() => void) | null = null;
    let unsubAllAdmins: (() => void) | null = null;

    if (superAdminView) {
      unsubAllUsers = onSnapshot(
        collection(db, 'userAccess'),
        (snapshot) => {
          if (cancelled) return;
          setAllUserAccessList(
            snapshot.docs.map((d) =>
              parseCloudUserAccessDoc(d.id, d.data() as Record<string, unknown>)
            )
          );
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.LIST, 'userAccess');
          } catch (err) {
            if (!cancelled) {
              setCloudError(err instanceof Error ? err : new Error(String(err)));
            }
          }
        }
      );

      unsubAllPayments = onSnapshot(
        collection(db, 'paymentRequests'),
        (snapshot) => {
          if (cancelled) return;
          const rows = snapshot.docs
            .map((d) =>
              parseCloudPaymentRequestDoc(d.id, d.data() as Record<string, unknown>)
            )
            .sort((a, b) => b.createdAtMs - a.createdAtMs);
          setAllPaymentRequests(rows);
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.LIST, 'paymentRequests');
          } catch (err) {
            if (!cancelled) {
              setCloudError(err instanceof Error ? err : new Error(String(err)));
            }
          }
        }
      );

      unsubAllAdmins = onSnapshot(
        collection(db, 'admins'),
        (snapshot) => {
          if (cancelled) return;
          setAllAdminRoles(
            snapshot.docs.map((d) => {
              const data = d.data() as Record<string, unknown>;
              return {
                uid: typeof data.uid === 'string' ? data.uid : d.id,
                email: typeof data.email === 'string' ? data.email : '',
                displayName:
                  typeof data.displayName === 'string' ? data.displayName : '',
                role: 'module_manager' as const,
                grantedByUid:
                  typeof data.grantedByUid === 'string'
                    ? data.grantedByUid
                    : ''
              };
            })
          );
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.LIST, 'admins');
          } catch (err) {
            if (!cancelled) {
              setCloudError(err instanceof Error ? err : new Error(String(err)));
            }
          }
        }
      );
    }

    return () => {
      cancelled = true;
      unsubUserAccess();
      unsubAdminRole();
      unsubUserPayments();
      if (unsubAllUsers) unsubAllUsers();
      if (unsubAllPayments) unsubAllPayments();
      if (unsubAllAdmins) unsubAllAdmins();
    };
  }, [authUser]);

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

  const navigateWithGate = useCallback(
    (tab: NavTab) => {
      if (tab !== 'courses' && !effectiveAccess.isSignedIn) {
        setLoginOpen(true);
        return;
      }
      if (tab === 'admin' && !effectiveAccess.canManageModules) {
        setActiveTab('courses');
        return;
      }
      if (
        tab !== 'courses' &&
        tab !== 'admin' &&
        effectiveAccess.isSignedIn &&
        !effectiveAccess.canAccessFeatures
      ) {
        setUpgradeModalOpen(true);
        return;
      }
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [effectiveAccess]
  );

  const handleOpenCourse = (
    courseId: string,
    lessonId?: string,
    pathwayStep?: PathwayStepId
  ) => {
    if (!effectiveAccess.isSignedIn) {
      setLoginOpen(true);
      return;
    }
    if (!effectiveAccess.canAccessFeatures) {
      setUpgradeModalOpen(true);
      return;
    }
    if (unlockedCourseIds && !unlockedCourseIds.has(courseId)) {
      setUpgradeModalOpen(true);
      return;
    }
    const targetCourse =
      allCourses.find((c) => c.id === courseId) ?? allCourses[0] ?? COURSES[0];
    setActiveCourseId(targetCourse.id);
    setActiveLessonId(lessonId ?? targetCourse.lessons[0]?.id ?? '');
    setActivePathwayStep(
      pathwayStep ?? (lessonId ? 'video-lessons' : undefined)
    );
    setActiveTab('classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQuizOrCertificate = (courseId: string, passed: boolean) => {
    if (!effectiveAccess.isSignedIn) {
      setLoginOpen(true);
      return;
    }
    if (!effectiveAccess.canAccessFeatures) {
      setUpgradeModalOpen(true);
      return;
    }
    if (unlockedCourseIds && !unlockedCourseIds.has(courseId)) {
      setUpgradeModalOpen(true);
      return;
    }
    if (passed && !effectiveAccess.canGetCertificate) {
      setUpgradeModalOpen(true);
      return;
    }
    if (!passed && !effectiveAccess.canTakeQuiz) {
      setUpgradeModalOpen(true);
      return;
    }
    setActiveCourseId(courseId);
    setActiveTab(passed ? 'certificate' : 'quiz');
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

  const handleSavePreAssessment = useCallback(
    (result: PreAssessmentResult) => {
      setPathwayProgress((prev) => ({
        ...prev,
        preAssessments: {
          ...prev.preAssessments,
          [result.courseId]: result
        }
      }));
      handleLogPracticeMinutes(3);
    },
    [handleLogPracticeMinutes]
  );

  const handleUpdateInteractive = useCallback(
    (result: InteractiveLearningResult) => {
      const previous = pathwayProgress.interactiveResults[result.courseId];
      const wasDone = Boolean(
        previous &&
          previous.quizChecked &&
          previous.dragDropSolved &&
          previous.scenarioSolved
      );
      const nowDone =
        result.quizChecked && result.dragDropSolved && result.scenarioSolved;

      setPathwayProgress((prev) => ({
        ...prev,
        interactiveResults: {
          ...prev.interactiveResults,
          [result.courseId]: result
        }
      }));

      if (!wasDone && nowDone) {
        handleLogPracticeMinutes(4);
      }
    },
    [pathwayProgress.interactiveResults, handleLogPracticeMinutes]
  );

  const handleSubmitAssignment = useCallback(
    (submission: PracticalAssignmentSubmission) => {
      setPathwayProgress((prev) => ({
        ...prev,
        assignments: {
          ...prev.assignments,
          [submission.courseId]: submission
        }
      }));
      handleLogPracticeMinutes(10);
    },
    [handleLogPracticeMinutes]
  );

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
    setPathwayProgress(EMPTY_PATHWAY_PROGRESS);
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

  const handleSaveModule = useCallback(
    async (course: CustomCourseRecord, _isBuiltIn: boolean) => {
      const cloudManager = canManageModules && Boolean(authUser);
      const normalized: CustomCourseRecord = {
        ...course,
        isCustom: true,
        ...(cloudManager && authUser
          ? { createdByUid: course.createdByUid ?? authUser.uid }
          : {})
      };

      if (cloudManager && authUser) {
        const isNewInCloud = !cloudCourseIdsRef.current.has(normalized.id);
        await saveCloudCourse(authUser.uid, normalized, isNewInCloud);
        cloudCourseIdsRef.current.add(normalized.id);
      }

      setCustomCourses((prev) => {
        const exists = prev.some((c) => c.id === normalized.id);
        if (exists) {
          return prev.map((c) => (c.id === normalized.id ? normalized : c));
        }
        return [normalized, ...prev];
      });
    },
    [authUser, canManageModules]
  );

  const handleRevertBuiltInOverride = useCallback(
    async (courseId: string) => {
      if (canManageModules && cloudCourseIdsRef.current.has(courseId)) {
        await deleteCloudCourse(courseId);
        cloudCourseIdsRef.current.delete(courseId);
      }
      setCustomCourses((prev) => prev.filter((c) => c.id !== courseId));
    },
    [canManageModules]
  );

  const syncModuleLayout = useCallback(
    async (nextLayout: ModuleLayoutConfig) => {
      setModuleLayout(nextLayout);
      if (canManageModules && authUser) {
        await saveCloudModuleLayout(authUser.uid, nextLayout);
      }
    },
    [authUser, canManageModules]
  );

  const handleDeleteCourse = useCallback(
    async (courseId: string) => {
      if (canManageModules && cloudCourseIdsRef.current.has(courseId)) {
        await deleteCloudCourse(courseId);
        cloudCourseIdsRef.current.delete(courseId);
      }
      setCustomCourses((prev) => prev.filter((c) => c.id !== courseId));
      const nextLayout: ModuleLayoutConfig = {
        orderedIds: moduleLayout.orderedIds.filter((id) => id !== courseId),
        hiddenCourseIds: moduleLayout.hiddenCourseIds.filter(
          (id) => id !== courseId
        )
      };
      await syncModuleLayout(nextLayout);
      if (activeCourseId === courseId) {
        setActiveCourseId(COURSES[0].id);
        setActiveLessonId(COURSES[0].lessons[0].id);
      }
    },
    [canManageModules, activeCourseId, moduleLayout, syncModuleLayout]
  );

  const handleReorderModules = useCallback(
    async (orderedIds: string[]) => {
      await syncModuleLayout({
        orderedIds,
        hiddenCourseIds: moduleLayout.hiddenCourseIds
      });
    },
    [moduleLayout.hiddenCourseIds, syncModuleLayout]
  );

  const handleToggleModuleVisibility = useCallback(
    async (courseId: string) => {
      const exists = moduleLayout.hiddenCourseIds.includes(courseId);
      const nextHidden = exists
        ? moduleLayout.hiddenCourseIds.filter((id) => id !== courseId)
        : [...moduleLayout.hiddenCourseIds, courseId];
      await syncModuleLayout({
        orderedIds:
          moduleLayout.orderedIds.length > 0
            ? moduleLayout.orderedIds
            : allManagedCourses.map((c) => c.id),
        hiddenCourseIds: nextHidden
      });
    },
    [moduleLayout, allManagedCourses, syncModuleLayout]
  );

  const handleBatchRenumberModules = useCallback(async () => {
    const cloudManager = canManageModules && Boolean(authUser);
    const customMap = new Map<string, CustomCourseRecord>();
    customCourses.forEach((c) => customMap.set(c.id, c));

    const updatedRecords: CustomCourseRecord[] = [];
    for (let idx = 0; idx < allManagedCourses.length; idx += 1) {
      const course = allManagedCourses[idx];
      const bnNum = toBengaliDigits(String(idx + 1).padStart(2, '0'));
      const strippedTitle = course.title
        .replace(/^[০-৯0-9]{1,3}\s*[·.\-:–—]\s*/, '')
        .trim();
      const nextTitle = `${bnNum} · ${strippedTitle || course.title}`;
      const existingRec = customMap.get(course.id);

      if (course.title !== nextTitle || existingRec?.orderIndex !== idx) {
        const record: CustomCourseRecord = {
          ...course,
          ...(existingRec ?? {}),
          title: nextTitle,
          orderIndex: idx,
          published: existingRec ? existingRec.published : true,
          isCustom: true,
          ...(cloudManager && authUser
            ? { createdByUid: existingRec?.createdByUid ?? authUser.uid }
            : {})
        };
        updatedRecords.push(record);
        if (cloudManager && authUser) {
          const isNewInCloud = !cloudCourseIdsRef.current.has(record.id);
          await saveCloudCourse(authUser.uid, record, isNewInCloud);
          cloudCourseIdsRef.current.add(record.id);
        }
      }
    }

    if (updatedRecords.length > 0) {
      const updatedMap = new Map(updatedRecords.map((r) => [r.id, r]));
      setCustomCourses((prev) => {
        const next = prev.map((c) => updatedMap.get(c.id) ?? c);
        updatedRecords.forEach((rec) => {
          if (!next.some((c) => c.id === rec.id)) {
            next.push(rec);
          }
        });
        return next;
      });
    }
  }, [authUser, canManageModules, customCourses, allManagedCourses]);

  const handleResetLayoutToDefault = useCallback(async () => {
    await syncModuleLayout({ orderedIds: [], hiddenCourseIds: [] });
  }, [syncModuleLayout]);

  const handleSaveMaterial = useCallback(
    async (material: UploadedMaterialItem, isNew: boolean) => {
      const cloudManager = canManageModules && Boolean(authUser);
      const normalized: UploadedMaterialItem = {
        ...material,
        ...(cloudManager && authUser
          ? { createdByUid: material.createdByUid ?? authUser.uid }
          : {})
      };

      if (cloudManager && authUser) {
        await saveCloudMaterial(authUser.uid, normalized, isNew);
      }

      setUploadedMaterials((prev) => {
        const exists = prev.some((m) => m.id === normalized.id);
        if (exists) {
          return prev.map((m) => (m.id === normalized.id ? normalized : m));
        }
        return [normalized, ...prev];
      });
    },
    [authUser, canManageModules]
  );

  const handleDeleteMaterial = useCallback(
    async (materialId: string) => {
      if (canManageModules) {
        await deleteCloudMaterial(materialId);
      }
      setUploadedMaterials((prev) => prev.filter((m) => m.id !== materialId));
    },
    [canManageModules]
  );

  const handleSaveAccessControl = useCallback(
    async (nextConfig: AccessControlConfig) => {
      if (!authUser || !isSuperAdmin) return;
      await saveCloudAccessControl(authUser.uid, nextConfig);
    },
    [authUser, isSuperAdmin]
  );

  const handleSuperAdminUpdateUserAccess = useCallback(
    async (
      targetUserId: string,
      patch: {
        displayName?: string;
        planTier: UserAccessRecord['planTier'];
        trialStartedAtMs: number;
        trialEndsAtMs: number;
        proActivatedAtMs: number;
        proExpiresAtMs: number;
        allowFullOverride: boolean;
        customNote: string;
      }
    ) => {
      if (!isSuperAdmin) return;
      await adminUpdateUserAccess(targetUserId, patch);
    },
    [isSuperAdmin]
  );

  const handleReviewPaymentRequest = useCallback(
    async (
      req: PaymentRequestRecord,
      approve: boolean,
      reviewNote: string,
      existingUserAccess?: UserAccessRecord
    ) => {
      if (!authUser || !isSuperAdmin) return;
      await reviewPaymentRequestAndGrantPro(
        authUser.uid,
        req,
        approve,
        accessConfig.annualDurationDays,
        reviewNote,
        existingUserAccess
      );
    },
    [authUser, isSuperAdmin, accessConfig.annualDurationDays]
  );

  const handleToggleModuleManagerRole = useCallback(
    async (userRec: UserAccessRecord, shouldBeManager: boolean) => {
      if (!authUser || !isSuperAdmin) return;
      if (shouldBeManager) {
        await grantModuleManagerRole(authUser.uid, {
          uid: userRec.uid,
          email: userRec.email,
          displayName: userRec.displayName
        });
      } else {
        await revokeModuleManagerRole(userRec.uid);
      }
    },
    [authUser, isSuperAdmin]
  );

  const handleSubmitPaymentRequest = useCallback(
    async (payload: {
      userName: string;
      method: PaymentMethodType;
      senderPhone: string;
      transactionId: string;
      amountBdt: number;
      note: string;
    }) => {
      if (!authUser || !authUser.emailVerified) {
        setLoginOpen(true);
        return;
      }
      await submitPaymentRequest(authUser, payload);
    },
    [authUser]
  );

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
        canManageModules={canManageModules}
        effectiveAccess={effectiveAccess}
        onNavigate={navigateWithGate}
        onOpenProfile={() => {
          if (!effectiveAccess.isSignedIn) {
            setLoginOpen(true);
            return;
          }
          setProfileOpen(true);
        }}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenUpgrade={() => setUpgradeModalOpen(true)}
      />

      <main className="flex-1">
        {activeTab !== 'courses' && !effectiveAccess.isSignedIn && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="glass-surface rounded-3xl p-8 sm:p-10 text-center space-y-5">
              <div className="glass-3d-icon-well w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-[#15803D]">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <div className="text-xs font-semibold text-[#15803D]">
                  লগইন সুরক্ষিত অঞ্চল · TPACK Academy
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#132219]">
                  ফিচারগুলো ব্যবহার করতে প্রথমে Google দিয়ে লগইন করুন
                </h1>
                <p className="text-sm text-[#3F5247] leading-relaxed">
                  লগইন না করলে কোনো প্রশিক্ষণ মডিউল, ভিডিও, উপকরণ, কুইজ বা সার্টিফিকেট এক্সেস করা যাবে না। সাইন ইন করলে সাথে সাথে{' '}
                  <strong>{toBengaliDigits(accessConfig.freeTrialDays)} দিনের ফ্রি লিমিটেড এক্সেস</strong>{' '}
                  চালু হবে এবং মাত্র ৳{toBengaliDigits(accessConfig.annualPriceBdt)} টাকায় ১ বছরের ফুল এক্সেস নিতে পারবেন।
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[46px] cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Google দিয়ে লগইন করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-3 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[46px] cursor-pointer"
                >
                  মূল পাতায় ফিরুন
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab !== 'courses' &&
          effectiveAccess.isSignedIn &&
          !effectiveAccess.canAccessFeatures &&
          !(activeTab === 'admin' && effectiveAccess.canManageModules) && (
            <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="glass-surface rounded-3xl p-8 sm:p-10 text-center space-y-5">
                <div className="glass-3d-icon-well w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-[#B45309]">
                  <Crown className="w-7 h-7" />
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <div className="text-xs font-semibold text-[#B45309]">
                    {effectiveAccess.statusLabelBn}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#132219]">
                    {effectiveAccess.status === 'maintenance'
                      ? 'প্ল্যাটফর্মে সাময়িক রক্ষণাবেক্ষণ চলছে'
                      : effectiveAccess.status === 'suspended'
                        ? 'আপনার অ্যাকাউন্টের এক্সেস সাময়িকভাবে স্থগিত'
                        : 'আপনার ৭ দিনের ফ্রি ট্রায়াল মেয়াদ শেষ হয়েছে'}
                  </h1>
                  <p className="text-sm text-[#3F5247] leading-relaxed">
                    {effectiveAccess.statusDetailBn}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {effectiveAccess.status !== 'maintenance' &&
                    effectiveAccess.status !== 'suspended' && (
                      <button
                        type="button"
                        onClick={() => setUpgradeModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[46px] cursor-pointer"
                      >
                        <Crown className="w-4 h-4" />
                        <span>
                          ৳{toBengaliDigits(accessConfig.annualPriceBdt)} টাকায় ১ বছরের ফুল এক্সেস নিন
                        </span>
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('courses')}
                    className="px-4 py-3 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[46px] cursor-pointer"
                  >
                    মূল পাতায় ফিরুন
                  </button>
                </div>
              </div>
            </section>
          )}

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
                  {effectiveAccess.isSignedIn ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenCourse(allCourses[0]?.id ?? COURSES[0].id)
                        }
                        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                      >
                        <span>প্রশিক্ষণ শুরু করুন</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!effectiveAccess.canGetCertificate) {
                            setUpgradeModalOpen(true);
                            return;
                          }
                          navigateWithGate('certificate');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-[#15803D]" />
                        <span>CPD সার্টিফিকেট</span>
                      </button>

                      {!effectiveAccess.isProActive &&
                        !effectiveAccess.isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setUpgradeModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#B45309] btn-3d-glass ring-1 ring-[#D97706]/35 rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                          >
                            <Crown className="w-4 h-4" />
                            <span>
                              ৳{toBengaliDigits(accessConfig.annualPriceBdt)}/বছর ফুল এক্সেস
                            </span>
                          </button>
                        )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLoginOpen(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[46px] cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Google দিয়ে লগইন করে শুরু করুন</span>
                    </button>
                  )}
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
              freeTrialDays={accessConfig.freeTrialDays}
              annualPriceBdt={accessConfig.annualPriceBdt}
              onOpenLoginModal={() => setLoginOpen(true)}
              onSignOut={handleSignOut}
            />

            {!effectiveAccess.isSignedIn ? (
              <section
                aria-label="লগইন গেট ও সাবস্ক্রিপশন পরিকল্পনা"
                className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/75">
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-[#15803D] inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>লগইন ছাড়া ফিচারসমূহ বন্ধ রয়েছে</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#132219]">
                      প্রশিক্ষণ মডিউল, ভিডিও ও CPD সার্টিফিকেট চালু করতে সাইন ইন করুন
                    </h2>
                    <p className="text-sm text-[#3F5247] max-w-2xl">
                      সকল ফিচার ব্যবহার করতে Google অ্যাকাউন্ট দিয়ে লগইন বাধ্যতামূলক। লগইন করার পর স্বয়ংক্রিয়ভাবে{' '}
                      {toBengaliDigits(accessConfig.freeTrialDays)} দিনের ফ্রি লিমিটেড এক্সেস পাবেন।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLoginOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[46px] cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>এখনই লগইন করুন</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="glass-card-3d rounded-2xl p-5 sm:p-6 space-y-3">
                    <div className="text-xs font-semibold text-[#15803D]">
                      প্ল্যান ০১ · স্বয়ংক্রিয় শুরু
                    </div>
                    <h3 className="text-xl font-bold text-[#132219]">
                      {toBengaliDigits(accessConfig.freeTrialDays)} দিন ফ্রি লিমিটেড এক্সেস
                    </h3>
                    <div className="text-2xl font-bold font-mono text-[#132219]">
                      ৳০{' '}
                      <span className="text-xs font-normal text-[#3F5247]">
                        / প্রথম {toBengaliDigits(accessConfig.freeTrialDays)} দিন
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#2C3E33] pt-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                        <span>
                          প্রথম {toBengaliDigits(accessConfig.freeTrialMaxModules)}টি পূর্ণাঙ্গ প্রশিক্ষণ মডিউল উন্মুক্ত
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                        <span>ইন্টারঅ্যাক্টিভ পাঠ ও নোটবুক ব্যবহারের সুবিধা</span>
                      </li>
                    </ul>
                  </div>

                  <div className="glass-card-3d rounded-2xl p-5 sm:p-6 ring-1 ring-[#15803D]/35 space-y-3">
                    <div className="text-xs font-semibold text-[#15803D] inline-flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      <span>প্ল্যান ০২ · বার্ষিক প্রো সদস্যপদ</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#132219]">
                      ১ বছরের পূর্ণাঙ্গ প্রো এক্সেস
                    </h3>
                    <div className="text-2xl font-bold font-mono text-[#15803D]">
                      ৳{toBengaliDigits(accessConfig.annualPriceBdt)}{' '}
                      <span className="text-xs font-normal text-[#3F5247]">
                        / {toBengaliDigits(accessConfig.annualDurationDays)} দিন (১ বছর)
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#2C3E33] pt-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                        <span>
                          সব ({toBengaliDigits(allCourses.length)}টি+) মডিউল, ভিডিও ও ডাউনলোডযোগ্য উপকরণ আনলকড
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                        <span>সকল কুইজ, প্র্যাকটিক্যাল অ্যাসাইনমেন্ট ও অফিশিয়াল CPD সার্টিফিকেট</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            ) : !effectiveAccess.canAccessFeatures ? (
              <section
                aria-label="এক্সেস সীমাবদ্ধ"
                className="glass-surface rounded-3xl p-7 sm:p-9 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="glass-3d-icon-well w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-[#B45309]">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-[#B45309]">
                      {effectiveAccess.statusLabelBn}
                    </div>
                    <h2 className="text-xl font-bold text-[#132219]">
                      কোর্স ও প্রশিক্ষণ ফিচার পুনরায় চালু করতে প্রো এক্সেস সক্রিয় করুন
                    </h2>
                    <p className="text-sm text-[#3F5247]">
                      {effectiveAccess.statusDetailBn}
                    </p>
                  </div>
                </div>
                {effectiveAccess.status !== 'maintenance' &&
                  effectiveAccess.status !== 'suspended' && (
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Crown className="w-4 h-4" />
                      <span>
                        ৳{toBengaliDigits(accessConfig.annualPriceBdt)}/বছর আনলক করুন
                      </span>
                    </button>
                  )}
              </section>
            ) : (
              <>
                {/* Signed-in Access Plan Banner */}
                {!effectiveAccess.isSuperAdmin && (
                  <section
                    aria-label="সাবস্ক্রিপশন ও এক্সেস অবস্থা"
                    className="glass-surface rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="glass-3d-icon-well w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[#15803D]">
                        {effectiveAccess.isModuleManager ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <Crown className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#132219]">
                          {effectiveAccess.statusLabelBn}
                        </div>
                        <div className="text-xs text-[#3F5247]">
                          {effectiveAccess.statusDetailBn}
                        </div>
                      </div>
                    </div>

                    {!effectiveAccess.isProActive && (
                      <button
                        type="button"
                        onClick={() => setUpgradeModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>
                          ৳{toBengaliDigits(accessConfig.annualPriceBdt)} টাকায় ১ বছরের ফুল এক্সেস নিন
                        </span>
                      </button>
                    )}
                  </section>
                )}

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
                  onGoToQuiz={() => navigateWithGate('quiz')}
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
                  pathwayProgress={pathwayProgress}
                  unlockedCourseIds={unlockedCourseIds}
                  onOpenCourse={(courseId) => handleOpenCourse(courseId)}
                  onOpenQuizOrCertificate={handleOpenQuizOrCertificate}
                  onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
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
                  pathwayProgress={pathwayProgress}
                  unlockedCourseIds={unlockedCourseIds}
                  onOpenCourse={(courseId, pathwayStep) =>
                    handleOpenCourse(courseId, undefined, pathwayStep)
                  }
                  onOpenQuizOrCertificate={handleOpenQuizOrCertificate}
                  onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
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
                      onClick={() => navigateWithGate('achievements')}
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
                  onOpenFullCalendar={() => navigateWithGate('calendar')}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'classroom' &&
          effectiveAccess.isSignedIn &&
          effectiveAccess.canAccessFeatures && (
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
              pathwayProgress={pathwayProgress}
              achievements={evaluatedAchievements}
              initialPathwayStep={activePathwayStep}
              canPlayVideos={effectiveAccess.canPlayVideos}
              canDownloadMaterials={effectiveAccess.canDownloadMaterials}
              canTakeQuiz={effectiveAccess.canTakeQuiz}
              canGetCertificate={effectiveAccess.canGetCertificate}
              onSavePreAssessment={handleSavePreAssessment}
              onUpdateInteractive={handleUpdateInteractive}
              onSubmitAssignment={handleSubmitAssignment}
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
              onGoToQuiz={() => navigateWithGate('quiz')}
              onGoToCertificate={() => navigateWithGate('certificate')}
              onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
            />
          )}

        {activeTab === 'materials' &&
          effectiveAccess.isSignedIn &&
          effectiveAccess.canAccessFeatures && (
            <MaterialsLibraryView
              courses={allCourses}
              uploadedMaterials={visibleUploadedMaterials}
              readMaterialIds={progress.readMaterialIds}
              canPlayVideos={effectiveAccess.canPlayVideos}
              canDownloadMaterials={effectiveAccess.canDownloadMaterials}
              onMarkMaterialRead={handleMarkMaterialRead}
              onOpenLessonInClassroom={(courseId, lessonId) =>
                handleOpenCourse(courseId, lessonId)
              }
              onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
            />
          )}

        {activeTab === 'quiz' &&
          effectiveAccess.isSignedIn &&
          effectiveAccess.canAccessFeatures && (
            <QuizCenterView
              courses={allCourses}
              selectedCourseId={activeCourseId}
              quizResults={progress.quizResults}
              achievements={evaluatedAchievements}
              canTakeQuiz={effectiveAccess.canTakeQuiz}
              unlockedCourseIds={unlockedCourseIds}
              onSelectCourse={setActiveCourseId}
              onCompleteQuiz={handleCompleteQuiz}
              onOpenCertificate={(courseId) => {
                if (!effectiveAccess.canGetCertificate) {
                  setUpgradeModalOpen(true);
                  return;
                }
                setActiveCourseId(courseId);
                setActiveTab('certificate');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAchievements={() => navigateWithGate('achievements')}
              onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
            />
          )}

        {activeTab === 'calendar' &&
          effectiveAccess.isSignedIn &&
          effectiveAccess.canAccessFeatures && (
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
                navigateWithGate(tab);
              }}
            />
          )}

        {activeTab === 'achievements' &&
          effectiveAccess.isSignedIn &&
          effectiveAccess.canAccessFeatures && (
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
                navigateWithGate(tab);
              }}
            />
          )}

        {activeTab === 'certificate' &&
          effectiveAccess.isSignedIn &&
          effectiveAccess.canAccessFeatures && (
            <CertificateStudioView
              courses={allCourses}
              selectedCourseId={activeCourseId}
              learnerName={progress.learnerName}
              designation={progress.designation}
              schoolName={progress.schoolName}
              quizResults={progress.quizResults}
              canGetCertificate={effectiveAccess.canGetCertificate}
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
                navigateWithGate('quiz');
              }}
              onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
            />
          )}

        {activeTab === 'admin' && effectiveAccess.isSignedIn && (
          <AdminPanelView
            authUser={authUser}
            isSuperAdmin={isSuperAdmin}
            canManageModules={canManageModules}
            allManagedCourses={allManagedCourses}
            customCourses={customCourses}
            builtInIds={builtInIds}
            overrideIds={overrideIds}
            hiddenCourseIds={moduleLayout.hiddenCourseIds}
            uploadedMaterials={uploadedMaterials}
            accessConfig={accessConfig}
            userAccessList={allUserAccessList}
            paymentRequests={allPaymentRequests}
            adminRoles={allAdminRoles}
            onSaveModule={handleSaveModule}
            onRevertBuiltInOverride={handleRevertBuiltInOverride}
            onDeleteCourse={handleDeleteCourse}
            onReorderModules={handleReorderModules}
            onToggleModuleVisibility={handleToggleModuleVisibility}
            onBatchRenumberModules={handleBatchRenumberModules}
            onResetLayoutToDefault={handleResetLayoutToDefault}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onSaveAccessControl={handleSaveAccessControl}
            onUpdateUserAccess={handleSuperAdminUpdateUserAccess}
            onReviewPaymentRequest={handleReviewPaymentRequest}
            onToggleModuleManagerRole={handleToggleModuleManagerRole}
            onOpenLogin={() => setLoginOpen(true)}
            onOpenCourseInClassroom={(courseId) => handleOpenCourse(courseId)}
            onOpenMaterialsLibrary={() => navigateWithGate('materials')}
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
              onClick={() => navigateWithGate('materials')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              লেসন প্ল্যান
            </button>
            <button
              type="button"
              onClick={() => navigateWithGate('quiz')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              মূল্যায়ন কুইজ
            </button>
            <button
              type="button"
              onClick={() => navigateWithGate('calendar')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              প্রশিক্ষণ ক্যালেন্ডার
            </button>
            <button
              type="button"
              onClick={() => navigateWithGate('achievements')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              অর্জন ও ব্যাজ
            </button>
            <button
              type="button"
              onClick={() => navigateWithGate('certificate')}
              className="hover:text-[#132219] transition-colors cursor-pointer"
            >
              CPD সনদ
            </button>
            {effectiveAccess.canManageModules && (
              <button
                type="button"
                onClick={() => navigateWithGate('admin')}
                className="hover:text-[#132219] transition-colors cursor-pointer"
              >
                {effectiveAccess.isSuperAdmin
                  ? 'সুপার অ্যাডমিন'
                  : 'মডিউল ম্যানেজার'}
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
        onOpenAchievements={() => navigateWithGate('achievements')}
      />

      <LoginPanelModal
        isOpen={loginOpen}
        authUser={authUser}
        authLoading={authLoading}
        learnerName={progress.learnerName}
        designation={progress.designation}
        schoolName={progress.schoolName}
        freeTrialDays={accessConfig.freeTrialDays}
        annualPriceBdt={accessConfig.annualPriceBdt}
        onClose={() => setLoginOpen(false)}
        onOpenProfile={() => {
          if (effectiveAccess.isSignedIn) {
            setProfileOpen(true);
          }
        }}
      />

      <AccessUpgradeModal
        isOpen={upgradeModalOpen}
        authUser={authUser}
        learnerName={progress.learnerName}
        totalModulesCount={allCourses.length}
        accessConfig={accessConfig}
        effectiveAccess={effectiveAccess}
        userPaymentRequests={userPaymentRequests}
        onClose={() => setUpgradeModalOpen(false)}
        onOpenLogin={() => {
          setUpgradeModalOpen(false);
          setLoginOpen(true);
        }}
        onSubmitPaymentRequest={handleSubmitPaymentRequest}
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
