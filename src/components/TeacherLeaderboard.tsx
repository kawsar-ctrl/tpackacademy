import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  Medal,
  Trophy,
  Users
} from 'lucide-react';
import { COHORT_TEACHER_PEERS } from '../data/leaderboardData';
import { Course, LearnerProgress } from '../types/lms';
import { formatStudyDurationBn, toBengaliDigits } from '../utils/lmsHelpers';

interface TeacherLeaderboardProps {
  courses: Course[];
  progress: LearnerProgress;
  onGoToQuiz: () => void;
  onOpenClassroom: () => void;
}

type LeaderboardSort = 'overall' | 'study-time' | 'quiz-modules';

interface RankedTeacher {
  id: string;
  name: string;
  designation: string;
  schoolName: string;
  totalStudySeconds: number;
  completedQuizModules: number;
  averageQuizPercentage: number;
  completedLessonsCount: number;
  compositeScore: number;
  isCurrentUser: boolean;
  rank: number;
}

function getInitials(name: string): string {
  const cleaned = name
    .replace(/^(মো\.|ড\.|অধ্যাপক)\s*/g, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'শি';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
}

export const TeacherLeaderboard: React.FC<TeacherLeaderboardProps> = ({
  courses,
  progress,
  onGoToQuiz,
  onOpenClassroom
}) => {
  const [sortBy, setSortBy] = useState<LeaderboardSort>('overall');
  const [showAll, setShowAll] = useState(false);

  const totalQuizModules = courses.length;
  const totalLessonsCount = useMemo(
    () => courses.reduce((sum, c) => sum + c.lessons.length, 0),
    [courses]
  );

  const currentUserEntry = useMemo(() => {
    const totalStudySeconds = Object.values(
      progress.studySecondsByDate ?? {}
    ).reduce((sum, sec) => sum + (Number.isFinite(sec) ? sec : 0), 0);

    const passedQuizzes = Object.values(progress.quizResults).filter(
      (r) => r.passed
    );
    const completedQuizModules = passedQuizzes.length;
    const averageQuizPercentage =
      completedQuizModules > 0
        ? Math.round(
            passedQuizzes.reduce((sum, q) => sum + q.percentage, 0) /
              completedQuizModules
          )
        : 0;

    return {
      id: 'current-learner',
      name: progress.learnerName.trim() || 'প্রশিক্ষণার্থী শিক্ষক',
      designation: progress.designation.trim() || 'সহকারী শিক্ষক',
      schoolName: progress.schoolName.trim() || 'TPACK Academy',
      totalStudySeconds,
      completedQuizModules,
      averageQuizPercentage,
      completedLessonsCount: progress.completedLessonIds.length,
      isCurrentUser: true
    };
  }, [
    progress.completedLessonIds.length,
    progress.designation,
    progress.learnerName,
    progress.quizResults,
    progress.schoolName,
    progress.studySecondsByDate
  ]);

  const rankedTeachers: RankedTeacher[] = useMemo(() => {
    const combined = [
      ...COHORT_TEACHER_PEERS.map((peer) => ({
        ...peer,
        isCurrentUser: false
      })),
      currentUserEntry
    ].map((entry) => {
      const studyMinutes = Math.round(entry.totalStudySeconds / 60);
      // Composite score blends completed quiz modules, quiz accuracy, and study time
      const compositeScore = Math.round(
        entry.completedQuizModules * 300 +
          entry.averageQuizPercentage * 1.5 +
          studyMinutes * 0.5
      );
      return {
        ...entry,
        compositeScore,
        rank: 0
      };
    });

    combined.sort((a, b) => {
      if (sortBy === 'study-time') {
        if (b.totalStudySeconds !== a.totalStudySeconds) {
          return b.totalStudySeconds - a.totalStudySeconds;
        }
        return b.completedQuizModules - a.completedQuizModules;
      }
      if (sortBy === 'quiz-modules') {
        if (b.completedQuizModules !== a.completedQuizModules) {
          return b.completedQuizModules - a.completedQuizModules;
        }
        if (b.averageQuizPercentage !== a.averageQuizPercentage) {
          return b.averageQuizPercentage - a.averageQuizPercentage;
        }
        return b.totalStudySeconds - a.totalStudySeconds;
      }
      if (b.compositeScore !== a.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }
      return b.totalStudySeconds - a.totalStudySeconds;
    });

    return combined.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [currentUserEntry, sortBy]);

  const maxStudySeconds = useMemo(
    () =>
      Math.max(
        1,
        ...rankedTeachers.map((t) => t.totalStudySeconds)
      ),
    [rankedTeachers]
  );

  const currentUserRanked = rankedTeachers.find((t) => t.isCurrentUser)!;

  const visibleTeachers = useMemo(() => {
    if (showAll) return rankedTeachers;
    const topFive = rankedTeachers.slice(0, 5);
    const isUserInTopFive = topFive.some((t) => t.isCurrentUser);
    return isUserInTopFive ? topFive : [...topFive, currentUserRanked];
  }, [currentUserRanked, rankedTeachers, showAll]);

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/40 font-mono font-bold text-xs shrink-0"
          title="১ম স্থান"
        >
          <Trophy className="w-4 h-4" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] font-mono font-bold text-xs shrink-0"
          title="২য় স্থান"
        >
          <Medal className="w-4 h-4" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#FFEDD5] text-[#9A3412] border border-[#FDBA74]/60 font-mono font-bold text-xs shrink-0"
          title="৩য় স্থান"
        >
          <Medal className="w-4 h-4" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl glass-well text-[#3F5247] font-mono tabular-nums font-bold text-xs shrink-0">
        #{toBengaliDigits(rank)}
      </span>
    );
  };

  return (
    <section
      id="teacher-leaderboard"
      aria-labelledby="teacher-leaderboard-heading"
      className="space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-white/75">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D]">
            Teacher Leaderboard · সহকর্মী শিক্ষকদের সম্মিলিত র‍্যাংকিং
          </div>
          <h2
            id="teacher-leaderboard-heading"
            className="text-2xl font-bold text-[#132219] tracking-tight"
          >
            শীর্ষ শিক্ষক লিডারবোর্ড
          </h2>
          <p className="text-sm text-[#3F5247]">
            মোট অধ্যয়ন সময় এবং সম্পন্ন করা মূল্যায়ন কুইজ মডিউলের ভিত্তিতে বর্তমান কোহর্টের অগ্রণী শিক্ষকদের তালিকা।
          </p>
        </div>

        {/* Sort Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1.5 glass-well rounded-xl w-fit shrink-0">
          {(
            [
              { id: 'overall', label: 'সম্মিলিত র‍্যাংকিং' },
              { id: 'study-time', label: 'মোট অধ্যয়ন সময়' },
              { id: 'quiz-modules', label: 'সম্পন্ন কুইজ মডিউল' }
            ] as { id: LeaderboardSort; label: string }[]
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSortBy(option.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                sortBy === option.id
                  ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                  : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Card Container */}
      <div className="glass-surface rounded-2xl overflow-hidden">
        {/* Current Learner Status Summary Bar */}
        <div className="px-5 py-4 bg-white/45 border-b border-white/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#132219]">
              <Users className="w-4 h-4 text-[#15803D]" />
              <span>আপনার বর্তমান অবস্থান:</span>
              <span className="font-mono tabular-nums text-[#15803D] font-bold">
                #{toBengaliDigits(currentUserRanked.rank)} /{' '}
                {toBengaliDigits(rankedTeachers.length)} জন
              </span>
            </span>
            <span className="hidden sm:inline text-[#B6C7BC]" aria-hidden="true">
              |
            </span>
            <span className="text-xs text-[#4A5D52] font-mono tabular-nums">
              অধ্যয়ন: {formatStudyDurationBn(currentUserRanked.totalStudySeconds)} ·
              কুইজ: {toBengaliDigits(currentUserRanked.completedQuizModules)}/
              {toBengaliDigits(totalQuizModules)}টি
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {currentUserRanked.completedQuizModules < totalQuizModules ? (
              <button
                type="button"
                onClick={onGoToQuiz}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-xl cursor-pointer"
              >
                <span>কুইজ দিয়ে এগিয়ে যান</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenClassroom}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-xl cursor-pointer"
              >
                <span>ক্লাসরুমে অধ্যয়ন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Column Header (Desktop) */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-white/35 border-b border-white/75 text-xs font-semibold text-[#3F5247]">
          <div className="col-span-1">ক্রম</div>
          <div className="col-span-5">শিক্ষকের নাম ও প্রতিষ্ঠান</div>
          <div className="col-span-3">মোট অধ্যয়ন সময়</div>
          <div className="col-span-3 text-right">সম্পন্ন কুইজ ও অগ্রগতি</div>
        </div>

        {/* Leaderboard Rows */}
        <div className="divide-y divide-white/70">
          {visibleTeachers.map((teacher, idx) => {
            const studyPct = Math.round(
              (teacher.totalStudySeconds / maxStudySeconds) * 100
            );
            const showSeparator =
              !showAll &&
              idx === 5 &&
              teacher.isCurrentUser &&
              teacher.rank > 6;

            return (
              <React.Fragment key={teacher.id}>
                {showSeparator && (
                  <div className="px-6 py-1.5 bg-white/40 text-[11px] text-[#5B7063] text-center font-medium">
                    ··· আপনার বর্তমান অবস্থান ···
                  </div>
                )}
                <div
                  className={`px-5 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center transition-colors ${
                    teacher.isCurrentUser
                      ? 'bg-[#DCFCE7]/45'
                      : 'hover:bg-white/45'
                  }`}
                >
                  {/* Rank */}
                  <div className="md:col-span-1 flex items-center gap-3">
                    {renderRankBadge(teacher.rank)}
                    <div className="md:hidden min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#132219] truncate">
                          {teacher.name}
                        </span>
                        {teacher.isCurrentUser && (
                          <span className="text-[11px] font-semibold text-[#15803D] bg-white border border-[#15803D]/30 px-2 py-0.5 rounded-md shrink-0">
                            আপনি
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#4A5D52] truncate">
                        {teacher.designation} · {teacher.schoolName}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Name & School (Desktop) */}
                  <div className="hidden md:flex md:col-span-5 items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        teacher.isCurrentUser
                          ? 'bg-[#15803D] text-white'
                          : teacher.rank === 1
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#E8EFEA] text-[#14532D]'
                      }`}
                    >
                      {getInitials(teacher.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#132219] truncate">
                          {teacher.name}
                        </span>
                        {teacher.isCurrentUser && (
                          <span className="text-[11px] font-semibold text-[#15803D] bg-white border border-[#15803D]/30 px-2 py-0.5 rounded-md shrink-0">
                            আপনি
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#4A5D52] truncate">
                        {teacher.designation} · {teacher.schoolName}
                      </div>
                    </div>
                  </div>

                  {/* Total Study Time + Bar */}
                  <div className="md:col-span-3 space-y-1.5">
                    <div className="flex items-center justify-between md:justify-start gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-mono tabular-nums font-bold text-[#132219]">
                        <Clock className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>{formatStudyDurationBn(teacher.totalStudySeconds)}</span>
                      </span>
                      <span className="md:hidden text-[11px] text-[#4A5D52]">
                        অধ্যয়ন সময়
                      </span>
                    </div>
                    <div className="w-full h-2 glass-well rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-transform duration-300 origin-left ${
                          teacher.isCurrentUser
                            ? 'bg-gradient-to-r from-[#15803D] to-[#22C55E]'
                            : teacher.rank === 1
                            ? 'bg-[#B45309]'
                            : 'bg-[#4D9B6A]'
                        }`}
                        style={{
                          transform: `scaleX(${Math.max(0.03, studyPct / 100)})`
                        }}
                      />
                    </div>
                  </div>

                  {/* Completed Quiz Modules */}
                  <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3 text-xs">
                    <div className="md:text-right space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 font-mono tabular-nums font-bold text-[#132219]">
                        <ClipboardCheck className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>
                          {toBengaliDigits(teacher.completedQuizModules)}/
                          {toBengaliDigits(totalQuizModules)} কুইজ সম্পন্ন
                        </span>
                      </div>
                      <div className="text-[11px] text-[#3F5247] font-mono tabular-nums">
                        {teacher.completedQuizModules > 0
                          ? `গড় স্কোর ${toBengaliDigits(teacher.averageQuizPercentage)}% · ${toBengaliDigits(
                              teacher.completedLessonsCount
                            )}/${toBengaliDigits(totalLessonsCount)} মডিউল`
                          : `${toBengaliDigits(teacher.completedLessonsCount)}/${toBengaliDigits(
                              totalLessonsCount
                            )} মডিউল সম্পন্ন`}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer Expand/Collapse Toggle */}
        {rankedTeachers.length > 5 && (
          <div className="px-6 py-3 bg-white/40 border-t border-white/75 flex items-center justify-between gap-3">
            <span className="text-xs text-[#3F5247]">
              মোট {toBengaliDigits(rankedTeachers.length)} জন সক্রিয় শিক্ষকের তথ্য প্রদর্শিত হচ্ছে
            </span>
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
            >
              {showAll ? (
                <>
                  <span>সংক্ষিপ্ত তালিকা দেখুন</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>সকল শিক্ষক দেখুন ({toBengaliDigits(rankedTeachers.length)} জন)</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
