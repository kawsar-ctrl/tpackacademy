import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { Course, LearnerProgress, PedagogyTip, TrainingSession } from '../types/lms';
import {
  getStudyingCoursesSummary,
  PEDAGOGY_TIPS
} from '../data/pedagogyTipsData';
import { toBengaliDigits } from '../utils/lmsHelpers';

interface DailyPedagogyTipProps {
  courses: Course[];
  sessions: TrainingSession[];
  progress: LearnerProgress;
  onOpenCourse: (courseId: string, lessonId?: string) => void;
}

type TipScope = 'studying' | 'all';

function pickRandomTip(pool: PedagogyTip[], excludeId?: string): PedagogyTip {
  if (pool.length === 0) return PEDAGOGY_TIPS[0];
  const candidates =
    pool.length > 1 && excludeId
      ? pool.filter((tip) => tip.id !== excludeId)
      : pool;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

export const DailyPedagogyTip: React.FC<DailyPedagogyTipProps> = ({
  courses,
  sessions,
  progress,
  onOpenCourse
}) => {
  const [scope, setScope] = useState<TipScope>('studying');
  const [copied, setCopied] = useState(false);

  const studyingSummary = useMemo(
    () => getStudyingCoursesSummary(courses, progress, sessions),
    [courses, progress, sessions]
  );

  const studyingCourseIds = useMemo(
    () => new Set(studyingSummary.studyingCourses.map((c) => c.id)),
    [studyingSummary.studyingCourses]
  );

  const activePool = useMemo(() => {
    if (scope === 'studying' && studyingSummary.isPersonalized) {
      const filtered = PEDAGOGY_TIPS.filter((tip) =>
        studyingCourseIds.has(tip.courseId)
      );
      return filtered.length > 0 ? filtered : PEDAGOGY_TIPS;
    }
    return PEDAGOGY_TIPS;
  }, [scope, studyingSummary.isPersonalized, studyingCourseIds]);

  const [currentTipId, setCurrentTipId] = useState<string>(
    () => pickRandomTip(activePool).id
  );

  // Ensure current tip stays synchronized if active pool changes (e.g. user starts a new course or switches scope)
  useEffect(() => {
    const stillInPool = activePool.some((tip) => tip.id === currentTipId);
    if (!stillInPool) {
      setCurrentTipId(pickRandomTip(activePool).id);
    }
  }, [activePool, currentTipId]);

  const currentTip = useMemo(
    () => activePool.find((tip) => tip.id === currentTipId) ?? activePool[0],
    [activePool, currentTipId]
  );

  const sourceCourse = useMemo(
    () => courses.find((c) => c.id === currentTip.courseId) ?? courses[0],
    [courses, currentTip.courseId]
  );

  const sourceLesson = useMemo(
    () =>
      sourceCourse.lessons.find((l) => l.id === currentTip.lessonId) ??
      sourceCourse.lessons[0],
    [sourceCourse, currentTip.lessonId]
  );

  const todayFormattedBn = useMemo(
    () =>
      new Date().toLocaleDateString('bn-BD', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
    []
  );

  const handleShuffleTip = useCallback(() => {
    setCopied(false);
    setCurrentTipId((prevId) => pickRandomTip(activePool, prevId).id);
  }, [activePool]);

  const handleCopyTip = useCallback(async () => {
    const shareText = `দৈনিক পেডাগজি ও TPACK টিপস (${currentTip.tpackDimension})\n\n${currentTip.title}\n${currentTip.strategy}\n\nআজকের শ্রেণিকক্ষ প্রয়োগ: ${currentTip.classroomTakeaway}\n— TPACK Academy (${sourceCourse.title})`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [currentTip, sourceCourse.title]);

  return (
    <section
      id="daily-pedagogy-tip"
      aria-labelledby="daily-pedagogy-tip-heading"
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-white/75">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D]">
            Daily Pedagogy Tip · {todayFormattedBn}
          </div>
          <h2
            id="daily-pedagogy-tip-heading"
            className="text-2xl font-bold text-[#132219] tracking-tight"
          >
            আজকের পেডাগজি ও TPACK কৌশল
          </h2>
          <p className="text-sm text-[#3F5247]">
            {studyingSummary.isPersonalized
              ? `আপনার চলমান ${toBengaliDigits(studyingSummary.studyingCourses.length)}টি কোর্সের বিষয়বস্তুর ওপর ভিত্তি করে বাছাইকৃত সংক্ষিপ্ত শিক্ষণ কৌশল।`
              : 'TPACK, সক্রিয় পেডাগজি ও শ্রেণিকক্ষ গবেষণার ওপর ভিত্তি করে প্রতিদিন একটি সংক্ষিপ্ত ও প্রয়োগযোগ্য কৌশল।'}
          </p>
        </div>

        {/* Scope Segmented Control + Shuffle Action */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {studyingSummary.isPersonalized && (
            <div
              role="group"
              aria-label="টিপস উৎস ফিল্টার"
              className="flex items-center gap-1 p-1 glass-well rounded-xl"
            >
              <button
                type="button"
                onClick={() => setScope('studying')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  scope === 'studying'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                চলমান কোর্স ({toBengaliDigits(studyingSummary.studyingCourses.length)})
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  scope === 'all'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                সব কোর্স ({toBengaliDigits(courses.length)})
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleShuffleTip}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
            <span>নতুন টিপস দেখুন</span>
          </button>
        </div>
      </div>

      {/* Main Single-Elevation Glassmorphic Tip Surface */}
      <article className="glass-surface rounded-2xl p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Concept, Strategy & 5-Minute Classroom Takeaway */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-5">
          <div className="space-y-3.5">
            {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#3F5247]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#15803D]">
                <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{currentTip.conceptKind}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#132219]">
                {currentTip.tpackDimension}
              </span>
              <span aria-hidden="true">·</span>
              <span>{currentTip.prepTimeLabel}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#132219] leading-snug [text-wrap:balance]">
              {currentTip.title}
            </h3>

            <p className="text-sm sm:text-base text-[#2C3E33] leading-relaxed max-w-[68ch]">
              {currentTip.strategy}
            </p>
          </div>

          {/* Hairline-separated Actionable Classroom Takeaway */}
          <div className="pt-4 border-t border-white/75 space-y-1.5">
            <div className="text-xs font-semibold text-[#B45309]">
              আজকের শ্রেণিকক্ষে প্রয়োগ
            </div>
            <p className="text-sm text-[#3F5247] leading-relaxed max-w-[68ch]">
              {currentTip.classroomTakeaway}
            </p>
          </div>
        </div>

        {/* Right Column: Studying Context, Source Course & Actions */}
        <div className="lg:col-span-4 pt-5 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/75 lg:pl-7 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[#3F5247]">
                {studyingSummary.isPersonalized && scope === 'studying'
                  ? 'আপনার চলমান কোর্স থেকে বাছাইকৃত'
                  : 'সংশ্লিষ্ট প্রশিক্ষণ কোর্স'}
              </div>
              <div className="text-sm font-bold text-[#132219] leading-snug">
                {sourceCourse.title}
              </div>
              <div className="text-xs text-[#3F5247] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#15803D] shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {sourceLesson.number}: {sourceLesson.title}
                </span>
              </div>
            </div>

            {/* Active Studying Courses Summary List (unboxed hairline list) */}
            <div className="pt-3 border-t border-white/75 space-y-1.5">
              <div className="text-xs font-semibold text-[#132219]">
                {studyingSummary.isPersonalized
                  ? 'বর্তমানে অধ্যয়নরত কোর্সসমূহ'
                  : 'প্রস্তাবিত TPACK পথ'}
              </div>
              {studyingSummary.isPersonalized ? (
                <ul className="space-y-1 text-xs text-[#3F5247]">
                  {studyingSummary.studyingCourses.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenCourse(c.id)}
                        className={`text-left truncate hover:text-[#15803D] transition-colors cursor-pointer ${
                          c.id === sourceCourse.id
                            ? 'font-semibold text-[#15803D]'
                            : ''
                        }`}
                      >
                        {c.title}
                      </button>
                      <span className="text-[11px] text-[#5B7063] shrink-0">
                        {studyingSummary.reasonByCourseId[c.id]}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#3F5247] leading-relaxed">
                  যেকোনো কোর্সের মডিউল বা উপকরণ পড়া শুরু করলে এই অংশটি স্বয়ংক্রিয়ভাবে সেই কোর্স অনুযায়ী টিপস দেখাবে।
                </p>
              )}
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onOpenCourse(sourceCourse.id, sourceLesson.id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
            >
              <span>সংশ্লিষ্ট পাঠে যান</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleCopyTip}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                  <span className="text-[#15803D]">কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#3F5247]" aria-hidden="true" />
                  <span>টিপস কপি</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
};
