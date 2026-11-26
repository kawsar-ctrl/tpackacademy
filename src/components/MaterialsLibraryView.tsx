import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Search
} from 'lucide-react';
import {
  Course,
  CourseCategory,
  Lesson,
  LessonMaterial,
  UploadedMaterialItem
} from '../types/lms';
import { downloadMaterialHandout, toBengaliDigits } from '../utils/lmsHelpers';

interface MaterialsLibraryViewProps {
  courses: Course[];
  uploadedMaterials?: UploadedMaterialItem[];
  readMaterialIds: string[];
  onMarkMaterialRead: (materialId: string) => void;
  onOpenLessonInClassroom: (courseId: string, lessonId: string) => void;
}

interface UnifiedMaterialEntry {
  kind: 'lesson' | 'uploaded';
  id: string;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonNumber?: string;
  category: Exclude<CourseCategory, 'all'>;
  categoryLabel: string;
  title: string;
  formatLabel: string;
  readTime: string;
  summary: string;
  keyPoints: string[];
  classroomActivity: LessonMaterial['classroomActivity'];
  actionChecklist: string[];
  formulaOrMetric?: LessonMaterial['formulaOrMetric'];
  lessonRef?: Lesson;
  attachmentName?: string;
  attachmentContent?: string;
  attachmentMimeType?: string;
}

