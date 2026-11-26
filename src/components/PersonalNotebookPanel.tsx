import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  NotebookPen,
  Plus,
  Save,
  Trash2,
  Volume2
} from 'lucide-react';
import {
  Course,
  Lesson,
  LessonNote,
  VoiceReflectionMeta
} from '../types/lms';
import {
  downloadLessonNoteTxt,
  hasLessonNoteContent,
  toBengaliDigits
} from '../utils/lmsHelpers';
import { VoiceReflectionRecorder } from './VoiceReflectionRecorder';

interface PersonalNotebookPanelProps {
  course: Course;
  lesson: Lesson;
  teacherName: string;
  savedNote?: LessonNote;
  allLessonNotes: Record<string, LessonNote>;
  onSaveNote: (
    lessonId: string,
    content: string,
    voiceReflections?: VoiceReflectionMeta[]
  ) => void;
  onDeleteNote: (lessonId: string) => void;
  onSelectLesson: (lessonId: string) => void;
}

const NOTE_PROMPTS = [
  {
    label: 'শ্রেণিকক্ষ প্রয়োগ',
    snippet: 'শ্রেণিকক্ষে প্রয়োগ পরিকল্পনা:\n- '
  },
  {
    label: 'মূল ভাবনা',
    snippet: 'এই পাঠের মূল শিক্ষণীয়:\n- '
  },
  {
    label: 'শিক্ষার্থীর প্রশ্ন/চ্যালেঞ্জ',
    snippet: 'সম্ভাব্য প্রশ্ন ও সমাধান:\n- '
  }
];

