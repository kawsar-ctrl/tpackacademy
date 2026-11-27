import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  Download,
  FileText,
  Lock,
  NotebookPen,
  PlayCircle
} from 'lucide-react';
import {
  CertificationPathwayProgress,
  Course,
  DiscussionPost,
  DiscussionPostType,
  DiscussionReply,
  EvaluatedAchievement,
  InteractiveLearningResult,
  LessonNote,
  PathwayStepId,
  PracticalAssignmentSubmission,
  PreAssessmentResult,
  QuizResult,
  VoiceReflectionMeta
} from '../types/lms';
import { InteractiveVideoPlayer } from './InteractiveVideoPlayer';
import { PersonalNotebookPanel } from './PersonalNotebookPanel';
import { LessonDiscussionForum } from './LessonDiscussionForum';
import {
  CertificationStepView,
  InteractiveLearningStepView,
  PathwayStepperHeader,
  PracticalAssignmentStepView,
  PreAssessmentStepView
} from './CoursePathwayWorkspace';
import {
  downloadMaterialHandout,
  hasLessonNoteContent,
  toBengaliDigits
} from '../utils/lmsHelpers';
import { computeCoursePathwayStatus } from '../utils/pathwayHelpers';

interface ClassroomViewProps {
  course: Course;
  activeLessonId: string;
  teacherName: string;
  teacherDesignation: string;
  teacherSchool: string;
  completedLessonIds: string[];
  readMaterialIds: string[];
  lessonNotes: Record<string, LessonNote>;
  customDiscussionPosts: DiscussionPost[];
  customDiscussionReplies: Record<string, DiscussionReply[]>;
  helpfulDiscussionIds: string[];
  quizResult?: QuizResult;
  pathwayProgress: CertificationPathwayProgress;
  achievements: EvaluatedAchievement[];
  initialPathwayStep?: PathwayStepId;
  canPlayVideos?: boolean;
  canDownloadMaterials?: boolean;
  canTakeQuiz?: boolean;
  canGetCertificate?: boolean;
  onSavePreAssessment: (result: PreAssessmentResult) => void;
  onUpdateInteractive: (result: InteractiveLearningResult) => void;
  onSubmitAssignment: (submission: PracticalAssignmentSubmission) => void;
  onSelectLesson: (lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onMarkMaterialRead: (materialId: string) => void;
  onSaveLessonNote: (
    lessonId: string,
    content: string,
    voiceReflections?: VoiceReflectionMeta[]
  ) => void;
  onDeleteLessonNote: (lessonId: string) => void;
  onCreateDiscussionPost: (post: {
    courseId: string;
    lessonId: string;
    type: DiscussionPostType;
    title: string;
    body: string;
  }) => void;
  onDeleteDiscussionPost: (postId: string) => void;
  onAddDiscussionReply: (postId: string, body: string) => void;
  onToggleDiscussionHelpful: (postId: string) => void;
  onStudySecondsTick?: (seconds: number) => void;
  onBackToCatalog: () => void;
  onGoToQuiz: () => void;
  onGoToCertificate: () => void;
  onOpenUpgradeModal?: () => void;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  course,
  activeLessonId,
  teacherName,
  teacherDesignation,
  teacherSchool,
  completedLessonIds,
  readMaterialIds,
  lessonNotes,
  customDiscussionPosts,
  customDiscussionReplies,
  helpfulDiscussionIds,
  quizResult,
  pathwayProgress,
  achievements,
  initialPathwayStep,
  canPlayVideos = true,
  canDownloadMaterials = true,
  canTakeQuiz = true,
  canGetCertificate = true,
  onSavePreAssessment,
  onUpdateInteractive,
  onSubmitAssignment,
  onSelectLesson,
  onToggleLessonComplete,
  onMarkMaterialRead,
  onSaveLessonNote,
  onDeleteLessonNote,
  onCreateDiscussionPost,
  onDeleteDiscussionPost,
  onAddDiscussionReply,
  onToggleDiscussionHelpful,
  onStudySecondsTick,
  onBackToCatalog,
  onGoToQuiz,
  onGoToCertificate,
  onOpenUpgradeModal
}) => {
  const [contentTab, setContentTab] = useState<'overview' | 'checklist' | 'notebook'>('overview');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState<PathwayStepId>(() => {
    if (initialPathwayStep) return initialPathwayStep;
    return pathwayProgress.preAssessments[course.id]
      ? 'video-lessons'
      : 'pre-assessment';
  });

  useEffect(() => {
    if (initialPathwayStep) {
      setActiveStep(initialPathwayStep);
      return;
    }
    setActiveStep(
      pathwayProgress.preAssessments[course.id]
        ? 'video-lessons'
        : 'pre-assessment'
    );
  }, [course.id, initialPathwayStep]);

  const pathwayStatus = useMemo(() => {
    const quizMap = quizResult ? { [course.id]: quizResult } : {};
    return computeCoursePathwayStatus(
      course,
      completedLessonIds,
      quizMap,
      pathwayProgress
    );
  }, [course, completedLessonIds, quizResult, pathwayProgress]);

  const activeLesson =
    course.lessons.find((l) => l.id === activeLessonId) ?? course.lessons[0];

  const completedInCourse = course.lessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;
  const progressPercent =
    course.lessons.length > 0
      ? Math.round((completedInCourse / course.lessons.length) * 100)
      : 0;

  const isLessonDone = activeLesson
    ? completedLessonIds.includes(activeLesson.id)
    : false;
  const isMaterialRead = activeLesson
    ? readMaterialIds.includes(activeLesson.material.id)
    : false;

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Course Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/75">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3F5247] hover:text-[#15803D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>সব কোর্সে ফিরে যান</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#132219] tracking-tight">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#3F5247]">
            <span>{course.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>প্রশিক্ষক: {course.instructor}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {toBengaliDigits(completedInCourse)}/{toBengaliDigits(course.lessons.length)} পাঠ সম্পন্ন
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {quizResult?.passed ? (
            <button
              type="button"
              onClick={() => {
                if (!canGetCertificate && onOpenUpgradeModal) {
                  onOpenUpgradeModal();
                  return;
                }
                onGoToCertificate();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
            >
              {canGetCertificate ? (
                <Award className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>সার্টিফিকেট দেখুন</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!canTakeQuiz && onOpenUpgradeModal) {
                  onOpenUpgradeModal();
                  return;
                }
                onGoToQuiz();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
            >
              {canTakeQuiz ? (
                <ClipboardCheck className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>কোর্স কুইজ দিন</span>
            </button>
          )}
        </div>
      </div>

      {/* 5-Step Smart Teacher Certification Pathway Stepper */}
      <PathwayStepperHeader
        activeStep={activeStep}
        status={pathwayStatus}
        onSelectStep={setActiveStep}
      />

      {activeStep === 'pre-assessment' && (
        <PreAssessmentStepView
          course={course}
          savedResult={pathwayProgress.preAssessments[course.id]}
          onSavePreAssessment={onSavePreAssessment}
          onNextStep={() => setActiveStep('video-lessons')}
        />
      )}

      {activeStep === 'interactive-learning' && (
        <InteractiveLearningStepView
          course={course}
          savedInteractive={pathwayProgress.interactiveResults[course.id]}
          onUpdateInteractive={onUpdateInteractive}
          onNextStep={() => setActiveStep('practical-assignment')}
        />
      )}

      {activeStep === 'practical-assignment' && (
        <PracticalAssignmentStepView
          course={course}
          teacherName={teacherName}
          savedSubmission={pathwayProgress.assignments[course.id]}
          onSubmitAssignment={onSubmitAssignment}
          onNextStep={() => setActiveStep('certification')}
        />
      )}

      {activeStep === 'certification' && (
        <CertificationStepView
          course={course}
          status={pathwayStatus}
          pathwayProgress={pathwayProgress}
          quizResult={quizResult}
          achievements={achievements}
          onSelectStep={setActiveStep}
          onGoToQuiz={() => {
            if (!canTakeQuiz && onOpenUpgradeModal) {
              onOpenUpgradeModal();
              return;
            }
            onGoToQuiz();
          }}
          onGoToCertificate={() => {
            if (!canGetCertificate && onOpenUpgradeModal) {
              onOpenUpgradeModal();
              return;
            }
            onGoToCertificate();
          }}
        />
      )}

      {activeStep === 'video-lessons' && !activeLesson && (
        <div className="glass-surface rounded-2xl p-8 text-center space-y-4">
          <div className="text-xs font-semibold text-[#15803D]">
            ধাপ ০২ · Video Lessons (১–৫ মিনিটের Micro Learning ভিডিও)
          </div>
          <p className="text-sm text-[#3F5247]">
            এই কাস্টম কোর্সে এখনো কোনো ভিডিও লেসন যুক্ত করা হয়নি। আপনি পরবর্তী ধাপে গিয়ে ইন্টারঅ্যাক্টিভ কার্যক্রম ও অ্যাসাইনমেন্ট সম্পন্ন করতে পারেন।
          </p>
          <button
            type="button"
            onClick={() => setActiveStep('interactive-learning')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl cursor-pointer"
          >
            <span>ধাপ ০৩: Interactive Learning-এ যান</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Zone Workspace (Step 2: Micro Learning Video Lessons) */}
      {activeStep === 'video-lessons' && activeLesson && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Zone: Video Stage + Training Materials */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-surface rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold text-[#15803D]">
                ধাপ ০২ · Video Lessons — ১–৫ মিনিটের Micro Learning ভিডিও ও পাঠ উপকরণ
              </div>
              <button
                type="button"
                onClick={() => setActiveStep('interactive-learning')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#132219] hover:text-[#15803D] transition-colors cursor-pointer"
              >
                <span>পরবর্তী: ধাপ ০৩ (Interactive Learning)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#15803D]" />
              </button>
            </div>

            {canPlayVideos ? (
              <InteractiveVideoPlayer
                lesson={activeLesson}
                isCompleted={isLessonDone}
                onToggleComplete={() => onToggleLessonComplete(activeLesson.id)}
                onStudySecondsTick={onStudySecondsTick}
              />
            ) : (
              <div className="glass-surface rounded-2xl p-8 text-center space-y-4">
                <div className="glass-3d-icon-well w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-[#B45309]">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-[#132219]">
                    ভিডিও প্লেয়ার বর্তমানে সীমাবদ্ধ
                  </h3>
                  <p className="text-xs sm:text-sm text-[#3F5247]">
                    আপনার বর্তমান লিমিটেড প্ল্যানে ভিডিও পাঠ প্রদর্শন বন্ধ আছে। ১ বছরের ফুল এক্সেস নিলে সব Micro Learning ভিডিও চালু হবে।
                  </p>
                </div>
                {onOpenUpgradeModal && (
                  <button
                    type="button"
                    onClick={onOpenUpgradeModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl cursor-pointer"
                  >
                    <Crown className="w-4 h-4" />
                    <span>১,০০০ টাকায় ফুল এক্সেস নিন</span>
                  </button>
                )}
              </div>
            )}

            {/* Structured Training Material Card */}
            <div className="glass-surface rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/75">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-[#3F5247] flex items-center gap-2">
                    <span>{activeLesson.number}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeLesson.material.formatLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeLesson.material.readTime}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#132219]">
                    {activeLesson.material.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onMarkMaterialRead(activeLesson.material.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                      isMaterialRead
                        ? 'btn-3d-glass ring-1 ring-[#15803D]/50 text-[#15803D]'
                        : 'btn-3d-glass text-[#3F5247] hover:text-[#132219]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isMaterialRead ? 'পঠিত' : 'পঠিত চিহ্নিত করুন'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!canDownloadMaterials && onOpenUpgradeModal) {
                        onOpenUpgradeModal();
                        return;
                      }
                      downloadMaterialHandout(course.title, activeLesson);
                      onMarkMaterialRead(activeLesson.material.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
                  >
                    {canDownloadMaterials ? (
                      <Download className="w-3.5 h-3.5 text-[#15803D]" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#B45309]" />
                    )}
                    <span>
                      {canDownloadMaterials
                        ? 'লেসন প্ল্যান ডাউনলোড'
                        : 'ডাউনলোড (প্রো)'}
                    </span>
                  </button>
                </div>
              </div>

            {/* Segmented Switcher for Notes vs Action Checklist vs Personal Notebook */}
            <div className="inline-flex flex-wrap items-center gap-1 p-1.5 glass-well rounded-xl">
              <button
                type="button"
                onClick={() => setContentTab('overview')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  contentTab === 'overview'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                শিক্ষণ কৌশল ও পাঠ পরিকল্পনা
              </button>
              <button
                type="button"
                onClick={() => setContentTab('checklist')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  contentTab === 'checklist'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                শ্রেণিকক্ষ প্রস্তুতি চেকলিস্ট ({toBengaliDigits(activeLesson.material.actionChecklist.length)})
              </button>
              <button
                type="button"
                onClick={() => setContentTab('notebook')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  contentTab === 'notebook'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                <NotebookPen className="w-3.5 h-3.5 text-[#15803D]" />
                <span>
                  ব্যক্তিগত নোটবুক
                  {hasLessonNoteContent(lessonNotes[activeLesson.id])
                    ? ' · সংরক্ষিত'
                    : ''}
                </span>
              </button>
            </div>

            {contentTab === 'overview' ? (
              <div className="space-y-5">
                <p className="text-[15px] leading-relaxed text-[#2C3E33] max-w-[70ch]">
                  {activeLesson.material.summary}
                </p>

                {/* Classroom Application Strip */}
                <div className="p-4 rounded-xl glass-well ring-1 ring-[#15803D]/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-[#3F5247]">উপযোগী শ্রেণি</div>
                    <div className="text-sm font-semibold text-[#132219] mt-0.5">
                      {activeLesson.material.classroomActivity.gradeLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#3F5247]">পিরিয়ড সময়কাল</div>
                    <div className="text-sm font-semibold text-[#132219] mt-0.5">
                      {activeLesson.material.classroomActivity.duration}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#3F5247]">প্রত্যাশিত শিখনফল</div>
                    <div className="text-sm font-medium text-[#132219] mt-0.5">
                      {activeLesson.material.classroomActivity.objective}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-[#132219]">
                    শিক্ষকের জন্য মূল শিক্ষণীয় বিষয়
                  </h3>
                  <ul className="space-y-2.5">
                    {activeLesson.material.keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm leading-relaxed text-[#2C3E33]"
                      >
                        <span className="font-mono tabular-nums text-xs font-semibold text-[#15803D] mt-0.5 shrink-0">
                          ০{toBengaliDigits(idx + 1)}.
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {activeLesson.material.formulaOrMetric && (
                  <div className="p-4 rounded-xl glass-well space-y-1.5">
                    <div className="text-xs font-semibold text-[#15803D]">
                      {activeLesson.material.formulaOrMetric.label}
                    </div>
                    <div className="font-mono text-sm font-semibold text-[#132219] break-all">
                      {activeLesson.material.formulaOrMetric.expression}
                    </div>
                    <div className="text-xs text-[#3F5247]">
                      {activeLesson.material.formulaOrMetric.note}
                    </div>
                  </div>
                )}
              </div>
            ) : contentTab === 'checklist' ? (
              <div className="space-y-3">
                <p className="text-xs text-[#3F5247]">
                  প্রশিক্ষণের পর বাস্তব জীবনে অনুশীলনের জন্য নিচের ধাপগুলো টিক দিয়ে চিহ্নিত করুন:
                </p>
                <div className="space-y-2">
                  {activeLesson.material.actionChecklist.map((item, idx) => {
                    const key = `${activeLesson.id}-${idx}`;
                    const checked = Boolean(checkedItems[key]);
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3.5 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                          checked
                            ? 'bg-[#DCFCE7]/65 border border-[#15803D]/35 text-[#132219]'
                            : 'glass-well text-[#2C3E33] hover:bg-white/75'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheck(key)}
                          className="mt-0.5 w-4 h-4 accent-[#15803D] rounded cursor-pointer"
                        />
                        <span
                          className={`text-sm leading-relaxed ${
                            checked ? 'line-through text-[#3F5247]' : ''
                          }`}
                        >
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <PersonalNotebookPanel
                course={course}
                lesson={activeLesson}
                teacherName={teacherName}
                savedNote={lessonNotes[activeLesson.id]}
                allLessonNotes={lessonNotes}
                onSaveNote={onSaveLessonNote}
                onDeleteNote={onDeleteLessonNote}
                onSelectLesson={onSelectLesson}
              />
            )}
          </div>

          {/* Lesson Discussion Forum */}
          <LessonDiscussionForum
            course={course}
            lesson={activeLesson}
            learnerName={teacherName}
            designation={teacherDesignation}
            schoolName={teacherSchool}
            customPosts={customDiscussionPosts}
            customReplies={customDiscussionReplies}
            helpfulIds={helpfulDiscussionIds}
            onCreatePost={onCreateDiscussionPost}
            onDeletePost={onDeleteDiscussionPost}
            onAddReply={onAddDiscussionReply}
            onToggleHelpful={onToggleDiscussionHelpful}
          />
        </div>

        {/* Right Zone: Sticky Curriculum Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          <div className="glass-surface rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#132219]">
                পাঠ্যসূচি ও মডিউল
              </h2>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#15803D]">
                {toBengaliDigits(progressPercent)}% সম্পন্ন
              </span>
            </div>

            {/* Clean Progress Bar */}
            <div
              className="w-full h-2 glass-well rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-gradient-to-r from-[#15803D] to-[#22C55E] transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>

            {/* Lesson List */}
            <div className="divide-y divide-white/70">
              {course.lessons.map((lesson) => {
                const isSelected = lesson.id === activeLesson.id;
                const done = completedLessonIds.includes(lesson.id);
                const hasNote = hasLessonNoteContent(lessonNotes[lesson.id]);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => onSelectLesson(lesson.id)}
                    className={`w-full text-left py-3.5 px-3 -mx-3 rounded-xl flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/85 shadow-xs ring-1 ring-[#15803D]/25'
                        : 'hover:bg-white/50'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {done ? (
                        <CheckCircle2
                          className="w-4 h-4 text-[#15803D]"
                          aria-label="সম্পন্ন"
                        />
                      ) : (
                        <PlayCircle
                          className={`w-4 h-4 ${
                            isSelected ? 'text-[#15803D]' : 'text-[#3F5247]'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#3F5247]">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{lesson.number}</span>
                          {hasNote && (
                            <span className="inline-flex items-center gap-0.5 text-[#15803D] font-medium">
                              <span aria-hidden="true">·</span>
                              <NotebookPen className="w-3 h-3" aria-hidden="true" />
                              <span>নোট</span>
                            </span>
                          )}
                        </span>
                        <span className="font-mono tabular-nums">
                          {lesson.durationLabel}
                        </span>
                      </div>
                      <div
                        className={`text-sm leading-snug ${
                          isSelected
                            ? 'font-semibold text-[#132219]'
                            : 'font-medium text-[#2C3E33]'
                        }`}
                      >
                        {lesson.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next Pathway Step & Quiz Box */}
            <div className="pt-4 border-t border-white/75 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-[#3F5247]">
                <FileText className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  ভিডিও লেসন শেষে ধাপ ০৩ (Interactive Learning), ধাপ ০৪ (Assignment) এবং ধাপ ০৫ (Post-Assessment)-এ ৬০% নম্বর পেলেই CPD সনদ আনলক হবে।
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep('interactive-learning')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] cursor-pointer"
              >
                <span>ধাপ ০৩: Interactive Learning-এ যান</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canTakeQuiz && onOpenUpgradeModal) {
                    onOpenUpgradeModal();
                    return;
                  }
                  onGoToQuiz();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[40px] cursor-pointer"
              >
                {canTakeQuiz ? (
                  <ClipboardCheck className="w-4 h-4 text-[#15803D]" />
                ) : (
                  <Lock className="w-4 h-4 text-[#B45309]" />
                )}
                <span>
                  {quizResult
                    ? `পুনরায় Post-Assessment দিন (সেরা: ${toBengaliDigits(quizResult.percentage)}%)`
                    : 'সরাসরি Post-Assessment কুইজ'}
                </span>
              </button>
            </div>
          </div>
        </aside>
        </div>
      )}
    </section>
  );
};
