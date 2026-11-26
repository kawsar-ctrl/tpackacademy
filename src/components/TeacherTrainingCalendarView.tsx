import React, { useMemo, useState } from 'react';
import {
  AlarmClock,
  ArrowRight,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  List,
  MessageSquare,
  Radio,
  UserCheck,
  Video
} from 'lucide-react';
import {
  CalendarEventKind,
  CpdDeadline,
  LearnerProgress,
  TrainingSession
} from '../types/lms';
import {
  buildDeadlineGoogleCalendarUrl,
  buildGoogleCalendarUrl,
  downloadAllCalendarEvents,
  downloadCalendarInvite,
  downloadDeadlineInvite,
  getLocalDateKey,
  toBengaliDigits
} from '../utils/lmsHelpers';

interface TeacherTrainingCalendarViewProps {
  sessions: TrainingSession[];
  deadlines: CpdDeadline[];
  progress: LearnerProgress;
  onToggleRegister: (sessionId: string) => void;
  onNavigateToAction: (
    tab: 'classroom' | 'quiz' | 'certificate' | 'materials',
    courseId?: string
  ) => void;
}

type ViewMode = 'calendar' | 'list';
type EventFilter = 'all' | CalendarEventKind;

type AggregatedEvent =
  | {
      kind: 'session';
      id: string;
      eventType: CalendarEventKind;
      isoDate: string;
      title: string;
      session: TrainingSession;
    }
  | {
      kind: 'deadline';
      id: string;
      eventType: 'cpd-deadline';
      isoDate: string;
      title: string;
      deadline: CpdDeadline;
    };

interface CalendarMonth {
  key: string; // YYYY-MM
  year: number;
  monthIndex: number;
  label: string;
}

const CALENDAR_MONTHS: CalendarMonth[] = [
  { key: '2026-11', year: 2026, monthIndex: 10, label: 'নভেম্বর ২০২৬' },
  { key: '2026-12', year: 2026, monthIndex: 11, label: 'ডিসেম্বর ২০২৬' }
];

const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

