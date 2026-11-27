import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileJson,
  GripVertical,
  ImagePlus,
  Layers,
  ListOrdered,
  Loader2,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react';
import {
  AssignmentArtifactType,
  Course,
  CourseCategory,
  CoursePathwayConfig,
  CustomCourseRecord,
  Lesson,
  QuizQuestion
} from '../types/lms';
import { toBengaliDigits } from '../utils/lmsHelpers';
import {
  buildAssignmentTemplate,
  buildInteractiveActivities,
  buildPreAssessmentQuestions
} from '../utils/pathwayHelpers';
import tpackImg from '../assets/images/bd_tpack_teacher_1794726527783.jpg';
import pedagogyImg from '../assets/images/bd_pedagogy_teacher_1794726528448.jpg';
import researchImg from '../assets/images/bd_research_teachers_1794726528020.jpg';

interface ModuleManageEditorTabProps {
  allManagedCourses: Course[];
  builtInIds: Set<string>;
  overrideIds: Set<string>;
  hiddenCourseIds: string[];
  isCloudAdmin: boolean;
  onSaveModule: (course: CustomCourseRecord, isBuiltIn: boolean) => Promise<void>;
  onRevertBuiltInOverride: (courseId: string) => Promise<void>;
  onDeleteCustomCourse: (courseId: string) => Promise<void>;
  onReorderModules: (orderedIds: string[]) => Promise<void>;
  onToggleModuleVisibility: (courseId: string) => Promise<void>;
  onBatchRenumberModules: () => Promise<void>;
  onResetLayoutToDefault: () => Promise<void>;
  onOpenCourseInClassroom: (courseId: string) => void;
}

type EditorSection = 'basic' | 'lessons' | 'pathway' | 'quiz';
type VisibilityFilter = 'all' | 'visible' | 'hidden';

const CATEGORY_OPTIONS: {
  id: Exclude<CourseCategory, 'all'>;
  label: string;
  presetImage: string;
  theme: Lesson['visualTheme'];
}[] = [
  {
    id: 'tpack-tech',
    label: 'টিপ্যাক ও প্রযুক্তি',
    presetImage: tpackImg,
    theme: 'tpack-venn'
  },
  {
    id: 'pedagogy-eval',
    label: 'পেডাগজি ও মূল্যায়ন',
    presetImage: pedagogyImg,
    theme: 'pedagogy-5e'
  },
  {
    id: 'research-leadership',
    label: 'গবেষণা ও নেতৃত্ব',
    presetImage: researchImg,
    theme: 'action-research'
  }
];

const VISUAL_THEME_OPTIONS: { id: Lesson['visualTheme']; label: string }[] = [
  { id: 'tpack-venn', label: 'TPACK ভেন ডায়াগ্রাম' },
  { id: 'digital-media', label: 'ডিজিটাল মিডিয়া ও এডটেক' },
  { id: 'pedagogy-5e', label: '৫ই ও আধুনিক পেডাগজি' },
  { id: 'assessment-rubric', label: 'মূল্যায়ন ও রুব্রিক' },
  { id: 'classroom-collab', label: 'শ্রেণিকক্ষ সহযোগিতা ও SEL' },
  { id: 'action-research', label: 'গবেষণা ও নেতৃত্ব' }
];

function createEmptyLesson(index: number, prefix: string): Lesson {
  const numStr = String(index + 1).padStart(2, '0');
  const lessonId = `${prefix}-l${index + 1}-${Date.now().toString(36).slice(-4)}`;
  return {
    id: lessonId,
    number: `মডিউল ${toBengaliDigits(numStr)}`,
    title: '',
    durationLabel: '০৩:০০',
    durationSec: 180,
    visualTheme: 'tpack-venn',
    chapters: [
      {
        timeSec: 0,
        title: 'মূল ধারণা ও শ্রেণিকক্ষ প্রাসঙ্গিকতা',
        caption: 'পাঠের মূল ধারণা ও শিক্ষার্থীদের সক্রিয় অংশগ্রহণের কৌশল।'
      }
    ],
    material: {
      id: `mat-${lessonId}`,
      title: '',
      formatLabel: 'লেসন প্ল্যান',
      readTime: '৫ মিনিট পাঠ',
      summary: '',
      keyPoints: ['মূল শিক্ষণ কৌশল ও শ্রেণিকক্ষ প্রয়োগ'],
      classroomActivity: {
        gradeLevel: '৬ষ্ঠ – ১০ম শ্রেণি',
        duration: '৪৫ মিনিট',
        objective: 'পাঠের মূল শিখনফল বাস্তবে প্রয়োগ করা।'
      },
      actionChecklist: ['পাঠ শুরুর আগে উপকরণ ও প্রশ্ন প্রস্তুত করুন']
    }
  };
}

function createEmptyQuizQuestion(index: number): QuizQuestion {
  return {
    id: `q-${Date.now().toString(36)}-${index}`,
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: ''
  };
}

function createNewModuleDraft(): CustomCourseRecord {
  const id = `course-${Date.now().toString(36)}`;
  return {
    id,
    title: '',
    subtitle: '',
    category: 'tpack-tech',
    categoryLabel: 'টিপ্যাক ও প্রযুক্তি',
    levelLabel: 'সকল স্তরের শিক্ষক',
    cpdHoursLabel: '৬ CPD ঘণ্টা',
    totalDurationLabel: '১টি মডিউল · ৬ CPD ঘণ্টা',
    instructor: 'প্রশিক্ষক প্যানেল',
    instructorRole: 'শিক্ষা প্রযুক্তি ও পেডাগজি পরামর্শক',
    imagePath: tpackImg,
    description: '',
    lessons: [createEmptyLesson(0, id)],
    quiz: [createEmptyQuizQuestion(0)],
    published: true,
    isCustom: true
  };
}

function toDraft(course: Course, isPublished: boolean, isCustom: boolean): CustomCourseRecord {
  const cloned = JSON.parse(JSON.stringify(course)) as CustomCourseRecord;
  cloned.published = isPublished;
  cloned.isCustom = isCustom;
  return cloned;
}

