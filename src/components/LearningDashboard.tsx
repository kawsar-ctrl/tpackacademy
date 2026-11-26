import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Clock,
  Flame,
  NotebookPen,
  Plus
} from 'lucide-react';
import { Course, LearnerProgress } from '../types/lms';
import {
  buildWeeklyActivityData,
  DailyActivityPoint,
  formatStudyDurationBn,
  hasLessonNoteContent,
  toBengaliDigits
} from '../utils/lmsHelpers';

interface LearningDashboardProps {
  courses: Course[];
  progress: LearnerProgress;
  onLogPracticeMinutes: (minutes: number) => void;
  onOpenCourse: (courseId: string, lessonId?: string) => void;
}

type ChartMetric = 'minutes' | 'activities';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyActivityPoint }>;
  metric: ChartMetric;
}

const DashboardTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  metric
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="glass-modal rounded-xl px-3.5 py-2.5 text-xs space-y-1">
      <div className="font-semibold text-[#132219]">{point.fullDateLabel}</div>
      <div className="flex items-center justify-between gap-4 text-[#3F5247]">
        <span>অধ্যয়ন সময়:</span>
        <span className="font-mono tabular-nums font-semibold text-[#15803D]">
          {point.studySeconds > 0
            ? formatStudyDurationBn(point.studySeconds)
            : '০ মিনিট'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[#3F5247]">
        <span>সম্পন্ন কার্যক্রম:</span>
        <span className="font-mono tabular-nums font-semibold text-[#132219]">
          {toBengaliDigits(point.activities)}টি
        </span>
      </div>
      {metric === 'minutes' && (
        <div className="text-[11px] text-[#5B7063] pt-0.5 border-t border-white/75">
          দৈনিক লক্ষ্য: ৩০ মিনিট
        </div>
      )}
    </div>
  );
};

