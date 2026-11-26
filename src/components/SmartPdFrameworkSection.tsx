import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Cpu,
  GraduationCap,
  HeartHandshake,
  Layers,
  PlayCircle,
  Sparkles
} from 'lucide-react';
import { Course, QuizResult } from '../types/lms';
import {
  getTeacherCareerStage,
  PD_FRAMEWORK_ITEMS,
  PD_FRAMEWORK_PILLARS,
  PD_TIERS,
  PdPillarId,
  PdTierId
} from '../data/pdFrameworkData';
import { toBengaliDigits } from '../utils/lmsHelpers';

interface SmartPdFrameworkSectionProps {
  courses: Course[];
  completedLessonIds: string[];
  quizResults: Record<string, QuizResult>;
  onOpenCourse: (courseId: string) => void;
  onOpenQuizOrCertificate: (courseId: string, passed: boolean) => void;
}

type StatusFilter = 'all' | 'pending' | 'completed';

const PILLAR_ICONS: Record<PdPillarId, React.ReactNode> = {
  'pedagogy-science': <BookOpen className="w-4 h-4 text-[#15803D]" />,
  'digital-ai-data': <Cpu className="w-4 h-4 text-[#15803D]" />,
  'wellbeing-safeguarding': <HeartHandshake className="w-4 h-4 text-[#15803D]" />,
  'leadership-research': <Compass className="w-4 h-4 text-[#15803D]" />
};

const TIER_LABEL_MAP: Record<PdTierId, string> = {
  foundation: 'প্রারম্ভিক',
  practitioner: 'অনুশীলন',
  master: 'মাস্টার'
};

