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
  published: boolean;
  createdByUid?: string;
}
