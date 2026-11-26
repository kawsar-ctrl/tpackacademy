import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Download,
  Lock,
  Share2,
  Target,
  Trophy
} from 'lucide-react';
import {
  AchievementCategory,
  EvaluatedAchievement,
  LearnerProgress
} from '../types/lms';
import { AchievementBadgeEmblem } from './AchievementBadgeEmblem';
import { GlassTiltCard } from './GlassTiltCard';
import { ShareAchievementModal } from './ShareAchievementModal';
import {
  downloadAchievementBadgePng,
  toBengaliDigits
} from '../utils/lmsHelpers';

interface AchievementsViewProps {
  achievements: EvaluatedAchievement[];
  progress: LearnerProgress;
  onNavigateToAction: (
    tab: 'classroom' | 'quiz' | 'materials',
    courseId?: string
  ) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements,
  progress,
  onNavigateToAction
}) => {
  const [categoryFilter, setCategoryFilter] =
    useState<AchievementCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>(
    'all'
  );
  const [sharingBadge, setSharingBadge] = useState<EvaluatedAchievement | null>(
    null
  );

  const earnedList = useMemo(
    () => achievements.filter((a) => a.status.unlocked),
    [achievements]
  );

  const nextRecommended = useMemo(() => {
    const locked = achievements.filter((a) => !a.status.unlocked);
    if (locked.length === 0) return null;
    return [...locked].sort((a, b) => b.status.percentage - a.status.percentage)[0];
  }, [achievements]);

  const highScoreQuizCount = useMemo(
    () =>
      Object.values(progress.quizResults).filter(
        (r) => r.passed && r.percentage >= 80
      ).length,
    [progress.quizResults]
  );

  const overallPct = Math.round(
    (earnedList.length / Math.max(1, achievements.length)) * 100
  );

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      const catOk =
        categoryFilter === 'all' || item.category === categoryFilter;
      const statusOk =
        statusFilter === 'all' ||
        (statusFilter === 'unlocked' && item.status.unlocked) ||
        (statusFilter === 'locked' && !item.status.unlocked);
      return catOk && statusOk;
    });
  }, [achievements, categoryFilter, statusFilter]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-white/75">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-[#15803D]">
            Learning Achievements · শিক্ষক ডিজিটাল দক্ষতা ব্যাজ
          </div>
          <h1 className="text-3xl font-bold text-[#132219] tracking-tight [text-wrap:balance]">
            শিখন অর্জন ও ডিজিটাল দক্ষতা ব্যাজ
          </h1>
          <p className="text-sm sm:text-base text-[#3F5247] leading-relaxed">
            নির্দিষ্ট প্রশিক্ষণ মডিউল সম্পন্ন করে কিংবা মূল্যায়ন কুইজে উচ্চতর নম্বর অর্জন করে ‘Tech-Savvy Educator’, ‘Pedagogy Pro’-এর মতো স্বীকৃত ডিজিটাল ব্যাজ আনলক ও সংরক্ষণ করুন।
          </p>
        </div>

        {nextRecommended && (
          <button
            type="button"
            onClick={() =>
              onNavigateToAction(
                nextRecommended.targetTab,
                nextRecommended.targetCourseId
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
          >
            <span>পরবর্তী ব্যাজ: {nextRecommended.titleEn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4-Column Achievement Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-[#15803D]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
              {toBengaliDigits(earnedList.length)}/{toBengaliDigits(achievements.length)} ব্যাজ
            </div>
            <div className="text-xs text-[#3F5247] mt-0.5">
              অর্জিত ডিজিটাল সম্মাননা
            </div>
          </div>
        </div>

        <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-[#B45309]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
              {toBengaliDigits(overallPct)}% সম্পন্ন
            </div>
            <div className="text-xs text-[#3F5247] mt-0.5">
              সামগ্রিক অর্জন অগ্রগতি
            </div>
          </div>
        </div>

        <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-[#15803D]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
              {toBengaliDigits(highScoreQuizCount)}টি কোর্স
            </div>
            <div className="text-xs text-[#3F5247] mt-0.5">
              ৮০%+ উচ্চ স্কোর অর্জিত কুইজ
            </div>
          </div>
        </div>

        <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold text-[#132219] truncate">
              {nextRecommended ? nextRecommended.titleEn : 'সব ব্যাজ অর্জিত!'}
            </div>
            <div className="text-xs text-[#3F5247] mt-0.5">
              {nextRecommended
                ? `পরবর্তী লক্ষ্য (${toBengaliDigits(nextRecommended.status.percentage)}%)`
                : 'সকল মাইলফলক সম্পন্ন'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1.5 glass-well rounded-xl w-fit">
          {(
            [
              { id: 'all', label: 'সব ব্যাজ' },
              { id: 'module-mastery', label: 'মডিউল দক্ষতা' },
              { id: 'quiz-excellence', label: 'কুইজ উৎকর্ষ' },
              { id: 'cpd-milestone', label: 'সামগ্রিক মাইলফলক' }
            ] as { id: AchievementCategory; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === tab.id
                  ? 'btn-3d-glass text-[#132219] font-semibold'
                  : 'text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1.5 glass-well rounded-xl w-fit">
          {(
            [
              { id: 'all', label: `সব (${toBengaliDigits(achievements.length)})` },
              { id: 'unlocked', label: `অর্জিত (${toBengaliDigits(earnedList.length)})` },
              {
                id: 'locked',
                label: `অর্জনের পথে (${toBengaliDigits(
                  achievements.length - earnedList.length
                )})`
              }
            ] as { id: 'all' | 'unlocked' | 'locked'; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'btn-3d-glass text-[#132219] font-semibold'
                  : 'text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl glass-3d-icon-well flex items-center justify-center mx-auto">
            <Award className="w-6 h-6 text-[#15803D]" />
          </div>
          <h2 className="text-lg font-semibold text-[#132219]">
            এই ফিল্টারে কোনো ব্যাজ পাওয়া যায়নি
          </h2>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
            className="px-5 py-2.5 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
          >
            সব ব্যাজ দেখান
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAchievements.map((badge) => {
            const { unlocked, percentage, progressLabel } = badge.status;

            return (
              <GlassTiltCard
                key={badge.id}
                maxTiltDeg={4}
                className={`glass-card-3d rounded-2xl p-6 h-full flex flex-col justify-between gap-5 ${
                  unlocked ? 'ring-1 ring-[#15803D]/35' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <AchievementBadgeEmblem
                    iconKey={badge.iconKey}
                    tier={badge.tier}
                    unlocked={unlocked}
                    size="lg"
                  />

                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Unboxed Metadata Line */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#3F5247]">
                      <span
                        className={`font-semibold ${
                          unlocked
                            ? badge.tier === 'gold'
                              ? 'text-[#B45309]'
                              : 'text-[#15803D]'
                            : 'text-[#3F5247]'
                        }`}
                      >
                        {badge.categoryLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{badge.tierLabel}</span>
                      <span aria-hidden="true">·</span>
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[#15803D] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>অর্জিত</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#5B7063]">
                          <Lock className="w-3 h-3" />
                          <span>অর্জনের অপেক্ষায়</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold font-display text-[#132219] leading-snug">
                        {badge.titleEn}
                      </h2>
                      <div className="text-sm font-semibold text-[#2C3E33]">
                        {badge.titleBn}
                      </div>
                    </div>

                    <p className="text-sm text-[#3F5247] leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {/* Progress & Action Footer */}
                <div className="pt-4 border-t border-white/75 space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#3F5247]">
                        শর্ত: {badge.criteriaLabel}
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-[#132219] shrink-0">
                        {progressLabel} ({toBengaliDigits(percentage)}%)
                      </span>
                    </div>
                    <div
                      className="w-full h-2.5 glass-well rounded-full overflow-hidden p-0.5"
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full transition-transform duration-300 origin-left ${
                          unlocked
                            ? badge.tier === 'gold'
                              ? 'bg-[#B45309]'
                              : 'bg-[#15803D]'
                            : 'bg-[#6A9E7D]'
                        }`}
                        style={{ transform: `scaleX(${percentage / 100})` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-[#3F5247]">
                      {unlocked
                        ? `অর্জনের তারিখ: ${badge.earnedAt || 'সম্প্রতি অর্জিত'}`
                        : `অবশিষ্ট লক্ষ্য: ${toBengaliDigits(
                            Math.max(0, badge.status.target - badge.status.current)
                          )} ধাপ`}
                    </div>

                    {unlocked ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSharingBadge(badge)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>অর্জন শেয়ার</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadAchievementBadgePng({
                              id: badge.id,
                              titleEn: badge.titleEn,
                              titleBn: badge.titleBn,
                              tierLabel: badge.tierLabel,
                              criteriaLabel: badge.criteriaLabel,
                              tier: badge.tier,
                              learnerName: progress.learnerName,
                              designation: progress.designation,
                              schoolName: progress.schoolName,
                              earnedAt: badge.earnedAt
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ব্যাজ PNG ডাউনলোড</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToAction(
                            badge.targetTab,
                            badge.targetCourseId
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
                      >
                        <span>{badge.ctaLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#15803D]" />
                      </button>
                    )}
                  </div>
                </div>
              </GlassTiltCard>
            );
          })}
        </div>
      )}

      <ShareAchievementModal
        badge={sharingBadge}
        progress={progress}
        onClose={() => setSharingBadge(null)}
      />
    </section>
  );
};