export const SmartPdFrameworkSection: React.FC<SmartPdFrameworkSectionProps> = ({
  courses,
  completedLessonIds,
  quizResults,
  onOpenCourse,
  onOpenQuizOrCertificate
}) => {
  const [selectedPillar, setSelectedPillar] = useState<'all' | PdPillarId>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | PdTierId>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const courseById = useMemo(() => {
    const map = new Map<string, Course>();
    courses.forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);

  const enrichedItems = useMemo(() => {
    return PD_FRAMEWORK_ITEMS.map((item) => {
      const course = courseById.get(item.courseId);
      const totalLessons = course?.lessons.length ?? 3;
      const completedLessons = course
        ? course.lessons.filter((l) => completedLessonIds.includes(l.id)).length
        : 0;
      const quizPassed = Boolean(quizResults[item.courseId]?.passed);
      const lessonsDone = totalLessons > 0 && completedLessons === totalLessons;
      const isModuleMastered = lessonsDone && quizPassed;
      const lessonPct =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        ...item,
        course,
        totalLessons,
        completedLessons,
        lessonPct,
        lessonsDone,
        quizPassed,
        isModuleMastered
      };
    });
  }, [courseById, completedLessonIds, quizResults]);

  const summary = useMemo(() => {
    const totalModules = enrichedItems.length;
    const completedModulesCount = enrichedItems.filter((i) => i.lessonsDone).length;
    const passedQuizzesCount = enrichedItems.filter((i) => i.quizPassed).length;
    const masteredModulesCount = enrichedItems.filter((i) => i.isModuleMastered).length;
    const totalCpdHours = enrichedItems.reduce((acc, i) => acc + i.cpdHours, 0);
    const earnedCpdHours = enrichedItems
      .filter((i) => i.quizPassed)
      .reduce((acc, i) => acc + i.cpdHours, 0);
    const overallPct =
      totalModules > 0
        ? Math.round(
            (enrichedItems.reduce((acc, i) => acc + i.lessonPct, 0) /
              (totalModules * 100)) *
              100
          )
        : 0;

    return {
      totalModules,
      completedModulesCount,
      passedQuizzesCount,
      masteredModulesCount,
      totalCpdHours,
      earnedCpdHours,
      overallPct
    };
  }, [enrichedItems]);

  const careerStage = useMemo(
    () =>
      getTeacherCareerStage(
        summary.completedModulesCount,
        summary.passedQuizzesCount
      ),
    [summary.completedModulesCount, summary.passedQuizzesCount]
  );

  const pillarStats = useMemo(() => {
    return PD_FRAMEWORK_PILLARS.map((pillar) => {
      const items = enrichedItems.filter((i) => i.pillarId === pillar.id);
      const completed = items.filter((i) => i.isModuleMastered || i.lessonsDone).length;
      const cpd = items.reduce((sum, i) => sum + i.cpdHours, 0);
      return {
        ...pillar,
        totalCount: items.length,
        completedCount: completed,
        cpdHours: cpd
      };
    });
  }, [enrichedItems]);

  const filteredItems = useMemo(() => {
    return enrichedItems.filter((item) => {
      if (selectedPillar !== 'all' && item.pillarId !== selectedPillar) {
        return false;
      }
      if (selectedTier !== 'all' && item.tier !== selectedTier) {
        return false;
      }
      if (statusFilter === 'completed' && !item.lessonsDone && !item.quizPassed) {
        return false;
      }
      if (statusFilter === 'pending' && item.lessonsDone && item.quizPassed) {
        return false;
      }
      return true;
    });
  }, [enrichedItems, selectedPillar, selectedTier, statusFilter]);

  const pillarTitleMap = useMemo(() => {
    const m: Record<PdPillarId, string> = {
      'pedagogy-science': 'স্তম্ভ ০১',
      'digital-ai-data': 'স্তম্ভ ০২',
      'wellbeing-safeguarding': 'স্তম্ভ ০৩',
      'leadership-research': 'স্তম্ভ ০৪'
    };
    return m;
  }, []);

  return (
    <section
      id="smart-pd-framework"
      aria-label="Smart Teacher Professional Development Framework"
      className="space-y-6"
    >
      {/* Framework Header & Overall Readiness Banner */}
      <div className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-white/75">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#15803D]">
              <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Smart Teacher Professional Development Framework · {toBengaliDigits(summary.totalModules)}টি মডিউল · {toBengaliDigits(4)} দক্ষতা স্তম্ভ
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#132219] tracking-tight">
              স্মার্ট শিক্ষক পেশাগত উন্নয়ন ফ্রেমওয়ার্ক ({toBengaliDigits(summary.totalModules)}-মডিউল রোডম্যাপ)
            </h2>
            <p className="text-sm text-[#3F5247] leading-relaxed">
              TPACK, ক্লাস ম্যানেজমেন্ট, ICT/AI, শিশু মনোবিজ্ঞান ও কারিকুলামসহ প্রকল্প ও সমস্যাভিত্তিক শিখন (PBL/PrBL), মূল্যায়ন, SEL, STEM/STEAM, লার্নিং অ্যানালিটিক্স, শিশু সুরক্ষা, নিউরোএডুকেশন এবং বিষয়ভিত্তিক আধুনিক শিক্ষণ কৌশলের সমন্বিত {toBengaliDigits(summary.totalCpdHours)} CPD ঘণ্টার পূর্ণাঙ্গ কাঠামো।
            </p>
          </div>

          {/* Dynamic Career Stage Card */}
          <div className="glass-card-3d rounded-2xl p-4 sm:p-5 lg:min-w-[310px] space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-[#3F5247]">
              <span className="font-semibold text-[#15803D] inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>বর্তমান পেশাগত স্তর</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-[#132219]">
                {toBengaliDigits(summary.earnedCpdHours)}/{toBengaliDigits(summary.totalCpdHours)} CPD ঘণ্টা
              </span>
            </div>
            <div className="text-base font-bold text-[#132219]">
              {careerStage.titleBn}
            </div>
            <div className="text-xs text-[#3F5247] leading-relaxed">
              {careerStage.nextMilestoneBn}
            </div>
          </div>
        </div>

        {/* Readiness Progress Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-well rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#3F5247]">
              <span>মডিউল পাঠ অগ্রগতি</span>
              <span className="font-mono tabular-nums font-semibold text-[#132219]">
                {toBengaliDigits(summary.completedModulesCount)}/{toBengaliDigits(summary.totalModules)} ({toBengaliDigits(summary.overallPct)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#15803D] to-[#22C55E] transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${summary.overallPct / 100})` }}
              />
            </div>
          </div>

          <div className="glass-well rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#3F5247]">
              <span>মূল্যায়ন কুইজ ও CPD সনদ</span>
              <span className="font-mono tabular-nums font-semibold text-[#132219]">
                {toBengaliDigits(summary.passedQuizzesCount)}/{toBengaliDigits(summary.totalModules)} উত্তীর্ণ
              </span>
            </div>
            <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#15803D] to-[#10B981] transition-transform duration-300 origin-left"
                style={{
                  transform: `scaleX(${
                    summary.totalModules > 0
                      ? summary.passedQuizzesCount / summary.totalModules
                      : 0
                  })`
                }}
              />
            </div>
          </div>

          <div className="glass-well rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs text-[#3F5247]">পূর্ণাঙ্গ মাস্টারি</div>
              <div className="text-lg font-bold font-mono tabular-nums text-[#132219]">
                {toBengaliDigits(summary.masteredModulesCount)} / {toBengaliDigits(summary.totalModules)} মডিউল
              </div>
            </div>
            <div className="glass-3d-icon-well w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-[#15803D]" />
            </div>
          </div>
        </div>

        {/* 4 Interactive Competency Pillars */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#132219] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#15803D]" />
              <span>ফ্রেমওয়ার্কের ৪টি মূল দক্ষতা স্তম্ভ (নির্বাচন করে ফিল্টার করুন)</span>
            </h3>
            {selectedPillar !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedPillar('all')}
                className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
              >
                সব ৪টি স্তম্ভ দেখুন
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {pillarStats.map((pillar) => {
              const isSelected = selectedPillar === pillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() =>
                    setSelectedPillar((prev) =>
                      prev === pillar.id ? 'all' : pillar.id
                    )
                  }
                  aria-pressed={isSelected}
                  className={`text-left rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-white/95 ring-2 ring-[#15803D] shadow-md'
                      : 'glass-card-3d hover:bg-white/75'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#15803D]">
                        {pillar.code} · {toBengaliDigits(pillar.totalCount)} মডিউল
                      </span>
                      <span className="glass-3d-icon-well w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                        {PILLAR_ICONS[pillar.id]}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#132219] leading-snug">
                      {pillar.titleBn}
                    </div>
                    <p className="text-xs text-[#3F5247] leading-relaxed line-clamp-2">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#3F5247] pt-2 border-t border-[#132219]/8">
                    <span>
                      সম্পন্ন: {toBengaliDigits(pillar.completedCount)}/{toBengaliDigits(pillar.totalCount)}
                    </span>
                    <span>{toBengaliDigits(pillar.cpdHours)} CPD ঘণ্টা</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier & Completion Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          <div
            className="flex flex-wrap items-center gap-1.5 p-1.5 glass-well rounded-xl w-fit"
            role="group"
            aria-label="পেশাগত স্তর ফিল্টার"
          >
            <button
              type="button"
              onClick={() => setSelectedTier('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'all'
                  ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                  : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
              }`}
            >
              সব স্তর ({toBengaliDigits(summary.totalModules)})
            </button>
            {PD_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedTier(tier.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  selectedTier === tier.id
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                {tier.labelBn}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-1.5 p-1.5 glass-well rounded-xl w-fit"
            role="group"
            aria-label="অগ্রগতি অবস্থা ফিল্টার"
          >
            {(
              [
                { id: 'all', label: 'সকল মডিউল' },
                { id: 'pending', label: 'বাকি রয়েছে' },
                { id: 'completed', label: 'অর্জিত / চলমান' }
              ] as { id: StatusFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatusFilter(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === opt.id
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 22-Module Competency Matrix */}
        {filteredItems.length === 0 ? (
          <div className="glass-well rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-[#132219]">
              এই ফিল্টারে কোনো মডিউল পাওয়া যায়নি
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedPillar('all');
                setSelectedTier('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
            >
              সব {toBengaliDigits(summary.totalModules)}টি মডিউল দেখান
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <article
                key={item.code}
                className={`glass-card-3d rounded-2xl p-5 flex flex-col justify-between gap-4 ${
                  item.isModuleMastered ? 'ring-1 ring-[#15803D]/35' : ''
                }`}
              >
                <div className="space-y-2.5">
                  {/* Unboxed Typographic Metadata */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#3F5247]">
                    <span className="font-mono font-bold text-[#15803D]">
                      {item.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{pillarTitleMap[item.pillarId]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{TIER_LABEL_MAP[item.tier]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {toBengaliDigits(item.cpdHours)} CPD
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-[#132219] leading-snug">
                      {item.shortTitle}
                    </h4>
                    <div className="text-xs font-semibold text-[#15803D]">
                      {item.titleBn}
                    </div>
                  </div>

                  <p className="text-xs text-[#3F5247] leading-relaxed">
                    {item.competencySummary}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/75">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#3F5247]">
                      <span className="font-mono tabular-nums">
                        পাঠ: {toBengaliDigits(item.completedLessons)}/
                        {toBengaliDigits(item.totalLessons)} ({toBengaliDigits(item.lessonPct)}%)
                      </span>
                      {item.quizPassed && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#15803D]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>মূল্যায়ন উত্তীর্ণ</span>
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 glass-well rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#15803D] to-[#22C55E] transition-transform duration-300 origin-left"
                        style={{ transform: `scaleX(${item.lessonPct / 100})` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenCourse(item.courseId)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap cursor-pointer min-h-[38px]"
                    >
                      <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {item.completedLessons > 0 ? 'চালিয়ে যান' : 'কোর্সে প্রবেশ'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenQuizOrCertificate(item.courseId, item.quizPassed)
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap cursor-pointer min-h-[38px]"
                    >
                      {item.quizPassed ? (
                        <>
                          <Award className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                          <span>সনদ</span>
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                          <span>মূল্যায়ন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
