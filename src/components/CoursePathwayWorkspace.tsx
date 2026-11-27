import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Download,
  FileCheck2,
  FileText,
  GripVertical,
  HelpCircle,
  Layers,
  Lock,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Upload
} from 'lucide-react';
import {
  AssignmentArtifactType,
  CertificationPathwayProgress,
  Course,
  EvaluatedAchievement,
  InteractiveLearningResult,
  PathwayStepId,
  PracticalAssignmentSubmission,
  PreAssessmentResult,
  QuizResult
} from '../types/lms';
import {
  buildAssignmentTemplate,
  buildInteractiveActivities,
  buildPreAssessmentQuestions,
  CoursePathwayStatus,
  downloadPracticalAssignmentTxt,
  DragDropStepItem
} from '../utils/pathwayHelpers';
import { toBengaliDigits } from '../utils/lmsHelpers';
import { AchievementBadgeEmblem } from './AchievementBadgeEmblem';

export const PATHWAY_STEPS: {
  id: PathwayStepId;
  numBn: string;
  shortTitle: string;
  subtitle: string;
}[] = [
  {
    id: 'pre-assessment',
    numBn: '০১',
    shortTitle: 'Pre-Assessment',
    subtitle: 'প্রশিক্ষণ পূর্ব দক্ষতা যাচাই'
  },
  {
    id: 'video-lessons',
    numBn: '০২',
    shortTitle: 'Video Lessons',
    subtitle: '১–৫ মি. Micro Learning'
  },
  {
    id: 'interactive-learning',
    numBn: '০৩',
    shortTitle: 'Interactive Learning',
    subtitle: 'কুইজ, Drag & Drop, সিনারিও'
  },
  {
    id: 'practical-assignment',
    numBn: '০৪',
    shortTitle: 'Practical Assignment',
    subtitle: 'Lesson Plan · Worksheet · Digital'
  },
  {
    id: 'certification',
    numBn: '০৫',
    shortTitle: 'Post-Assessment & Cert',
    subtitle: 'চূড়ান্ত মূল্যায়ন, ব্যাজ ও সনদ'
  }
];

interface PathwayStepperHeaderProps {
  activeStep: PathwayStepId;
  status: CoursePathwayStatus;
  onSelectStep: (step: PathwayStepId) => void;
}