function buildMonthGrid(year: number, monthIndex: number): (string | null)[] {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (string | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(monthIndex + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function getDaysDiffLabel(isoDate: string, todayIso: string): string {
  const [ty, tm, td] = todayIso.split('-').map(Number);
  const [ey, em, ed] = isoDate.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const eventUtc = Date.UTC(ey, em - 1, ed);
  const diffDays = Math.round((eventUtc - todayUtc) / 86400000);

  if (diffDays === 0) return 'আজ';
  if (diffDays === 1) return 'আগামীকাল';
  if (diffDays > 1) return `${toBengaliDigits(diffDays)} দিন বাকি`;
  return 'সময় অতিক্রান্ত';
}

function formatIsoDateLabelBn(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const monthNames = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর'
  ];
  return `${toBengaliDigits(d)} ${monthNames[m - 1] ?? ''} ${toBengaliDigits(y)}`;
}

function getEventBadgeStyles(eventType: CalendarEventKind): {
  chipClass: string;
  dotClass: string;
  label: string;
} {
  switch (eventType) {
    case 'webinar':
      return {
        chipClass: 'bg-[#ECF2ED] text-[#14532D] border-[#15803D]/30',
        dotClass: 'bg-[#15803D]',
        label: 'ওয়েবিনার'
      };
    case 'workshop':
      return {
        chipClass: 'bg-[#E6F4F1] text-[#115E59] border-[#0F766E]/30',
        dotClass: 'bg-[#0F766E]',
        label: 'ওয়ার্কশপ'
      };
    case 'qa':
      return {
        chipClass: 'bg-[#EFF6FF] text-[#1E40AF] border-[#2563EB]/25',
        dotClass: 'bg-[#2563EB]',
        label: 'Q&A'
      };
    case 'cpd-deadline':
      return {
        chipClass: 'bg-[#FEF3C7] text-[#92400E] border-[#D97706]/35',
        dotClass: 'bg-[#B45309]',
        label: 'CPD ডেডলাইন'
      };
  }
}

export const TeacherTrainingCalendarView: React.FC<
  TeacherTrainingCalendarViewProps
> = ({
  sessions,
  deadlines,
  progress,
  onToggleRegister,
  onNavigateToAction
}) => {
  // Native React state to toggle between Monthly Calendar and List views
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [filter, setFilter] = useState<EventFilter>('all');
  const [monthCursor, setMonthCursor] = useState(0);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>('2026-11-18');
  const [recentlySyncedId, setRecentlySyncedId] = useState<string | null>(null);
  const [bulkSynced, setBulkSynced] = useState(false);

  const todayIso = useMemo(() => getLocalDateKey(), []);
  const activeMonth = CALENDAR_MONTHS[monthCursor];

  const allEvents: AggregatedEvent[] = useMemo(() => {
    const mappedSessions: AggregatedEvent[] = sessions.map((s) => ({
      kind: 'session',
      id: s.id,
      eventType: s.type,
      isoDate: s.isoDate,
      title: s.title,
      session: s
    }));

    const mappedDeadlines: AggregatedEvent[] = deadlines.map((d) => ({
      kind: 'deadline',
      id: d.id,
      eventType: 'cpd-deadline',
      isoDate: d.isoDate,
      title: d.title,
      deadline: d
    }));

    return [...mappedSessions, ...mappedDeadlines].sort((a, b) =>
      a.isoDate.localeCompare(b.isoDate)
    );
  }, [sessions, deadlines]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return allEvents;
    return allEvents.filter((ev) => ev.eventType === filter);
  }, [allEvents, filter]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, AggregatedEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.isoDate]) map[ev.isoDate] = [];
      map[ev.isoDate].push(ev);
    });
    return map;
  }, [filteredEvents]);

  const monthCells = useMemo(
    () => buildMonthGrid(activeMonth.year, activeMonth.monthIndex),
    [activeMonth.year, activeMonth.monthIndex]
  );

  const activeMonthEvents = useMemo(
    () => filteredEvents.filter((ev) => ev.isoDate.startsWith(activeMonth.key)),
    [filteredEvents, activeMonth.key]
  );

  const selectedDayEvents = useMemo(
    () => eventsByDate[selectedIsoDate] ?? [],
    [eventsByDate, selectedIsoDate]
  );

  const groupedByMonth = useMemo(() => {
    return CALENDAR_MONTHS.map((m) => ({
      month: m,
      events: filteredEvents.filter((ev) => ev.isoDate.startsWith(m.key))
    })).filter((group) => group.events.length > 0);
  }, [filteredEvents]);

  const registeredCount = sessions.filter((s) =>
    progress.registeredSessionIds.includes(s.id)
  ).length;

  const workshopsCount = sessions.filter((s) => s.type === 'workshop').length;
  const webinarsAndQaCount = sessions.length - workshopsCount;

  const handleSyncSingle = (event: AggregatedEvent) => {
    if (event.kind === 'session') {
      downloadCalendarInvite(event.session);
    } else {
      downloadDeadlineInvite(event.deadline);
    }
    setRecentlySyncedId(event.id);
    window.setTimeout(() => {
      setRecentlySyncedId((curr) => (curr === event.id ? null : curr));
    }, 3000);
  };

  const handleBulkExport = () => {
    downloadAllCalendarEvents(sessions, deadlines);
    setBulkSynced(true);
    window.setTimeout(() => setBulkSynced(false), 3500);
  };

  const handleChangeMonth = (nextCursor: number) => {
    setMonthCursor(nextCursor);
    const nextMonth = CALENDAR_MONTHS[nextCursor];
    const firstEventInMonth = allEvents.find((ev) =>
      ev.isoDate.startsWith(nextMonth.key)
    );
    setSelectedIsoDate(
      firstEventInMonth ? firstEventInMonth.isoDate : `${nextMonth.key}-01`
    );
  };

  const handleJumpToday = () => {
    setMonthCursor(0);
    setSelectedIsoDate('2026-11-18');
  };

  const isDeadlineCompleted = (deadline: CpdDeadline): boolean => {
    if (deadline.id === 'cpd-dl-tpack-modules') {
      const tpackLessonIds = ['tpk-l1', 'tpk-l2', 'tpk-l3', 'tpk-l4'];
      return tpackLessonIds.every((id) =>
        progress.completedLessonIds.includes(id)
      );
    }
    if (deadline.id === 'cpd-dl-winter-cohort') {
      return (
        Object.values(progress.quizResults).filter((r) => r.passed).length >= 3
      );
    }
    return Boolean(progress.quizResults[deadline.courseId]?.passed);
  };

  const renderEventCard = (event: AggregatedEvent) => {
    const isJustSynced = recentlySyncedId === event.id;
    const countdown = getDaysDiffLabel(event.isoDate, todayIso);

    if (event.kind === 'session') {
      const { session } = event;
      const isRegistered = progress.registeredSessionIds.includes(session.id);
      const remainingSeats = Math.max(
        0,
        session.seatsAvailable - (isRegistered ? 1 : 0)
      );
      const badgeStyle = getEventBadgeStyles(event.eventType);

      return (
        <article
          key={event.id}
          className={`glass-card-3d rounded-2xl p-5 sm:p-6 space-y-4 ${
            isRegistered ? 'ring-1 ring-[#15803D]/45' : ''
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#3F5247]">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-semibold ${badgeStyle.chipClass}`}
                >
                  {session.type === 'webinar' ? (
                    <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : session.type === 'workshop' ? (
                    <Video className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{session.typeLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#132219] font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#3F5247]" />
                  <span>{session.dateLabel}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-[#3F5247]" />
                  <span>
                    {session.timeLabel} ({session.durationLabel})
                  </span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{session.platformLabel}</span>
              </div>

              <span className="text-xs font-mono tabular-nums font-semibold text-[#15803D]">
                {countdown}
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#132219] leading-snug">
              {session.title}
            </h3>

            <p className="text-sm text-[#3F5247] leading-relaxed">
              {session.topicSummary}
            </p>

            <div className="pt-2 border-t border-white/75 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-[#2C3E33]">
                <span className="text-[#3F5247]">প্রশিক্ষক: </span>
                <strong className="font-semibold text-[#132219]">
                  {session.trainerName}
                </strong>{' '}
                <span className="text-[#3F5247]">({session.trainerRole})</span>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToAction('classroom', session.courseId)}
                className="text-left sm:text-right font-medium text-[#15803D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                {session.courseTitle}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-white/75 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono tabular-nums text-[#3F5247]">
              খালি আসন:{' '}
              <span className="font-semibold text-[#132219]">
                {toBengaliDigits(remainingSeats)}/
                {toBengaliDigits(session.seatsTotal)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSyncSingle(event)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                  isJustSynced
                    ? 'bg-[#ECF2ED]/90 border border-[#15803D] text-[#15803D]'
                    : 'btn-3d-glass text-[#132219]'
                }`}
              >
                {isJustSynced ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>.ICS ডাউনলোড হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>লোকাল ক্যালেন্ডার (.ICS)</span>
                  </>
                )}
              </button>

              <a
                href={buildGoogleCalendarUrl(session)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <span>Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#3F5247]" />
              </a>

              <button
                type="button"
                onClick={() => onToggleRegister(session.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                  isRegistered
                    ? 'btn-3d-glass border border-[#15803D]/40 text-[#15803D]'
                    : 'btn-3d-emerald'
                }`}
              >
                {isRegistered ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>নিবন্ধিত · আসন নিশ্চিত</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>আসন সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </article>
      );
    }

    const { deadline } = event;
    const completed = isDeadlineCompleted(deadline);
    const badgeStyle = getEventBadgeStyles('cpd-deadline');

    return (
      <article
        key={event.id}
        className={`glass-card-3d rounded-2xl p-5 sm:p-6 space-y-4 ${
          completed ? 'ring-1 ring-[#15803D]/40' : 'ring-1 ring-[#D97706]/35'
        }`}
      >
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#3F5247]">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-semibold ${badgeStyle.chipClass}`}
              >
                <AlarmClock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>CPD ডেডলাইন</span>
              </span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#132219] font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#3F5247]" />
                <span>{deadline.dateLabel}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#3F5247]" />
                <span>{deadline.timeLabel}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#92400E]">
                {deadline.cpdCreditsLabel}
              </span>
            </div>

            {completed ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>শর্ত সম্পন্ন</span>
              </span>
            ) : (
              <span className="text-xs font-mono tabular-nums font-semibold text-[#B45309]">
                {countdown}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-[#132219] leading-snug">
            {deadline.title}
          </h3>

          <p className="text-sm text-[#3F5247] leading-relaxed">
            {deadline.requirementSummary}
          </p>

          <div className="pt-2 border-t border-white/75 flex items-center justify-between gap-2 text-xs">
            <span className="text-[#3F5247]">
              সংশ্লিষ্ট কোর্স:{' '}
              <strong className="font-semibold text-[#132219]">
                {deadline.courseTitle}
              </strong>
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/75 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#3F5247]">
            {completed
              ? 'আপনি ইতোমধ্যে এই CPD মাইলফলকের শর্ত পূরণ করেছেন।'
              : 'সময়সীমার আগে মূল্যায়ন বা মডিউল শর্ত সম্পন্ন করুন।'}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSyncSingle(event)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                isJustSynced
                  ? 'bg-[#ECF2ED]/90 border border-[#15803D] text-[#15803D]'
                  : 'btn-3d-glass text-[#132219]'
              }`}
            >
              {isJustSynced ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>রিমাইন্ডার .ICS ডাউনলোড</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>রিমাইন্ডার (.ICS)</span>
                </>
              )}
            </button>

            <a
              href={buildDeadlineGoogleCalendarUrl(deadline)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <span>Google Calendar</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#3F5247]" />
            </a>

            <button
              type="button"
              onClick={() =>
                onNavigateToAction(deadline.targetTab, deadline.courseId)
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
            >
              <span>{completed ? 'অগ্রগতি দেখুন' : deadline.ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section
      aria-labelledby="training-calendar-view-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8"
    >
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-white/75">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-[#15803D]">
            Teacher Training Calendar · প্রশিক্ষণ, কর্মশালা ও CPD সময়সূচি
          </div>
          <h1
            id="training-calendar-view-heading"
            className="text-3xl font-bold text-[#132219] tracking-tight [text-wrap:balance]"
          >
            শিক্ষক প্রশিক্ষণ ও CPD ক্যালেন্ডার
          </h1>
          <p className="text-sm sm:text-base text-[#3F5247] leading-relaxed">
            আসন্ন সকল লাইভ ওয়েবিনার, ভার্চুয়াল ওয়ার্কশপ এবং CPD মূল্যায়ন ডেডলাইন একত্রে মাসিক ক্যালেন্ডার অথবা কালানুক্রমিক তালিকা আকারে দেখুন।
          </p>
        </div>

        {/* View Mode Toggle (Native State) + Bulk Sync */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div
            role="group"
            aria-label="ভিউ মোড পরিবর্তন"
            className="inline-flex items-center gap-1 p-1.5 glass-well rounded-xl"
          >
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              aria-pressed={viewMode === 'calendar'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'calendar'
                  ? 'btn-3d-glass text-[#132219] font-semibold'
                  : 'text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#15803D]" />
              <span>ক্যালেন্ডার ভিউ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'list'
                  ? 'btn-3d-glass text-[#132219] font-semibold'
                  : 'text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              <List className="w-3.5 h-3.5 text-[#15803D]" />
              <span>তালিকা ভিউ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBulkExport}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer ${
              bulkSynced
                ? 'bg-[#ECF2ED]/90 border border-[#15803D] text-[#15803D]'
                : 'btn-3d-glass text-[#132219]'
            }`}
          >
            {bulkSynced ? (
              <>
                <Check className="w-4 h-4 text-[#15803D]" />
                <span>সব ইভেন্ট (.ICS) সংরক্ষিত</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4 text-[#15803D]" />
                <span>সব সময়সূচি সিঙ্ক (.ICS)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4-Column Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#15803D]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
              {toBengaliDigits(allEvents.length)}টি নির্ধারিত
            </div>
            <div className="text-xs text-[#3F5247] mt-0.5">
              সকল সেশন ও CPD সময়সীমা
            </div>
          </div>
        </div>

        <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-[#15803D]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
              {toBengaliDigits(webinarsAndQaCount)}টি লাইভ সেশন
            </div>
            <div className="text-xs text-[#3F5247] mt-0.5">
              ওয়েবিনার ও সরাসরি Q&A
            </div>
          </div>
        </div>

        <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-[#0F766E]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
              {toBengaliDigits(workshopsCount)}টি ওয়ার্কশপ
            </div>
            <div className="text-xs text-[#3F5247] mt-0.5">
              ব্রেকআউট ও নিবন্ধিত ({toBengaliDigits(registeredCount)}টি)
            </div>
          </div>
        </div>

        <div className="glass-card-3d rounded-2xl p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
            <AlarmClock className="w-5 h-5 text-[#B45309]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#132219]">
              {toBengaliDigits(deadlines.length)}টি CPD ডেডলাইন
            </div>
            <div className="text-xs text-[#3F5247] mt-0.5">
              মডিউল, কুইজ ও সনদ সময়সীমা
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1.5 glass-well rounded-xl w-fit">
          {(
            [
              { id: 'all', label: `সবসমূহ (${toBengaliDigits(allEvents.length)})` },
              { id: 'webinar', label: 'লাইভ ওয়েবিনার' },
              { id: 'workshop', label: 'ওয়ার্কশপ' },
              { id: 'qa', label: 'প্রশ্নোত্তর (Q&A)' },
              { id: 'cpd-deadline', label: 'CPD ডেডলাইন' }
            ] as { id: EventFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab.id
                  ? 'btn-3d-glass text-[#132219] font-semibold'
                  : 'text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#3F5247] font-mono tabular-nums">
          {viewMode === 'calendar'
            ? `${activeMonth.label}-এ ${toBengaliDigits(activeMonthEvents.length)}টি ইভেন্ট`
            : `মোট ${toBengaliDigits(filteredEvents.length)}টি ইভেন্ট প্রদর্শিত`}
        </div>
      </div>

      {/* Main Content Area: Monthly Calendar View vs List View */}
      {viewMode === 'calendar' ? (
        <div className="space-y-6">
          {/* Full-Width Monthly Calendar Grid */}
          <div className="glass-surface rounded-2xl overflow-hidden">
            {/* Calendar Month Toolbar */}
            <div className="px-5 sm:px-6 py-4 bg-white/45 border-b border-white/75 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#132219]">
                  {activeMonth.label}
                </h2>
                <p className="text-xs text-[#3F5247]">
                  যেকোনো তারিখে ক্লিক করে ওই দিনের প্রশিক্ষণ সেশন ও CPD ডেডলাইন দেখুন।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-xl cursor-pointer"
                >
                  আজ (১৮ নভে)
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeMonth(Math.max(0, monthCursor - 1))}
                  disabled={monthCursor === 0}
                  aria-label="পূর্ববর্তী মাস"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-xl btn-3d-glass text-[#132219] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleChangeMonth(
                      Math.min(CALENDAR_MONTHS.length - 1, monthCursor + 1)
                    )
                  }
                  disabled={monthCursor === CALENDAR_MONTHS.length - 1}
                  aria-label="পরবর্তী মাস"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-xl btn-3d-glass text-[#132219] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Header Strip */}
            <div className="grid grid-cols-7 border-b border-white/75 bg-white/35">
              {WEEKDAYS_BN.map((day) => (
                <div
                  key={day}
                  className="py-2.5 px-2 text-center text-xs font-semibold text-[#3F5247]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 7-Column Month Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-white/75">
              {monthCells.map((iso, idx) => {
                if (!iso) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[82px] sm:min-h-[112px] bg-white/20"
                    />
                  );
                }

                const dayNum = Number(iso.split('-')[2]);
                const dayEvents = eventsByDate[iso] ?? [];
                const isSelected = selectedIsoDate === iso;
                const isToday = iso === '2026-11-18' || iso === todayIso;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedIsoDate(iso)}
                    className={`min-h-[82px] sm:min-h-[112px] p-1.5 sm:p-2.5 text-left flex flex-col justify-between gap-1.5 transition-colors cursor-pointer align-top ${
                      isSelected
                        ? 'bg-[#ECF2ED]/85 ring-2 ring-inset ring-[#15803D]'
                        : dayEvents.length > 0
                        ? 'bg-white/45 hover:bg-white/75'
                        : 'bg-white/30 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-mono tabular-nums font-bold ${
                          isSelected
                            ? 'bg-[#15803D] text-white shadow-xs'
                            : isToday
                            ? 'bg-[#132219] text-white shadow-xs'
                            : 'text-[#132219]'
                        }`}
                      >
                        {toBengaliDigits(dayNum)}
                      </span>
                      {isToday && (
                        <span className="hidden sm:inline text-[10px] font-semibold text-[#15803D]">
                          আজ
                        </span>
                      )}
                    </div>

                    {dayEvents.length > 0 && (
                      <div className="space-y-1 w-full">
                        {dayEvents.slice(0, 2).map((ev) => {
                          const style = getEventBadgeStyles(ev.eventType);
                          return (
                            <div
                              key={ev.id}
                              className={`px-1.5 py-1 rounded border text-[10px] sm:text-[11px] leading-tight font-medium truncate flex items-center gap-1 ${style.chipClass}`}
                              title={ev.title}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotClass}`}
                              />
                              <span className="truncate hidden sm:inline">
                                {ev.title}
                              </span>
                              <span className="truncate sm:hidden">
                                {style.label}
                              </span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] font-mono font-semibold text-[#3F5247] pl-0.5">
                            +{toBengaliDigits(dayEvents.length - 2)} আরও
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Color Legend */}
            <div className="px-5 sm:px-6 py-3 bg-white/40 border-t border-white/75 flex flex-wrap items-center gap-5 text-xs text-[#3F5247]">
              {(
                ['webinar', 'workshop', 'qa', 'cpd-deadline'] as CalendarEventKind[]
              ).map((kind) => {
                const s = getEventBadgeStyles(kind);
                return (
                  <span key={kind} className="inline-flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.dotClass}`} />
                    <span>{s.label}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector Panel */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/75">
              <h3 className="text-lg font-bold text-[#132219]">
                নির্বাচিত তারিখ: {formatIsoDateLabelBn(selectedIsoDate)}
              </h3>
              <span className="text-xs font-mono tabular-nums text-[#3F5247]">
                {toBengaliDigits(selectedDayEvents.length)}টি নির্ধারিত কার্যক্রম
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="glass-surface rounded-2xl p-8 text-center space-y-3">
                <Calendar className="w-7 h-7 text-[#3F5247] mx-auto" />
                <div className="text-sm font-semibold text-[#132219]">
                  এই তারিখে কোনো লাইভ সেশন বা CPD ডেডলাইন নির্ধারিত নেই
                </div>
                <p className="text-xs text-[#3F5247]">
                  {activeMonth.label}-এর হাইলাইট করা তারিখগুলোতে ক্লিক করুন অথবা তালিকা ভিউতে সবগুলো আসন্ন ইভেন্ট দেখুন।
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-xl cursor-pointer"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>সব ইভেন্ট তালিকা ভিউতে দেখুন</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {selectedDayEvents.map((ev) => renderEventCard(ev))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View (Chronological Grouped Agenda) */
        <div className="space-y-8">
          {groupedByMonth.length === 0 ? (
            <div className="glass-surface rounded-2xl p-12 text-center space-y-3">
              <Calendar className="w-8 h-8 text-[#3F5247] mx-auto" />
              <h2 className="text-lg font-semibold text-[#132219]">
                এই ফিল্টারে কোনো আসন্ন সেশন বা ডেডলাইন নেই
              </h2>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="px-5 py-2.5 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
              >
                সব ইভেন্ট দেখান
              </button>
            </div>
          ) : (
            groupedByMonth.map(({ month, events }) => (
              <div key={month.key} className="space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/75">
                  <h2 className="text-xl font-bold text-[#132219]">
                    {month.label}
                  </h2>
                  <span className="text-xs font-mono tabular-nums font-semibold text-[#15803D]">
                    {toBengaliDigits(events.length)}টি কার্যক্রম
                  </span>
                </div>

                <div className="space-y-4">
                  {events.map((ev) => renderEventCard(ev))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};
