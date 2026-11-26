import React, { useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Cloud,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  FolderPlus,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  LogIn,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload
} from 'lucide-react';
import {
  Course,
  CourseCategory,
  CustomCourseRecord,
  Lesson,
  QuizQuestion,
  UploadedMaterialItem
} from '../types/lms';
import { isVerifiedAdminUser } from '../firebase';
import { toBengaliDigits } from '../utils/lmsHelpers';
import tpackImg from '../assets/images/bd_tpack_teacher_1794726527783.jpg';
import pedagogyImg from '../assets/images/bd_pedagogy_teacher_1794726528448.jpg';
import researchImg from '../assets/images/bd_research_teachers_1794726528020.jpg';

interface AdminPanelViewProps {
  authUser: User | null;
  builtInCourses: Course[];
  customCourses: CustomCourseRecord[];
  uploadedMaterials: UploadedMaterialItem[];
  onSaveCourse: (course: CustomCourseRecord, isNew: boolean) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onSaveMaterial: (
    material: UploadedMaterialItem,
    isNew: boolean
  ) => Promise<void>;
  onDeleteMaterial: (materialId: string) => Promise<void>;
  onOpenLogin: () => void;
  onOpenCourseInClassroom: (courseId: string) => void;
  onOpenMaterialsLibrary: () => void;
  onBackToCourses?: () => void;
}

type AdminSubTab = 'courses' | 'materials' | 'overview';

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

