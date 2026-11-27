export type CourseCategory = 'all' | 'tpack-tech' | 'pedagogy-eval' | 'research-leadership';

export type NavTab =
  | 'courses'
  | 'classroom'
  | 'materials'
  | 'quiz'
  | 'calendar'
  | 'achievements'
  | 'certificate'
  | 'admin';

export interface VideoChapter {
  timeSec: number;
  title: string;
  caption: string;
}

export interface LessonMaterial {
  id: string;
  title: string;
  formatLabel: string;
  readTime: string;
  summary: string;
  keyPoints: string[];
  classroomActivity: {
    gradeLevel: string;
    duration: string;
    objective: string;
  };
  actionChecklist: string[];
  formulaOrMetric?: {
    label: string;
    expression: string;
    note: string;
  };
}

export interface Lesson {
  id: string;
  number: string;
  title: string;
  durationLabel: string;
  durationSec: number;
  visualTheme:
    | 'tpack-venn'
    | 'digital-media'
    | 'pedagogy-5e'
    | 'assessment-rubric'
    | 'classroom-collab'
    | 'action-research';
  chapters: VideoChapter[];
  material: LessonMaterial;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CoursePathwayConfig {
  preAssessmentQuestions?: {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    diagnosticNote: string;
  }[];
  interactiveMicroQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  interactiveDragSteps?: string[];
  interactiveScenario?: {
    context: string;
    challenge: string;
    choices: {
      text: string;
      isBest: boolean;
      feedback: string;
    }[];
  };
  assignmentDefaults?: {
    defaultType: AssignmentArtifactType;
    title: string;
    gradeAndDuration: string;
    learningObjective: string;
    activitiesAndMaterials: string;
    assessmentMethod: string;
  };
}

export interface ModuleLayoutConfig {
  orderedIds: string[];
  hiddenCourseIds: string[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<CourseCategory, 'all'>;
  categoryLabel: string;
  levelLabel: string;
  cpdHoursLabel: string;
  totalDurationLabel: string;
  instructor: string;
  instructorRole: string;
  imagePath: string;
  description: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
  pathwayConfig?: CoursePathwayConfig;
}

export interface QuizResult {
  courseId: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  certificateId: string;
}

export type ScheduleSessionType = 'webinar' | 'workshop' | 'qa';

export interface TrainingSession {
  id: string;
  title: string;
  type: ScheduleSessionType;
  typeLabel: string;
  isoDate: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  icsStart: string;
  icsEnd: string;
  trainerName: string;
  trainerRole: string;
  platformLabel: string;
  courseId: string;
  courseTitle: string;
  topicSummary: string;
  seatsTotal: number;
  seatsAvailable: number;
}

export type CalendarEventKind = ScheduleSessionType | 'cpd-deadline';

export interface CpdDeadline {
  id: string;
  title: string;
  isoDate: string;
  dateLabel: string;
  timeLabel: string;
  icsStart: string;
  icsEnd: string;
  courseId: string;
  courseTitle: string;
  cpdCreditsLabel: string;
  requirementSummary: string;
  targetTab: 'quiz' | 'classroom' | 'certificate' | 'materials';
  ctaLabel: string;
}

export type AchievementCategory =
  | 'all'
  | 'module-mastery'
  | 'quiz-excellence'
  | 'cpd-milestone';

export type AchievementTier = 'emerald' | 'gold' | 'forest';

export type AchievementIconKey =
  | 'cpu'
  | 'compass'
  | 'users'
  | 'target'
  | 'book'
  | 'award'
  | 'trophy'
  | 'calendar';

export interface AchievementProgressInfo {
  unlocked: boolean;
  current: number;
  target: number;
  percentage: number;
  progressLabel: string;
}

export interface AchievementDefinition {
  id: string;
  titleEn: string;
  titleBn: string;
  category: Exclude<AchievementCategory, 'all'>;
  categoryLabel: string;
  tier: AchievementTier;
  tierLabel: string;
  iconKey: AchievementIconKey;
  description: string;
  criteriaLabel: string;
  targetTab: 'classroom' | 'quiz' | 'materials';
  targetCourseId?: string;
  ctaLabel: string;
  evaluate: (progress: LearnerProgress, courses: Course[]) => AchievementProgressInfo;
}

export interface EvaluatedAchievement extends AchievementDefinition {
  status: AchievementProgressInfo;
  earnedAt?: string;
}

export interface VoiceReflectionMeta {
  id: string;
  durationSec: number;
  mimeType: string;
  createdAt: string;
  label: string;
}

export interface LessonNote {
  content: string;
  updatedAt: string;
  voiceReflections?: VoiceReflectionMeta[];
}

export type DiscussionPostType = 'question' | 'experience';

export interface DiscussionReply {
  id: string;
  authorName: string;
  authorRole: string;
  isInstructor?: boolean;
  body: string;
  createdAt: string;
  isOwn?: boolean;
}

export interface DiscussionPost {
  id: string;
  courseId: string;
  lessonId: string;
  type: DiscussionPostType;
  title: string;
  body: string;
  authorName: string;
  authorRole: string;
  schoolName?: string;
  createdAt: string;
  helpfulCount: number;
  replies: DiscussionReply[];
  isOwn?: boolean;
}

export interface LearnerProgress {
  learnerName: string;
  designation: string;
  schoolName: string;
  completedLessonIds: string[];
  readMaterialIds: string[];
  registeredSessionIds: string[];
  quizResults: Record<string, QuizResult>;
  unlockedAchievementDates: Record<string, string>;
  lessonNotes: Record<string, LessonNote>;
  studySecondsByDate: Record<string, number>;
  activityCountByDate: Record<string, number>;
  customDiscussionPosts: DiscussionPost[];
  customDiscussionReplies: Record<string, DiscussionReply[]>;
  helpfulDiscussionIds: string[];
}

export type PedagogyTipConceptKind =
  | 'TPACK ধারণা'
  | 'শ্রেণিকক্ষ কৌশল'
  | 'মূল্যায়ন টিপ'
  | 'গবেষণা ও নেতৃত্ব';

export interface PedagogyTip {
  id: string;
  courseId: string;
  lessonId: string;
  conceptKind: PedagogyTipConceptKind;
  tpackDimension: string;
  title: string;
  strategy: string;
  classroomTakeaway: string;
  prepTimeLabel: string;
}

export interface CustomCourseRecord extends Course {
  published: boolean;
  createdByUid?: string;
  isCustom?: boolean;
  orderIndex?: number;
}

export interface UploadedMaterialItem {
  id: string;
  courseId: string;
  courseTitle: string;
  category: Exclude<CourseCategory, 'all'>;
  categoryLabel: string;
  title: string;
  formatLabel: string;
  readTime: string;
  summary: string;
  keyPoints: string[];
  actionChecklist: string[];
  classroomActivity: {
    gradeLevel: string;
    duration: string;
    objective: string;
  };
  attachmentName: string;
  attachmentContent: string;
  attachmentMimeType: string;
  videoSourceType?: 'none' | 'link' | 'upload';
  videoUrl?: string;
  videoFileName?: string;
  videoFileSizeLabel?: string;
  videoMimeType?: string;
  published: boolean;
  createdByUid?: string;
}

export type PathwayStepId =
  | 'pre-assessment'
  | 'video-lessons'
  | 'interactive-learning'
  | 'practical-assignment'
  | 'certification';

export interface PreAssessmentResult {
  courseId: string;
  score: number;
  total: number;
  percentage: number;
  readinessLabel: string;
  completedAt: string;
}

export interface InteractiveLearningResult {
  courseId: string;
  quizChecked: boolean;
  dragDropSolved: boolean;
  scenarioSolved: boolean;
  completedAt?: string;
}

export type AssignmentArtifactType =
  | 'lesson-plan'
  | 'worksheet'
  | 'digital-content';

export interface PracticalAssignmentSubmission {
  courseId: string;
  artifactType: AssignmentArtifactType;
  title: string;
  gradeAndDuration: string;
  learningObjective: string;
  activitiesAndMaterials: string;
  assessmentMethod: string;
  attachmentName?: string;
  submittedAt: string;
}

export interface CertificationPathwayProgress {
  preAssessments: Record<string, PreAssessmentResult>;
  interactiveResults: Record<string, InteractiveLearningResult>;
  assignments: Record<string, PracticalAssignmentSubmission>;
}

export type UserPlanTier = 'free_trial' | 'annual_pro' | 'suspended';

export interface UserAccessRecord {
  uid: string;
  email: string;
  displayName: string;
  planTier: UserPlanTier;
  trialStartedAtMs: number;
  trialEndsAtMs: number;
  proActivatedAtMs: number;
  proExpiresAtMs: number;
  allowFullOverride: boolean;
  customNote: string;
  updatedAtMs: number;
}

export interface AccessControlConfig {
  freeTrialDays: number;
  freeTrialMaxModules: number;
  freeTrialAllowVideos: boolean;
  freeTrialAllowMaterialsDownload: boolean;
  freeTrialAllowQuiz: boolean;
  freeTrialAllowCertificate: boolean;
  annualPriceBdt: number;
  annualDurationDays: number;
  paymentInstructions: string;
  maintenanceMode: boolean;
  updatedByUid?: string;
}

export type PaymentMethodType = 'bKash' | 'Nagad' | 'Rocket' | 'Bank';

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequestRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: PaymentMethodType;
  senderPhone: string;
  transactionId: string;
  amountBdt: number;
  note: string;
  status: PaymentRequestStatus;
  reviewedByUid: string;
  reviewNote: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface AdminRoleRecord {
  uid: string;
  email: string;
  displayName: string;
  role: 'module_manager';
  grantedByUid: string;
}

export type AccessStatusKind =
  | 'guest'
  | 'super_admin'
  | 'module_manager'
  | 'annual_pro'
  | 'free_trial'
  | 'trial_expired'
  | 'suspended'
  | 'maintenance';

export interface EffectiveAccessState {
  status: AccessStatusKind;
  isSignedIn: boolean;
  isSuperAdmin: boolean;
  isModuleManager: boolean;
  isProActive: boolean;
  isTrialActive: boolean;
  daysRemaining: number;
  allowedModuleCount: number; // Infinity when unlimited
  canAccessFeatures: boolean;
  canPlayVideos: boolean;
  canDownloadMaterials: boolean;
  canTakeQuiz: boolean;
  canGetCertificate: boolean;
  canManageModules: boolean;
  canControlPlatform: boolean;
  statusLabelBn: string;
  statusDetailBn: string;
}