async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 640;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        if (compressed.length > 95000) {
          resolve(canvas.toDataURL('image/jpeg', 0.58));
        } else {
          resolve(compressed);
        }
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export const ModuleManageEditorTab: React.FC<ModuleManageEditorTabProps> = ({
  allManagedCourses,
  builtInIds,
  overrideIds,
  hiddenCourseIds,
  isCloudAdmin,
  onSaveModule,
  onRevertBuiltInOverride,
  onDeleteCustomCourse,
  onReorderModules,
  onToggleModuleVisibility,
  onBatchRenumberModules,
  onResetLayoutToDefault,
  onOpenCourseInClassroom
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>('all');
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all');

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    () => allManagedCourses[0]?.id ?? null
  );
  const [editorDraft, setEditorDraft] = useState<CustomCourseRecord>(() =>
    allManagedCourses[0]
      ? toDraft(
          allManagedCourses[0],
          !hiddenCourseIds.includes(allManagedCourses[0].id),
          !builtInIds.has(allManagedCourses[0].id)
        )
      : createNewModuleDraft()
  );
  const [isCreatingNew, setIsCreatingNew] = useState(
    allManagedCourses.length === 0
  );
  const [editorSection, setEditorSection] = useState<EditorSection>('basic');
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(
    () => editorDraft.lessons[0]?.id ?? null
  );

  // Drag & Drop state for Modules, Lessons, and Quiz Questions
  const [draggingCourseIdx, setDraggingCourseIdx] = useState<number | null>(
    null
  );
  const [draggingLessonIdx, setDraggingLessonIdx] = useState<number | null>(
    null
  );
  const [draggingQuizIdx, setDraggingQuizIdx] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [layoutBusy, setLayoutBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  const hiddenSet = useMemo(() => new Set(hiddenCourseIds), [hiddenCourseIds]);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allManagedCourses.filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) {
        return false;
      }
      const isHidden = hiddenSet.has(c.id);
      if (visibilityFilter === 'visible' && isHidden) return false;
      if (visibilityFilter === 'hidden' && !isHidden) return false;
      if (q) {
        return (
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.categoryLabel.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    allManagedCourses,
    categoryFilter,
    visibilityFilter,
    searchQuery,
    hiddenSet
  ]);

  const isFiltered =
    categoryFilter !== 'all' ||
    visibilityFilter !== 'all' ||
    searchQuery.trim().length > 0;

  useEffect(() => {
    if (isCreatingNew || !selectedCourseId) return;
    const found = allManagedCourses.find((c) => c.id === selectedCourseId);
    if (!found && allManagedCourses[0]) {
      setSelectedCourseId(allManagedCourses[0].id);
      const nextDraft = toDraft(
        allManagedCourses[0],
        !hiddenSet.has(allManagedCourses[0].id),
        !builtInIds.has(allManagedCourses[0].id)
      );
      setEditorDraft(nextDraft);
      setExpandedLessonId(nextDraft.lessons[0]?.id ?? null);
    }
  }, [allManagedCourses, selectedCourseId, isCreatingNew, builtInIds, hiddenSet]);

  const selectModuleForEdit = (course: Course) => {
    setIsCreatingNew(false);
    setSelectedCourseId(course.id);
    const nextDraft = toDraft(
      course,
      !hiddenSet.has(course.id),
      !builtInIds.has(course.id)
    );
    setEditorDraft(nextDraft);
    setExpandedLessonId(nextDraft.lessons[0]?.id ?? null);
    setFeedback(null);
  };

  const handleStartNewModule = () => {
    const fresh = createNewModuleDraft();
    setIsCreatingNew(true);
    setSelectedCourseId(null);
    setEditorDraft(fresh);
    setExpandedLessonId(fresh.lessons[0]?.id ?? null);
    setEditorSection('basic');
    setFeedback(null);
  };

  const handleCloneModule = (source: Course) => {
    const newId = `course-${Date.now().toString(36)}`;
    const cloned = toDraft(source, true, true);
    cloned.id = newId;
    cloned.title = `${source.title} (কপি)`;
    cloned.lessons = cloned.lessons.map((l, idx) => ({
      ...l,
      id: `${newId}-l${idx + 1}`,
      material: {
        ...l.material,
        id: `mat-${newId}-l${idx + 1}`
      }
    }));
    cloned.quiz = cloned.quiz.map((q, idx) => ({
      ...q,
      id: `q-${newId}-${idx + 1}`
    }));
    setIsCreatingNew(true);
    setSelectedCourseId(null);
    setEditorDraft(cloned);
    setExpandedLessonId(cloned.lessons[0]?.id ?? null);
    setEditorSection('basic');
    setFeedback({
      type: 'success',
      text: `“${source.title}” ক্লোন করা হয়েছে। সম্পাদনা করে “সংরক্ষণ ও প্রয়োগ করুন” বোতামে ক্লিক করুন।`
    });
  };

  // Module Reordering Handlers
  const moveCourseInOrder = async (courseId: string, delta: number) => {
    const orderedIds = allManagedCourses.map((c) => c.id);
    const idx = orderedIds.indexOf(courseId);
    if (idx === -1) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= orderedIds.length) return;
    const next = [...orderedIds];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    setLayoutBusy(true);
    try {
      await onReorderModules(next);
    } finally {
      setLayoutBusy(false);
    }
  };

  const moveCourseToPosition = async (courseId: string, targetPosition1Based: number) => {
    const orderedIds = allManagedCourses.map((c) => c.id);
    const currentIdx = orderedIds.indexOf(courseId);
    const boundedTarget = Math.max(
      0,
      Math.min(orderedIds.length - 1, targetPosition1Based - 1)
    );
    if (currentIdx === -1 || currentIdx === boundedTarget) return;
    const next = [...orderedIds];
    const [moved] = next.splice(currentIdx, 1);
    next.splice(boundedTarget, 0, moved);
    setLayoutBusy(true);
    try {
      await onReorderModules(next);
    } finally {
      setLayoutBusy(false);
    }
  };

  const handleDropCourse = async (dropFilteredIdx: number) => {
    if (draggingCourseIdx === null || isFiltered) {
      setDraggingCourseIdx(null);
      return;
    }
    if (draggingCourseIdx === dropFilteredIdx) {
      setDraggingCourseIdx(null);
      return;
    }
    const orderedIds = allManagedCourses.map((c) => c.id);
    const [moved] = orderedIds.splice(draggingCourseIdx, 1);
    orderedIds.splice(dropFilteredIdx, 0, moved);
    setDraggingCourseIdx(null);
    setLayoutBusy(true);
    try {
      await onReorderModules(orderedIds);
    } finally {
      setLayoutBusy(false);
    }
  };

  // Lesson Reordering inside Editor
  const moveLesson = (fromIdx: number, toIdx: number) => {
    if (
      toIdx < 0 ||
      toIdx >= editorDraft.lessons.length ||
      fromIdx === toIdx
    ) {
      return;
    }
    setEditorDraft((prev) => {
      const next = [...prev.lessons];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return { ...prev, lessons: next };
    });
  };

  // Quiz Reordering inside Editor
  const moveQuizQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= editorDraft.quiz.length || fromIdx === toIdx) {
      return;
    }
    setEditorDraft((prev) => {
      const next = [...prev.quiz];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return { ...prev, quiz: next };
    });
  };

  const handleCategoryChange = (cat: Exclude<CourseCategory, 'all'>) => {
    const found =
      CATEGORY_OPTIONS.find((o) => o.id === cat) ?? CATEGORY_OPTIONS[0];
    setEditorDraft((prev) => ({
      ...prev,
      category: cat,
      categoryLabel: found.label,
      imagePath: prev.imagePath.startsWith('data:')
        ? prev.imagePath
        : prev.imagePath || found.presetImage
    }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setEditorDraft((prev) => ({ ...prev, imagePath: dataUrl }));
      setFeedback({
        type: 'success',
        text: `কভার ছবি “${file.name}” সংযুক্ত হয়েছে।`
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'ছবিটি পড়া যায়নি। অনুগ্রহ করে JPG, PNG বা WebP ছবি দিন।'
      });
    }
  };

  const handleExportModuleJson = () => {
    const blob = new Blob([JSON.stringify(editorDraft, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${editorDraft.id || 'tpack-module'}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImportModuleJson = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<CustomCourseRecord>;
      const cat =
        parsed.category === 'pedagogy-eval' ||
        parsed.category === 'research-leadership'
          ? parsed.category
          : 'tpack-tech';
      const catMeta =
        CATEGORY_OPTIONS.find((o) => o.id === cat) ?? CATEGORY_OPTIONS[0];
      const newId = `course-${Date.now().toString(36)}`;
      const lessons: Lesson[] =
        Array.isArray(parsed.lessons) && parsed.lessons.length > 0
          ? parsed.lessons.slice(0, 25).map((l, idx) => {
              const fb = createEmptyLesson(idx, newId);
              return {
                ...fb,
                ...l,
                id: `${newId}-l${idx + 1}`,
                chapters:
                  Array.isArray(l.chapters) && l.chapters.length > 0
                    ? l.chapters
                    : fb.chapters,
                material: {
                  ...fb.material,
                  ...(l.material ?? {}),
                  id: `mat-${newId}-l${idx + 1}`
                }
              };
            })
          : [createEmptyLesson(0, newId)];
      const quiz: QuizQuestion[] =
        Array.isArray(parsed.quiz) && parsed.quiz.length > 0
          ? parsed.quiz.slice(0, 30).map((q, idx) => ({
              id: `q-${newId}-${idx + 1}`,
              question: q.question || `প্রশ্ন ${toBengaliDigits(idx + 1)}`,
              options:
                Array.isArray(q.options) && q.options.length >= 2
                  ? q.options.slice(0, 4)
                  : ['বিকল্প ১', 'বিকল্প ২', 'বিকল্প ৩', 'বিকল্প ৪'],
              correctIndex:
                typeof q.correctIndex === 'number' ? q.correctIndex : 0,
              explanation: q.explanation || 'সঠিক উত্তরের ব্যাখ্যা।'
            }))
          : [createEmptyQuizQuestion(0)];

      setIsCreatingNew(true);
      setSelectedCourseId(null);
      setEditorDraft({
        id: newId,
        title: parsed.title || 'আমদানিকৃত মডিউল',
        subtitle: parsed.subtitle || '',
        category: cat,
        categoryLabel: parsed.categoryLabel || catMeta.label,
        levelLabel: parsed.levelLabel || 'সকল স্তরের শিক্ষক',
        cpdHoursLabel: parsed.cpdHoursLabel || '৬ CPD ঘণ্টা',
        totalDurationLabel:
          parsed.totalDurationLabel ||
          `${toBengaliDigits(lessons.length)}টি মডিউল · ${parsed.cpdHoursLabel || '৬ CPD ঘণ্টা'}`,
        instructor: parsed.instructor || 'প্রশিক্ষক প্যানেল',
        instructorRole: parsed.instructorRole || 'পেডাগজি ও এডটেক বিশেষজ্ঞ',
        imagePath:
          typeof parsed.imagePath === 'string' && parsed.imagePath
            ? parsed.imagePath
            : catMeta.presetImage,
        description:
          parsed.description || 'JSON থেকে আমদানিকৃত প্রশিক্ষণ মডিউল।',
        lessons,
        quiz,
        pathwayConfig: parsed.pathwayConfig,
        published: true,
        isCustom: true
      });
      setExpandedLessonId(lessons[0]?.id ?? null);
      setFeedback({
        type: 'success',
        text: `“${file.name}” সফলভাবে লোড হয়েছে। প্রয়োজনীয় সম্পাদনা শেষে সংরক্ষণ করুন।`
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'সঠিক JSON মডিউল ফাইল নির্বাচন করুন।'
      });
    }
  };

  // Populate Pathway Editor Defaults on demand
  const loadPathwaySmartDefaults = (
    target: 'pre' | 'interactive' | 'assignment'
  ) => {
    setEditorDraft((prev) => {
      const nextCfg: CoursePathwayConfig = { ...(prev.pathwayConfig ?? {}) };
      if (target === 'pre') {
        const autoPre = buildPreAssessmentQuestions({
          ...prev,
          pathwayConfig: undefined
        });
        nextCfg.preAssessmentQuestions = autoPre;
      } else if (target === 'interactive') {
        const autoInter = buildInteractiveActivities({
          ...prev,
          pathwayConfig: undefined
        });
        nextCfg.interactiveMicroQuiz = autoInter.microQuiz;
        nextCfg.interactiveDragSteps = [...autoInter.dragDropSteps]
          .sort((a, b) => a.correctOrder - b.correctOrder)
          .map((s) => s.label);
        nextCfg.interactiveScenario = autoInter.scenario;
      } else if (target === 'assignment') {
        const tpl = buildAssignmentTemplate(
          { ...prev, pathwayConfig: undefined },
          'lesson-plan'
        );
        nextCfg.assignmentDefaults = {
          defaultType: tpl.artifactType,
          title: tpl.title,
          gradeAndDuration: tpl.gradeAndDuration,
          learningObjective: tpl.learningObjective,
          activitiesAndMaterials: tpl.activitiesAndMaterials,
          assessmentMethod: tpl.assessmentMethod
        };
      }
      return { ...prev, pathwayConfig: nextCfg };
    });
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!editorDraft.title.trim() || !editorDraft.description.trim()) {
      setFeedback({
        type: 'error',
        text: 'মডিউলের শিরোনাম এবং সংক্ষিপ্ত বিবরণ অবশ্যই লিখতে হবে।'
      });
      setEditorSection('basic');
      return;
    }

    const validLessons = editorDraft.lessons
      .filter((l) => l.title.trim())
      .map((l, idx) => {
        const numLabel = `মডিউল ${toBengaliDigits(String(idx + 1).padStart(2, '0'))}`;
        const matTitle =
          l.material.title.trim() || `${l.title.trim()} — গাইড`;
        const matSummary =
          l.material.summary.trim() ||
          `${l.title.trim()} বিষয়ক সংক্ষিপ্ত পাঠ উপকরণ।`;
        return {
          ...l,
          number: l.number.trim() || numLabel,
          title: l.title.trim(),
          material: {
            ...l.material,
            title: matTitle,
            summary: matSummary
          }
        };
      });

    if (validLessons.length === 0) {
      setFeedback({
        type: 'error',
        text: 'অন্তত ১টি ভিডিও লেসনের শিরোনাম যুক্ত করুন।'
      });
      setEditorSection('lessons');
      return;
    }

    const validQuiz = editorDraft.quiz
      .filter((q) => q.question.trim() && q.options.some((o) => o.trim()))
      .map((q) => ({
        ...q,
        question: q.question.trim(),
        options: q.options.map(
          (o, i) => o.trim() || `বিকল্প ${toBengaliDigits(i + 1)}`
        ),
        explanation:
          q.explanation.trim() || 'মডিউলের পাঠ্যবস্তু অনুযায়ী সঠিক উত্তর।'
      }));

    const isBuiltIn = !isCreatingNew && builtInIds.has(editorDraft.id);
    const prepared: CustomCourseRecord = {
      ...editorDraft,
      title: editorDraft.title.trim(),
      subtitle:
        editorDraft.subtitle.trim() ||
        `${editorDraft.categoryLabel} বিষয়ক আধুনিক শিক্ষক প্রশিক্ষণ`,
      totalDurationLabel: `${toBengaliDigits(validLessons.length)}টি মডিউল · ${
        editorDraft.cpdHoursLabel.trim() || '৬ CPD ঘণ্টা'
      }`,
      lessons: validLessons,
      quiz:
        validQuiz.length > 0
          ? validQuiz
          : [
              {
                id: `q-auto-${Date.now()}`,
                question: `${editorDraft.title.trim()} মডিউলের মূল লক্ষ্য কোনটি?`,
                options: [
                  'শ্রেণিকক্ষে কার্যকর ও আধুনিক শিক্ষণ কৌশল প্রয়োগ করা',
                  'শুধু মুখস্থনির্ভর পাঠদান চালিয়ে যাওয়া',
                  'শিক্ষার্থীদের অংশগ্রহণ কমানো',
                  'মূল্যায়ন ছাড়া পাঠ শেষ করা'
                ],
                correctIndex: 0,
                explanation:
                  'প্রতিটি মডিউলের মূল লক্ষ্য শ্রেণিকক্ষের বাস্তব মানোন্নয়ন।'
              }
            ],
      isCustom: !isBuiltIn
    };

    setSaving(true);
    try {
      await onSaveModule(prepared, isBuiltIn);
      setIsCreatingNew(false);
      setSelectedCourseId(prepared.id);
      setEditorDraft(prepared);
      setFeedback({
        type: 'success',
        text: isCloudAdmin
          ? 'মডিউলের পরিবর্তন সফলভাবে সংরক্ষিত ও Firestore ক্লাউডে সিঙ্ক হয়েছে।'
          : 'মডিউলের পরিবর্তন সংরক্ষিত হয়েছে ও লাইভ ক্যাটালগে কার্যকর হয়েছে।'
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'মডিউল সংরক্ষণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      });
    } finally {
      setSaving(false);
    }
  };

  const editingIsBuiltIn = !isCreatingNew && builtInIds.has(editorDraft.id);
  const editingHasOverride =
    editingIsBuiltIn && overrideIds.has(editorDraft.id);

  return (
    <div className="space-y-6">
      {/* Top Arrangement Toolbar */}
      <div className="glass-surface rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#15803D] inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>মডিউল ম্যানেজ ও ক্রম বিন্যাস স্টুডিও</span>
          </div>
          <p className="text-xs text-[#3F5247]">
            বামদিকের যেকোনো মডিউল ড্র্যাগ করে বা তীর বোতামে ক্রম পরিবর্তন করুন এবং ডানদিকের এডিটরে শিরোনাম, ৫-ধাপ পাথওয়ে, ভিডিও লেসন ও কুইজ ইচ্ছেমতো সাজান।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={layoutBusy}
            onClick={() => void onBatchRenumberModules()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer disabled:opacity-50"
          >
            <ListOrdered className="w-3.5 h-3.5 text-[#15803D]" />
            <span>বর্তমান ক্রমে নম্বর (০১–{toBengaliDigits(allManagedCourses.length)}) সাজান</span>
          </button>

          <button
            type="button"
            disabled={layoutBusy}
            onClick={() => void onResetLayoutToDefault()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#3F5247] hover:text-[#132219] btn-3d-glass rounded-xl cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ক্রম রিসেট</span>
          </button>

          <button
            type="button"
            onClick={handleStartNewModule}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন মডিউল</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT PANE: Reorderable Module List (All 33+ Modules) */}
        <div className="lg:col-span-5 glass-surface rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#132219]">
              সকল প্রশিক্ষণ মডিউল ({toBengaliDigits(filteredModules.length)}/
              {toBengaliDigits(allManagedCourses.length)})
            </h2>
            <span className="text-[11px] font-mono tabular-nums text-[#3F5247]">
              {toBengaliDigits(hiddenCourseIds.length)}টি লুকানো
            </span>
          </div>

          {/* Search & Filters */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#3F5247] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="মডিউলের নাম বা প্রশিক্ষক খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'সব' },
                  { id: 'tpack-tech', label: 'টিপ্যাক' },
                  { id: 'pedagogy-eval', label: 'পেডাগজি' },
                  { id: 'research-leadership', label: 'গবেষণা' }
                ] as { id: CourseCategory; label: string }[]
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-white/95 text-[#132219] font-semibold shadow-xs border border-white'
                      : 'glass-well text-[#3F5247] hover:text-[#132219]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              <span className="w-px h-4 bg-[#132219]/10 mx-0.5" />

              {(
                [
                  { id: 'all', label: 'সকল অবস্থা' },
                  { id: 'visible', label: 'প্রকাশিত' },
                  { id: 'hidden', label: 'লুকানো' }
                ] as { id: VisibilityFilter; label: string }[]
              ).map((vis) => (
                <button
                  key={vis.id}
                  type="button"
                  onClick={() => setVisibilityFilter(vis.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                    visibilityFilter === vis.id
                      ? 'bg-[#DCFCE7]/90 text-[#14532D] font-semibold border border-[#15803D]/30'
                      : 'glass-well text-[#3F5247] hover:text-[#132219]'
                  }`}
                >
                  {vis.label}
                </button>
              ))}
            </div>

            {isFiltered && (
              <div className="text-[11px] text-[#3F5247]">
                ড্র্যাগ-অ্যান্ড-ড্রপ করতে ফিল্টার “সব” রাখুন অথবা ↑ / ↓ বোতাম ব্যবহার করুন।
              </div>
            )}
          </div>

          {/* Sortable List */}
          <div className="max-h-[760px] overflow-y-auto pr-1 space-y-2.5">
            {filteredModules.length === 0 ? (
              <div className="py-8 px-4 text-center glass-well rounded-xl space-y-2">
                <p className="text-xs font-semibold text-[#132219]">
                  এই ফিল্টারে কোনো মডিউল নেই
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setVisibilityFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold btn-3d-emerald rounded-lg cursor-pointer"
                >
                  ফিল্টার মুছুন
                </button>
              </div>
            ) : (
              filteredModules.map((course, filteredIdx) => {
                const globalIndex = allManagedCourses.findIndex(
                  (c) => c.id === course.id
                );
                const isSelected =
                  !isCreatingNew && selectedCourseId === course.id;
                const isBuiltIn = builtInIds.has(course.id);
                const isOverridden = overrideIds.has(course.id);
                const isHidden = hiddenSet.has(course.id);

                return (
                  <div
                    key={course.id}
                    draggable={!isFiltered}
                    onDragStart={() => setDraggingCourseIdx(filteredIdx)}
                    onDragOver={(e) => {
                      if (!isFiltered) e.preventDefault();
                    }}
                    onDrop={() => void handleDropCourse(filteredIdx)}
                    className={`rounded-xl p-3.5 transition-all space-y-2.5 ${
                      isSelected
                        ? 'bg-white/95 ring-2 ring-[#15803D] shadow-sm'
                        : isHidden
                          ? 'glass-well opacity-75'
                          : 'glass-card-3d'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {!isFiltered && (
                        <div
                          className="mt-1 text-[#3F5247] cursor-grab active:cursor-grabbing shrink-0"
                          title="টেনে অবস্থান পরিবর্তন করুন"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}

                      <div className="w-7 h-7 rounded-lg bg-[#15803D]/12 text-[#15803D] font-mono tabular-nums text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {toBengaliDigits(
                          String(globalIndex + 1).padStart(2, '0')
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#3F5247]">
                          <span className="font-semibold text-[#15803D]">
                            {course.categoryLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {!isBuiltIn
                              ? 'কাস্টম'
                              : isOverridden
                                ? 'সম্পাদিত'
                                : 'মূল'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              isHidden
                                ? 'text-[#B45309] font-semibold'
                                : 'text-[#15803D] font-medium'
                            }
                          >
                            {isHidden ? 'লুকানো' : 'প্রকাশিত'}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-[#132219] leading-snug line-clamp-2">
                          {course.title}
                        </div>

                        <div className="text-[11px] font-mono tabular-nums text-[#5B7063]">
                          {toBengaliDigits(course.lessons.length)} লেসন ·{' '}
                          {toBengaliDigits(course.quiz.length)} কুইজ প্রশ্ন
                        </div>
                      </div>

                      {/* Up / Down Position Controls */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={globalIndex <= 0 || layoutBusy}
                          onClick={() => void moveCourseInOrder(course.id, -1)}
                          aria-label="উপরে সরান"
                          title="১ ধাপ উপরে সরান"
                          className="w-7 h-7 rounded-lg btn-3d-glass flex items-center justify-center text-[#132219] disabled:opacity-35 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={
                            globalIndex >= allManagedCourses.length - 1 ||
                            layoutBusy
                          }
                          onClick={() => void moveCourseInOrder(course.id, 1)}
                          aria-label="নিচে সরান"
                          title="১ ধাপ নিচে সরান"
                          className="w-7 h-7 rounded-lg btn-3d-glass flex items-center justify-center text-[#132219] disabled:opacity-35 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Module Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#132219]/8">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => selectModuleForEdit(course)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#15803D]" />
                          <span>সম্পাদনা</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCloneModule(course)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#3F5247] btn-3d-glass rounded-lg cursor-pointer"
                          title="এই মডিউল কপি করে নতুন তৈরি করুন"
                        >
                          <Copy className="w-3 h-3" />
                          <span>ক্লোন</span>
                        </button>

                        <button
                          type="button"
                          disabled={layoutBusy}
                          onClick={() =>
                            void onToggleModuleVisibility(course.id)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#3F5247] btn-3d-glass rounded-lg cursor-pointer"
                        >
                          {isHidden ? (
                            <>
                              <Eye className="w-3 h-3 text-[#15803D]" />
                              <span>প্রকাশ</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>লুকান</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenCourseInClassroom(course.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#15803D] hover:underline cursor-pointer"
                        >
                          <PlayCircle className="w-3 h-3" />
                          <span>দেখুন</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {globalIndex > 0 && (
                          <button
                            type="button"
                            disabled={layoutBusy}
                            onClick={() =>
                              void moveCourseToPosition(course.id, 1)
                            }
                            className="text-[11px] text-[#3F5247] hover:text-[#15803D] px-1.5 py-0.5 cursor-pointer"
                            title="সবার প্রথমে নিন"
                          >
                            শীর্ষে
                          </button>
                        )}

                        {isBuiltIn && isOverridden && (
                          <button
                            type="button"
                            onClick={() =>
                              void onRevertBuiltInOverride(course.id)
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-[#B45309] hover:underline cursor-pointer"
                            title="মূল ডিফল্ট অবস্থায় ফিরিয়ে আনুন"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>রিসেট</span>
                          </button>
                        )}

                        {!isBuiltIn &&
                          (confirmDeleteId === course.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  void onDeleteCustomCourse(course.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-0.5 text-[11px] font-semibold bg-[#DC2626] text-white rounded cursor-pointer"
                              >
                                নিশ্চিত
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[11px] text-[#3F5247] cursor-pointer"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(course.id)}
                              className="inline-flex items-center gap-0.5 text-[11px] text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>মুছুন</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Full Visual Module & 5-Step Pathway Editor */}
        <form
          onSubmit={handleSaveEditor}
          className="lg:col-span-7 glass-surface rounded-2xl p-6 sm:p-7 space-y-6"
        >
          {/* Editor Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/75">
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-semibold text-[#15803D]">
                {isCreatingNew
                  ? 'নতুন প্রশিক্ষণ মডিউল তৈরি'
                  : editingIsBuiltIn
                    ? editingHasOverride
                      ? 'মূল মডিউল সম্পাদনা (কাস্টম সংস্করণ সক্রিয়)'
                      : 'মূল মডিউল সম্পাদনা ও কাস্টমাইজেশন'
                    : 'কাস্টম মডিউল সম্পাদনা'}
              </div>
              <h2 className="text-lg font-bold text-[#132219] truncate">
                {editorDraft.title || 'নতুন মডিউল শিরোনাম'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportModuleJson}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jsonInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#15803D]" />
                <span>JSON ইমপোর্ট</span>
              </button>
              <button
                type="button"
                onClick={handleExportModuleJson}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#3F5247] hover:text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>এক্সপোর্ট</span>
              </button>
            </div>
          </div>

          {/* 4 Editor Section Switcher */}
          <div
            className="flex flex-wrap items-center gap-1.5 p-1.5 glass-well rounded-xl"
            role="tablist"
            aria-label="মডিউল এডিটর সেকশন"
          >
            {(
              [
                { id: 'basic', label: '১. মূল তথ্য ও কভার' },
                {
                  id: 'lessons',
                  label: `২. ভিডিও লেসন (${toBengaliDigits(editorDraft.lessons.length)})`
                },
                { id: 'pathway', label: '৩. ৫-ধাপ পাথওয়ে' },
                {
                  id: 'quiz',
                  label: `৪. মূল্যায়ন কুইজ (${toBengaliDigits(editorDraft.quiz.length)})`
                }
              ] as { id: EditorSection; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={editorSection === tab.id}
                onClick={() => setEditorSection(tab.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  editorSection === tab.id
                    ? 'bg-white/95 text-[#132219] font-semibold shadow-sm border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SECTION 1: BASIC INFO & COVER */}
          {editorSection === 'basic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-[#3F5247]">
                    মডিউলের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={editorDraft.title}
                    onChange={(e) =>
                      setEditorDraft((prev) => ({
                        ...prev,
                        title: e.target.value
                      }))
                    }
                    placeholder="যেমন: ০১ · TPACK ফ্রেমওয়ার্ক ও ডিজিটাল শিক্ষণ"
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-[#3F5247]">
                    উপ-শিরোনাম
                  </label>
                  <input
                    type="text"
                    value={editorDraft.subtitle}
                    onChange={(e) =>
                      setEditorDraft((prev) => ({
                        ...prev,
                        subtitle: e.target.value
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#3F5247]">
                    বিভাগ (Category)
                  </label>
                  <select
                    value={editorDraft.category}
                    onChange={(e) =>
                      handleCategoryChange(
                        e.target.value as Exclude<CourseCategory, 'all'>
                      )
                    }
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#3F5247]">
                    CPD ঘণ্টা ও লক্ষ্য স্তর
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editorDraft.cpdHoursLabel}
                      onChange={(e) =>
                        setEditorDraft((prev) => ({
                          ...prev,
                          cpdHoursLabel: e.target.value
                        }))
                      }
                      placeholder="৬ CPD ঘণ্টা"
                      className="w-full px-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                    />
                    <input
                      type="text"
                      value={editorDraft.levelLabel}
                      onChange={(e) =>
                        setEditorDraft((prev) => ({
                          ...prev,
                          levelLabel: e.target.value
                        }))
                      }
                      placeholder="সকল শিক্ষক"
                      className="w-full px-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#3F5247]">
                    প্রশিক্ষকের নাম
                  </label>
                  <input
                    type="text"
                    value={editorDraft.instructor}
                    onChange={(e) =>
                      setEditorDraft((prev) => ({
                        ...prev,
                        instructor: e.target.value
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#3F5247]">
                    প্রশিক্ষকের পদবি
                  </label>
                  <input
                    type="text"
                    value={editorDraft.instructorRole}
                    onChange={(e) =>
                      setEditorDraft((prev) => ({
                        ...prev,
                        instructorRole: e.target.value
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-[#3F5247]">
                    মডিউলের সংক্ষিপ্ত বিবরণ *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editorDraft.description}
                    onChange={(e) =>
                      setEditorDraft((prev) => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="pt-4 border-t border-white/75 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-36 aspect-[4/3] rounded-xl overflow-hidden border border-white/80 glass-well shrink-0">
                  <img
                    src={editorDraft.imagePath || tpackImg}
                    alt="মডিউল কভার প্রিভিউ"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover block"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="text-xs font-semibold text-[#132219]">
                    কভার ছবি পরিবর্তন
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>নতুন ছবি আপলোড</span>
                    </button>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setEditorDraft((prev) => ({
                            ...prev,
                            imagePath: opt.presetImage
                          }))
                        }
                        className="px-2.5 py-1.5 text-[11px] font-medium text-[#3F5247] hover:text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: LESSONS ORGANIZER & EDITOR */}
          {editorSection === 'lessons' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#3F5247]">
                  ধাপ ০২ (১–৫ মি. Micro Learning): লেসনগুলো ড্র্যাগ বা ↑/↓ বোতামে সাজান এবং ভিডিও চ্যাপ্টার ও হ্যান্ডআউট সম্পাদনা করুন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newLesson = createEmptyLesson(
                      editorDraft.lessons.length,
                      editorDraft.id
                    );
                    setEditorDraft((prev) => ({
                      ...prev,
                      lessons: [...prev.lessons, newLesson]
                    }));
                    setExpandedLessonId(newLesson.id);
                  }}
                  disabled={editorDraft.lessons.length >= 25}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>লেসন যুক্ত করুন</span>
                </button>
              </div>

              <div className="space-y-3">
                {editorDraft.lessons.map((lesson, idx) => {
                  const isOpen = expandedLessonId === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      draggable
                      onDragStart={() => setDraggingLessonIdx(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggingLessonIdx !== null) {
                          moveLesson(draggingLessonIdx, idx);
                        }
                        setDraggingLessonIdx(null);
                      }}
                      className="rounded-xl glass-well p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="w-4 h-4 text-[#3F5247] cursor-grab shrink-0" />
                          <span className="text-xs font-mono font-bold text-[#15803D] shrink-0">
                            লেসন ০{toBengaliDigits(idx + 1)}
                          </span>
                          <span className="text-sm font-bold text-[#132219] truncate">
                            {lesson.title || '(শিরোনামহীন)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveLesson(idx, idx - 1)}
                            aria-label="লেসন উপরে নিন"
                            className="w-7 h-7 rounded-lg btn-3d-glass flex items-center justify-center disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === editorDraft.lessons.length - 1}
                            onClick={() => moveLesson(idx, idx + 1)}
                            aria-label="লেসন নিচে নিন"
                            className="w-7 h-7 rounded-lg btn-3d-glass flex items-center justify-center disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedLessonId(isOpen ? null : lesson.id)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
                          >
                            {isOpen ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>সংকুচিত</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                <span>বিস্তারিত</span>
                              </>
                            )}
                          </button>
                          {editorDraft.lessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditorDraft((prev) => ({
                                  ...prev,
                                  lessons: prev.lessons.filter(
                                    (item) => item.id !== lesson.id
                                  )
                                }))
                              }
                              className="p-1.5 text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                              aria-label="লেসন মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="space-y-3 pt-3 border-t border-white/75">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={lesson.number}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorDraft((prev) => ({
                                  ...prev,
                                  lessons: prev.lessons.map((item) =>
                                    item.id === lesson.id
                                      ? { ...item, number: val }
                                      : item
                                  )
                                }));
                              }}
                              placeholder="মডিউল ০১"
                              className="px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                            />
                            <input
                              type="text"
                              value={lesson.durationLabel}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorDraft((prev) => ({
                                  ...prev,
                                  lessons: prev.lessons.map((item) =>
                                    item.id === lesson.id
                                      ? { ...item, durationLabel: val }
                                      : item
                                  )
                                }));
                              }}
                              placeholder="সময় (যেমন ০৩:০০)"
                              className="px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                            />
                            <select
                              value={lesson.visualTheme}
                              onChange={(e) => {
                                const val = e.target
                                  .value as Lesson['visualTheme'];
                                setEditorDraft((prev) => ({
                                  ...prev,
                                  lessons: prev.lessons.map((item) =>
                                    item.id === lesson.id
                                      ? { ...item, visualTheme: val }
                                      : item
                                  )
                                }));
                              }}
                              className="px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                            >
                              {VISUAL_THEME_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorDraft((prev) => ({
                                ...prev,
                                lessons: prev.lessons.map((item) =>
                                  item.id === lesson.id
                                    ? { ...item, title: val }
                                    : item
                                )
                              }));
                            }}
                            placeholder="লেসনের শিরোনাম *"
                            className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={lesson.material.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorDraft((prev) => ({
                                  ...prev,
                                  lessons: prev.lessons.map((item) =>
                                    item.id === lesson.id
                                      ? {
                                          ...item,
                                          material: {
                                            ...item.material,
                                            title: val
                                          }
                                        }
                                      : item
                                  )
                                }));
                              }}
                              placeholder="হ্যান্ডআউট/উপকরণের শিরোনাম"
                              className="px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                            />
                            <input
                              type="text"
                              value={lesson.material.classroomActivity.objective}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorDraft((prev) => ({
                                  ...prev,
                                  lessons: prev.lessons.map((item) =>
                                    item.id === lesson.id
                                      ? {
                                          ...item,
                                          material: {
                                            ...item.material,
                                            classroomActivity: {
                                              ...item.material
                                                .classroomActivity,
                                              objective: val
                                            }
                                          }
                                        }
                                      : item
                                  )
                                }));
                              }}
                              placeholder="প্রত্যাশিত শিখনফল"
                              className="px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                            />
                          </div>

                          <textarea
                            rows={2}
                            value={lesson.material.summary}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorDraft((prev) => ({
                                ...prev,
                                lessons: prev.lessons.map((item) =>
                                  item.id === lesson.id
                                    ? {
                                        ...item,
                                        material: {
                                          ...item.material,
                                          summary: val
                                        }
                                      }
                                    : item
                                )
                              }));
                            }}
                            placeholder="পাঠ সারসংক্ষেপ ও শিক্ষণ কৌশল..."
                            className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-[#3F5247]">
                                মূল পয়েন্ট (প্রতি লাইনে ১টি)
                              </span>
                              <textarea
                                rows={3}
                                value={(lesson.material.keyPoints ?? []).join(
                                  '\n'
                                )}
                                onChange={(e) => {
                                  const lines = e.target.value.split(/\r?\n/);
                                  setEditorDraft((prev) => ({
                                    ...prev,
                                    lessons: prev.lessons.map((item) =>
                                      item.id === lesson.id
                                        ? {
                                            ...item,
                                            material: {
                                              ...item.material,
                                              keyPoints: lines
                                            }
                                          }
                                        : item
                                    )
                                  }));
                                }}
                                className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-[#3F5247]">
                                শ্রেণিকক্ষ চেকলিস্ট (প্রতি লাইনে ১টি)
                              </span>
                              <textarea
                                rows={3}
                                value={(
                                  lesson.material.actionChecklist ?? []
                                ).join('\n')}
                                onChange={(e) => {
                                  const lines = e.target.value.split(/\r?\n/);
                                  setEditorDraft((prev) => ({
                                    ...prev,
                                    lessons: prev.lessons.map((item) =>
                                      item.id === lesson.id
                                        ? {
                                            ...item,
                                            material: {
                                              ...item.material,
                                              actionChecklist: lines
                                            }
                                          }
                                        : item
                                    )
                                  }));
                                }}
                                className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: 5-STEP PATHWAY CUSTOMIZATION */}
          {editorSection === 'pathway' && (
            <div className="space-y-6">
              {/* Step 1: Pre-Assessment */}
              <div className="glass-well rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#15803D]">
                      ধাপ ০১ · Pre-Assessment কাস্টমাইজেশন
                    </div>
                    <p className="text-[11px] text-[#3F5247]">
                      প্রশিক্ষণ পূর্ব বেসলাইন প্রশ্ন কাস্টমভাবে সম্পাদনা করুন অথবা মডিউলের স্মার্ট অটো-জেনারেটেড প্রশ্ন ব্যবহার করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadPathwaySmartDefaults('pre')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-lg cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>অটো প্রশ্ন লোড ও এডিট</span>
                    </button>
                    {editorDraft.pathwayConfig?.preAssessmentQuestions && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditorDraft((prev) => ({
                            ...prev,
                            pathwayConfig: {
                              ...(prev.pathwayConfig ?? {}),
                              preAssessmentQuestions: undefined
                            }
                          }))
                        }
                        className="text-xs text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                      >
                        অটো-মোডে ফিরুন
                      </button>
                    )}
                  </div>
                </div>

                {editorDraft.pathwayConfig?.preAssessmentQuestions ? (
                  <div className="space-y-3">
                    {editorDraft.pathwayConfig.preAssessmentQuestions.map(
                      (pq, pIdx) => (
                        <div
                          key={pq.id}
                          className="bg-white/75 rounded-xl p-3.5 space-y-2 border border-white"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#132219]">
                              প্রাক-মূল্যায়ন প্রশ্ন ০{toBengaliDigits(pIdx + 1)}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={pq.prompt}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorDraft((prev) => ({
                                ...prev,
                                pathwayConfig: {
                                  ...(prev.pathwayConfig ?? {}),
                                  preAssessmentQuestions:
                                    prev.pathwayConfig?.preAssessmentQuestions?.map(
                                      (item) =>
                                        item.id === pq.id
                                          ? { ...item, prompt: val }
                                          : item
                                    )
                                }
                              }));
                            }}
                            className="w-full px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {pq.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="flex items-center gap-1.5"
                              >
                                <input
                                  type="radio"
                                  name={`pre-correct-${pq.id}`}
                                  checked={pq.correctIndex === oIdx}
                                  onChange={() =>
                                    setEditorDraft((prev) => ({
                                      ...prev,
                                      pathwayConfig: {
                                        ...(prev.pathwayConfig ?? {}),
                                        preAssessmentQuestions:
                                          prev.pathwayConfig?.preAssessmentQuestions?.map(
                                            (item) =>
                                              item.id === pq.id
                                                ? { ...item, correctIndex: oIdx }
                                                : item
                                          )
                                      }
                                    }))
                                  }
                                  className="accent-[#15803D]"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditorDraft((prev) => ({
                                      ...prev,
                                      pathwayConfig: {
                                        ...(prev.pathwayConfig ?? {}),
                                        preAssessmentQuestions:
                                          prev.pathwayConfig?.preAssessmentQuestions?.map(
                                            (item) =>
                                              item.id === pq.id
                                                ? {
                                                    ...item,
                                                    options: item.options.map(
                                                      (o, idx) =>
                                                        idx === oIdx ? val : o
                                                    )
                                                  }
                                                : item
                                          )
                                      }
                                    }));
                                  }}
                                  className="flex-1 px-2.5 py-1 text-xs glass-input rounded-lg text-[#132219]"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-[#3F5247] bg-white/55 rounded-lg p-3">
                    বর্তমানে স্মার্ট অটো-মোড সক্রিয় (মডিউলের লেসন ও কুইজ থেকে স্বয়ংক্রিয়ভাবে ৩টি ডায়াগনস্টিক প্রশ্ন তৈরি হয়)।
                  </div>
                )}
              </div>

              {/* Step 3: Interactive Learning (Drag & Drop + Scenario) */}
              <div className="glass-well rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#15803D]">
                      ধাপ ০৩ · Interactive Learning (Drag & Drop এবং Scenario)
                    </div>
                    <p className="text-[11px] text-[#3F5247]">
                      ৪-ধাপের Drag & Drop কার্ড এবং শ্রেণিকক্ষ পরিস্থিতি (Scenario) সম্পাদনা করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadPathwaySmartDefaults('interactive')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-lg cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>টেমপ্লেট লোড ও এডিট</span>
                    </button>
                    {(editorDraft.pathwayConfig?.interactiveDragSteps ||
                      editorDraft.pathwayConfig?.interactiveScenario) && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditorDraft((prev) => ({
                            ...prev,
                            pathwayConfig: {
                              ...(prev.pathwayConfig ?? {}),
                              interactiveMicroQuiz: undefined,
                              interactiveDragSteps: undefined,
                              interactiveScenario: undefined
                            }
                          }))
                        }
                        className="text-xs text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                      >
                        অটো-মোডে ফিরুন
                      </button>
                    )}
                  </div>
                </div>

                {editorDraft.pathwayConfig?.interactiveDragSteps ? (
                  <div className="space-y-4">
                    <div className="space-y-2 bg-white/75 rounded-xl p-3.5 border border-white">
                      <div className="text-xs font-bold text-[#132219]">
                        Drag & Drop সঠিক ক্রমের ৪টি ধাপ (১ → ৪)
                      </div>
                      {editorDraft.pathwayConfig.interactiveDragSteps.map(
                        (stepLabel, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-[#15803D] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                              {toBengaliDigits(sIdx + 1)}
                            </span>
                            <input
                              type="text"
                              value={stepLabel}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditorDraft((prev) => ({
                                  ...prev,
                                  pathwayConfig: {
                                    ...(prev.pathwayConfig ?? {}),
                                    interactiveDragSteps:
                                      prev.pathwayConfig?.interactiveDragSteps?.map(
                                        (st, idx) => (idx === sIdx ? val : st)
                                      )
                                  }
                                }));
                              }}
                              className="flex-1 px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                            />
                          </div>
                        )
                      )}
                    </div>

                    {editorDraft.pathwayConfig.interactiveScenario && (
                      <div className="space-y-2.5 bg-white/75 rounded-xl p-3.5 border border-white">
                        <div className="text-xs font-bold text-[#132219]">
                          শ্রেণিকক্ষ Scenario-Based Activity
                        </div>
                        <input
                          type="text"
                          value={
                            editorDraft.pathwayConfig.interactiveScenario.context
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditorDraft((prev) => ({
                              ...prev,
                              pathwayConfig: {
                                ...(prev.pathwayConfig ?? {}),
                                interactiveScenario: prev.pathwayConfig
                                  ?.interactiveScenario
                                  ? {
                                      ...prev.pathwayConfig.interactiveScenario,
                                      context: val
                                    }
                                  : undefined
                              }
                            }));
                          }}
                          placeholder="শ্রেণিকক্ষ প্রেক্ষাপট"
                          className="w-full px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                        />
                        <textarea
                          rows={2}
                          value={
                            editorDraft.pathwayConfig.interactiveScenario
                              .challenge
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditorDraft((prev) => ({
                              ...prev,
                              pathwayConfig: {
                                ...(prev.pathwayConfig ?? {}),
                                interactiveScenario: prev.pathwayConfig
                                  ?.interactiveScenario
                                  ? {
                                      ...prev.pathwayConfig.interactiveScenario,
                                      challenge: val
                                    }
                                  : undefined
                              }
                            }));
                          }}
                          placeholder="শিক্ষকের সামনে আসা পরিস্থিতি বা সমস্যা"
                          className="w-full px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                        />
                        {editorDraft.pathwayConfig.interactiveScenario.choices.map(
                          (ch, cIdx) => (
                            <div
                              key={cIdx}
                              className="p-2.5 rounded-lg glass-well space-y-1.5"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="scenario-best"
                                  checked={ch.isBest}
                                  onChange={() =>
                                    setEditorDraft((prev) => ({
                                      ...prev,
                                      pathwayConfig: {
                                        ...(prev.pathwayConfig ?? {}),
                                        interactiveScenario: prev.pathwayConfig
                                          ?.interactiveScenario
                                          ? {
                                              ...prev.pathwayConfig
                                                .interactiveScenario,
                                              choices:
                                                prev.pathwayConfig.interactiveScenario.choices.map(
                                                  (item, idx) => ({
                                                    ...item,
                                                    isBest: idx === cIdx
                                                  })
                                                )
                                            }
                                          : undefined
                                      }
                                    }))
                                  }
                                  className="accent-[#15803D]"
                                />
                                <input
                                  type="text"
                                  value={ch.text}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditorDraft((prev) => ({
                                      ...prev,
                                      pathwayConfig: {
                                        ...(prev.pathwayConfig ?? {}),
                                        interactiveScenario: prev.pathwayConfig
                                          ?.interactiveScenario
                                          ? {
                                              ...prev.pathwayConfig
                                                .interactiveScenario,
                                              choices:
                                                prev.pathwayConfig.interactiveScenario.choices.map(
                                                  (item, idx) =>
                                                    idx === cIdx
                                                      ? { ...item, text: val }
                                                      : item
                                                )
                                            }
                                          : undefined
                                      }
                                    }));
                                  }}
                                  className="flex-1 px-2.5 py-1 text-xs glass-input rounded-lg text-[#132219]"
                                />
                              </div>
                              <input
                                type="text"
                                value={ch.feedback}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditorDraft((prev) => ({
                                    ...prev,
                                    pathwayConfig: {
                                      ...(prev.pathwayConfig ?? {}),
                                      interactiveScenario: prev.pathwayConfig
                                        ?.interactiveScenario
                                        ? {
                                            ...prev.pathwayConfig
                                              .interactiveScenario,
                                            choices:
                                              prev.pathwayConfig.interactiveScenario.choices.map(
                                                (item, idx) =>
                                                  idx === cIdx
                                                    ? { ...item, feedback: val }
                                                    : item
                                              )
                                          }
                                        : undefined
                                    }
                                  }));
                                }}
                                placeholder="ফিডব্যাক"
                                className="w-full px-2.5 py-1 text-[11px] glass-input rounded-lg text-[#3F5247]"
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-[#3F5247] bg-white/55 rounded-lg p-3">
                    বর্তমানে স্মার্ট অটো-মোড সক্রিয় (লেসন ও অ্যাকশন চেকলিস্ট থেকে স্বয়ংক্রিয়ভাবে Drag & Drop ও Scenario তৈরি হয়)।
                  </div>
                )}
              </div>

              {/* Step 4: Practical Assignment Defaults */}
              <div className="glass-well rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#15803D]">
                      ধাপ ০৪ · Practical Assignment টেমপ্লেট
                    </div>
                    <p className="text-[11px] text-[#3F5247]">
                      শিক্ষকদের জন্য Lesson Plan / Worksheet / Digital Content অ্যাসাইনমেন্ট প্রম্পট কাস্টমাইজ করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadPathwaySmartDefaults('assignment')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-lg cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>অ্যাসাইনমেন্ট প্রম্পট এডিট</span>
                    </button>
                    {editorDraft.pathwayConfig?.assignmentDefaults && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditorDraft((prev) => ({
                            ...prev,
                            pathwayConfig: {
                              ...(prev.pathwayConfig ?? {}),
                              assignmentDefaults: undefined
                            }
                          }))
                        }
                        className="text-xs text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                      >
                        অটো-মোডে ফিরুন
                      </button>
                    )}
                  </div>
                </div>

                {editorDraft.pathwayConfig?.assignmentDefaults ? (
                  <div className="bg-white/75 rounded-xl p-3.5 space-y-2.5 border border-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <select
                        value={
                          editorDraft.pathwayConfig.assignmentDefaults
                            .defaultType
                        }
                        onChange={(e) => {
                          const val = e.target.value as AssignmentArtifactType;
                          setEditorDraft((prev) => ({
                            ...prev,
                            pathwayConfig: {
                              ...(prev.pathwayConfig ?? {}),
                              assignmentDefaults: prev.pathwayConfig
                                ?.assignmentDefaults
                                ? {
                                    ...prev.pathwayConfig.assignmentDefaults,
                                    defaultType: val
                                  }
                                : undefined
                            }
                          }));
                        }}
                        className="px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                      >
                        <option value="lesson-plan">Lesson Plan</option>
                        <option value="worksheet">Worksheet</option>
                        <option value="digital-content">Digital Content</option>
                      </select>
                      <input
                        type="text"
                        value={
                          editorDraft.pathwayConfig.assignmentDefaults.title
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditorDraft((prev) => ({
                            ...prev,
                            pathwayConfig: {
                              ...(prev.pathwayConfig ?? {}),
                              assignmentDefaults: prev.pathwayConfig
                                ?.assignmentDefaults
                                ? {
                                    ...prev.pathwayConfig.assignmentDefaults,
                                    title: val
                                  }
                                : undefined
                            }
                          }));
                        }}
                        placeholder="অ্যাসাইনমেন্টের শিরোনাম"
                        className="px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={
                        editorDraft.pathwayConfig.assignmentDefaults
                          .activitiesAndMaterials
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditorDraft((prev) => ({
                          ...prev,
                          pathwayConfig: {
                            ...(prev.pathwayConfig ?? {}),
                            assignmentDefaults: prev.pathwayConfig
                              ?.assignmentDefaults
                              ? {
                                  ...prev.pathwayConfig.assignmentDefaults,
                                  activitiesAndMaterials: val
                                }
                              : undefined
                          }
                        }));
                      }}
                      placeholder="মূল কার্যক্রম ও নির্দেশিকা"
                      className="w-full px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-[#3F5247] bg-white/55 rounded-lg p-3">
                    বর্তমানে স্মার্ট অটো-মোড সক্রিয় (Lesson Plan, Worksheet এবং Digital Content ৩টি ধরনই স্বয়ংক্রিয়ভাবে প্রস্তুত থাকে)।
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: POST-ASSESSMENT QUIZ BUILDER */}
          {editorSection === 'quiz' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#3F5247]">
                  ধাপ ০৫ (Post-Assessment): কুইজ প্রশ্নগুলো ড্র্যাগ বা ↑/↓ বোতামে সাজান এবং উত্তর ও ব্যাখ্যা সম্পাদনা করুন।
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEditorDraft((prev) => ({
                      ...prev,
                      quiz: [
                        ...prev.quiz,
                        createEmptyQuizQuestion(prev.quiz.length)
                      ]
                    }))
                  }
                  disabled={editorDraft.quiz.length >= 30}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>প্রশ্ন যুক্ত করুন</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {editorDraft.quiz.map((q, qIdx) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={() => setDraggingQuizIdx(qIdx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggingQuizIdx !== null) {
                        moveQuizQuestion(draggingQuizIdx, qIdx);
                      }
                      setDraggingQuizIdx(null);
                    }}
                    className="p-4 rounded-xl glass-well space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-[#3F5247] cursor-grab" />
                        <span className="text-xs font-bold text-[#132219]">
                          প্রশ্ন {toBengaliDigits(qIdx + 1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={qIdx === 0}
                          onClick={() => moveQuizQuestion(qIdx, qIdx - 1)}
                          className="w-7 h-7 rounded-lg btn-3d-glass flex items-center justify-center disabled:opacity-35 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={qIdx === editorDraft.quiz.length - 1}
                          onClick={() => moveQuizQuestion(qIdx, qIdx + 1)}
                          className="w-7 h-7 rounded-lg btn-3d-glass flex items-center justify-center disabled:opacity-35 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {editorDraft.quiz.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditorDraft((prev) => ({
                                ...prev,
                                quiz: prev.quiz.filter(
                                  (item) => item.id !== q.id
                                )
                              }))
                            }
                            className="p-1.5 text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditorDraft((prev) => ({
                          ...prev,
                          quiz: prev.quiz.map((item) =>
                            item.id === q.id ? { ...item, question: val } : item
                          )
                        }));
                      }}
                      placeholder="বহুনির্বাচনী প্রশ্ন লিখুন..."
                      className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`quiz-correct-${q.id}`}
                            checked={q.correctIndex === oIdx}
                            onChange={() =>
                              setEditorDraft((prev) => ({
                                ...prev,
                                quiz: prev.quiz.map((item) =>
                                  item.id === q.id
                                    ? { ...item, correctIndex: oIdx }
                                    : item
                                )
                              }))
                            }
                            className="accent-[#15803D] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorDraft((prev) => ({
                                ...prev,
                                quiz: prev.quiz.map((item) =>
                                  item.id === q.id
                                    ? {
                                        ...item,
                                        options: item.options.map((o, idx) =>
                                          idx === oIdx ? val : o
                                        )
                                      }
                                    : item
                                )
                              }));
                            }}
                            placeholder={`বিকল্প ${toBengaliDigits(oIdx + 1)}`}
                            className="flex-1 px-2.5 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditorDraft((prev) => ({
                          ...prev,
                          quiz: prev.quiz.map((item) =>
                            item.id === q.id
                              ? { ...item, explanation: val }
                              : item
                          )
                        }));
                      }}
                      placeholder="সঠিক উত্তরের সংক্ষিপ্ত ব্যাখ্যা..."
                      className="w-full px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback && (
            <div
              role="status"
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-[#ECF2ED]/90 border-[#15803D]/30 text-[#14532D]'
                  : 'bg-[#FEF2F2]/90 border-[#FECACA] text-[#B91C1C]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#15803D]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Bottom Save & Publish Action Bar */}
          <div className="pt-4 border-t border-white/75 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#132219] cursor-pointer">
              <input
                type="checkbox"
                checked={editorDraft.published}
                onChange={(e) =>
                  setEditorDraft((prev) => ({
                    ...prev,
                    published: e.target.checked
                  }))
                }
                className="w-4 h-4 accent-[#15803D] rounded cursor-pointer"
              />
              <span>ক্যাটালগে প্রকাশিত রাখুন (দৃশ্যমান)</span>
            </label>

            <div className="flex flex-wrap items-center gap-2.5">
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => onOpenCourseInClassroom(editorDraft.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[42px] cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>ক্লাসরুমে দেখুন</span>
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>পরিবর্তন সংরক্ষণ ও প্রয়োগ করুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