export const PathwayStepperHeader: React.FC<PathwayStepperHeaderProps> = ({
  activeStep,
  status,
  onSelectStep
}) => {
  const pct = Math.round((status.completedSteps / status.totalSteps) * 100);

  const stepIcon = (id: PathwayStepId, done: boolean, isCurrent: boolean) => {
    if (done) {
      return <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />;
    }
    const cls = `w-4 h-4 shrink-0 ${isCurrent ? 'text-[#15803D]' : 'text-[#3F5247]'}`;
    switch (id) {
      case 'pre-assessment':
        return <Compass className={cls} />;
      case 'video-lessons':
        return <PlayCircle className={cls} />;
      case 'interactive-learning':
        return <Layers className={cls} />;
      case 'practical-assignment':
        return <FileText className={cls} />;
      case 'certification':
        return <Award className={cls} />;
    }
  };

  return (
    <div className="glass-surface rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D]">
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Smart Teacher Certification Pathway · ৫-ধাপ কাঠামো</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tabular-nums font-semibold text-[#132219]">
            সম্পন্ন: {toBengaliDigits(status.completedSteps)}/{toBengaliDigits(status.totalSteps)} ধাপ ({toBengaliDigits(pct)}%)
          </span>
          <div className="w-24 h-2 glass-well rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#15803D] to-[#22C55E] transition-transform duration-300 origin-left"
              style={{ transform: `scaleX(${pct / 100})` }}
            />
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5"
        role="tablist"
        aria-label="Smart Teacher Certification Pathway ধাপসমূহ"
      >
        {PATHWAY_STEPS.map((step) => {
          const isCurrent = activeStep === step.id;
          const isDone = status.stepStatus[step.id];
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => onSelectStep(step.id)}
              className={`text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                isCurrent
                  ? 'bg-white/95 ring-2 ring-[#15803D] shadow-sm'
                  : isDone
                    ? 'bg-[#DCFCE7]/55 border border-[#15803D]/25 hover:bg-white/80'
                    : 'glass-well hover:bg-white/75'
              }`}
            >
              <div className="mt-0.5">{stepIcon(step.id, isDone, isCurrent)}</div>
              <div className="min-w-0">
                <div className="text-[11px] font-mono tabular-nums font-bold text-[#15803D]">
                  ধাপ {step.numBn} {isDone ? '· সম্পন্ন' : ''}
                </div>
                <div className="text-xs font-bold text-[#132219] truncate">
                  {step.shortTitle}
                </div>
                <div className="text-[11px] text-[#3F5247] leading-snug">
                  {step.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface PreAssessmentStepProps {
  course: Course;
  savedResult?: PreAssessmentResult;
  onSavePreAssessment: (result: PreAssessmentResult) => void;
  onNextStep: () => void;
}

export const PreAssessmentStepView: React.FC<PreAssessmentStepProps> = ({
  course,
  savedResult,
  onSavePreAssessment,
  onNextStep
}) => {
  const questions = useMemo(() => buildPreAssessmentQuestions(course), [course]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showReview, setShowReview] = useState<boolean>(Boolean(savedResult));

  useEffect(() => {
    setAnswers({});
    setShowReview(Boolean(savedResult));
  }, [course.id, savedResult]);

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) score += 1;
    });
    const percentage = Math.round((score / questions.length) * 100);
    const readinessLabel =
      percentage >= 80
        ? 'উচ্চ পূর্বজ্ঞান (গভীর অনুশীলনের জন্য প্রস্তুত)'
        : percentage >= 40
          ? 'মধ্যম প্রস্তুতি (মাইক্রো-ভিডিওতে মূল কৌশল ঝালিয়ে নিন)'
          : 'প্রারম্ভিক ভিত্তি (প্রতিটি মাইক্রো-লেসন ধাপে ধাপে দেখুন)';

    onSavePreAssessment({
      courseId: course.id,
      score,
      total: questions.length,
      percentage,
      readinessLabel,
      completedAt: new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
    setShowReview(true);
  };

  return (
    <div className="glass-surface rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/75">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D]">
            ধাপ ০১ · Pre-Assessment (প্রশিক্ষণ পূর্ব দক্ষতা যাচাই)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#132219]">
            প্রশিক্ষণ শুরুর আগে আপনার প্রাথমিক ধারণা যাচাই করুন
          </h2>
          <p className="text-sm text-[#3F5247]">
            এই ৩টি ডায়াগনস্টিক প্রশ্ন আপনার বর্তমান অবস্থান চিহ্নিত করবে এবং ভিডিও লেসন শেষে অগ্রগতির তুলনা দেখাবে।
          </p>
        </div>

        {savedResult && (
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setShowReview(false);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#15803D]" />
            <span>পুনরায় যাচাই করুন</span>
          </button>
        )}
      </div>

      {savedResult && showReview ? (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl glass-well ring-1 ring-[#15803D]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pre-Assessment সম্পন্ন · {savedResult.completedAt}</span>
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#132219]">
                প্রাথমিক স্কোর: {toBengaliDigits(savedResult.score)}/{toBengaliDigits(savedResult.total)} ({toBengaliDigits(savedResult.percentage)}%)
              </div>
              <div className="text-sm font-medium text-[#2C3E33]">
                {savedResult.readinessLabel}
              </div>
            </div>

            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>ধাপ ০২: Video Lessons শুরু করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#132219]">
              এই মডিউলের শিখন-দিকনির্দেশনা (Diagnostic Notes)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="glass-card-3d rounded-xl p-4 space-y-1.5">
                  <div className="text-xs font-mono font-semibold text-[#15803D]">
                    দিকনির্দেশনা ০{toBengaliDigits(idx + 1)}
                  </div>
                  <p className="text-xs text-[#2C3E33] leading-relaxed">
                    {q.diagnosticNote}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {questions.map((q, qIdx) => {
            const selected = answers[q.id];
            return (
              <fieldset
                key={q.id}
                className="glass-card-3d rounded-2xl p-5 space-y-3"
              >
                <legend className="text-sm sm:text-base font-bold text-[#132219] leading-snug mb-2">
                  <span className="font-mono text-[#15803D] mr-2">
                    ০{toBengaliDigits(qIdx + 1)}.
                  </span>
                  {q.prompt}
                </legend>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isChecked = selected === optIdx;
                    return (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#ECF2ED]/95 border border-[#15803D] text-[#132219] font-semibold'
                            : 'glass-well text-[#2C3E33] hover:bg-white/75'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={isChecked}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                          }
                          className="w-4 h-4 accent-[#15803D] shrink-0"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs font-mono tabular-nums text-[#3F5247]">
              উত্তর সম্পন্ন: {toBengaliDigits(answeredCount)}/{toBengaliDigits(questions.length)}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onNextStep}
                className="px-4 py-2.5 text-xs font-semibold text-[#3F5247] btn-3d-glass rounded-xl cursor-pointer"
              >
                সরাসরি ভিডিও লেসনে যান
              </button>
              <button
                type="submit"
                disabled={answeredCount < questions.length}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer"
              >
                <span>Pre-Assessment জমা দিন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

interface InteractiveLearningStepProps {
  course: Course;
  savedInteractive?: InteractiveLearningResult;
  onUpdateInteractive: (result: InteractiveLearningResult) => void;
  onNextStep: () => void;
}

export const InteractiveLearningStepView: React.FC<InteractiveLearningStepProps> = ({
  course,
  savedInteractive,
  onUpdateInteractive,
  onNextStep
}) => {
  const bundle = useMemo(() => buildInteractiveActivities(course), [course]);

  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState<boolean>(
    Boolean(savedInteractive?.quizChecked)
  );

  const [dragItems, setDragItems] = useState<DragDropStepItem[]>(
    bundle.dragDropSteps
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [dragSolved, setDragSolved] = useState<boolean>(
    Boolean(savedInteractive?.dragDropSolved)
  );

  const [scenarioChoice, setScenarioChoice] = useState<number | null>(null);
  const [scenarioSolved, setScenarioSolved] = useState<boolean>(
    Boolean(savedInteractive?.scenarioSolved)
  );

  useEffect(() => {
    setQuizChoice(null);
    setQuizChecked(Boolean(savedInteractive?.quizChecked));
    setDragItems(bundle.dragDropSteps);
    setDragError(null);
    setDragSolved(Boolean(savedInteractive?.dragDropSolved));
    setScenarioChoice(null);
    setScenarioSolved(Boolean(savedInteractive?.scenarioSolved));
  }, [course.id, bundle.dragDropSteps, savedInteractive]);

  const persistProgress = (
    nextQuiz: boolean,
    nextDrag: boolean,
    nextScenario: boolean
  ) => {
    const allDone = nextQuiz && nextDrag && nextScenario;
    onUpdateInteractive({
      courseId: course.id,
      quizChecked: nextQuiz,
      dragDropSolved: nextDrag,
      scenarioSolved: nextScenario,
      completedAt: allDone
        ? new Date().toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : undefined
    });
  };

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= dragItems.length || fromIdx === toIdx) return;
    const next = [...dragItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setDragItems(next);
    setDragError(null);
  };

  const verifyDragDropOrder = () => {
    const isCorrect = dragItems.every(
      (item, idx) => item.correctOrder === idx + 1
    );
    if (isCorrect) {
      setDragSolved(true);
      setDragError(null);
      persistProgress(quizChecked, true, scenarioSolved);
    } else {
      setDragError(
        'ক্রমটি এখনো পুরোপুরি মেলেনি — ধাপ ১ (ভিত্তি) → ধাপ ২ → ধাপ ৩ → ধাপ ৪ (মূল্যায়ন) ক্রমানুসারে সাজিয়ে আবার যাচাই করুন।'
      );
    }
  };

  const doneCount =
    (quizChecked ? 1 : 0) + (dragSolved ? 1 : 0) + (scenarioSolved ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="glass-surface rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D]">
            ধাপ ০৩ · Interactive Learning (কুইজ, Drag & Drop ও Scenario-Based Activities)
          </div>
          <h2 className="text-xl font-bold text-[#132219]">
            সক্রিয় অনুশীলন ও শ্রেণিকক্ষ পরিস্থিতি সিদ্ধান্ত ল্যাব
          </h2>
          <p className="text-sm text-[#3F5247]">
            নিচের ৩টি ইন্টারঅ্যাক্টিভ কার্যক্রম সম্পন্ন করুন — প্রতিটিতে তাৎক্ষণিক ফিডব্যাক পাবেন।
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono tabular-nums font-bold text-[#15803D] glass-well px-3 py-2 rounded-xl">
            {toBengaliDigits(doneCount)}/৩ কার্যক্রম সম্পন্ন
          </span>
          {doneCount === 3 && (
            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap cursor-pointer"
            >
              <span>ধাপ ০৪: Assignment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Activity 1: Quick Concept Quiz */}
      <div className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#15803D]">
            <HelpCircle className="w-4 h-4" />
            <span>কার্যক্রম ০১ · তাৎক্ষণিক কনসেপ্ট কুইজ</span>
          </div>
          {quizChecked && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
              <span>সম্পন্ন</span>
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-[#132219]">
          {bundle.microQuiz.question}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {bundle.microQuiz.options.map((opt, idx) => {
            const isSelected = quizChoice === idx;
            const isCorrect = bundle.microQuiz.correctIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuizChoice(idx);
                  if (isCorrect) {
                    setQuizChecked(true);
                    persistProgress(true, dragSolved, scenarioSolved);
                  }
                }}
                className={`text-left p-3.5 rounded-xl text-sm transition-all cursor-pointer ${
                  isSelected
                    ? isCorrect
                      ? 'bg-[#DCFCE7]/85 border border-[#15803D] text-[#132219] font-semibold'
                      : 'bg-[#FEF2F2]/90 border border-[#DC2626] text-[#991B1B]'
                    : 'glass-well text-[#2C3E33] hover:bg-white/75'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {(quizChoice !== null || quizChecked) && (
          <div className="p-3.5 rounded-xl glass-well text-xs sm:text-sm text-[#2C3E33] leading-relaxed">
            <strong className="text-[#15803D]">ব্যাখ্যা: </strong>
            {bundle.microQuiz.explanation}
          </div>
        )}
      </div>

      {/* Activity 2: HTML5 Drag & Drop + Accessible Reorder */}
      <div className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#15803D]">
              <Layers className="w-4 h-4" />
              <span>কার্যক্রম ০২ · Drag & Drop (পাঠদান ধাপ বিন্যাস)</span>
            </div>
            <h3 className="text-base font-bold text-[#132219] mt-1">
              কার্ডগুলো মাউস দিয়ে টেনে (Drag & Drop) অথবা তীর বোতাম দিয়ে ১ → ৪ ক্রমে সাজান
            </h3>
          </div>
          {dragSolved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
              <span>সঠিক বিন্যাস</span>
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {dragItems.map((item, idx) => (
            <div
              key={item.id}
              draggable={!dragSolved}
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && !dragSolved) {
                  moveItem(dragIndex, idx);
                }
                setDragIndex(null);
              }}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-xl transition-all ${
                dragSolved
                  ? 'bg-[#DCFCE7]/75 border border-[#15803D]/35'
                  : 'glass-card-3d cursor-grab active:cursor-grabbing'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical className="w-4 h-4 text-[#3F5247] shrink-0" />
                <span className="w-6 h-6 rounded-lg bg-[#15803D] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {toBengaliDigits(idx + 1)}
                </span>
                <span className="text-sm font-medium text-[#132219]">
                  {item.label}
                </span>
              </div>

              {!dragSolved && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, idx - 1)}
                    aria-label="উপরে সরান"
                    className="w-8 h-8 rounded-lg btn-3d-glass flex items-center justify-center text-[#132219] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === dragItems.length - 1}
                    onClick={() => moveItem(idx, idx + 1)}
                    aria-label="নিচে সরান"
                    className="w-8 h-8 rounded-lg btn-3d-glass flex items-center justify-center text-[#132219] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {dragError && (
          <div className="p-3 rounded-xl bg-[#FEF2F2]/90 border border-[#FECACA] text-xs text-[#B91C1C]">
            {dragError}
          </div>
        )}

        {!dragSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={verifyDragDropOrder}
              className="px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
            >
              বিন্যাস যাচাই করুন
            </button>
          </div>
        )}
      </div>

      {/* Activity 3: Scenario-Based Activity */}
      <div className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#15803D]">
            <Compass className="w-4 h-4" />
            <span>কার্যক্রম ০৩ · Scenario-Based Classroom Activity</span>
          </div>
          {scenarioSolved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
              <span>সম্পন্ন</span>
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl glass-well space-y-1.5">
          <div className="text-xs font-semibold text-[#15803D]">
            {bundle.scenario.context}
          </div>
          <p className="text-sm font-bold text-[#132219] leading-relaxed">
            {bundle.scenario.challenge}
          </p>
        </div>

        <div className="space-y-2.5">
          {bundle.scenario.choices.map((ch, idx) => {
            const isSelected = scenarioChoice === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setScenarioChoice(idx);
                  if (ch.isBest) {
                    setScenarioSolved(true);
                    persistProgress(quizChecked, dragSolved, true);
                  }
                }}
                className={`w-full text-left p-3.5 rounded-xl text-sm transition-all cursor-pointer ${
                  isSelected
                    ? ch.isBest
                      ? 'bg-[#DCFCE7]/85 border border-[#15803D] text-[#132219] font-semibold'
                      : 'bg-[#FEF2F2]/90 border border-[#DC2626] text-[#991B1B]'
                    : 'glass-well text-[#2C3E33] hover:bg-white/75'
                }`}
              >
                {ch.text}
              </button>
            );
          })}
        </div>

        {scenarioChoice !== null && (
          <div className="p-3.5 rounded-xl glass-well text-xs sm:text-sm text-[#2C3E33] leading-relaxed">
            <strong className="text-[#15803D]">পেডাগজিক্যাল ফিডব্যাক: </strong>
            {bundle.scenario.choices[scenarioChoice]?.feedback}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onNextStep}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl cursor-pointer"
          >
            <span>ধাপ ০৪: Practical Assignment-এ যান</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface PracticalAssignmentStepProps {
  course: Course;
  teacherName: string;
  savedSubmission?: PracticalAssignmentSubmission;
  onSubmitAssignment: (submission: PracticalAssignmentSubmission) => void;
  onNextStep: () => void;
}

export const PracticalAssignmentStepView: React.FC<PracticalAssignmentStepProps> = ({
  course,
  teacherName,
  savedSubmission,
  onSubmitAssignment,
  onNextStep
}) => {
  const [artifactType, setArtifactType] = useState<AssignmentArtifactType>(
    savedSubmission?.artifactType ?? 'lesson-plan'
  );
  const [title, setTitle] = useState(savedSubmission?.title ?? '');
  const [gradeAndDuration, setGradeAndDuration] = useState(
    savedSubmission?.gradeAndDuration ?? ''
  );
  const [learningObjective, setLearningObjective] = useState(
    savedSubmission?.learningObjective ?? ''
  );
  const [activitiesAndMaterials, setActivitiesAndMaterials] = useState(
    savedSubmission?.activitiesAndMaterials ?? ''
  );
  const [assessmentMethod, setAssessmentMethod] = useState(
    savedSubmission?.assessmentMethod ?? ''
  );
  const [attachmentName, setAttachmentName] = useState(
    savedSubmission?.attachmentName ?? ''
  );
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (savedSubmission) {
      setArtifactType(savedSubmission.artifactType);
      setTitle(savedSubmission.title);
      setGradeAndDuration(savedSubmission.gradeAndDuration);
      setLearningObjective(savedSubmission.learningObjective);
      setActivitiesAndMaterials(savedSubmission.activitiesAndMaterials);
      setAssessmentMethod(savedSubmission.assessmentMethod);
      setAttachmentName(savedSubmission.attachmentName ?? '');
    } else {
      const tpl = buildAssignmentTemplate(course, 'lesson-plan');
      setArtifactType('lesson-plan');
      setTitle(tpl.title);
      setGradeAndDuration(tpl.gradeAndDuration);
      setLearningObjective(tpl.learningObjective);
      setActivitiesAndMaterials(tpl.activitiesAndMaterials);
      setAssessmentMethod(tpl.assessmentMethod);
      setAttachmentName('');
    }
    setJustSubmitted(false);
  }, [course, savedSubmission]);

  const handleLoadTemplate = (nextType: AssignmentArtifactType) => {
    setArtifactType(nextType);
    const tpl = buildAssignmentTemplate(course, nextType);
    setTitle(tpl.title);
    setGradeAndDuration(tpl.gradeAndDuration);
    setLearningObjective(tpl.learningObjective);
    setActivitiesAndMaterials(tpl.activitiesAndMaterials);
    setAssessmentMethod(tpl.assessmentMethod);
    setJustSubmitted(false);
  };

  const canSubmit =
    title.trim().length > 2 &&
    learningObjective.trim().length > 4 &&
    activitiesAndMaterials.trim().length > 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const submission: PracticalAssignmentSubmission = {
      courseId: course.id,
      artifactType,
      title: title.trim(),
      gradeAndDuration: gradeAndDuration.trim() || '৬ষ্ঠ – ১০ম শ্রেণি · ৪৫ মিনিট',
      learningObjective: learningObjective.trim(),
      activitiesAndMaterials: activitiesAndMaterials.trim(),
      assessmentMethod:
        assessmentMethod.trim() || 'গঠনমূলক মূল্যায়ন ও এক্সিট টিকিট',
      attachmentName: attachmentName.trim() || undefined,
      submittedAt: new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
    onSubmitAssignment(submission);
    setJustSubmitted(true);
  };

  return (
    <div className="glass-surface rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/75">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D]">
            ধাপ ০৪ · Practical Assignment (Lesson Plan, Worksheet, Digital Content তৈরি)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#132219]">
            বাস্তব শ্রেণিকক্ষ উপকরণ নির্মাণ ও জমা দিন
          </h2>
          <p className="text-sm text-[#3F5247]">
            আপনার বিদ্যালয়ের শ্রেণিকক্ষের জন্য একটি Lesson Plan, Worksheet অথবা Digital Content নকশা তৈরি ও সংরক্ষণ করুন।
          </p>
        </div>

        {savedSubmission && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#DCFCE7]/80 text-xs font-semibold text-[#15803D] shrink-0">
            <FileCheck2 className="w-4 h-4" />
            <span>জমা সম্পন্ন · {savedSubmission.submittedAt}</span>
          </span>
        )}
      </div>

      {/* Artifact Type Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 glass-well rounded-xl">
          {(
            [
              { id: 'lesson-plan', label: 'Lesson Plan (পাঠ পরিকল্পনা)' },
              { id: 'worksheet', label: 'Worksheet (ওয়ার্কশিট)' },
              { id: 'digital-content', label: 'Digital Content (ডিজিটাল কনটেন্ট)' }
            ] as { id: AssignmentArtifactType; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleLoadTemplate(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                artifactType === tab.id
                  ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                  : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleLoadTemplate(artifactType)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-xl cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>মডিউল স্মার্ট টেমপ্লেট রিফ্রেশ</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#132219]">
              অ্যাসাইনমেন্ট শিরোনাম
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              required
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#132219]">
              শ্রেণি ও সময়কাল
            </span>
            <input
              type="text"
              value={gradeAndDuration}
              onChange={(e) => setGradeAndDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            />
          </label>
        </div>

        <label className="space-y-1.5 block">
          <span className="text-xs font-semibold text-[#132219]">
            প্রত্যাশিত শিখনফল (Learning Objective)
          </span>
          <textarea
            rows={2}
            value={learningObjective}
            onChange={(e) => setLearningObjective(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            required
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-semibold text-[#132219]">
            মূল কার্যক্রম, ধাপ ও ডিজিটাল/শ্রেণিকক্ষ উপকরণ
          </span>
          <textarea
            rows={5}
            value={activitiesAndMaterials}
            onChange={(e) => setActivitiesAndMaterials(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm glass-input rounded-xl text-[#132219] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            required
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#132219]">
              মূল্যায়ন কৌশল (Assessment Strategy)
            </span>
            <input
              type="text"
              value={assessmentMethod}
              onChange={(e) => setAssessmentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-semibold text-[#132219]">
              ঐচ্ছিক ফাইল সংযুক্তি (স্লাইড/ডকুমেন্ট রেফারেন্স)
            </span>
            <div className="flex items-center gap-2">
              <label className="flex-1 inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium glass-input rounded-xl text-[#3F5247] cursor-pointer hover:bg-white/75">
                <Upload className="w-4 h-4 text-[#15803D] shrink-0" />
                <span className="truncate">
                  {attachmentName || 'নথি নির্বাচন করুন (ঐচ্ছিক)'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachmentName(file.name);
                  }}
                />
              </label>
            </div>
          </label>
        </div>

        {(justSubmitted || savedSubmission) && (
          <div className="p-3.5 rounded-xl bg-[#DCFCE7]/70 border border-[#15803D]/30 text-xs font-medium text-[#14532D]">
            আপনার Practical Assignment সফলভাবে সংরক্ষিত হয়েছে! চাইলে এটি ডাউনলোড করে পোর্টফোলিওতে রাখতে পারেন এবং ধাপ ০৫-এ গিয়ে চূড়ান্ত মূল্যায়ন ও সনদ সম্পন্ন করতে পারেন।
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() =>
              downloadPracticalAssignmentTxt(course.title, teacherName, {
                courseId: course.id,
                artifactType,
                title: title.trim() || course.title,
                gradeAndDuration,
                learningObjective,
                activitiesAndMaterials,
                assessmentMethod,
                attachmentName,
                submittedAt:
                  savedSubmission?.submittedAt ??
                  new Date().toLocaleDateString('bn-BD')
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#15803D]" />
            <span>নথি ডাউনলোড (.txt)</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald disabled:opacity-50 rounded-xl cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>
                {savedSubmission ? 'অ্যাসাইনমেন্ট আপডেট করুন' : 'অ্যাসাইনমেন্ট জমা দিন'}
              </span>
            </button>

            <button
              type="button"
              onClick={onNextStep}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
            >
              <span>ধাপ ০৫: Post-Assessment & Cert</span>
              <ArrowRight className="w-4 h-4 text-[#15803D]" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

interface CertificationStepProps {
  course: Course;
  status: CoursePathwayStatus;
  pathwayProgress: CertificationPathwayProgress;
  quizResult?: QuizResult;
  achievements: EvaluatedAchievement[];
  onSelectStep: (step: PathwayStepId) => void;
  onGoToQuiz: () => void;
  onGoToCertificate: () => void;
}

export const CertificationStepView: React.FC<CertificationStepProps> = ({
  course,
  status,
  pathwayProgress,
  quizResult,
  achievements,
  onSelectStep,
  onGoToQuiz,
  onGoToCertificate
}) => {
  const preRes = pathwayProgress.preAssessments[course.id];
  const unlockedBadges = achievements.filter((a) => a.status.unlocked);
  const growthDelta =
    preRes && quizResult ? quizResult.percentage - preRes.percentage : null;

  return (
    <div className="glass-surface rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/75">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D]">
            ধাপ ০৫ · Post-Assessment & Certification (চূড়ান্ত মূল্যায়ন, স্কোর, ব্যাজ ও সার্টিফিকেট)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#132219]">
            সার্টিফিকেশন অর্জন ও প্রাক-উত্তর দক্ষতা তুলনা
          </h2>
          <p className="text-sm text-[#3F5247]">
            সবগুলো ধাপের অগ্রগতি যাচাই করে চূড়ান্ত Post-Assessment কুইজে ৬০% নম্বর অর্জন করলে আপনার ডিজিটাল ব্যাজ ও CPD সার্টিফিকেট আনলক হবে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onGoToQuiz}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>
              {quizResult
                ? `পুনরায় Post-Assessment দিন (${toBengaliDigits(quizResult.percentage)}%)`
                : 'চূড়ান্ত Post-Assessment শুরু করুন'}
            </span>
          </button>

          {quizResult?.passed && (
            <button
              type="button"
              onClick={onGoToCertificate}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#132219] btn-3d-glass ring-1 ring-[#15803D]/40 rounded-xl whitespace-nowrap cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#15803D]" />
              <span>CPD সার্টিফিকেট ডাউনলোড</span>
            </button>
          )}
        </div>
      </div>

      {/* Pre vs Post Score & Certificate Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card-3d rounded-2xl p-5 space-y-1.5">
          <div className="text-xs text-[#3F5247]">ধাপ ০১ · Pre-Assessment স্কোর</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219]">
            {preRes
              ? `${toBengaliDigits(preRes.percentage)}%`
              : 'সম্পন্ন হয়নি'}
          </div>
          <div className="text-xs text-[#3F5247]">
            {preRes
              ? `${toBengaliDigits(preRes.score)}/${toBengaliDigits(preRes.total)} সঠিক উত্তর`
              : 'প্রশিক্ষণ পূর্ব বেসলাইন যাচাই করুন'}
          </div>
        </div>

        <div className="glass-card-3d rounded-2xl p-5 space-y-1.5">
          <div className="text-xs text-[#3F5247]">ধাপ ০৫ · Post-Assessment স্কোর</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#15803D]">
            {quizResult
              ? `${toBengaliDigits(quizResult.percentage)}%`
              : 'অপেক্ষমাণ'}
          </div>
          <div className="text-xs text-[#3F5247]">
            {quizResult
              ? `${toBengaliDigits(quizResult.score)}/${toBengaliDigits(quizResult.total)} সঠিক · ${
                  quizResult.passed ? 'উত্তীর্ণ' : '৬০% প্রয়োজন'
                }`
              : '৫ প্রশ্নের চূড়ান্ত মূল্যায়ন কুইজ'}
          </div>
        </div>

        <div className="glass-card-3d rounded-2xl p-5 space-y-1.5">
          <div className="text-xs text-[#3F5247]">দক্ষতা উন্নতি ও সনদ স্থিতি</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219]">
            {growthDelta !== null
              ? `${growthDelta >= 0 ? '+' : ''}${toBengaliDigits(growthDelta)}% উন্নতি`
              : quizResult?.passed
                ? 'সনদ আনলক'
                : `${toBengaliDigits(status.completedSteps)}/৫ ধাপ`}
          </div>
          <div className="text-xs font-medium text-[#15803D] inline-flex items-center gap-1">
            {quizResult?.passed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>সনদ আইডি: {quizResult.certificateId}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-[#3F5247]" />
                <span className="text-[#3F5247]">
                  ৬০% পেলেই সনদ আনলক হবে
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 5-Step Readiness Checklist */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#132219]">
          ‘{course.title}’ — ৫-ধাপ সার্টিফিকেশন চেকলিস্ট
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PATHWAY_STEPS.map((s) => {
            const done = status.stepStatus[s.id];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  s.id === 'certification' ? onGoToQuiz() : onSelectStep(s.id)
                }
                className={`text-left p-3.5 rounded-xl transition-all cursor-pointer space-y-1.5 ${
                  done
                    ? 'bg-[#DCFCE7]/65 border border-[#15803D]/35'
                    : 'glass-well hover:bg-white/75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#15803D]">
                    ধাপ {s.numBn}
                  </span>
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  ) : (
                    <span className="text-[11px] text-[#3F5247]">বাকি</span>
                  )}
                </div>
                <div className="text-xs font-bold text-[#132219]">
                  {s.shortTitle}
                </div>
                <div className="text-[11px] text-[#3F5247]">{s.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unlocked Badges Strip */}
      <div className="pt-4 border-t border-white/75 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[#132219]">
            <Trophy className="w-4 h-4 text-[#B45309]" />
            <span>
              অর্জিত ডিজিটাল ব্যাজ ({toBengaliDigits(unlockedBadges.length)}/
              {toBengaliDigits(achievements.length)})
            </span>
          </div>
          {quizResult?.passed && (
            <button
              type="button"
              onClick={onGoToCertificate}
              className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
            >
              সার্টিফিকেট স্টুডিওতে যান →
            </button>
          )}
        </div>

        {unlockedBadges.length === 0 ? (
          <p className="text-xs text-[#3F5247]">
            ভিডিও লেসন ও চূড়ান্ত মূল্যায়ন কুইজ সম্পন্ন করলেই আপনার ডিজিটাল দক্ষতা ব্যাজ আনলক হতে শুরু করবে।
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {unlockedBadges.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="glass-well rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
              >
                <AchievementBadgeEmblem
                  iconKey={b.iconKey}
                  tier={b.tier}
                  unlocked={true}
                  size="sm"
                />
                <div>
                  <div className="text-xs font-bold text-[#132219]">
                    {b.titleEn}
                  </div>
                  <div className="text-[11px] text-[#3F5247]">{b.titleBn}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