function downloadUploadedMaterialFile(entry: UnifiedMaterialEntry): void {
  const hasRawAttachment = Boolean(entry.attachmentContent?.trim());
  const lines = [
    '====================================================================',
    'TPACK Academy — শিক্ষক প্রশিক্ষণ উপকরণ (অ্যাডমিন পোর্টাল)',
    '====================================================================',
    `কোর্স: ${entry.courseTitle}`,
    `শিরোনাম: ${entry.title}`,
    `ধরন: ${entry.formatLabel} | পাঠ সময়: ${entry.readTime}`,
    '',
    '--- শ্রেণিকক্ষ প্রয়োগ তথ্য ---',
    `উপযোগী শ্রেণি: ${entry.classroomActivity.gradeLevel}`,
    `সময়কাল: ${entry.classroomActivity.duration}`,
    `মূল শিখনফল: ${entry.classroomActivity.objective}`,
    '',
    '--- সারসংক্ষেপ ---',
    entry.summary,
    ...(entry.keyPoints.length > 0
      ? [
          '',
          '--- শিক্ষণ কৌশল ও মূল বিষয়সমূহ ---',
          ...entry.keyPoints.map((pt, i) => `${toBengaliDigits(i + 1)}. ${pt}`)
        ]
      : []),
    ...(entry.actionChecklist.length > 0
      ? [
          '',
          '--- শ্রেণিকক্ষ প্রস্তুতি চেকলিস্ট ---',
          ...entry.actionChecklist.map((item) => `[ ] ${item}`)
        ]
      : []),
    ...(hasRawAttachment
      ? [
          '',
          `--- সংযুক্ত ডকুমেন্ট (${entry.attachmentName || 'attachment.txt'}) ---`,
          entry.attachmentContent || ''
        ]
      : []),
    '',
    '====================================================================',
    '© ২০২৬ TPACK Academy'
  ];

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${entry.id}-material.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function downloadRawAttachment(entry: UnifiedMaterialEntry): void {
  if (!entry.attachmentContent) return;
  const blob = new Blob([entry.attachmentContent], {
    type: entry.attachmentMimeType || 'text/plain;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = entry.attachmentName || `${entry.id}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export const MaterialsLibraryView: React.FC<MaterialsLibraryViewProps> = ({
  courses,
  uploadedMaterials = [],
  readMaterialIds,
  onMarkMaterialRead,
  onOpenLessonInClassroom
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    courses[0]?.lessons[0]?.material.id ?? uploadedMaterials[0]?.id ?? ''
  );

  const allMaterials: UnifiedMaterialEntry[] = useMemo(() => {
    const lessonEntries: UnifiedMaterialEntry[] = courses.flatMap((course) =>
      course.lessons.map((lesson) => ({
        kind: 'lesson' as const,
        id: lesson.material.id,
        courseId: course.id,
        courseTitle: course.title,
        lessonId: lesson.id,
        lessonNumber: lesson.number,
        category: course.category,
        categoryLabel: course.categoryLabel,
        title: lesson.material.title,
        formatLabel: lesson.material.formatLabel,
        readTime: lesson.material.readTime,
        summary: lesson.material.summary,
        keyPoints: lesson.material.keyPoints,
        classroomActivity: lesson.material.classroomActivity,
        actionChecklist: lesson.material.actionChecklist,
        formulaOrMetric: lesson.material.formulaOrMetric,
        lessonRef: lesson
      }))
    );

    const standaloneEntries: UnifiedMaterialEntry[] = uploadedMaterials.map(
      (mat) => ({
        kind: 'uploaded' as const,
        id: mat.id,
        courseId: mat.courseId,
        courseTitle: mat.courseTitle,
        lessonNumber: 'সংযুক্ত উপকরণ',
        category: mat.category,
        categoryLabel: mat.categoryLabel,
        title: mat.title,
        formatLabel: mat.formatLabel,
        readTime: mat.readTime,
        summary: mat.summary,
        keyPoints: mat.keyPoints,
        classroomActivity: mat.classroomActivity,
        actionChecklist: mat.actionChecklist,
        attachmentName: mat.attachmentName,
        attachmentContent: mat.attachmentContent,
        attachmentMimeType: mat.attachmentMimeType
      })
    );

    return [...standaloneEntries, ...lessonEntries];
  }, [courses, uploadedMaterials]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMaterials.filter((entry) => {
      const matchesCat =
        categoryFilter === 'all' || entry.category === categoryFilter;
      const matchesSearch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.courseTitle.toLowerCase().includes(q) ||
        (entry.attachmentName?.toLowerCase().includes(q) ?? false);
      return matchesCat && matchesSearch;
    });
  }, [allMaterials, categoryFilter, searchQuery]);

  const activeEntry =
    filteredMaterials.find((entry) => entry.id === selectedMaterialId) ??
    filteredMaterials[0] ??
    allMaterials[0];

  const readCount = allMaterials.filter((e) =>
    readMaterialIds.includes(e.id)
  ).length;

  const targetCourseForActive = activeEntry
    ? courses.find((c) => c.id === activeEntry.courseId)
    : undefined;
  const targetLessonId =
    activeEntry?.lessonId ?? targetCourseForActive?.lessons[0]?.id;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/75">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl font-bold text-[#132219] tracking-tight">
            শিক্ষক প্রশিক্ষণ উপকরণ ও লেসন প্ল্যান লাইব্রেরি
          </h1>
          <p className="text-sm sm:text-base text-[#3F5247]">
            শ্রেণিকক্ষে পাঠদানের জন্য TPACK গাইড, 5E লেসন প্ল্যান, মূল্যায়ন রুব্রিক ও অ্যাকশন রিসার্চ ওয়ার্কশিট পড়ুন এবং হ্যান্ডআউট ডাউনলোড করুন।
          </p>
        </div>

        <div className="glass-well rounded-xl px-4 py-2 text-sm font-mono tabular-nums text-[#15803D] font-semibold shrink-0">
          পঠিত উপকরণ: {toBengaliDigits(readCount)} / {toBengaliDigits(allMaterials.length)}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1.5 glass-well rounded-xl w-fit">
          {(
            [
              { id: 'all', label: 'সকল মডিউল' },
              { id: 'tpack-tech', label: 'টিপ্যাক ও প্রযুক্তি' },
              { id: 'pedagogy-eval', label: 'পেডাগজি ও মূল্যায়ন' },
              { id: 'research-leadership', label: 'গবেষণা ও নেতৃত্ব' }
            ] as { id: CourseCategory; label: string }[]
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

        <div className="relative w-full md:w-72">
          <Search
            className="w-4 h-4 text-[#3F5247] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="লেসন প্ল্যান বা রুব্রিক খুঁজুন..."
            aria-label="প্রশিক্ষণ উপকরণ খুঁজুন"
            className="w-full pl-10 pr-4 py-2.5 text-sm glass-input rounded-xl text-[#132219] placeholder:text-[#5B7063] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
          />
        </div>
      </div>

      {/* Empty State vs Populated Split View */}
      {filteredMaterials.length === 0 || !activeEntry ? (
        <div className="glass-surface rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl glass-3d-icon-well flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-[#15803D]" />
          </div>
          <h2 className="text-lg font-semibold text-[#132219]">
            কোনো প্রশিক্ষণ উপকরণ পাওয়া যায়নি
          </h2>
          <p className="text-sm text-[#3F5247]">
            অনুগ্রহ করে অন্য কিওয়ার্ড দিয়ে খুঁজুন অথবা সব ফিল্টার রিসেট করুন।
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 px-5 py-2.5 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
          >
            সব উপকরণ দেখান
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Material Index List */}
          <div className="lg:col-span-5 glass-surface rounded-2xl divide-y divide-white/75 overflow-hidden">
            {filteredMaterials.map((entry) => {
              const isSelected = activeEntry.id === entry.id;
              const isRead = readMaterialIds.includes(entry.id);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedMaterialId(entry.id)}
                  className={`w-full text-left p-4 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#ECF2ED]/85 shadow-inner'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs text-[#3F5247] flex items-center gap-1.5 truncate">
                      <span>{entry.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.formatLabel}</span>
                      {entry.kind === 'uploaded' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#15803D] font-medium">
                            আপলোডকৃত
                          </span>
                        </>
                      )}
                    </div>
                    <div
                      className={`text-sm leading-snug ${
                        isSelected
                          ? 'font-bold text-[#132219]'
                          : 'font-semibold text-[#2C3E33]'
                      }`}
                    >
                      {entry.title}
                    </div>
                  </div>
                  {isRead && (
                    <CheckCircle2
                      className="w-4 h-4 text-[#15803D] shrink-0 mt-1"
                      aria-label="পঠিত"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Material Reader Pane */}
          <div className="lg:col-span-7 glass-surface rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2 pb-5 border-b border-white/75">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#3F5247]">
                <span>{activeEntry.courseTitle}</span>
                {activeEntry.lessonNumber && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{activeEntry.lessonNumber}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>{activeEntry.readTime}</span>
              </div>
              <h2 className="text-2xl font-bold text-[#132219]">
                {activeEntry.title}
              </h2>
            </div>

            <p className="text-[15px] leading-relaxed text-[#2C3E33]">
              {activeEntry.summary}
            </p>

            {/* Classroom Activity Box */}
            <div className="p-4 rounded-xl glass-well grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-[#3F5247]">উপযোগী শ্রেণি</div>
                <div className="text-xs font-semibold text-[#132219] mt-0.5">
                  {activeEntry.classroomActivity.gradeLevel}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#3F5247]">পিরিয়ড সময়</div>
                <div className="text-xs font-semibold text-[#132219] mt-0.5">
                  {activeEntry.classroomActivity.duration}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#3F5247]">মূল শিখনফল</div>
                <div className="text-xs font-medium text-[#132219] mt-0.5">
                  {activeEntry.classroomActivity.objective}
                </div>
              </div>
            </div>

            {activeEntry.keyPoints.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#132219]">
                  শিক্ষণ কৌশল ও মূল সারসংক্ষেপ
                </h3>
                <ul className="space-y-2.5">
                  {activeEntry.keyPoints.map((pt, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm leading-relaxed text-[#2C3E33]"
                    >
                      <span className="font-mono tabular-nums text-xs font-semibold text-[#15803D] mt-0.5">
                        ০{toBengaliDigits(idx + 1)}.
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeEntry.formulaOrMetric && (
              <div className="p-4 rounded-xl glass-well space-y-1">
                <div className="text-xs font-semibold text-[#15803D]">
                  {activeEntry.formulaOrMetric.label}
                </div>
                <div className="font-mono text-sm font-semibold text-[#132219]">
                  {activeEntry.formulaOrMetric.expression}
                </div>
                <div className="text-xs text-[#3F5247]">
                  {activeEntry.formulaOrMetric.note}
                </div>
              </div>
            )}

            {activeEntry.actionChecklist.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#132219]">
                  শ্রেণিকক্ষ প্রস্তুতি চেকলিস্ট
                </h3>
                <ul className="space-y-1.5 text-sm text-[#2C3E33]">
                  {activeEntry.actionChecklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-[#15803D] font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeEntry.attachmentContent && (
              <div className="rounded-xl glass-well p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#132219]">
                    <FileText className="w-4 h-4 text-[#15803D]" />
                    <span>
                      সংযুক্ত নথি: {activeEntry.attachmentName || 'handout.txt'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      downloadRawAttachment(activeEntry);
                      onMarkMaterialRead(activeEntry.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>মূল ফাইল ডাউনলোড</span>
                  </button>
                </div>
                <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-[#2C3E33] glass-input rounded-xl p-3 font-sans">
                  {activeEntry.attachmentContent}
                </pre>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-5 border-t border-white/75 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (activeEntry.lessonRef) {
                      downloadMaterialHandout(
                        activeEntry.courseTitle,
                        activeEntry.lessonRef
                      );
                    } else {
                      downloadUploadedMaterialFile(activeEntry);
                    }
                    onMarkMaterialRead(activeEntry.id);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>হ্যান্ডআউট ডাউনলোড (.TXT)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMarkMaterialRead(activeEntry.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                  <span>
                    {readMaterialIds.includes(activeEntry.id)
                      ? 'পঠিত হিসেবে সংরক্ষিত'
                      : 'পঠিত চিহ্নিত করুন'}
                  </span>
                </button>
              </div>

              {targetCourseForActive && targetLessonId && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenLessonInClassroom(
                      targetCourseForActive.id,
                      targetLessonId
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D] hover:underline cursor-pointer"
                >
                  <span>
                    {activeEntry.kind === 'lesson'
                      ? 'ভিডিও লেসনে যান'
                      : 'কোর্সে প্রবেশ করুন'}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
