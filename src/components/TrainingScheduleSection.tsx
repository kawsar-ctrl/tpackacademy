import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MessageSquare,
  Radio,
  UserCheck,
  Video
} from 'lucide-react';
import { ScheduleSessionType, TrainingSession } from '../types/lms';
import {
  buildGoogleCalendarUrl,
  downloadBulkCalendarInvites,
  downloadCalendarInvite,
  toBengaliDigits
} from '../utils/lmsHelpers';

interface TrainingScheduleSectionProps {
  sessions: TrainingSession[];
  registeredSessionIds: string[];
  onToggleRegister: (sessionId: string) => void;
  onOpenCourse: (courseId: string) => void;
  onOpenFullCalendar?: () => void;
}

type SessionFilter = 'all' | ScheduleSessionType;

interface CalendarMonth {
  year: number;
  monthIndex: number; // 0-indexed (10 = Nov, 11 = Dec)
  label: string;
}

const CALENDAR_MONTHS: CalendarMonth[] = [
  { year: 2026, monthIndex: 10, label: 'নভেম্বর ২০২৬' },
  { year: 2026, monthIndex: 11, label: 'ডিসেম্বর ২০২৬' }
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

export const TrainingScheduleSection: React.FC<TrainingScheduleSectionProps> = ({
  sessions,
  registeredSessionIds,
  onToggleRegister,
  onOpenCourse,
  onOpenFullCalendar
}) => {
  const [filter, setFilter] = useState<SessionFilter>('all');
  const [monthCursor, setMonthCursor] = useState(0);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);
  const [recentlySyncedId, setRecentlySyncedId] = useState<string | null>(null);
  const [bulkSynced, setBulkSynced] = useState(false);

  const activeMonth = CALENDAR_MONTHS[monthCursor];

  const monthCells = useMemo(
    () => buildMonthGrid(activeMonth.year, activeMonth.monthIndex),
    [activeMonth.year, activeMonth.monthIndex]
  );

  const sessionsByDate = useMemo(() => {
    const map: Record<string, TrainingSession[]> = {};
    sessions.forEach((s) => {
      if (!map[s.isoDate]) map[s.isoDate] = [];
      map[s.isoDate].push(s);
    });
    return map;
  }, [sessions]);

  const activeMonthPrefix = `${activeMonth.year}-${String(
    activeMonth.monthIndex + 1
  ).padStart(2, '0')}`;

  const activeMonthSessions = useMemo(
    () => sessions.filter((s) => s.isoDate.startsWith(activeMonthPrefix)),
    [sessions, activeMonthPrefix]
  );

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const typeMatch = filter === 'all' || s.type === filter;
      const dateMatch = selectedIsoDate ? s.isoDate === selectedIsoDate : true;
      return typeMatch && dateMatch;
    });
  }, [sessions, filter, selectedIsoDate]);

  const registeredSessions = useMemo(
    () => sessions.filter((s) => registeredSessionIds.includes(s.id)),
    [sessions, registeredSessionIds]
  );

  const handleSingleIcsSync = (session: TrainingSession) => {
    downloadCalendarInvite(session);
    setRecentlySyncedId(session.id);
    window.setTimeout(() => {
      setRecentlySyncedId((curr) => (curr === session.id ? null : curr));
    }, 3000);
  };

  const handleBulkIcsSync = () => {
    const targets =
      registeredSessions.length > 0 ? registeredSessions : sessions;
    downloadBulkCalendarInvites(
      targets,
      registeredSessions.length > 0
        ? 'tpack-my-registered-webinars.ics'
        : 'tpack-all-upcoming-webinars.ics'
    );
    setBulkSynced(true);
    window.setTimeout(() => setBulkSynced(false), 3500);
  };

  const handleSelectDate = (isoDate: string) => {
    setSelectedIsoDate((prev) => (prev === isoDate ? null : isoDate));
  };

  const handleChangeMonth = (nextCursor: number) => {
    setMonthCursor(nextCursor);
    setSelectedIsoDate(null);
  };

  return (
    <section
      id="training-schedule"
      aria-labelledby="training-schedule-heading"
      className="space-y-6 pt-4"
    >
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-white/75">
        <div className="space-y-1 max-w-2xl">
          <div className="text-xs font-semibold text-[#15803D]">
            Upcoming Training Events · লাইভ ওয়েবিনার ও প্রশিক্ষণ ক্যালেন্ডার
          </div>
          <h2
            id="training-schedule-heading"
            className="text-2xl font-bold text-[#132219] tracking-tight"
          >
            আসন্ন প্রশিক্ষণ ও লাইভ ওয়েবিনার ক্যালেন্ডার
          </h2>
          <p className="text-sm text-[#3F5247]">
            নির্ধারিত লাইভ ওয়েবিনার, ভার্চুয়াল ওয়ার্কশপ ও প্রশ্নোত্তর সেশনের তারিখ দেখুন এবং আপনার লোকাল ক্যালেন্ডারে (.ICS / Google Calendar) সিঙ্ক করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-xs font-mono tabular-nums font-semibold text-[#3F5247]">
            নিবন্ধিত:{' '}
            <strong className="text-[#15803D]">
              {toBengaliDigits(registeredSessions.length)}/
              {toBengaliDigits(sessions.length)}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleBulkIcsSync}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer ${
              bulkSynced
                ? 'btn-3d-glass ring-1 ring-[#15803D]/50 text-[#15803D]'
                : 'btn-3d-glass text-[#132219]'
            }`}
          >
            {bulkSynced ? (
              <>
                <Check className="w-4 h-4 text-[#15803D]" />
                <span>ক্যালেন্ডার ফাইল ডাউনলোড হয়েছে</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4 text-[#15803D]" />
                <span>
                  {registeredSessions.length > 0
                    ? `নিবন্ধিত (${toBengaliDigits(registeredSessions.length)}) সিঙ্ক (.ICS)`
                    : 'সব ওয়েবিনার সিঙ্ক (.ICS)'}
                </span>
              </>
            )}
          </button>

          {onOpenFullCalendar && (
            <button
              type="button"
              onClick={onOpenFullCalendar}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
            >
              <span>পূর্ণাঙ্গ ক্যালেন্ডার ও CPD ডেডলাইন</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Zone Calendar Split: Left Interactive Month Grid / Right Live Webinar Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone: Monthly Calendar */}
        <div className="lg:col-span-5 glass-surface rounded-2xl p-5 space-y-4">
          {/* Calendar Month Controls */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/75">
            <div>
              <h3 className="text-base font-bold text-[#132219]">
                {activeMonth.label}
              </h3>
              <p className="text-xs text-[#3F5247] font-mono tabular-nums">
                এই মাসে নির্ধারিত ইভেন্ট: {toBengaliDigits(activeMonthSessions.length)}টি
              </p>
            </div>

            <div className="flex items-center gap-1.5">
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

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_BN.map((day) => (
              <div
                key={day}
                className="py-1.5 text-[11px] font-semibold text-[#4A5D52]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {monthCells.map((iso, idx) => {
              if (!iso) {
                return <div key={`empty-${idx}`} className="h-11" />;
              }

              const dayNum = Number(iso.split('-')[2]);
              const dayEvents = sessionsByDate[iso] ?? [];
              const hasEvents = dayEvents.length > 0;
              const isSelected = selectedIsoDate === iso;
              const hasRegistered = dayEvents.some((e) =>
                registeredSessionIds.includes(e.id)
              );

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!hasEvents}
                  onClick={() => hasEvents && handleSelectDate(iso)}
                  aria-label={
                    hasEvents
                      ? `${toBengaliDigits(dayNum)} ${activeMonth.label} — ${toBengaliDigits(dayEvents.length)}টি প্রশিক্ষণ ইভেন্ট`
                      : `${toBengaliDigits(dayNum)} ${activeMonth.label}`
                  }
                  className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs font-mono tabular-nums transition-all relative ${
                    isSelected
                      ? 'btn-3d-emerald font-bold ring-2 ring-[#15803D] ring-offset-1 cursor-pointer'
                      : hasEvents
                      ? 'bg-[#DCFCE7]/75 border border-[#15803D]/35 text-[#132219] font-bold hover:bg-[#DCFCE7] shadow-xs cursor-pointer'
                      : 'text-[#5B7063] bg-white/40 cursor-default'
                  }`}
                >
                  <span>{toBengaliDigits(dayNum)}</span>
                  {hasEvents && (
                    <span
                      className={`text-[9px] leading-none mt-0.5 font-sans font-semibold ${
                        isSelected
                          ? 'text-[#DCFCE7]'
                          : hasRegistered
                          ? 'text-[#15803D]'
                          : 'text-[#2C3E33]'
                      }`}
                    >
                      {dayEvents[0].type === 'webinar'
                        ? 'ওয়েবিনার'
                        : dayEvents[0].type === 'qa'
                        ? 'Q&A'
                        : 'কর্মশালা'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Jump List for Active Month */}
          <div className="pt-3 border-t border-white/75 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#132219]">
                {activeMonth.label}-এর নির্ধারিত তারিখসমূহ
              </span>
              {selectedIsoDate && (
                <button
                  type="button"
                  onClick={() => setSelectedIsoDate(null)}
                  className="font-semibold text-[#15803D] hover:underline cursor-pointer"
                >
                  সব তারিখ দেখুন
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {activeMonthSessions.map((ev) => {
                const isSel = selectedIsoDate === ev.isoDate;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleSelectDate(ev.isoDate)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSel
                        ? 'bg-white/95 ring-1 ring-[#15803D]/50 text-[#132219] font-semibold shadow-xs'
                        : 'glass-well text-[#2C3E33] hover:bg-white/75'
                    }`}
                  >
                    <span className="truncate">{ev.title}</span>
                    <span className="font-mono tabular-nums text-[#15803D] font-semibold shrink-0">
                      {ev.dateLabel.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Zone: Filter Tabs & Scheduled Event Cards */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1.5 glass-well rounded-xl w-fit">
              {(
                [
                  { id: 'all', label: 'সকল ইভেন্ট' },
                  { id: 'webinar', label: 'লাইভ ওয়েবিনার' },
                  { id: 'workshop', label: 'ভার্চুয়াল ওয়ার্কশপ' },
                  { id: 'qa', label: 'প্রশ্নোত্তর (Q&A)' }
                ] as { id: SessionFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    filter === tab.id
                      ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                      : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {selectedIsoDate && (
              <button
                type="button"
                onClick={() => setSelectedIsoDate(null)}
                className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
              >
                নির্বাচিত তারিখ সরান ({toBengaliDigits(filteredSessions.length)}টি প্রদর্শিত)
              </button>
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <div className="glass-surface rounded-2xl p-10 text-center space-y-3">
              <Calendar className="w-8 h-8 text-[#3F5247] mx-auto" />
              <h3 className="text-base font-semibold text-[#132219]">
                এই ফিল্টারে কোনো আসন্ন ইভেন্ট নেই
              </h3>
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setSelectedIsoDate(null);
                }}
                className="px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
              >
                সব আসন্ন ইভেন্ট দেখান
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => {
                const isRegistered = registeredSessionIds.includes(session.id);
                const isJustSynced = recentlySyncedId === session.id;
                const remainingSeats = Math.max(
                  0,
                  session.seatsAvailable - (isRegistered ? 1 : 0)
                );
                const googleCalUrl = buildGoogleCalendarUrl(session);

                return (
                  <article
                    key={session.id}
                    className={`glass-card-3d rounded-2xl p-5 sm:p-6 space-y-4 ${
                      isRegistered ? 'ring-1 ring-[#15803D]/35' : ''
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Clean Unboxed Metadata Line */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5D52]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#15803D]">
                          {session.type === 'webinar' ? (
                            <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : session.type === 'workshop' ? (
                            <Video className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <MessageSquare
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          )}
                          <span>{session.typeLabel}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#132219] font-medium">
                          <Calendar
                            className="w-3.5 h-3.5 text-[#4A5D52]"
                            aria-hidden="true"
                          />
                          <span>{session.dateLabel}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Clock
                            className="w-3.5 h-3.5 text-[#4A5D52]"
                            aria-hidden="true"
                          />
                          <span>
                            {session.timeLabel} ({session.durationLabel})
                          </span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{session.platformLabel}</span>
                      </div>

                      <h3 className="text-lg font-bold text-[#132219] leading-snug">
                        {session.title}
                      </h3>

                      <p className="text-sm text-[#4A5D52] leading-relaxed">
                        {session.topicSummary}
                      </p>

                      {/* Trainer & Linked Course */}
                      <div className="pt-2 border-t border-white/75 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="text-[#2C3E33]">
                          <span className="text-[#3F5247]">প্রশিক্ষক: </span>
                          <strong className="font-semibold text-[#132219]">
                            {session.trainerName}
                          </strong>{' '}
                          <span className="text-[#3F5247]">
                            ({session.trainerRole})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenCourse(session.courseId)}
                          className="text-left sm:text-right font-medium text-[#15803D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {session.courseTitle}
                        </button>
                      </div>
                    </div>

                    {/* Calendar Sync & Registration Action Footer */}
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
                          onClick={() => handleSingleIcsSync(session)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                            isJustSynced
                              ? 'btn-3d-glass ring-1 ring-[#15803D]/50 text-[#15803D]'
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
                          href={googleCalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[40px]"
                        >
                          <span>Google Calendar</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#3F5247]" />
                        </a>

                        <button
                          type="button"
                          onClick={() => onToggleRegister(session.id)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                            isRegistered
                              ? 'btn-3d-glass ring-1 ring-[#15803D]/50 text-[#15803D]'
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
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
