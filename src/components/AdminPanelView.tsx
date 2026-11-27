import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Film,
  Layers,
  Link2,
  Loader2,
  Lock,
  LogIn,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  Video
} from 'lucide-react';
import {
  AccessControlConfig,
  AdminRoleRecord,
  Course,
  CustomCourseRecord,
  PaymentRequestRecord,
  UploadedMaterialItem,
  UserAccessRecord
} from '../types/lms';
import { toBengaliDigits } from '../utils/lmsHelpers';
import { parseVideoSource, sanitizeSafeMediaUrl } from '../utils/accessHelpers';
import {
  deleteMaterialVideoBlob,
  getMaterialVideoBlob,
  saveMaterialVideoBlob
} from '../utils/videoStorage';
import { ModuleManageEditorTab } from './ModuleManageEditorTab';
import { SuperAdminControlTab } from './SuperAdminControlTab';

interface AdminPanelViewProps {
  authUser: User | null;
  isSuperAdmin: boolean;
  canManageModules: boolean;
  allManagedCourses: Course[];
  customCourses: CustomCourseRecord[];
  builtInIds: Set<string>;
  overrideIds: Set<string>;
  hiddenCourseIds: string[];
  uploadedMaterials: UploadedMaterialItem[];
  accessConfig: AccessControlConfig;
  userAccessList: UserAccessRecord[];
  paymentRequests: PaymentRequestRecord[];
  adminRoles: AdminRoleRecord[];
  onSaveModule: (course: CustomCourseRecord, isBuiltIn: boolean) => Promise<void>;
  onRevertBuiltInOverride: (courseId: string) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onReorderModules: (orderedIds: string[]) => Promise<void>;
  onToggleModuleVisibility: (courseId: string) => Promise<void>;
  onBatchRenumberModules: () => Promise<void>;
  onResetLayoutToDefault: () => Promise<void>;
  onSaveMaterial: (
    material: UploadedMaterialItem,
    isNew: boolean
  ) => Promise<void>;
  onDeleteMaterial: (materialId: string) => Promise<void>;
  onSaveAccessControl: (config: AccessControlConfig) => Promise<void>;
  onUpdateUserAccess: (
    targetUserId: string,
    patch: {
      displayName?: string;
      planTier: UserAccessRecord['planTier'];
      trialStartedAtMs: number;
      trialEndsAtMs: number;
      proActivatedAtMs: number;
      proExpiresAtMs: number;
      allowFullOverride: boolean;
      customNote: string;
    }
  ) => Promise<void>;
  onReviewPaymentRequest: (
    req: PaymentRequestRecord,
    approve: boolean,
    reviewNote: string,
    existingUserAccess?: UserAccessRecord
  ) => Promise<void>;
  onToggleModuleManagerRole: (
    userRec: UserAccessRecord,
    shouldBeManager: boolean
  ) => Promise<void>;
  onOpenLogin: () => void;
  onOpenCourseInClassroom: (courseId: string) => void;
  onOpenMaterialsLibrary: () => void;
}

type AdminSubTab = 'organizer' | 'materials' | 'super-control' | 'overview';

const FORMAT_OPTIONS = [
  'লেসন প্ল্যান',
  'হ্যান্ডআউট',
  'মূল্যায়ন রুব্রিক',
  'ওয়ার্কশিট',
  'গবেষণা গাইড',
  'ভিডিও পাঠ উপকরণ',
  'আপলোডকৃত ডকুমেন্ট'
];

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
    videoSourceType: 'none',
    videoUrl: '',
    videoFileName: '',
    videoFileSizeLabel: '',
    videoMimeType: '',
    published: true
  };
}

function formatFileSizeMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${toBengaliDigits(mb.toFixed(1))} MB`;
  }
  const kb = Math.max(1, Math.round(bytes / 1024));
  return `${toBengaliDigits(kb)} KB`;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  authUser,
  isSuperAdmin,
  canManageModules,
  allManagedCourses,
  customCourses,
  builtInIds,
  overrideIds,
  hiddenCourseIds,
  uploadedMaterials,
  accessConfig,
  userAccessList,
  paymentRequests,
  adminRoles,
  onSaveModule,
  onRevertBuiltInOverride,
  onDeleteCourse,
  onReorderModules,
  onToggleModuleVisibility,
  onBatchRenumberModules,
  onResetLayoutToDefault,
  onSaveMaterial,
  onDeleteMaterial,
  onSaveAccessControl,
  onUpdateUserAccess,
  onReviewPaymentRequest,
  onToggleModuleManagerRole,
  onOpenLogin,
  onOpenCourseInClassroom,
  onOpenMaterialsLibrary
}) => {
  const [subTab, setSubTab] = useState<AdminSubTab>('organizer');
  const [materialSearch, setMaterialSearch] = useState('');

  // Material Uploader State
  const [materialDraft, setMaterialDraft] = useState<UploadedMaterialItem>(() =>
    createEmptyMaterialDraft(allManagedCourses)
  );
  const [keyPointsText, setKeyPointsText] = useState('');
  const [checklistText, setChecklistText] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null
  );
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [materialSaving, setMaterialSaving] = useState(false);
  const [materialDragging, setMaterialDragging] = useState(false);
  const [videoDragging, setVideoDragging] = useState(false);
  const [materialFeedback, setMaterialFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmDeleteMaterialId, setConfirmDeleteMaterialId] = useState<
    string | null
  >(null);

  const materialFileInputRef = useRef<HTMLInputElement | null>(null);
  const materialVideoInputRef = useRef<HTMLInputElement | null>(null);

  const isCloudAdmin = canManageModules;

  useEffect(() => {
    let activeUrl = '';
    let cancelled = false;

    if (pendingVideoFile) {
      activeUrl = URL.createObjectURL(pendingVideoFile);
      setVideoPreviewUrl(activeUrl);
    } else if (materialDraft.videoSourceType === 'upload') {
      void getMaterialVideoBlob(materialDraft.id).then((blob) => {
        if (cancelled || !blob) return;
        activeUrl = URL.createObjectURL(blob);
        setVideoPreviewUrl(activeUrl);
      });
    } else {
      setVideoPreviewUrl('');
    }

    return () => {
      cancelled = true;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [pendingVideoFile, materialDraft.id, materialDraft.videoSourceType]);

  const hiddenSet = useMemo(() => new Set(hiddenCourseIds), [hiddenCourseIds]);
  const visibleCourseCount = useMemo(
    () => allManagedCourses.filter((c) => !hiddenSet.has(c.id)).length,
    [allManagedCourses, hiddenSet]
  );
  const pureCustomCount = useMemo(
    () => customCourses.filter((c) => !builtInIds.has(c.id)).length,
    [customCourses, builtInIds]
  );

  const filteredUploadedMaterials = useMemo(() => {
    const q = materialSearch.trim().toLowerCase();
    if (!q) return uploadedMaterials;
    return uploadedMaterials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.courseTitle.toLowerCase().includes(q) ||
        m.formatLabel.toLowerCase().includes(q) ||
        m.attachmentName.toLowerCase().includes(q) ||
        (m.videoFileName?.toLowerCase().includes(q) ?? false)
    );
  }, [uploadedMaterials, materialSearch]);

  // Material Uploader Handlers
  const handleStartNewMaterial = () => {
    setEditingMaterialId(null);
    const fresh = createEmptyMaterialDraft(allManagedCourses);
    setMaterialDraft(fresh);
    setPendingVideoFile(null);
    setKeyPointsText('');
    setChecklistText('');
    setMaterialFeedback(null);
  };

  const handleSelectMaterialForEdit = (mat: UploadedMaterialItem) => {
    setEditingMaterialId(mat.id);
    setPendingVideoFile(null);
    setMaterialDraft({
      videoSourceType: 'none',
      videoUrl: '',
      videoFileName: '',
      videoFileSizeLabel: '',
      videoMimeType: '',
      ...mat
    });
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

  const processUploadedVideoFile = (file: File) => {
    setMaterialFeedback(null);
    const maxBytes = 120 * 1024 * 1024;
    if (file.size > maxBytes) {
      setMaterialFeedback({
        type: 'error',
        text: 'ভিডিও ফাইলটি ১২০ MB-এর কম হতে হবে। বড় ভিডিওর ক্ষেত্রে ভিডিও লিংক অপশন ব্যবহার করুন।'
      });
      return;
    }
    const lowerName = file.name.toLowerCase();
    const isVideoFile =
      file.type.startsWith('video/') ||
      lowerName.endsWith('.mp4') ||
      lowerName.endsWith('.webm') ||
      lowerName.endsWith('.mov') ||
      lowerName.endsWith('.m4v');
    if (!isVideoFile) {
      setMaterialFeedback({
        type: 'error',
        text: 'অনুগ্রহ করে .mp4, .webm বা .mov ভিডিও ফাইল নির্বাচন করুন।'
      });
      return;
    }

    setPendingVideoFile(file);
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    setMaterialDraft((prev) => ({
      ...prev,
      title: prev.title.trim() || baseName || file.name,
      videoSourceType: 'upload',
      videoUrl: '',
      videoFileName: file.name,
      videoFileSizeLabel: formatFileSizeMb(file.size),
      videoMimeType: file.type || 'video/mp4'
    }));
    setMaterialFeedback({
      type: 'success',
      text: `ভিডিও "${file.name}" (${formatFileSizeMb(file.size)}) সংযুক্ত হয়েছে। সংরক্ষণ করতে নিচের আপলোড বাটনে ক্লিক করুন।`
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

    if (materialDraft.videoSourceType === 'link') {
      const safeUrl = sanitizeSafeMediaUrl(materialDraft.videoUrl);
      if (!safeUrl) {
        setMaterialFeedback({
          type: 'error',
          text: 'বৈধ http:// বা https:// ভিডিও লিংক দিন (YouTube, Vimeo, Google Drive বা MP4 URL)।'
        });
        return;
      }
    }

    const targetCourse =
      allManagedCourses.find((c) => c.id === materialDraft.courseId) ??
      allManagedCourses[0];

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

    const videoMode = materialDraft.videoSourceType ?? 'none';

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
      },
      videoSourceType: videoMode,
      videoUrl:
        videoMode === 'link' ? sanitizeSafeMediaUrl(materialDraft.videoUrl) : '',
      videoFileName:
        videoMode === 'upload' ? materialDraft.videoFileName ?? '' : '',
      videoFileSizeLabel:
        videoMode === 'upload' ? materialDraft.videoFileSizeLabel ?? '' : '',
      videoMimeType:
        videoMode === 'upload' ? materialDraft.videoMimeType ?? 'video/mp4' : ''
    };

    setMaterialSaving(true);
    try {
      if (videoMode === 'upload' && pendingVideoFile) {
        await saveMaterialVideoBlob(preparedMaterial.id, pendingVideoFile);
      } else if (videoMode !== 'upload') {
        await deleteMaterialVideoBlob(preparedMaterial.id);
      }

      const isNew = editingMaterialId === null;
      await onSaveMaterial(preparedMaterial, isNew);
      setPendingVideoFile(null);
      setEditingMaterialId(preparedMaterial.id);
      setMaterialDraft(preparedMaterial);
      setMaterialFeedback({
        type: 'success',
        text: 'প্রশিক্ষণ উপকরণ ও ভিডিও সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে।'
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

  if (!canManageModules) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-surface rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl glass-3d-icon-well flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-[#15803D]" />
          </div>
          <h1 className="text-2xl font-bold text-[#132219]">
            সুপার অ্যাডমিন ও মডিউল ম্যানেজার এক্সেস সংরক্ষিত
          </h1>
          <p className="text-sm text-[#3F5247] leading-relaxed max-w-lg mx-auto">
            প্রশিক্ষণ মডিউল সাজানো, সম্পাদনা, ভিডিও উপকরণ আপলোড এবং ব্যবহারকারী এক্সেস নিয়ন্ত্রণ শুধুমাত্র অনুমোদিত সুপার অ্যাডমিন ও মডিউল ম্যানেজার অ্যাকাউন্টের জন্য সংরক্ষিত।
          </p>
          {!authUser && (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>অ্যাডমিন Google অ্যাকাউন্টে লগইন করুন</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Sync Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/75">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-[#15803D]">
            {isSuperAdmin
              ? 'Super Admin Studio · ট্রেনিং মডিউল ম্যানেজার ও সম্পূর্ণ এক্সেস কন্ট্রোল'
              : 'Module Manager Studio · মডিউল বিন্যাস ও কনটেন্ট কাস্টমাইজেশন'}
          </div>
          <h1 className="text-3xl font-bold text-[#132219] tracking-tight">
            {isSuperAdmin
              ? 'সুপার অ্যাডমিন ও ট্রেনিং মডিউল ম্যানেজার'
              : 'ট্রেনিং মডিউল ম্যানেজ ও এডিট প্যানেল'}
          </h1>
          <p className="text-sm sm:text-base text-[#3F5247]">
            {isSuperAdmin
              ? 'সকল প্রশিক্ষণ মডিউল সাজান ও এডিট করুন, ভিডিও লিংক বা ভিডিও ফাইলসহ উপকরণ আপলোড করুন এবং ইউজার এক্সেস, ৭ দিনের ফ্রি ট্রায়াল ও ৳১,০০০ বার্ষিক প্রো প্ল্যান নিয়ন্ত্রণ করুন।'
              : 'প্রতিটি প্রশিক্ষণ মডিউলের ক্রম সাজান, শিরোনাম, ভিডিও পাঠ, ৫-ধাপ সার্টিফিকেশন পাথওয়ে, মূল্যায়ন কুইজ এবং প্রশিক্ষণ উপকরণ সম্পাদনা করুন।'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-well text-xs font-semibold text-[#14532D]">
            <Cloud className="w-4 h-4 text-[#15803D]" />
            <span>
              {isSuperAdmin ? 'সুপার অ্যাডমিন ক্লাউড সিঙ্ক সক্রিয়' : 'মডিউল ম্যানেজার সক্রিয়'}
            </span>
          </div>
        </div>
      </div>

      {/* 4-Column Tabular KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">দৃশ্যমান সক্রিয় মডিউল</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219] mt-1">
            {toBengaliDigits(visibleCourseCount)}/{toBengaliDigits(allManagedCourses.length)}টি
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            {toBengaliDigits(hiddenCourseIds.length)}টি লুকানো
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">সম্পাদিত ও নতুন মডিউল</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#15803D] mt-1">
            {toBengaliDigits(overrideIds.size + pureCustomCount)}টি
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            {toBengaliDigits(overrideIds.size)}টি মূল কাস্টমাইজড · {toBengaliDigits(pureCustomCount)}টি নতুন
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">আপলোডকৃত উপকরণ</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219] mt-1">
            {toBengaliDigits(uploadedMaterials.length)}টি
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            ভিডিও, হ্যান্ডআউট ও রুব্রিক
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">
            {isSuperAdmin ? 'নিবন্ধিত শিক্ষক ও পেমেন্ট' : 'সংরক্ষণ মাধ্যম'}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219] mt-1">
            {isSuperAdmin
              ? `${toBengaliDigits(userAccessList.length)} জন`
              : 'Firestore ক্লাউড'}
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            {isSuperAdmin
              ? `${toBengaliDigits(paymentRequests.filter((r) => r.status === 'pending').length)}টি পেমেন্ট অপেক্ষমাণ`
              : 'রিয়েল-টাইম ক্লাউড সিঙ্ক'}
          </div>
        </div>
      </div>

      {/* Workspace Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 glass-well rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab('organizer')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'organizer'
              ? 'btn-3d-glass text-[#132219] font-semibold'
              : 'text-[#3F5247] hover:text-[#132219]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#15803D]" />
          <span>মডিউল সাজান ও এডিট</span>
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
          <span>প্রশিক্ষণ উপকরণ ও ভিডিও আপলোড</span>
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setSubTab('super-control')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'super-control'
                ? 'btn-3d-glass text-[#132219] font-semibold'
                : 'text-[#3F5247] hover:text-[#132219]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#15803D]" />
            <span>সুপার অ্যাডমিন কন্ট্রোল</span>
          </button>
        )}
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

      {/* TAB 1: MODULE MANAGE & EDIT STUDIO */}
      {subTab === 'organizer' && (
        <ModuleManageEditorTab
          allManagedCourses={allManagedCourses}
          builtInIds={builtInIds}
          overrideIds={overrideIds}
          hiddenCourseIds={hiddenCourseIds}
          isCloudAdmin={isCloudAdmin}
          onSaveModule={onSaveModule}
          onRevertBuiltInOverride={onRevertBuiltInOverride}
          onDeleteCustomCourse={onDeleteCourse}
          onReorderModules={onReorderModules}
          onToggleModuleVisibility={onToggleModuleVisibility}
          onBatchRenumberModules={onBatchRenumberModules}
          onResetLayoutToDefault={onResetLayoutToDefault}
          onOpenCourseInClassroom={onOpenCourseInClassroom}
        />
      )}

      {/* TAB 3: SUPER ADMIN CONTROL PANEL */}
      {subTab === 'super-control' && isSuperAdmin && authUser && (
        <SuperAdminControlTab
          currentAdminUid={authUser.uid}
          accessConfig={accessConfig}
          userAccessList={userAccessList}
          paymentRequests={paymentRequests}
          adminRoles={adminRoles}
          onSaveAccessControl={onSaveAccessControl}
          onUpdateUserAccess={onUpdateUserAccess}
          onReviewPaymentRequest={onReviewPaymentRequest}
          onToggleModuleManagerRole={onToggleModuleManagerRole}
        />
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
                          {mat.videoSourceType === 'link' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-0.5 text-[#15803D] font-medium">
                                <Link2 className="w-3 h-3" />
                                <span>ভিডিও লিংক</span>
                              </span>
                            </>
                          )}
                          {mat.videoSourceType === 'upload' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-0.5 text-[#15803D] font-medium">
                                <Film className="w-3 h-3" />
                                <span>আপলোড ভিডিও</span>
                              </span>
                            </>
                          )}
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
                                void deleteMaterialVideoBlob(mat.id);
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
                  {allManagedCourses.map((c) => (
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

              {/* Video Link & Video File Upload Panel */}
              <div className="sm:col-span-2 p-4 rounded-2xl glass-well space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#15803D]" />
                    <span className="text-xs font-bold text-[#132219]">
                      ভিডিও লিংক বা ভিডিও আপলোড যুক্ত করুন (ঐচ্ছিক)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-white/70 rounded-xl border border-white">
                    {(
                      [
                        { id: 'none', label: 'ভিডিও নেই' },
                        { id: 'link', label: 'ভিডিও লিংক' },
                        { id: 'upload', label: 'ভিডিও আপলোড' }
                      ] as { id: 'none' | 'link' | 'upload'; label: string }[]
                    ).map((mode) => {
                      const active =
                        (materialDraft.videoSourceType ?? 'none') === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            if (mode.id !== 'upload') {
                              setPendingVideoFile(null);
                            }
                            setMaterialDraft((prev) => ({
                              ...prev,
                              videoSourceType: mode.id
                            }));
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                            active
                              ? 'btn-3d-emerald font-semibold'
                              : 'text-[#3F5247] hover:text-[#132219]'
                          }`}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {materialDraft.videoSourceType === 'link' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#3F5247]">
                        ভিডিও URL (YouTube, Vimeo, Google Drive বা সরাসরি .mp4 লিংক)
                      </label>
                      <div className="relative">
                        <Link2 className="w-4 h-4 text-[#3F5247] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="url"
                          value={materialDraft.videoUrl ?? ''}
                          onChange={(e) =>
                            setMaterialDraft((prev) => ({
                              ...prev,
                              videoUrl: e.target.value
                            }))
                          }
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full pl-9 pr-3.5 py-2 text-xs glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                        />
                      </div>
                    </div>

                    {(() => {
                      const parsed = parseVideoSource(materialDraft.videoUrl);
                      if (parsed.kind === 'invalid') return null;
                      return (
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/90 border border-white/80">
                          {parsed.kind === 'direct' ? (
                            <video
                              src={parsed.embedOrSrcUrl}
                              controls
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <iframe
                              src={parsed.embedOrSrcUrl}
                              title="ভিডিও লিংক প্রিভিউ"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {materialDraft.videoSourceType === 'upload' && (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setVideoDragging(true);
                      }}
                      onDragLeave={() => setVideoDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setVideoDragging(false);
                        const dropped = e.dataTransfer.files?.[0];
                        if (dropped) processUploadedVideoFile(dropped);
                      }}
                      className={`p-4 rounded-xl border-2 border-dashed text-center space-y-2 transition-colors ${
                        videoDragging
                          ? 'border-[#15803D] bg-[#ECF2ED]/85'
                          : 'border-[#B6C7BC] bg-white/50'
                      }`}
                    >
                      <input
                        ref={materialVideoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) processUploadedVideoFile(file);
                        }}
                        className="hidden"
                      />
                      <Film className="w-5 h-5 text-[#15803D] mx-auto" />
                      <div className="text-xs font-semibold text-[#132219]">
                        ভিডিও ফাইল (.mp4, .webm, .mov) ড্র্যাগ করুন অথবা নির্বাচন করুন
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => materialVideoInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>ভিডিও ফাইল নির্বাচন</span>
                        </button>
                        {materialDraft.videoFileName && (
                          <span className="text-xs font-medium text-[#15803D]">
                            {materialDraft.videoFileName}
                            {materialDraft.videoFileSizeLabel
                              ? ` (${materialDraft.videoFileSizeLabel})`
                              : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {videoPreviewUrl && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/90 border border-white/80">
                        <video
                          src={videoPreviewUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
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
                সকল মডিউল ({toBengaliDigits(allManagedCourses.length)})
              </h2>
              <span className="text-xs text-[#3F5247]">
                বর্তমান সাজানো ক্রম অনুযায়ী মূল, সম্পাদিত ও কাস্টম মডিউল
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/75 bg-white/40 text-[#3F5247]">
                    <th className="py-3 px-4 font-semibold">ক্রম</th>
                    <th className="py-3 px-4 font-semibold">মডিউল শিরোনাম</th>
                    <th className="py-3 px-4 font-semibold">বিভাগ</th>
                    <th className="py-3 px-4 font-semibold">পাঠ / কুইজ</th>
                    <th className="py-3 px-4 font-semibold">উৎস ও অবস্থা</th>
                    <th className="py-3 px-4 font-semibold text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/75">
                  {allManagedCourses.map((c, idx) => {
                    const isBuiltIn = builtInIds.has(c.id);
                    const hasOverride = overrideIds.has(c.id);
                    const isHidden = hiddenSet.has(c.id);
                    const customRec = customCourses.find((cc) => cc.id === c.id);
                    const isPublished = customRec ? customRec.published : true;
                    return (
                      <tr key={c.id} className="hover:bg-white/45 transition-colors">
                        <td className="py-3 px-4 font-mono tabular-nums text-[#3F5247]">
                          {toBengaliDigits(String(idx + 1).padStart(2, '0'))}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#132219]">
                          {c.title}
                        </td>
                        <td className="py-3 px-4 text-[#3F5247]">
                          {c.categoryLabel}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-[#3F5247]">
                          {toBengaliDigits(c.lessons.length)} পাঠ ·{' '}
                          {toBengaliDigits(c.quiz.length)} প্রশ্ন
                        </td>
                        <td className="py-3 px-4 text-[#3F5247]">
                          {isBuiltIn
                            ? hasOverride
                              ? 'সম্পাদিত মূল'
                              : 'মূল কারিকুলাম'
                            : 'নতুন কাস্টম'}{' '}
                          ·{' '}
                          <span
                            className={
                              isHidden
                                ? 'text-[#B45309] font-semibold'
                                : isPublished
                                ? 'text-[#15803D] font-semibold'
                                : 'text-[#B45309] font-semibold'
                            }
                          >
                            {isHidden
                              ? 'লুকানো'
                              : isPublished
                              ? 'দৃশ্যমান'
                              : 'খসড়া'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenCourseInClassroom(c.id)}
                            className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
                          >
                            ক্লাসরুম
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubTab('organizer')}
                            className="text-xs font-semibold text-[#132219] hover:underline cursor-pointer"
                          >
                            ম্যানেজারে সাজান
                          </button>
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
