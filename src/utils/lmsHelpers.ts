import { CpdDeadline, Lesson, LessonNote, TrainingSession, VoiceReflectionMeta } from '../types/lms';

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)] ?? digit);
}

export function formatTimeBn(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${toBengaliDigits(mm)}:${toBengaliDigits(ss)}`;
}

export function generateCertificateId(courseId: string): string {
  const prefix =
    courseId === 'tpack-digital-teaching'
      ? 'TPK'
      : courseId === 'modern-pedagogy-assessment'
      ? 'PED'
      : 'LDR';
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TPACK-2026-${prefix}-${rand}`;
}

export function downloadMaterialHandout(courseTitle: string, lesson: Lesson): void {
  const { material } = lesson;
  const lines: string[] = [
    '====================================================================',
    'TPACK Academy — শিক্ষক দক্ষতা উন্নয়ন লেসন প্ল্যান ও প্রশিক্ষণ উপকরণ',
    '====================================================================',
    `প্রশিক্ষণ কোর্স: ${courseTitle}`,
    `মডিউল: ${lesson.number} — ${lesson.title}`,
    `উপকরণের শিরোনাম: ${material.title}`,
    `ধরন: ${material.formatLabel} | পাঠ সময়: ${material.readTime}`,
    '',
    '--- শ্রেণিকক্ষ প্রয়োগ তথ্য ---',
    `উপযোগী শ্রেণি: ${material.classroomActivity.gradeLevel}`,
    `শ্রেণিকক্ষের সময়কাল: ${material.classroomActivity.duration}`,
    `শিখনফল (Learning Objective): ${material.classroomActivity.objective}`,
    '',
    '--- মূল সারসংক্ষেপ ---',
    material.summary,
    '',
    '--- শিক্ষণ কৌশল ও মূল বিষয়সমূহ ---',
    ...material.keyPoints.map((pt, idx) => `${toBengaliDigits(idx + 1)}. ${pt}`),
    '',
    '--- শিক্ষকের প্রস্তুতি ও শ্রেণিকক্ষ চেকলিস্ট ---',
    ...material.actionChecklist.map((item) => `[ ] ${item}`)
  ];

  if (material.formulaOrMetric) {
    lines.push(
      '',
      `--- ${material.formulaOrMetric.label} ---`,
      material.formulaOrMetric.expression,
      `নোট: ${material.formulaOrMetric.note}`
    );
  }

  lines.push(
    '',
    '====================================================================',
    '© ২০২৬ TPACK Academy | শিক্ষক পেশাগত দক্ষতা উন্নয়ন কর্মসূচি',
    '===================================================================='
  );

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${lesson.id}-tpack-lesson-plan.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildVEventLines(session: TrainingSession): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${session.id}@tpackacademy.edu`,
    `DTSTART:${session.icsStart}`,
    `DTEND:${session.icsEnd}`,
    `SUMMARY:${session.title} (${session.typeLabel})`,
    `DESCRIPTION:প্রশিক্ষক: ${session.trainerName} (${session.trainerRole})\\nকোর্স: ${session.courseTitle}\\n${session.topicSummary}`,
    `LOCATION:TPACK Academy — ${session.platformLabel}`,
    'END:VEVENT'
  ];
}

export function downloadCalendarInvite(session: TrainingSession): void {
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TPACK Academy//Teacher Training LMS//BN',
    ...buildVEventLines(session),
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${session.id}-schedule.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadBulkCalendarInvites(
  sessions: TrainingSession[],
  filename = 'tpack-academy-upcoming-events.ics'
): void {
  if (sessions.length === 0) return;
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TPACK Academy//Teacher Training LMS//BN',
    'X-WR-CALNAME:TPACK Academy Live Webinars & Training',
    ...sessions.flatMap((s) => buildVEventLines(s)),
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function buildGoogleCalendarUrl(session: TrainingSession): string {
  const details = `প্রশিক্ষক: ${session.trainerName} (${session.trainerRole})\nকোর্স: ${session.courseTitle}\n\n${session.topicSummary}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${session.title} (${session.typeLabel})`,
    dates: `${session.icsStart}/${session.icsEnd}`,
    details,
    location: `TPACK Academy — ${session.platformLabel}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildDeadlineVEventLines(deadline: CpdDeadline): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${deadline.id}@tpackacademy.edu`,
    `DTSTART:${deadline.icsStart}`,
    `DTEND:${deadline.icsEnd}`,
    `SUMMARY:[CPD ডেডলাইন] ${deadline.title}`,
    `DESCRIPTION:কোর্স: ${deadline.courseTitle}\\nক্রেডিট: ${deadline.cpdCreditsLabel}\\n${deadline.requirementSummary}`,
    'LOCATION:TPACK Academy — অনলাইন মূল্যায়ন পোর্টাল',
    'END:VEVENT'
  ];
}

export function downloadDeadlineInvite(deadline: CpdDeadline): void {
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TPACK Academy//Teacher Training LMS//BN',
    ...buildDeadlineVEventLines(deadline),
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${deadline.id}-deadline.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function buildDeadlineGoogleCalendarUrl(deadline: CpdDeadline): string {
  const details = `কোর্স: ${deadline.courseTitle}\nক্রেডিট: ${deadline.cpdCreditsLabel}\n\n${deadline.requirementSummary}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[CPD ডেডলাইন] ${deadline.title}`,
    dates: `${deadline.icsStart}/${deadline.icsEnd}`,
    details,
    location: 'TPACK Academy — অনলাইন পোর্টাল'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadAllCalendarEvents(
  sessions: TrainingSession[],
  deadlines: CpdDeadline[],
  filename = 'tpack-teacher-training-calendar.ics'
): void {
  if (sessions.length === 0 && deadlines.length === 0) return;
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TPACK Academy//Teacher Training LMS//BN',
    'X-WR-CALNAME:TPACK Academy Training & CPD Calendar',
    ...sessions.flatMap((s) => buildVEventLines(s)),
    ...deadlines.flatMap((d) => buildDeadlineVEventLines(d)),
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadAchievementBadgePng(params: {
  id: string;
  titleEn: string;
  titleBn: string;
  tierLabel: string;
  criteriaLabel: string;
  tier: 'emerald' | 'gold' | 'forest';
  learnerName: string;
  designation: string;
  schoolName: string;
  earnedAt?: string;
}): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  const accentPrimary =
    params.tier === 'gold'
      ? '#B45309'
      : params.tier === 'forest'
      ? '#14532D'
      : '#15803D';
  const accentSoft =
    params.tier === 'gold'
      ? '#FEF3C7'
      : params.tier === 'forest'
      ? '#DCFCE7'
      : '#ECF2ED';
  const accentRing =
    params.tier === 'gold'
      ? '#F59E0B'
      : params.tier === 'forest'
      ? '#166534'
      : '#22C55E';

  // Background
  ctx.fillStyle = '#FAFDF9';
  ctx.fillRect(0, 0, w, h);

  // Outer Frame
  ctx.strokeStyle = accentPrimary;
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, w - 56, h - 56);

  ctx.strokeStyle = '#DDE5DF';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(42, 42, w - 84, h - 84);

  // Left Medallion Crest
  const cx = 230;
  const cy = h / 2;

  ctx.fillStyle = accentSoft;
  ctx.beginPath();
  ctx.arc(cx, cy, 132, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = accentPrimary;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 112, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = accentRing;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 96, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inner Crest Shield
  ctx.fillStyle = accentPrimary;
  ctx.beginPath();
  ctx.arc(cx, cy, 66, 0, Math.PI * 2);
  ctx.fill();

  // Checkmark / Star Emblem inside Crest
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 2);
  ctx.lineTo(cx - 6, cy + 20);
  ctx.lineTo(cx + 28, cy - 18);
  ctx.stroke();

  // Right Content Column
  const rx = 410;
  ctx.textAlign = 'left';

  ctx.fillStyle = accentPrimary;
  ctx.font = '700 18px "Outfit", "Hind Siliguri", sans-serif';
  ctx.fillText(`TPACK ACADEMY · ${params.tierLabel.toUpperCase()}`, rx, 136);

  ctx.fillStyle = '#132219';
  ctx.font = '700 42px "Outfit", sans-serif';
  ctx.fillText(params.titleEn, rx, 200);

  ctx.fillStyle = '#2C3E33';
  ctx.font = '600 28px "Hind Siliguri", sans-serif';
  ctx.fillText(params.titleBn, rx, 248);

  // Divider
  ctx.strokeStyle = '#DDE5DF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx, 278);
  ctx.lineTo(w - 90, 278);
  ctx.stroke();

  // Awarded to
  ctx.fillStyle = '#4A5D52';
  ctx.font = '500 18px "Hind Siliguri", sans-serif';
  ctx.fillText('ডিজিটাল দক্ষতা ব্যাজ অর্জনকারী:', rx, 324);

  const teacherName = params.learnerName.trim() || 'সম্মানিত প্রশিক্ষণার্থী শিক্ষক';
  ctx.fillStyle = '#14532D';
  ctx.font = '700 34px "Hind Siliguri", sans-serif';
  ctx.fillText(teacherName, rx, 372);

  const affil = [params.designation.trim(), params.schoolName.trim()]
    .filter(Boolean)
    .join(' · ');
  if (affil) {
    ctx.fillStyle = '#4A5D52';
    ctx.font = '500 20px "Hind Siliguri", sans-serif';
    ctx.fillText(affil, rx, 412);
  }

  // Criteria Box
  ctx.fillStyle = '#F6F8F6';
  ctx.fillRect(rx, 448, w - rx - 90, 82);
  ctx.strokeStyle = '#DDE5DF';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rx, 448, w - rx - 90, 82);

  ctx.fillStyle = '#4A5D52';
  ctx.font = '600 16px "Hind Siliguri", sans-serif';
  ctx.fillText('অর্জনের মানদণ্ড:', rx + 20, 480);

  ctx.fillStyle = '#132219';
  ctx.font = '600 20px "Hind Siliguri", sans-serif';
  ctx.fillText(params.criteriaLabel, rx + 20, 512);

  // Footer Metadata
  ctx.fillStyle = '#4A5D52';
  ctx.font = '500 17px "Hind Siliguri", sans-serif';
  ctx.fillText(
    `অর্জনের তারিখ: ${params.earnedAt || 'সম্প্রতি অর্জিত'}`,
    rx,
    588
  );

  ctx.textAlign = 'right';
  ctx.font = '600 15px "JetBrains Mono", monospace';
  ctx.fillText(`BADGE-${params.id.toUpperCase()}`, w - 90, 588);

  const dataUrl = canvas.toDataURL('image/png');
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = `TPACK-Badge-${params.id}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function hasLessonNoteContent(note?: LessonNote): boolean {
  if (!note) return false;
  return (
    Boolean(note.content?.trim()) || (note.voiceReflections?.length ?? 0) > 0
  );
}

export function downloadLessonNoteTxt(params: {
  courseTitle: string;
  lessonNumber: string;
  lessonTitle: string;
  lessonId: string;
  teacherName: string;
  content: string;
  updatedAt: string;
  voiceReflections?: VoiceReflectionMeta[];
}): void {
  const voiceLines =
    params.voiceReflections && params.voiceReflections.length > 0
      ? [
          '',
          '--- সংরক্ষিত অডিও প্রতিফলন (Voice Reflections) ---',
          ...params.voiceReflections.map(
            (v, idx) =>
              `${toBengaliDigits(idx + 1)}. ${v.label} (${formatTimeBn(v.durationSec)} · ${v.createdAt})`
          )
        ]
      : [];

  const lines = [
    '====================================================================',
    'TPACK Academy — শিক্ষকের ব্যক্তিগত নোটবুক (Personal Notebook)',
    '====================================================================',
    `শিক্ষক: ${params.teacherName || 'প্রশিক্ষণার্থী শিক্ষক'}`,
    `কোর্স: ${params.courseTitle}`,
    `মডিউল: ${params.lessonNumber} — ${params.lessonTitle}`,
    `সর্বশেষ সংরক্ষণ: ${params.updatedAt}`,
    '',
    '--- সংরক্ষিত লিখিত নোট ---',
    params.content.trim() || '(কোনো লিখিত নোট যুক্ত করা হয়নি)',
    ...voiceLines,
    '',
    '====================================================================',
    '© ২০২৬ TPACK Academy'
  ];

  const blob = new Blob([lines.join('\n')], {
    type: 'text/plain;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${params.lessonId}-personal-note.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatStudyDurationBn(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  if (safe === 0) return '০ মিনিট';
  if (safe < 60) return `${toBengaliDigits(safe)} সেকেন্ড`;
  const totalMinutes = Math.round(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${toBengaliDigits(minutes)} মিনিট`;
  }
  if (minutes === 0) {
    return `${toBengaliDigits(hours)} ঘণ্টা`;
  }
  return `${toBengaliDigits(hours)} ঘ. ${toBengaliDigits(minutes)} মি.`;
}

const SHORT_WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

export interface DailyActivityPoint {
  dateKey: string;
  dayLabel: string;
  fullDateLabel: string;
  studyMinutes: number;
  studySeconds: number;
  activities: number;
  isToday: boolean;
}

export function buildWeeklyActivityData(
  studySecondsByDate: Record<string, number>,
  activityCountByDate: Record<string, number>
): DailyActivityPoint[] {
  const today = new Date();
  const points: DailyActivityPoint[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = getLocalDateKey(d);
    const sec = studySecondsByDate[key] ?? 0;
    const mins = Number((sec / 60).toFixed(1));
    const activities = activityCountByDate[key] ?? 0;
    const weekday = SHORT_WEEKDAYS_BN[d.getDay()];

    points.push({
      dateKey: key,
      dayLabel: offset === 0 ? `${weekday} (আজ)` : weekday,
      fullDateLabel: d.toLocaleDateString('bn-BD', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }),
      studyMinutes: mins,
      studySeconds: sec,
      activities,
      isToday: offset === 0
    });
  }

  return points;
}

export type AchievementShareFormat = 'bn' | 'en' | 'short';

export function buildAchievementShareSummary(params: {
  titleEn: string;
  titleBn: string;
  tierLabel: string;
  criteriaLabel: string;
  learnerName: string;
  designation: string;
  schoolName: string;
  earnedAt?: string;
  format: AchievementShareFormat;
}): string {
  const teacher = params.learnerName.trim() || 'সম্মানিত প্রশিক্ষণার্থী শিক্ষক';
  const affiliation = [params.designation.trim(), params.schoolName.trim()]
    .filter(Boolean)
    .join(', ');
  const earnedDate = params.earnedAt || 'সম্প্রতি অর্জিত';

  if (params.format === 'en') {
    const roleLine = affiliation ? ` (${affiliation})` : '';
    return [
      `Proud to share that I have earned the "${params.titleEn}" (${params.titleBn}) digital badge on TPACK Academy!`,
      ``,
      `Educator: ${teacher}${roleLine}`,
      `Recognition: ${params.titleEn} · ${params.tierLabel}`,
      `Milestone: ${params.criteriaLabel}`,
      `Earned: ${earnedDate}`,
      ``,
      `Continuing my journey in technology-integrated pedagogy and modern classroom assessment.`,
      `#TPACKAcademy #TeacherCPD #EdTech #DigitalEducator`
    ].join('\n');
  }

  if (params.format === 'short') {
    return `TPACK Academy থেকে ‘${params.titleEn}’ (${params.titleBn}) ডিজিটাল ব্যাজ অর্জন করেছি! অর্জনকারী: ${teacher}। মানদণ্ড: ${params.criteriaLabel}। #TPACKAcademy #TeacherCPD #EdTechBangladesh`;
  }

  const identityLine = affiliation ? `${teacher} (${affiliation})` : teacher;
  return [
    `আনন্দের সাথে জানাচ্ছি যে আমি TPACK Academy থেকে “${params.titleBn}” (${params.titleEn}) ডিজিটাল দক্ষতা ব্যাজ অর্জন করেছি!`,
    ``,
    `অর্জনকারী: ${identityLine}`,
    `সম্মাননা স্তর: ${params.tierLabel}`,
    `অর্জনের মানদণ্ড: ${params.criteriaLabel}`,
    `অর্জনের তারিখ: ${earnedDate}`,
    ``,
    `শ্রেণিকক্ষে আধুনিক পেডাগজি ও প্রযুক্তির সমন্বিত প্রয়োগে এই অর্জন নতুন অনুপ্রেরণা জোগাবে।`,
    `#TPACKAcademy #TeacherCPD #EdTechBangladesh #শিক্ষক_দক্ষতা`
  ].join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