export const LearningDashboard: React.FC<LearningDashboardProps> = ({
  courses,
  progress,
  onLogPracticeMinutes,
  onOpenCourse
}) => {
  const [metric, setMetric] = useState<ChartMetric>('minutes');
  const [loggedFeedback, setLoggedFeedback] = useState<string | null>(null);

  const studySecondsByDate = progress.studySecondsByDate ?? {};
  const activityCountByDate = progress.activityCountByDate ?? {};

  const weeklyData = useMemo(
    () => buildWeeklyActivityData(studySecondsByDate, activityCountByDate),
    [studySecondsByDate, activityCountByDate]
  );

  const totalStudySeconds = useMemo(
    () =>
      Object.values(studySecondsByDate).reduce(
        (sum, sec) => sum + (Number.isFinite(sec) ? sec : 0),
        0
      ),
    [studySecondsByDate]
  );

  const weeklyStudySeconds = useMemo(
    () => weeklyData.reduce((sum, d) => sum + d.studySeconds, 0),
    [weeklyData]
  );

  const weeklyActivitiesTotal = useMemo(
    () => weeklyData.reduce((sum, d) => sum + d.activities, 0),
    [weeklyData]
  );

  const activeDaysCount = useMemo(
    () =>
      weeklyData.filter((d) => d.studySeconds > 0 || d.activities > 0).length,
    [weeklyData]
  );

  const savedNotesCount = useMemo(
    () =>
      Object.values(progress.lessonNotes ?? {}).filter((n) =>
        hasLessonNoteContent(n)
      ).length,
    [progress.lessonNotes]
  );

  const nextLessonTarget = useMemo(() => {
    for (const c of courses) {
      const next = c.lessons.find(
        (l) => !progress.completedLessonIds.includes(l.id)
      );
      if (next) return { course: c, lesson: next };
    }
    return { course: courses[0], lesson: courses[0].lessons[0] };
  }, [courses, progress.completedLessonIds]);

  const hasWeeklyData = weeklyStudySeconds > 0 || weeklyActivitiesTotal > 0;

  const handleQuickLog = (minutes: number) => {
    onLogPracticeMinutes(minutes);
    setLoggedFeedback(`+${toBengaliDigits(minutes)} মিনিট আজকের কার্যক্রমে যুক্ত হয়েছে`);
    window.setTimeout(() => setLoggedFeedback(null), 3000);
  };

  return (
    <section
      id="learning-dashboard"
      aria-labelledby="learning-dashboard-heading"
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/75">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D]">
            Learning Dashboard · অধ্যয়ন সময় ও সাপ্তাহিক কার্যক্রম
          </div>
          <h2
            id="learning-dashboard-heading"
            className="text-2xl font-bold text-[#132219] tracking-tight"
          >
            ব্যক্তিগত শিখন ড্যাশবোর্ড
          </h2>
          <p className="text-sm text-[#3F5247]">
            আপনার মোট অধ্যয়ন সময়, গত ৭ দিনের দৈনিক চর্চা এবং কোর্সভিত্তিক অগ্রগতির রিয়েল-টাইম বিশ্লেষণ।
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-1 p-1.5 glass-well rounded-xl w-fit shrink-0">
          <button
            type="button"
            onClick={() => setMetric('minutes')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              metric === 'minutes'
                ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
            }`}
          >
            অধ্যয়ন সময় (মিনিট)
          </button>
          <button
            type="button"
            onClick={() => setMetric('activities')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              metric === 'activities'
                ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
            }`}
          >
            সম্পন্ন কার্যক্রম
          </button>
        </div>
      </div>

      {/* Main 2-Zone Dashboard: Left Weekly Bar Chart (7 cols) / Right Study Summary & Course Breakdown (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Zone: Recharts Weekly Activity Bar Chart */}
        <div className="lg:col-span-7 glass-surface rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#132219]">
                সাপ্তাহিক শিখন কার্যক্রম (গত ৭ দিন)
              </h3>
              <p className="text-xs text-[#4A5D52] mt-0.5">
                {metric === 'minutes'
                  ? 'প্রতিদিন ভিডিও পাঠ, উপকরণ অধ্যয়ন ও শ্রেণিকক্ষ প্রস্তুতিতে ব্যয়িত সময় (মিনিট)'
                  : 'প্রতিদিন সম্পন্ন করা মডিউল, উপকরণ পাঠ, নোট সংরক্ষণ ও কুইজের সংখ্যা'}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-lg font-bold font-mono tabular-nums text-[#15803D]">
                {metric === 'minutes'
                  ? formatStudyDurationBn(weeklyStudySeconds)
                  : `${toBengaliDigits(weeklyActivitiesTotal)}টি কার্যক্রম`}
              </div>
              <div className="text-[11px] text-[#4A5D52]">
                সাপ্তাহিক মোট ({toBengaliDigits(activeDaysCount)}/৭ সক্রিয় দিন)
              </div>
            </div>
          </div>

          {/* Chart Stage */}
          <div className="relative w-full h-[270px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 14, right: 12, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E8EFEA"
                />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fill: '#4A5D52', fontSize: 12 }}
                  axisLine={{ stroke: '#DDE5DF' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={(val: number) => toBengaliDigits(val)}
                  tick={{ fill: '#4A5D52', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(21, 128, 61, 0.07)' }}
                  content={<DashboardTooltip metric={metric} />}
                />
                {metric === 'minutes' && (
                  <ReferenceLine
                    y={30}
                    stroke="#B45309"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                )}
                <Bar
                  dataKey={metric === 'minutes' ? 'studyMinutes' : 'activities'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                >
                  {weeklyData.map((entry) => (
                    <Cell
                      key={entry.dateKey}
                      fill={entry.isToday ? '#15803D' : '#4D9B6A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {!hasWeeklyData && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
                <div className="glass-modal rounded-2xl px-5 py-4 text-center max-w-sm space-y-2 pointer-events-auto">
                  <div className="text-sm font-semibold text-[#132219]">
                    এখনো সাপ্তাহিক অধ্যয়ন সময় রেকর্ড হয়নি
                  </div>
                  <p className="text-xs text-[#3F5247] leading-relaxed">
                    যেকোনো ভিডিও লেসন দেখলে, মডিউল সম্পন্ন করলে বা অনুশীলন সময় লগ করলে এখানে ৭ দিনের বার চার্ট তৈরি হবে।
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCourse(
                        nextLessonTarget.course.id,
                        nextLessonTarget.lesson.id
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
                  >
                    <span>প্রথম লেসন শুরু করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chart Legend & Quick Offline Study Logger */}
          <div className="pt-3 border-t border-white/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#3F5247]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#15803D]" />
                <span>আজকের সক্রিয়তা</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#4D9B6A]" />
                <span>পূর্ববর্তী দিনসমূহ</span>
              </span>
              {metric === 'minutes' && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 border-t-2 border-dashed border-[#B45309]" />
                  <span>দৈনিক লক্ষ্য (৩০ মি.)</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-xs text-[#3F5247]">অনুশীলন লগ:</span>
              <button
                type="button"
                onClick={() => handleQuickLog(15)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#15803D]" />
                <span>১৫ মি.</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLog(30)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#15803D]" />
                <span>৩০ মি.</span>
              </button>
            </div>
          </div>

          {loggedFeedback && (
            <div className="text-xs font-semibold text-[#15803D]">
              {loggedFeedback}
            </div>
          )}
        </div>

        {/* Right Zone: Total Study Time Metrics & Course Activity Breakdown */}
        <div className="lg:col-span-5 glass-surface rounded-2xl p-6 flex flex-col justify-between gap-5">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl glass-well">
              <div className="flex items-center gap-1.5 text-xs text-[#3F5247]">
                <Clock className="w-3.5 h-3.5 text-[#15803D]" />
                <span>মোট অধ্যয়ন সময়</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#132219] mt-1">
                {formatStudyDurationBn(totalStudySeconds)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-well">
              <div className="flex items-center gap-1.5 text-xs text-[#3F5247]">
                <Flame className="w-3.5 h-3.5 text-[#B45309]" />
                <span>সাপ্তাহিক সক্রিয় দিন</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#132219] mt-1">
                {toBengaliDigits(activeDaysCount)} / ৭ দিন
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-well">
              <div className="flex items-center gap-1.5 text-xs text-[#3F5247]">
                <Activity className="w-3.5 h-3.5 text-[#15803D]" />
                <span>সাপ্তাহিক কার্যক্রম</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#132219] mt-1">
                {toBengaliDigits(weeklyActivitiesTotal)}টি
              </div>
            </div>

            <div className="p-3.5 rounded-xl glass-well">
              <div className="flex items-center gap-1.5 text-xs text-[#3F5247]">
                <NotebookPen className="w-3.5 h-3.5 text-[#15803D]" />
                <span>ব্যক্তিগত নোট</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#132219] mt-1">
                {toBengaliDigits(savedNotesCount)}টি পাঠ
              </div>
            </div>
          </div>

          {/* Per-Course Completion Breakdown */}
          <div className="space-y-3 pt-2 border-t border-white/75">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#132219] inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#15803D]" />
                <span>কোর্সভিত্তিক অগ্রগতি সারসংক্ষেপ</span>
              </span>
              <span className="text-[#3F5247]">মডিউল ও মূল্যায়ন</span>
            </div>

            <div className="space-y-3">
              {courses.map((course) => {
                const done = course.lessons.filter((l) =>
                  progress.completedLessonIds.includes(l.id)
                ).length;
                const pct = Math.round((done / course.lessons.length) * 100);
                const quiz = progress.quizResults[course.id];

                return (
                  <div key={course.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onOpenCourse(course.id)}
                        className="font-semibold text-[#132219] hover:text-[#15803D] truncate text-left cursor-pointer"
                      >
                        {course.title}
                      </button>
                      <span className="font-mono tabular-nums text-[#3F5247] shrink-0">
                        {toBengaliDigits(done)}/{toBengaliDigits(course.lessons.length)}
                        {quiz?.passed
                          ? ` · কুইজ ${toBengaliDigits(quiz.percentage)}%`
                          : ''}
                      </span>
                    </div>
                    <div className="w-full h-2 glass-well rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#15803D] to-[#22C55E] transition-transform duration-300 origin-left"
                        style={{ transform: `scaleX(${pct / 100})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Lesson CTA */}
          <div className="pt-3 border-t border-white/75 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] text-[#3F5247]">পরবর্তী প্রস্তাবিত পাঠ</div>
              <div className="text-xs font-semibold text-[#132219] truncate">
                {nextLessonTarget.lesson.title}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onOpenCourse(
                  nextLessonTarget.course.id,
                  nextLessonTarget.lesson.id
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[38px] cursor-pointer"
            >
              <span>পাঠে যান</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