export const PersonalNotebookPanel: React.FC<PersonalNotebookPanelProps> = ({
  course,
  lesson,
  teacherName,
  savedNote,
  allLessonNotes,
  onSaveNote,
  onDeleteNote,
  onSelectLesson
}) => {
  const [draft, setDraft] = useState(savedNote?.content ?? '');
  const [justSaved, setJustSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync local draft when switching to another lesson or when external savedNote changes
  useEffect(() => {
    setDraft(savedNote?.content ?? '');
    setConfirmDelete(false);
    setJustSaved(false);
  }, [lesson.id, savedNote?.content]);

  const voiceReflections = savedNote?.voiceReflections ?? [];
  const savedContent = savedNote?.content ?? '';
  const isDirty = draft !== savedContent;
  const trimmedDraft = draft.trim();
  const hasAnyContent =
    Boolean(trimmedDraft) || voiceReflections.length > 0;
  const wordCount = trimmedDraft ? trimmedDraft.split(/\s+/).length : 0;
  const charCount = draft.length;

  // Debounced auto-save when user pauses typing
  useEffect(() => {
    if (!isDirty) return;
    const timer = window.setTimeout(() => {
      if (draft.trim() || voiceReflections.length > 0) {
        onSaveNote(lesson.id, draft, voiceReflections);
      } else if (savedNote) {
        onDeleteNote(lesson.id);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    draft,
    isDirty,
    lesson.id,
    savedNote,
    voiceReflections,
    onSaveNote,
    onDeleteNote
  ]);

  const handleManualSave = () => {
    if (draft.trim() || voiceReflections.length > 0) {
      onSaveNote(lesson.id, draft, voiceReflections);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2500);
    } else if (savedNote) {
      onDeleteNote(lesson.id);
    }
  };

  const handleAddVoiceReflection = (meta: VoiceReflectionMeta) => {
    const nextReflections = [...voiceReflections, meta];
    onSaveNote(lesson.id, draft, nextReflections);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2500);
  };

  const handleDeleteVoiceReflection = (clipId: string) => {
    const nextReflections = voiceReflections.filter((v) => v.id !== clipId);
    if (!draft.trim() && nextReflections.length === 0) {
      onDeleteNote(lesson.id);
    } else {
      onSaveNote(lesson.id, draft, nextReflections);
    }
  };

  const handleInsertPrompt = (snippet: string) => {
    setDraft((prev) => {
      const prefix = prev.trim().length > 0 ? `${prev.trimEnd()}\n\n` : '';
      return `${prefix}${snippet}`;
    });
  };

  const courseNotesList = course.lessons.filter((l) =>
    hasLessonNoteContent(allLessonNotes[l.id])
  );

  return (
    <div className="space-y-4">
      {/* Header & Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-[#4A5D52]">
          <NotebookPen className="w-4 h-4 text-[#15803D] shrink-0" />
          <span>
            <strong className="text-[#132219]">{lesson.number}</strong>-এর ব্যক্তিগত নোট ও অডিও প্রতিফলন
          </span>
        </div>

        <div className="text-xs font-mono tabular-nums text-[#4A5D52] shrink-0">
          {justSaved ? (
            <span className="inline-flex items-center gap-1 font-sans font-semibold text-[#15803D]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>নোট সংরক্ষিত হয়েছে</span>
            </span>
          ) : isDirty ? (
            <span className="font-sans text-[#B45309] font-medium">
              সংরক্ষণ হচ্ছে...
            </span>
          ) : savedNote ? (
            <span>সংরক্ষিত: {savedNote.updatedAt}</span>
          ) : (
            <span>এখনো কোনো নোট বা অডিও সংরক্ষিত হয়নি</span>
          )}
        </div>
      </div>

      {/* Microphone-Based Voice Reflection Recorder */}
      <VoiceReflectionRecorder
        lessonId={lesson.id}
        reflections={voiceReflections}
        onAddReflection={handleAddVoiceReflection}
        onDeleteReflection={handleDeleteVoiceReflection}
      />

      {/* Quick Structured Insert Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/75">
        <span className="text-xs text-[#3F5247]">দ্রুত লিখিত নোট যুক্ত করুন:</span>
        {NOTE_PROMPTS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleInsertPrompt(item.snippet)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#15803D]" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Textarea Editor */}
      <div>
        <label htmlFor={`lesson-note-${lesson.id}`} className="sr-only">
          {lesson.title} পাঠের ব্যক্তিগত নোট
        </label>
        <textarea
          id={`lesson-note-${lesson.id}`}
          rows={6}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="চাইলে এই পাঠের মূল শিক্ষণ কৌশল, আপনার শ্রেণিকক্ষের উপযোগী উদাহরণ বা প্রয়োগ নোট লিখুন—অথবা উপরে ভয়েস প্রতিফলন রেকর্ড করুন..."
          className="w-full p-4 text-sm leading-relaxed glass-input rounded-xl text-[#132219] placeholder:text-[#6B7E72] focus:outline-none focus:ring-2 focus:ring-[#15803D] resize-y min-h-[150px]"
        />
        <div className="mt-1.5 flex items-center justify-between text-xs font-mono tabular-nums text-[#3F5247]">
          <span>
            {toBengaliDigits(wordCount)} শব্দ · {toBengaliDigits(charCount)} অক্ষর
            {voiceReflections.length > 0
              ? ` · ${toBengaliDigits(voiceReflections.length)}টি অডিও`
              : ''}
          </span>
          <span>স্বয়ংক্রিয়ভাবে সংরক্ষিত</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!hasAnyContent && !savedNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-3d-emerald disabled:opacity-50 disabled:cursor-not-allowed rounded-xl min-h-[40px] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>নোট সংরক্ষণ করুন</span>
          </button>

          {hasAnyContent && (
            <button
              type="button"
              onClick={() =>
                downloadLessonNoteTxt({
                  courseTitle: course.title,
                  lessonNumber: lesson.number,
                  lessonTitle: lesson.title,
                  lessonId: lesson.id,
                  teacherName,
                  content: draft,
                  updatedAt:
                    savedNote?.updatedAt ??
                    new Date().toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }),
                  voiceReflections
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[40px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#15803D]" />
              <span>নোট ডাউনলোড (.TXT)</span>
            </button>
          )}
        </div>

        {(hasAnyContent || savedNote) && (
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft('');
                    onDeleteNote(lesson.id);
                    setConfirmDelete(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg cursor-pointer"
                >
                  নিশ্চিত মুছুন
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#3F5247] btn-3d-glass rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#3F5247] hover:text-[#DC2626] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>নোট মুছুন</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Saved Notes Directory across this Course */}
      {courseNotesList.length > 0 && (
        <div className="pt-4 border-t border-white/75 space-y-2.5">
          <div className="text-xs font-semibold text-[#132219]">
            এই কোর্সে আপনার সংরক্ষিত নোটসমূহ ({toBengaliDigits(courseNotesList.length)}টি পাঠ)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {courseNotesList.map((item) => {
              const note = allLessonNotes[item.id];
              const isCurrent = item.id === lesson.id;
              const voiceCount = note.voiceReflections?.length ?? 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectLesson(item.id)}
                  className={`text-left p-3 rounded-xl transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white/95 ring-1 ring-[#15803D]/50 text-[#132219] shadow-xs'
                      : 'glass-well text-[#2C3E33] hover:bg-white/75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#3F5247]">
                    <span className="font-semibold text-[#15803D]">
                      {item.number}
                    </span>
                    <span className="font-mono tabular-nums">
                      {note.updatedAt}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#132219] truncate mt-0.5">
                    {item.title}
                  </div>
                  <div className="text-xs text-[#3F5247] line-clamp-1 mt-0.5 flex items-center gap-1.5">
                    {voiceCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[#15803D] font-medium shrink-0">
                        <Volume2 className="w-3 h-3" />
                        <span>{toBengaliDigits(voiceCount)} অডিও</span>
                      </span>
                    )}
                    {note.content.trim() ? (
                      <span className="truncate">{note.content}</span>
                    ) : voiceCount > 0 ? (
                      <span className="truncate">মৌখিক প্রতিফলন সংরক্ষিত</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