const FORMAT_OPTIONS = [
  'লেসন প্ল্যান',
  'হ্যান্ডআউট',
  'মূল্যায়ন রুব্রিক',
  'ওয়ার্কশিট',
  'গবেষণা গাইড',
  'আপলোডকৃত ডকুমেন্ট'
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

function createEmptyCourseDraft(): CustomCourseRecord {
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

function createEmptyMaterialDraft(courses: Course[]): UploadedMaterialItem {
  const targetCourse = courses[0];
  return {
    id: `mat-upload-${Date.now().toString(36)}`,
    courseId: targetCourse?.id ?? 'tpack-digital-teaching',
    courseTitle:
      targetCourse?.title ?? 'TPACK ফ্রেমওয়ার্ক ও ডিজিটাল শিক্ষণ দক্ষতা',
    category: targetCourse?.category ?? 'tpack-tech',
    categoryLabel: targetCourse?.categoryLabel ?? 'টিপ্যাক ও প্রযুক্তি',
    title: '',
    formatLabel: 'হ্যান্ডআউট',
    readTime: '৫ মিনিট পাঠ',
    summary: '',
    keyPoints: [],
    actionChecklist: [],
    classroomActivity: {
      gradeLevel: '৬ষ্ঠ – ১০ম শ্রেণি',
      duration: '৪৫ মিনিট',
      objective: ''
    },
    attachmentName: '',
    attachmentContent: '',
    attachmentMimeType: '',
    published: true
  };
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

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  authUser,
  builtInCourses,
  customCourses,
  uploadedMaterials,
  onSaveCourse,
  onDeleteCourse,
  onSaveMaterial,
  onDeleteMaterial,
  onOpenLogin,
  onOpenCourseInClassroom,
  onOpenMaterialsLibrary,
  onBackToCourses
}) => {
  const [subTab, setSubTab] = useState<AdminSubTab>('courses');
  const [courseSearch, setCourseSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  const allAvailableCourses = useMemo(
    () => [...builtInCourses, ...customCourses],
    [builtInCourses, customCourses]
  );

  // Course Builder State
  const [courseDraft, setCourseDraft] = useState<CustomCourseRecord>(() =>
    createEmptyCourseDraft()
  );
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseSaving, setCourseSaving] = useState(false);
  const [courseFeedback, setCourseFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<
    string | null
  >(null);

  // Material Uploader State
  const [materialDraft, setMaterialDraft] = useState<UploadedMaterialItem>(() =>
    createEmptyMaterialDraft(builtInCourses)
  );
  const [keyPointsText, setKeyPointsText] = useState('');
  const [checklistText, setChecklistText] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null
  );
  const [materialSaving, setMaterialSaving] = useState(false);
  const [materialDragging, setMaterialDragging] = useState(false);
  const [materialFeedback, setMaterialFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmDeleteMaterialId, setConfirmDeleteMaterialId] = useState<
    string | null
  >(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const courseJsonInputRef = useRef<HTMLInputElement | null>(null);
  const materialFileInputRef = useRef<HTMLInputElement | null>(null);

  const isCloudAdmin = isVerifiedAdminUser(authUser);

  const filteredCustomCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return customCourses;
    return customCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.categoryLabel.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
    );
  }, [customCourses, courseSearch]);

  const filteredUploadedMaterials = useMemo(() => {
    const q = materialSearch.trim().toLowerCase();
    if (!q) return uploadedMaterials;
    return uploadedMaterials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.courseTitle.toLowerCase().includes(q) ||
        m.formatLabel.toLowerCase().includes(q) ||
        m.attachmentName.toLowerCase().includes(q)
    );
  }, [uploadedMaterials, materialSearch]);

  const publishedCustomCount = useMemo(
    () =>
      customCourses.filter((c) => c.published).length +
      uploadedMaterials.filter((m) => m.published).length,
    [customCourses, uploadedMaterials]
  );

  // Course Builder Handlers
  const handleStartNewCourse = () => {
    setEditingCourseId(null);
    setCourseDraft(createEmptyCourseDraft());
    setCourseFeedback(null);
  };

  const handleSelectCourseForEdit = (course: CustomCourseRecord) => {
    setEditingCourseId(course.id);
    setCourseDraft(JSON.parse(JSON.stringify(course)) as CustomCourseRecord);
    setCourseFeedback(null);
  };

  const handleCourseCategoryChange = (cat: Exclude<CourseCategory, 'all'>) => {
    const found =
      CATEGORY_OPTIONS.find((o) => o.id === cat) ?? CATEGORY_OPTIONS[0];
    setCourseDraft((prev) => ({
      ...prev,
      category: cat,
      categoryLabel: found.label,
      imagePath:
        prev.imagePath.startsWith('data:')
          ? prev.imagePath
          : found.presetImage
    }));
  };

  const handleCoverFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setCourseDraft((prev) => ({ ...prev, imagePath: dataUrl }));
      setCourseFeedback({
        type: 'success',
        text: `কভার ছবি "${file.name}" সংযুক্ত হয়েছে।`
      });
    } catch {
      setCourseFeedback({
        type: 'error',
        text: 'ছবিটি পড়া যায়নি। অনুগ্রহ করে JPG, PNG বা WebP ছবি নির্বাচন করুন।'
      });
    }
  };

  const handleImportCourseJson = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<CustomCourseRecord>;
      const cat =
        parsed.category === 'pedagogy-eval' ||
        parsed.category === 'research-leadership'
          ? parsed.category
          : 'tpack-tech';
      const catMeta =
        CATEGORY_OPTIONS.find((o) => o.id === cat) ?? CATEGORY_OPTIONS[0];
      const newId = `course-${Date.now().toString(36)}`;
      const importedLessons: Lesson[] =
        Array.isArray(parsed.lessons) && parsed.lessons.length > 0
          ? parsed.lessons.slice(0, 25).map((l, idx) => {
              const fallback = createEmptyLesson(idx, newId);
              return {
                ...fallback,
                ...l,
                id: `${newId}-l${idx + 1}`,
                chapters:
                  Array.isArray(l.chapters) && l.chapters.length > 0
                    ? l.chapters
                    : fallback.chapters,
                material: {
                  ...fallback.material,
                  ...(l.material ?? {}),
                  id: `mat-${newId}-l${idx + 1}`
                }
              };
            })
          : [createEmptyLesson(0, newId)];
      const importedQuiz: QuizQuestion[] =
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

      setEditingCourseId(null);
      setCourseDraft({
        id: newId,
        title: parsed.title || 'ইমপোর্টকৃত কোর্স',
        subtitle: parsed.subtitle || '',
        category: cat,
        categoryLabel: parsed.categoryLabel || catMeta.label,
        levelLabel: parsed.levelLabel || 'সকল স্তরের শিক্ষক',
        cpdHoursLabel: parsed.cpdHoursLabel || '৬ CPD ঘণ্টা',
        totalDurationLabel:
          parsed.totalDurationLabel ||
          `${toBengaliDigits(importedLessons.length)}টি মডিউল · ${parsed.cpdHoursLabel || '৬ CPD ঘণ্টা'}`,
        instructor: parsed.instructor || 'প্রশিক্ষক প্যানেল',
        instructorRole:
          parsed.instructorRole || 'শিক্ষা প্রযুক্তি ও পেডাগজি বিশেষজ্ঞ',
        imagePath:
          typeof parsed.imagePath === 'string' && parsed.imagePath
            ? parsed.imagePath
            : catMeta.presetImage,
        description:
          parsed.description || 'JSON ফাইল থেকে আমদানিকৃত প্রশিক্ষণ কোর্স।',
        lessons: importedLessons,
        quiz: importedQuiz,
        published: true,
        isCustom: true
      });
      setCourseFeedback({
        type: 'success',
        text: `"${file.name}" থেকে কোর্স কাঠামো লোড হয়েছে। যাচাই করে সংরক্ষণ করুন।`
      });
    } catch {
      setCourseFeedback({
        type: 'error',
        text: 'সঠিক JSON কোর্স ফাইল নির্বাচন করুন।'
      });
    }
  };

  const handleDownloadCourseTemplate = () => {
    const sample = {
      title: 'ডিজিটাল ক্লাসরুমে গেমিফিকেশন ও ইন্টারঅ্যাক্টিভ কুইজ',
      subtitle: 'শিক্ষার্থীর অংশগ্রহণ বাড়াতে Kahoot, Quizizz ও গঠনমূলক ফিডব্যাক',
      category: 'tpack-tech',
      levelLabel: 'মাধ্যমিক শিক্ষক',
      cpdHoursLabel: '৬ CPD ঘণ্টা',
      instructor: 'ড. সাদিয়া আফরিন',
      instructorRole: 'এডটেক ও শিক্ষণ নকশা বিশেষজ্ঞ',
      description:
        'গেম-ভিত্তিক মূল্যায়ন ও ইন্টারঅ্যাক্টিভ কুইজ ব্যবহার করে শ্রেণিকক্ষকে আরও অংশগ্রহণমূলক করার প্রায়োগিক প্রশিক্ষণ।',
      lessons: [
        {
          number: 'মডিউল ০১',
          title: 'গেমিফাইড মূল্যায়নের মূলনীতি',
          durationLabel: '০৩:০০',
          durationSec: 180,
          material: {
            title: 'কুইজ ও গেমিফিকেশন গাইড',
            formatLabel: 'হ্যান্ডআউট',
            readTime: '৫ মিনিট পাঠ',
            summary: 'কুইজের মাধ্যমে ভয়হীন ও আনন্দদায়ক মূল্যায়নের কৌশল।',
            keyPoints: ['পয়েন্ট ও তাৎক্ষণিক ফিডব্যাক', 'দলীয় কুইজ পরিচালনা'],
            actionChecklist: ['১টি ৫-প্রশ্নের অনুশীলন কুইজ তৈরি করুন']
          }
        }
      ],
      quiz: [
        {
          question: 'ক্লাসে গেমিফাইড কুইজ ব্যবহারের প্রধান উদ্দেশ্য কী?',
          options: [
            'শিক্ষার্থীদের মধ্যে সক্রিয় অংশগ্রহণ ও তাৎক্ষণিক শিখন যাচাই',
            'সময় নষ্ট করা',
            'পাঠ্যবই বাদ দেওয়া',
            'কেবল নম্বর কমানো'
          ],
          correctIndex: 0,
          explanation:
            'তাৎক্ষণিক ফিডব্যাক ও আনন্দদায়ক প্রতিযোগিতা শিক্ষার্থীদের আগ্রহ বাড়ায়।'
        }
      ]
    };
    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tpack-course-template.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseFeedback(null);

    if (!courseDraft.title.trim() || !courseDraft.description.trim()) {
      setCourseFeedback({
        type: 'error',
        text: 'কোর্সের শিরোনাম এবং সংক্ষিপ্ত বিবরণ অবশ্যই লিখতে হবে।'
      });
      return;
    }

    const validLessons = courseDraft.lessons
      .filter((l) => l.title.trim())
      .map((l, idx) => {
        const numLabel = `মডিউল ${toBengaliDigits(String(idx + 1).padStart(2, '0'))}`;
        const matTitle = l.material.title.trim() || `${l.title.trim()} — গাইড`;
        const matSummary =
          l.material.summary.trim() || `${l.title.trim()} বিষয়ক সংক্ষিপ্ত পাঠ উপকরণ।`;
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
      setCourseFeedback({
        type: 'error',
        text: 'কোর্সে অন্তত ১টি মডিউলের শিরোনাম যুক্ত করুন।'
      });
      return;
    }

    const validQuiz = courseDraft.quiz
      .filter((q) => q.question.trim() && q.options.some((o) => o.trim()))
      .map((q) => ({
        ...q,
        question: q.question.trim(),
        options: q.options.map((o, i) => o.trim() || `বিকল্প ${toBengaliDigits(i + 1)}`),
        explanation: q.explanation.trim() || 'মডিউলের পাঠ্যবস্তু অনুযায়ী সঠিক উত্তর।'
      }));

    const preparedCourse: CustomCourseRecord = {
      ...courseDraft,
      title: courseDraft.title.trim(),
      subtitle:
        courseDraft.subtitle.trim() ||
        `${courseDraft.categoryLabel} বিষয়ক আধুনিক শিক্ষক প্রশিক্ষণ`,
      totalDurationLabel: `${toBengaliDigits(validLessons.length)}টি মডিউল · ${courseDraft.cpdHoursLabel.trim() || '৬ CPD ঘণ্টা'}`,
      lessons: validLessons,
      quiz: validQuiz.length > 0 ? validQuiz : [
        {
          id: `q-auto-${Date.now()}`,
          question: `${courseDraft.title.trim()} কোর্সের মূল লক্ষ্য কোনটি?`,
          options: [
            'শ্রেণিকক্ষে কার্যকর ও আধুনিক শিক্ষণ কৌশল প্রয়োগ করা',
            'শুধু মুখস্থনির্ভর পাঠদান চালিয়ে যাওয়া',
            'শিক্ষার্থীদের অংশগ্রহণ কমানো',
            'মূল্যায়ন ছাড়া পাঠ শেষ করা'
          ],
          correctIndex: 0,
          explanation: 'প্রতিটি মডিউলের মূল লক্ষ্য শ্রেণিকক্ষের বাস্তব মানোন্নয়ন।'
        }
      ],
      isCustom: true
    };

    setCourseSaving(true);
    try {
      const isNew = editingCourseId === null;
      await onSaveCourse(preparedCourse, isNew);
      setEditingCourseId(preparedCourse.id);
      setCourseDraft(preparedCourse);
      setCourseFeedback({
        type: 'success',
        text: isCloudAdmin
          ? 'কোর্সটি সফলভাবে Firestore ক্লাউড ডাটাবেসে সংরক্ষিত ও সিঙ্ক হয়েছে।'
          : 'কোর্সটি লোকাল প্রিভিউ ক্যাটালগে সংরক্ষিত হয়েছে (ক্লাউডে প্রকাশ করতে অ্যাডমিন লগইন করুন)।'
      });
    } catch {
      setCourseFeedback({
        type: 'error',
        text: 'কোর্স সংরক্ষণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      });
    } finally {
      setCourseSaving(false);
    }
  };

  // Material Uploader Handlers
  const handleStartNewMaterial = () => {
    setEditingMaterialId(null);
    const fresh = createEmptyMaterialDraft(allAvailableCourses);
    setMaterialDraft(fresh);
    setKeyPointsText('');
    setChecklistText('');
    setMaterialFeedback(null);
  };

  const handleSelectMaterialForEdit = (mat: UploadedMaterialItem) => {
    setEditingMaterialId(mat.id);
    setMaterialDraft({ ...mat });
    setKeyPointsText((mat.keyPoints ?? []).join('\n'));
    setChecklistText((mat.actionChecklist ?? []).join('\n'));
    setMaterialFeedback(null);
  };

  const processUploadedMaterialFile = async (file: File) => {
    setMaterialFeedback(null);
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    const lowerName = file.name.toLowerCase();
    const isTextReadable =
      file.type.startsWith('text/') ||
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.md') ||
      lowerName.endsWith('.csv') ||
      lowerName.endsWith('.json');

    let extractedContent = '';
    if (isTextReadable) {
      try {
        extractedContent = (await file.text()).slice(0, 48000);
      } catch {
        extractedContent = '';
      }
    }

    const lines = extractedContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const wordEstimate = extractedContent
      ? Math.max(2, Math.min(25, Math.round(extractedContent.split(/\s+/).length / 160)))
      : 5;

    const bulletLines = lines
      .filter((l) => /^([-*•]|\d+[.)])\s+/.test(l))
      .map((l) => l.replace(/^([-*•]|\d+[.)])\s+/, '').trim())
      .slice(0, 6);

    const summaryLine =
      lines.find((l) => l.length > 20 && !l.startsWith('#')) ??
      `আপলোডকৃত প্রশিক্ষণ ফাইল (${file.name}) থেকে সংযুক্ত পাঠ উপকরণ।`;

    setMaterialDraft((prev) => ({
      ...prev,
      title: prev.title.trim() || baseName || file.name,
      formatLabel: lowerName.endsWith('.json')
        ? 'স্ট্রাকচার্ড রিসোর্স'
        : lowerName.endsWith('.md')
        ? 'মার্কডাউন গাইড'
        : 'আপলোডকৃত ডকুমেন্ট',
      readTime: `${toBengaliDigits(wordEstimate)} মিনিট পাঠ`,
      summary: prev.summary.trim() || summaryLine.slice(0, 1500),
      attachmentName: file.name,
      attachmentMimeType: file.type || 'text/plain',
      attachmentContent:
        extractedContent ||
        `সংযুক্ত ফাইল: ${file.name} (${toBengaliDigits(Math.max(1, Math.round(file.size / 1024)))} KB)`
    }));

    if (!keyPointsText.trim() && bulletLines.length > 0) {
      setKeyPointsText(bulletLines.join('\n'));
    }

    setMaterialFeedback({
      type: 'success',
      text: isTextReadable
        ? `"${file.name}" সফলভাবে পড়া হয়েছে ও ফর্মে যুক্ত হয়েছে।`
        : `"${file.name}" মেটাডাটা সংযুক্ত হয়েছে। চাইলে নিচে উপকরণের মূল বিষয়বস্তু সম্পাদনা করতে পারেন।`
    });
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaterialFeedback(null);

    if (!materialDraft.title.trim() || !materialDraft.summary.trim()) {
      setMaterialFeedback({
        type: 'error',
        text: 'উপকরণের শিরোনাম এবং সারসংক্ষেপ অবশ্যই পূরণ করুন।'
      });
      return;
    }

    const targetCourse =
      allAvailableCourses.find((c) => c.id === materialDraft.courseId) ??
      allAvailableCourses[0];

    const parsedKeyPoints = keyPointsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 20);
    const parsedChecklist = checklistText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 20);

    const preparedMaterial: UploadedMaterialItem = {
      ...materialDraft,
      courseId: targetCourse.id,
      courseTitle: targetCourse.title,
      category: targetCourse.category,
      categoryLabel: targetCourse.categoryLabel,
      title: materialDraft.title.trim(),
      summary: materialDraft.summary.trim(),
      keyPoints:
        parsedKeyPoints.length > 0
          ? parsedKeyPoints
          : ['পাঠের মূল ধারণা ও শ্রেণিকক্ষ অনুশীলন'],
      actionChecklist:
        parsedChecklist.length > 0
          ? parsedChecklist
          : ['শ্রেণিকক্ষে পাঠদানের পূর্বে উপকরণটি পর্যালোচনা করুন'],
      classroomActivity: {
        gradeLevel:
          materialDraft.classroomActivity.gradeLevel.trim() || 'সকল শ্রেণি',
        duration:
          materialDraft.classroomActivity.duration.trim() || '৪৫ মিনিট',
        objective:
          materialDraft.classroomActivity.objective.trim() ||
          `${materialDraft.title.trim()} শ্রেণিকক্ষে প্রয়োগ করা।`
      }
    };

    setMaterialSaving(true);
    try {
      const isNew = editingMaterialId === null;
      await onSaveMaterial(preparedMaterial, isNew);
      setEditingMaterialId(preparedMaterial.id);
      setMaterialDraft(preparedMaterial);
      setMaterialFeedback({
        type: 'success',
        text: isCloudAdmin
          ? 'প্রশিক্ষণ উপকরণটি সফলভাবে Firestore-এ আপলোড হয়েছে এবং লাইব্রেরিতে যুক্ত হয়েছে।'
          : 'উপকরণটি লোকাল প্রিভিউ লাইব্রেরিতে সংরক্ষিত হয়েছে (ক্লাউডে প্রকাশ করতে অ্যাডমিন লগইন করুন)।'
      });
    } catch {
      setMaterialFeedback({
        type: 'error',
        text: 'উপকরণ আপলোডে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      });
    } finally {
      setMaterialSaving(false);
    }
  };

  if (!isCloudAdmin) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-surface rounded-2xl p-8 sm:p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl glass-3d-icon-well flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-[#15803D]" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#15803D]">
              Admin Content Studio · সংরক্ষিত এলাকা
            </div>
            <h1 className="text-2xl font-bold text-[#132219] tracking-tight">
              {authUser
                ? 'এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই'
                : 'অ্যাডমিন লগইন প্রয়োজন'}
            </h1>
            <p className="text-sm text-[#3F5247] max-w-md mx-auto leading-relaxed">
              {authUser
                ? 'কোর্স মডিউল ও প্রশিক্ষণ উপকরণ যুক্ত বা সম্পাদনা করার প্যানেলটি শুধুমাত্র অনুমোদিত অ্যাডমিন লগইন করলে প্রদর্শিত হয়।'
                : 'নতুন কোর্স মডিউল, কুইজ ও প্রশিক্ষণ উপকরণ আপলোড করার প্যানেল ব্যবহার করতে অনুগ্রহ করে অ্যাডমিন Google অ্যাকাউন্ট দিয়ে লগইন করুন।'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {authUser ? 'অন্য অ্যাকাউন্টে লগইন' : 'অ্যাডমিন Google লগইন'}
              </span>
            </button>
            {onBackToCourses && (
              <button
                type="button"
                onClick={onBackToCourses}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[44px] cursor-pointer"
              >
                <span>কোর্স ক্যাটালগে ফিরে যান</span>
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Admin Auth Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/75">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-[#15803D]">
            Admin Content Studio · ডায়নামিক কোর্স ও প্রশিক্ষণ উপকরণ আপলোড
          </div>
          <h1 className="text-3xl font-bold text-[#132219] tracking-tight">
            কোর্স ও উপকরণ অ্যাডমিন প্যানেল
          </h1>
          <p className="text-sm sm:text-base text-[#3F5247]">
            নতুন শিক্ষক প্রশিক্ষণ কোর্স, মডিউল, কুইজ প্রশ্ন এবং হ্যান্ডআউট ফাইল (`.txt`, `.md`, `.json`) সরাসরি আপলোড ও পরিচালনা করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-well text-xs font-semibold text-[#14532D]">
            <Cloud className="w-4 h-4 text-[#15803D]" />
            <span>Firestore অ্যাডমিন সংযুক্ত</span>
          </div>
        </div>
      </div>

      {/* 4-Column Tabular KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">মোট সক্রিয় কোর্স</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219] mt-1">
            {toBengaliDigits(allAvailableCourses.length)}টি
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            {toBengaliDigits(builtInCourses.length)}টি মূল + {toBengaliDigits(customCourses.length)}টি কাস্টম
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">আপলোডকৃত উপকরণ</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#15803D] mt-1">
            {toBengaliDigits(uploadedMaterials.length)}টি
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            হ্যান্ডআউট, রুব্রিক ও গাইড
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">প্রকাশিত কাস্টম কনটেন্ট</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219] mt-1">
            {toBengaliDigits(publishedCustomCount)}টি
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            কোর্স ও উপকরণ মিলিয়ে
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">সংরক্ষণ মাধ্যম</div>
          <div className="text-lg font-bold text-[#132219] mt-1.5">
            {isCloudAdmin ? 'Firestore ক্লাউড' : 'লোকাল ব্রাউজার'}
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            {isCloudAdmin ? 'রিয়েল-টাইম রোল-ভিত্তিক সিঙ্ক' : 'সাইন ইন ছাড়া প্রিভিউ'}
          </div>
        </div>
      </div>

      {/* Workspace Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 glass-well rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab('courses')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'courses'
              ? 'btn-3d-glass text-[#132219] font-semibold'
              : 'text-[#3F5247] hover:text-[#132219]'
          }`}
        >
          <FolderPlus className="w-3.5 h-3.5 text-[#15803D]" />
          <span>কোর্স তৈরি ও আপলোড</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('materials')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'materials'
              ? 'btn-3d-glass text-[#132219] font-semibold'
              : 'text-[#3F5247] hover:text-[#132219]'
          }`}
        >
          <FileUp className="w-3.5 h-3.5 text-[#15803D]" />
          <span>প্রশিক্ষণ উপকরণ আপলোড</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('overview')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'overview'
              ? 'btn-3d-glass text-[#132219] font-semibold'
              : 'text-[#3F5247] hover:text-[#132219]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#15803D]" />
          <span>সম্পূর্ণ ক্যাটালগ তালিকা</span>
        </button>
      </div>

      {/* TAB 1: DYNAMIC COURSE BUILDER & UPLOAD */}
      {subTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Custom Courses List */}
          <div className="lg:col-span-5 glass-surface rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#132219]">
                কাস্টম কোর্স তালিকা ({toBengaliDigits(customCourses.length)})
              </h2>
              <button
                type="button"
                onClick={handleStartNewCourse}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন কোর্স</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#3F5247] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="কাস্টম কোর্স খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>

            {filteredCustomCourses.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-[#B6C7BC] rounded-xl glass-well space-y-2">
                <BookOpen className="w-6 h-6 text-[#3F5247] mx-auto" />
                <div className="text-xs font-semibold text-[#132219]">
                  এখনো কোনো কাস্টম কোর্স যুক্ত হয়নি
                </div>
                <p className="text-xs text-[#3F5247] leading-relaxed">
                  ডানপাশের ফর্ম পূরণ করে অথবা একটি `.json` কোর্স প্যাকেজ ফাইল আপলোড করে প্রথম কোর্স তৈরি করুন।
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/75 glass-well rounded-xl overflow-hidden">
                {filteredCustomCourses.map((c) => {
                  const isEditing = editingCourseId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 space-y-2 ${
                        isEditing ? 'bg-[#ECF2ED]/85' : 'bg-white/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] text-[#3F5247] flex items-center gap-1.5">
                            <span className="font-medium text-[#15803D]">
                              {c.categoryLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {c.published ? 'প্রকাশিত' : 'খসড়া'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {toBengaliDigits(c.lessons.length)} মডিউল
                            </span>
                          </div>
                          <div className="text-sm font-bold text-[#132219] truncate mt-0.5">
                            {c.title}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectCourseForEdit(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#15803D]" />
                          <span>সম্পাদনা</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void onSaveCourse(
                              { ...c, published: !c.published },
                              false
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#3F5247] btn-3d-glass rounded-lg cursor-pointer"
                        >
                          {c.published ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>খসড়া করুন</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-[#15803D]" />
                              <span>প্রকাশ করুন</span>
                            </>
                          )}
                        </button>

                        {confirmDeleteCourseId === c.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                void onDeleteCourse(c.id);
                                if (editingCourseId === c.id) {
                                  handleStartNewCourse();
                                }
                                setConfirmDeleteCourseId(null);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#DC2626] rounded-lg cursor-pointer"
                            >
                              মুছুন
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCourseId(null)}
                              className="px-2 py-1 text-xs text-[#3F5247] cursor-pointer"
                            >
                              বাতিল
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCourseId(c.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>মুছুন</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-white/75 text-xs text-[#3F5247]">
              মূল কারিকুলামে {toBengaliDigits(builtInCourses.length)}টি স্থায়ী কোর্স সক্রিয় রয়েছে। নতুন কাস্টম কোর্সগুলো স্বয়ংক্রিয়ভাবে ক্যাটালগ ও ক্লাসরুমে যুক্ত হয়।
            </div>
          </div>

          {/* Right Column: Dynamic Course Builder Form */}
          <form
            onSubmit={handleSubmitCourse}
            className="lg:col-span-7 glass-surface rounded-2xl p-6 sm:p-7 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/75">
              <div>
                <h2 className="text-lg font-bold text-[#132219]">
                  {editingCourseId
                    ? 'কাস্টম কোর্স সম্পাদনা করুন'
                    : 'নতুন কোর্স তৈরি ও আপলোড করুন'}
                </h2>
                <p className="text-xs text-[#3F5247] mt-0.5">
                  হাতে পূরণ করুন অথবা JSON কোর্স প্যাকেজ ফাইল থেকে সরাসরি আমদানি করুন।
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={courseJsonInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportCourseJson}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => courseJsonInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>JSON আপলোড</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCourseTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#3F5247] hover:text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>টেমপ্লেট</span>
                </button>
              </div>
            </div>

            {/* Basic Course Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  কোর্সের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={courseDraft.title}
                  onChange={(e) =>
                    setCourseDraft((prev) => ({
                      ...prev,
                      title: e.target.value
                    }))
                  }
                  placeholder="যেমন: ডিজিটাল শ্রেণিকক্ষে ইন্টারঅ্যাক্টিভ বিজ্ঞান পাঠ"
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  উপ-শিরোনাম
                </label>
                <input
                  type="text"
                  value={courseDraft.subtitle}
                  onChange={(e) =>
                    setCourseDraft((prev) => ({
                      ...prev,
                      subtitle: e.target.value
                    }))
                  }
                  placeholder="যেমন: সিমুলেশন, গ্রুপ অনুশীলন ও গঠনমূলক মূল্যায়ন"
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  বিভাগ (Category)
                </label>
                <select
                  value={courseDraft.category}
                  onChange={(e) =>
                    handleCourseCategoryChange(
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
                    value={courseDraft.cpdHoursLabel}
                    onChange={(e) =>
                      setCourseDraft((prev) => ({
                        ...prev,
                        cpdHoursLabel: e.target.value
                      }))
                    }
                    placeholder="৬ CPD ঘণ্টা"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                  <input
                    type="text"
                    value={courseDraft.levelLabel}
                    onChange={(e) =>
                      setCourseDraft((prev) => ({
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
                  value={courseDraft.instructor}
                  onChange={(e) =>
                    setCourseDraft((prev) => ({
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
                  value={courseDraft.instructorRole}
                  onChange={(e) =>
                    setCourseDraft((prev) => ({
                      ...prev,
                      instructorRole: e.target.value
                    }))
                  }
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  কোর্সের সংক্ষিপ্ত বিবরণ *
                </label>
                <textarea
                  rows={3}
                  required
                  value={courseDraft.description}
                  onChange={(e) =>
                    setCourseDraft((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                  }
                  placeholder="এই কোর্স শেষে শিক্ষকরা কী কী দক্ষতা অর্জন করবেন তা সংক্ষেপে লিখুন..."
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>
            </div>

            {/* Cover Image Upload & Preview */}
            <div className="pt-4 border-t border-white/75 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-36 aspect-[4/3] rounded-xl overflow-hidden border border-white/80 glass-well shrink-0">
                <img
                  src={courseDraft.imagePath || tpackImg}
                  alt="কোর্স কভার প্রিভিউ"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover block"
                />
              </div>
              <div className="space-y-2 flex-1">
                <div className="text-xs font-semibold text-[#132219]">
                  কোর্স কভার ছবি আপলোড বা প্রিসেট নির্বাচন
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5 text-[#15803D]" />
                    <span>কভার ছবি আপলোড</span>
                  </button>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setCourseDraft((prev) => ({
                          ...prev,
                          imagePath: opt.presetImage
                        }))
                      }
                      className="px-2.5 py-1.5 text-[11px] font-medium text-[#3F5247] hover:text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
                    >
                      {opt.label} ছবি
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Lessons Builder */}
            <div className="pt-4 border-t border-white/75 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#132219]">
                  পাঠ্য মডিউলসমূহ ({toBengaliDigits(courseDraft.lessons.length)})
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCourseDraft((prev) => ({
                      ...prev,
                      lessons: [
                        ...prev.lessons,
                        createEmptyLesson(prev.lessons.length, prev.id)
                      ]
                    }))
                  }
                  disabled={courseDraft.lessons.length >= 25}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>মডিউল যুক্ত করুন</span>
                </button>
              </div>

              <div className="space-y-4">
                {courseDraft.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-xl glass-well space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#15803D]">
                        মডিউল {toBengaliDigits(idx + 1)}
                      </span>
                      {courseDraft.lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCourseDraft((prev) => ({
                              ...prev,
                              lessons: prev.lessons.filter(
                                (item) => item.id !== lesson.id
                              )
                            }))
                          }
                          className="text-xs text-[#3F5247] hover:text-[#DC2626] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>অপসারণ</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCourseDraft((prev) => ({
                              ...prev,
                              lessons: prev.lessons.map((item) =>
                                item.id === lesson.id
                                  ? { ...item, title: val }
                                  : item
                              )
                            }));
                          }}
                          placeholder="মডিউলের শিরোনাম *"
                          className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>
                      <input
                        type="text"
                        value={lesson.durationLabel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCourseDraft((prev) => ({
                            ...prev,
                            lessons: prev.lessons.map((item) =>
                              item.id === lesson.id
                                ? { ...item, durationLabel: val }
                                : item
                            )
                          }));
                        }}
                        placeholder="সময় (যেমন ০৩:০০)"
                        className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={lesson.material.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCourseDraft((prev) => ({
                            ...prev,
                            lessons: prev.lessons.map((item) =>
                              item.id === lesson.id
                                ? {
                                    ...item,
                                    material: { ...item.material, title: val }
                                  }
                                : item
                            )
                          }));
                        }}
                        placeholder="সংশ্লিষ্ট লেসন উপকরণের নাম"
                        className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                      />
                      <input
                        type="text"
                        value={lesson.chapters[0]?.caption ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCourseDraft((prev) => ({
                            ...prev,
                            lessons: prev.lessons.map((item) =>
                              item.id === lesson.id
                                ? {
                                    ...item,
                                    chapters: [
                                      {
                                        timeSec: 0,
                                        title:
                                          item.chapters[0]?.title ??
                                          'পাঠ পরিচিতি',
                                        caption: val
                                      },
                                      ...item.chapters.slice(1)
                                    ]
                                  }
                                : item
                            )
                          }));
                        }}
                        placeholder="ভিডিও/পাঠ সারসংক্ষেপ ক্যাপশন"
                        className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={lesson.material.summary}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCourseDraft((prev) => ({
                          ...prev,
                          lessons: prev.lessons.map((item) =>
                            item.id === lesson.id
                              ? {
                                  ...item,
                                  material: { ...item.material, summary: val }
                                }
                              : item
                          )
                        }));
                      }}
                      placeholder="মডিউলের মূল পাঠ সারসংক্ষেপ ও শিক্ষণ কৌশল..."
                      className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Quiz Builder */}
            <div className="pt-4 border-t border-white/75 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#132219]">
                  মূল্যায়ন কুইজ প্রশ্ন ({toBengaliDigits(courseDraft.quiz.length)})
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCourseDraft((prev) => ({
                      ...prev,
                      quiz: [
                        ...prev.quiz,
                        createEmptyQuizQuestion(prev.quiz.length)
                      ]
                    }))
                  }
                  disabled={courseDraft.quiz.length >= 30}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-lg cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>প্রশ্ন যুক্ত করুন</span>
                </button>
              </div>

              <div className="space-y-4">
                {courseDraft.quiz.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl glass-well space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#132219]">
                        প্রশ্ন {toBengaliDigits(qIdx + 1)}
                      </span>
                      {courseDraft.quiz.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCourseDraft((prev) => ({
                              ...prev,
                              quiz: prev.quiz.filter((item) => item.id !== q.id)
                            }))
                          }
                          className="text-xs text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                        >
                          অপসারণ
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCourseDraft((prev) => ({
                          ...prev,
                          quiz: prev.quiz.map((item) =>
                            item.id === q.id ? { ...item, question: val } : item
                          )
                        }));
                      }}
                      placeholder="বহুনির্বাচনী প্রশ্ন লিখুন..."
                      className="w-full px-3 py-2 text-xs glass-input rounded-lg text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctIndex === oIdx}
                            onChange={() =>
                              setCourseDraft((prev) => ({
                                ...prev,
                                quiz: prev.quiz.map((item) =>
                                  item.id === q.id
                                    ? { ...item, correctIndex: oIdx }
                                    : item
                                )
                              }))
                            }
                            aria-label={`বিকল্প ${oIdx + 1} সঠিক`}
                            className="accent-[#15803D] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCourseDraft((prev) => ({
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
                            className="flex-1 px-2.5 py-1.5 text-xs glass-input rounded-lg text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCourseDraft((prev) => ({
                          ...prev,
                          quiz: prev.quiz.map((item) =>
                            item.id === q.id
                              ? { ...item, explanation: val }
                              : item
                          )
                        }));
                      }}
                      placeholder="সঠিক উত্তরের সংক্ষিপ্ত ব্যাখ্যা..."
                      className="w-full px-3 py-1.5 text-xs glass-input rounded-lg text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {courseFeedback && (
              <div
                role="status"
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  courseFeedback.type === 'success'
                    ? 'bg-[#ECF2ED]/90 border-[#15803D]/30 text-[#14532D]'
                    : 'bg-[#FEF2F2]/90 border-[#FECACA] text-[#B91C1C]'
                }`}
              >
                {courseFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#15803D]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{courseFeedback.text}</span>
              </div>
            )}

            <div className="pt-3 border-t border-white/75 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#132219] cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseDraft.published}
                  onChange={(e) =>
                    setCourseDraft((prev) => ({
                      ...prev,
                      published: e.target.checked
                    }))
                  }
                  className="w-4 h-4 accent-[#15803D] rounded cursor-pointer"
                />
                <span>সরাসরি কোর্স ক্যাটালগে প্রকাশ করুন</span>
              </label>

              <button
                type="submit"
                disabled={courseSaving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] disabled:opacity-60 cursor-pointer"
              >
                {courseSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {editingCourseId
                    ? 'কোর্স হালনাগাদ করুন'
                    : 'কোর্স সংরক্ষণ ও প্রকাশ করুন'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: TRAINING MATERIALS UPLOAD */}
      {subTab === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Uploaded Materials List */}
          <div className="lg:col-span-5 glass-surface rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#132219]">
                আপলোডকৃত উপকরণ ({toBengaliDigits(uploadedMaterials.length)})
              </h2>
              <button
                type="button"
                onClick={handleStartNewMaterial}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন উপকরণ</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#3F5247] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="আপলোডকৃত উপকরণ খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>

            {filteredUploadedMaterials.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-[#B6C7BC] rounded-xl glass-well space-y-2">
                <FileText className="w-6 h-6 text-[#3F5247] mx-auto" />
                <div className="text-xs font-semibold text-[#132219]">
                  এখনো কোনো অতিরিক্ত উপকরণ আপলোড করা হয়নি
                </div>
                <p className="text-xs text-[#3F5247] leading-relaxed">
                  ডানপাশের ফাইল আপলোডারে `.txt` বা `.md` লেসন প্ল্যান ড্র্যাগ করুন অথবা ফর্ম পূরণ করে যুক্ত করুন।
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/75 glass-well rounded-xl overflow-hidden">
                {filteredUploadedMaterials.map((mat) => {
                  const isEditing = editingMaterialId === mat.id;
                  return (
                    <div
                      key={mat.id}
                      className={`p-3.5 space-y-2 ${
                        isEditing ? 'bg-[#ECF2ED]/85' : 'bg-white/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] text-[#3F5247] flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-[#15803D]">
                            {mat.formatLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{mat.published ? 'প্রকাশিত' : 'খসড়া'}</span>
                          {mat.attachmentName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[140px]">
                                {mat.attachmentName}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-bold text-[#132219] truncate mt-0.5">
                          {mat.title}
                        </div>
                        <div className="text-[11px] text-[#3F5247] truncate">
                          কোর্স: {mat.courseTitle}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectMaterialForEdit(mat)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#15803D]" />
                          <span>সম্পাদনা</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void onSaveMaterial(
                              { ...mat, published: !mat.published },
                              false
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#3F5247] btn-3d-glass rounded-lg cursor-pointer"
                        >
                          {mat.published ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>খসড়া</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-[#15803D]" />
                              <span>প্রকাশ</span>
                            </>
                          )}
                        </button>

                        {confirmDeleteMaterialId === mat.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                void onDeleteMaterial(mat.id);
                                if (editingMaterialId === mat.id) {
                                  handleStartNewMaterial();
                                }
                                setConfirmDeleteMaterialId(null);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#DC2626] rounded-lg cursor-pointer"
                            >
                              মুছুন
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMaterialId(null)}
                              className="px-2 py-1 text-xs text-[#3F5247] cursor-pointer"
                            >
                              বাতিল
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMaterialId(mat.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#3F5247] hover:text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>মুছুন</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Material Upload Form */}
          <form
            onSubmit={handleSubmitMaterial}
            className="lg:col-span-7 glass-surface rounded-2xl p-6 sm:p-7 space-y-5"
          >
            <div className="pb-4 border-b border-white/75">
              <h2 className="text-lg font-bold text-[#132219]">
                {editingMaterialId
                  ? 'প্রশিক্ষণ উপকরণ হালনাগাদ করুন'
                  : 'নতুন প্রশিক্ষণ উপকরণ ও হ্যান্ডআউট আপলোড'}
              </h2>
              <p className="text-xs text-[#3F5247] mt-0.5">
                আপলোডকৃত উপকরণগুলো সরাসরি “প্রশিক্ষণ উপকরণ” লাইব্রেরিতে পাঠযোগ্য ও ডাউনলোডযোগ্য হিসেবে প্রদর্শিত হবে।
              </p>
            </div>

            {/* Drag and Drop Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setMaterialDragging(true);
              }}
              onDragLeave={() => setMaterialDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setMaterialDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) {
                  void processUploadedMaterialFile(dropped);
                }
              }}
              className={`p-5 rounded-xl border-2 border-dashed text-center space-y-2.5 transition-colors glass-well ${
                materialDragging
                  ? 'border-[#15803D] bg-[#ECF2ED]/85'
                  : 'border-[#B6C7BC]'
              }`}
            >
              <input
                ref={materialFileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void processUploadedMaterialFile(file);
                }}
                className="hidden"
              />
              <div className="w-11 h-11 rounded-xl glass-3d-icon-well flex items-center justify-center mx-auto">
                <FileUp className="w-5 h-5 text-[#15803D]" />
              </div>
              <div className="text-sm font-semibold text-[#132219]">
                এখানে হ্যান্ডআউট ফাইল ড্র্যাগ করে ছেড়ে দিন
              </div>
              <p className="text-xs text-[#3F5247]">
                `.txt`, `.md`, `.csv`, `.json` ফাইলের লেখা স্বয়ংক্রিয়ভাবে পড়া হবে ও প্রিভিউ তৈরি হবে।
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => materialFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ফাইল নির্বাচন করুন</span>
                </button>
                {materialDraft.attachmentName && (
                  <span className="text-xs font-medium text-[#15803D]">
                    সংযুক্ত: {materialDraft.attachmentName}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  উপকরণের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={materialDraft.title}
                  onChange={(e) =>
                    setMaterialDraft((prev) => ({
                      ...prev,
                      title: e.target.value
                    }))
                  }
                  placeholder="যেমন: ৫ই মডেল ও সক্রিয় শ্রেণিকক্ষ হ্যান্ডআউট"
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  সংশ্লিষ্ট প্রশিক্ষণ কোর্স
                </label>
                <select
                  value={materialDraft.courseId}
                  onChange={(e) =>
                    setMaterialDraft((prev) => ({
                      ...prev,
                      courseId: e.target.value
                    }))
                  }
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                >
                  {allAvailableCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  উপকরণের ধরন
                </label>
                <select
                  value={materialDraft.formatLabel}
                  onChange={(e) =>
                    setMaterialDraft((prev) => ({
                      ...prev,
                      formatLabel: e.target.value
                    }))
                  }
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                >
                  {FORMAT_OPTIONS.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  পাঠের আনুমানিক সময়
                </label>
                <input
                  type="text"
                  value={materialDraft.readTime}
                  onChange={(e) =>
                    setMaterialDraft((prev) => ({
                      ...prev,
                      readTime: e.target.value
                    }))
                  }
                  placeholder="৫ মিনিট পাঠ"
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  উপকরণের সারসংক্ষেপ *
                </label>
                <textarea
                  rows={3}
                  required
                  value={materialDraft.summary}
                  onChange={(e) =>
                    setMaterialDraft((prev) => ({
                      ...prev,
                      summary: e.target.value
                    }))
                  }
                  placeholder="শিক্ষকরা এই উপকরণ থেকে কী কী প্রয়োগযোগ্য দিকনির্দেশনা পাবেন..."
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  মূল শিক্ষণ পয়েন্ট (প্রতি লাইনে ১টি)
                </label>
                <textarea
                  rows={4}
                  value={keyPointsText}
                  onChange={(e) => setKeyPointsText(e.target.value)}
                  placeholder={'যেমন:\n- পাঠের শুরুতে পূর্বজ্ঞান যাচাই\n- দলীয় কাজের জন্য রুব্রিক বিতরণ'}
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  প্রস্তুতি চেকলিস্ট (প্রতি লাইনে ১টি)
                </label>
                <textarea
                  rows={4}
                  value={checklistText}
                  onChange={(e) => setChecklistText(e.target.value)}
                  placeholder={'যেমন:\n- প্রজেক্টর ও স্লাইড যাচাই করুন\n- এক্সিট টিকিট কাগজ প্রস্তুত রাখুন'}
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  উপযোগী শ্রেণি ও পিরিয়ড
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={materialDraft.classroomActivity.gradeLevel}
                    onChange={(e) =>
                      setMaterialDraft((prev) => ({
                        ...prev,
                        classroomActivity: {
                          ...prev.classroomActivity,
                          gradeLevel: e.target.value
                        }
                      }))
                    }
                    placeholder="৬ষ্ঠ – ১০ম শ্রেণি"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                  <input
                    type="text"
                    value={materialDraft.classroomActivity.duration}
                    onChange={(e) =>
                      setMaterialDraft((prev) => ({
                        ...prev,
                        classroomActivity: {
                          ...prev.classroomActivity,
                          duration: e.target.value
                        }
                      }))
                    }
                    placeholder="৪৫ মিনিট"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  শ্রেণিকক্ষ শিখনফল
                </label>
                <input
                  type="text"
                  value={materialDraft.classroomActivity.objective}
                  onChange={(e) =>
                    setMaterialDraft((prev) => ({
                      ...prev,
                      classroomActivity: {
                        ...prev.classroomActivity,
                        objective: e.target.value
                      }
                    }))
                  }
                  placeholder="শিক্ষার্থীরা সক্রিয় অনুশীলনের মাধ্যমে মূল ধারণা আয়ত্ত করবে"
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-[#3F5247]">
                  ডকুমেন্ট / হ্যান্ডআউট বিষয়বস্তু (ঐচ্ছিক পাঠযোগ্য অংশ)
                </label>
                <textarea
                  rows={4}
                  value={materialDraft.attachmentContent}
                  onChange={(e) =>
                    setMaterialDraft((prev) => ({
                      ...prev,
                      attachmentContent: e.target.value
                    }))
                  }
                  placeholder="ফাইল আপলোড করলে এখানে পূর্ণ টেক্সট দেখা যাবে, অথবা সরাসরি এখানে হ্যান্ডআউট কনটেন্ট পেস্ট করুন..."
                  className="w-full px-3.5 py-2 text-xs font-mono leading-relaxed glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>
            </div>

            {materialFeedback && (
              <div
                role="status"
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  materialFeedback.type === 'success'
                    ? 'bg-[#ECF2ED]/90 border-[#15803D]/30 text-[#14532D]'
                    : 'bg-[#FEF2F2]/90 border-[#FECACA] text-[#B91C1C]'
                }`}
              >
                {materialFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#15803D]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{materialFeedback.text}</span>
              </div>
            )}

            <div className="pt-3 border-t border-white/75 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#132219] cursor-pointer">
                <input
                  type="checkbox"
                  checked={materialDraft.published}
                  onChange={(e) =>
                    setMaterialDraft((prev) => ({
                      ...prev,
                      published: e.target.checked
                    }))
                  }
                  className="w-4 h-4 accent-[#15803D] rounded cursor-pointer"
                />
                <span>উপকরণ লাইব্রেরিতে প্রকাশ করুন</span>
              </label>

              <button
                type="submit"
                disabled={materialSaving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] disabled:opacity-60 cursor-pointer"
              >
                {materialSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileUp className="w-4 h-4" />
                )}
                <span>
                  {editingMaterialId
                    ? 'উপকরণ হালনাগাদ করুন'
                    : 'উপকরণ আপলোড ও প্রকাশ করুন'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: FULL CATALOG OVERVIEW TABLE */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="glass-surface rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/75 flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-[#132219]">
                সকল কোর্স ({toBengaliDigits(allAvailableCourses.length)})
              </h2>
              <span className="text-xs text-[#3F5247]">
                মূল কারিকুলাম ও কাস্টম আপলোডকৃত কোর্স
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/75 bg-white/40 text-[#3F5247]">
                    <th className="py-3 px-4 font-semibold">কোর্স শিরোনাম</th>
                    <th className="py-3 px-4 font-semibold">বিভাগ</th>
                    <th className="py-3 px-4 font-semibold">মডিউল / কুইজ</th>
                    <th className="py-3 px-4 font-semibold">উৎস ও অবস্থা</th>
                    <th className="py-3 px-4 font-semibold text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/75">
                  {allAvailableCourses.map((c) => {
                    const customRec = customCourses.find((cc) => cc.id === c.id);
                    const isPublished = customRec ? customRec.published : true;
                    return (
                      <tr key={c.id} className="hover:bg-white/45 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#132219]">
                          {c.title}
                        </td>
                        <td className="py-3 px-4 text-[#3F5247]">
                          {c.categoryLabel}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-[#3F5247]">
                          {toBengaliDigits(c.lessons.length)} মডিউল ·{' '}
                          {toBengaliDigits(c.quiz.length)} প্রশ্ন
                        </td>
                        <td className="py-3 px-4 text-[#3F5247]">
                          {customRec ? 'কাস্টম' : 'মূল'} ·{' '}
                          <span
                            className={
                              isPublished
                                ? 'text-[#15803D] font-semibold'
                                : 'text-[#B45309] font-semibold'
                            }
                          >
                            {isPublished ? 'প্রকাশিত' : 'খসড়া'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenCourseInClassroom(c.id)}
                            className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
                          >
                            ক্লাসরুম
                          </button>
                          {customRec && (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectCourseForEdit(customRec);
                                setSubTab('courses');
                              }}
                              className="text-xs font-semibold text-[#132219] hover:underline cursor-pointer"
                            >
                              সম্পাদনা
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-surface rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/75 flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-[#132219]">
                আপলোডকৃত প্রশিক্ষণ উপকরণ ({toBengaliDigits(uploadedMaterials.length)})
              </h2>
              <button
                type="button"
                onClick={onOpenMaterialsLibrary}
                className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
              >
                উপকরণ লাইব্রেরি দেখুন
              </button>
            </div>
            {uploadedMaterials.length === 0 ? (
              <div className="p-6 text-xs text-[#3F5247] text-center">
                এখনো কোনো আলাদা উপকরণ আপলোড করা হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/75 bg-white/40 text-[#3F5247]">
                      <th className="py-3 px-4 font-semibold">উপকরণের শিরোনাম</th>
                      <th className="py-3 px-4 font-semibold">সংশ্লিষ্ট কোর্স</th>
                      <th className="py-3 px-4 font-semibold">ধরন ও ফাইল</th>
                      <th className="py-3 px-4 font-semibold">অবস্থা</th>
                      <th className="py-3 px-4 font-semibold text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/75">
                    {uploadedMaterials.map((m) => (
                      <tr key={m.id} className="hover:bg-white/45 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#132219]">
                          {m.title}
                        </td>
                        <td className="py-3 px-4 text-[#3F5247]">
                          {m.courseTitle}
                        </td>
                        <td className="py-3 px-4 text-[#3F5247]">
                          {m.formatLabel}
                          {m.attachmentName ? ` · ${m.attachmentName}` : ''}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              m.published
                                ? 'text-[#15803D] font-semibold'
                                : 'text-[#B45309] font-semibold'
                            }
                          >
                            {m.published ? 'প্রকাশিত' : 'খসড়া'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectMaterialForEdit(m);
                              setSubTab('materials');
                            }}
                            className="text-xs font-semibold text-[#132219] hover:underline cursor-pointer"
                          >
                            সম্পাদনা
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
