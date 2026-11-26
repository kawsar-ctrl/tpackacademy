import React from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Cloud,
  LogIn,
  LogOut,
  RotateCcw,
  Trophy,
  X
} from 'lucide-react';
import { Course, EvaluatedAchievement, LearnerProgress } from '../types/lms';
import { toBengaliDigits } from '../utils/lmsHelpers';
import { AchievementBadgeEmblem } from './AchievementBadgeEmblem';

interface ProfileModalProps {
  isOpen: boolean;
  authUser: User | null;
  courses: Course[];
  progress: LearnerProgress;
  achievements: EvaluatedAchievement[];
  onClose: () => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
  onUpdateName: (name: string) => void;
  onUpdateDesignation: (designation: string) => void;
  onUpdateSchoolName: (schoolName: string) => void;
  onResetProgress: () => void;
  onJumpToCourse: (courseId: string) => void;
  onOpenAchievements: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  authUser,
  courses,
  progress,
  achievements,
  onClose,
  onOpenLogin,
  onSignOut,
  onUpdateName,
  onUpdateDesignation,
  onUpdateSchoolName,
  onResetProgress,
  onJumpToCourse,
  onOpenAchievements
}) => {
  if (!isOpen) return null;

  const totalLessons = courses.reduce((sum, c) => sum + c.lessons.length, 0);
  const completedLessons = progress.completedLessonIds.length;
  const passedCourses = Object.values(progress.quizResults).filter(
    (r) => r.passed
  ).length;
  const unlockedBadges = achievements.filter((a) => a.status.unlocked);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1E15]/35 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="w-full max-w-lg glass-modal rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/75 flex items-center justify-between">
          <h2 id="profile-modal-title" className="text-lg font-bold text-[#132219]">
            প্রশিক্ষণার্থী শিক্ষক প্রোফাইল ও অগ্রগতি
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#3F5247] hover:bg-white/70 hover:text-[#132219] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Google Account Connection Strip */}
          <div className="p-3.5 rounded-xl glass-well flex items-center justify-between gap-3">
            {authUser ? (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Cloud className="w-4 h-4 text-[#15803D] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#132219]">
                      Google অ্যাকাউন্ট সংযুক্ত
                    </div>
                    <div className="text-[11px] text-[#3F5247] truncate">
                      {authUser.email}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#B91C1C] bg-[#FEF2F2]/90 hover:bg-[#FEE2E2] border border-[#FECACA] rounded-lg shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগ আউট</span>
                </button>
              </>
            ) : (
              <>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#132219]">
                    অতিথি ব্রাউজিং মোড
                  </div>
                  <div className="text-[11px] text-[#3F5247]">
                    ক্লাউডে অগ্রগতি সংরক্ষণের জন্য Google দিয়ে সাইন ইন করুন
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold btn-3d-emerald rounded-lg shrink-0 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>সাইন ইন</span>
                </button>
              </>
            )}
          </div>

          {/* Teacher Profile Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="modal-learner-name"
                className="block text-xs font-semibold text-[#3F5247]"
              >
                শিক্ষকের পূর্ণ নাম (সার্টিফিকেটে ব্যবহৃত হবে)
              </label>
              <input
                id="modal-learner-name"
                type="text"
                value={progress.learnerName}
                onChange={(e) => onUpdateName(e.target.value)}
                placeholder="যেমন: মো. রাফিউল ইসলাম"
                className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="modal-designation"
                  className="block text-xs font-semibold text-[#3F5247]"
                >
                  পদবি
                </label>
                <input
                  id="modal-designation"
                  type="text"
                  value={progress.designation}
                  onChange={(e) => onUpdateDesignation(e.target.value)}
                  placeholder="যেমন: সহকারী শিক্ষক (বিজ্ঞান)"
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="modal-school-name"
                  className="block text-xs font-semibold text-[#3F5247]"
                >
                  বিদ্যালয় / প্রতিষ্ঠানের নাম
                </label>
                <input
                  id="modal-school-name"
                  type="text"
                  value={progress.schoolName}
                  onChange={(e) => onUpdateSchoolName(e.target.value)}
                  placeholder="যেমন: সবুজপুর আদর্শ উচ্চ বিদ্যালয়"
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                />
              </div>
            </div>
          </div>

          {/* 3-Column Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl glass-well">
              <div className="text-xs text-[#3F5247]">সম্পন্ন মডিউল</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#132219] mt-1">
                {toBengaliDigits(completedLessons)}/{toBengaliDigits(totalLessons)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl glass-well">
              <div className="text-xs text-[#3F5247]">লেসন প্ল্যান</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#132219] mt-1">
                {toBengaliDigits(progress.readMaterialIds.length)}/{toBengaliDigits(totalLessons)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl glass-well">
              <div className="text-xs text-[#3F5247]">CPD সনদ</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#15803D] mt-1">
                {toBengaliDigits(passedCourses)}/{toBengaliDigits(courses.length)}
              </div>
            </div>
          </div>

          {/* Per-Course Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#132219]">
              প্রশিক্ষণ মডিউলভিত্তিক অবস্থা
            </h3>
            <div className="divide-y divide-white/75 glass-well rounded-xl">
              {courses.map((c) => {
                const done = c.lessons.filter((l) =>
                  progress.completedLessonIds.includes(l.id)
                ).length;
                const quiz = progress.quizResults[c.id];
                return (
                  <div
                    key={c.id}
                    className="p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#132219] truncate">
                        {c.title}
                      </div>
                      <div className="text-xs text-[#3F5247] flex items-center gap-2 mt-0.5 font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {toBengaliDigits(done)}/{toBengaliDigits(c.lessons.length)} মডিউল
                        </span>
                        <span aria-hidden="true">·</span>
                        {quiz?.passed ? (
                          <span className="inline-flex items-center gap-1 text-[#15803D] font-semibold">
                            <Award className="w-3.5 h-3.5" />
                            উত্তীর্ণ ({toBengaliDigits(quiz.percentage)}%)
                          </span>
                        ) : (
                          <span>মূল্যায়ন বাকি</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToCourse(c.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#15803D] btn-3d-glass rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      প্রবেশ করুন
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Earned Achievements Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#132219] inline-flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#B45309]" />
                <span>
                  অর্জিত ডিজিটাল ব্যাজ ({toBengaliDigits(unlockedBadges.length)}/
                  {toBengaliDigits(achievements.length)})
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  onOpenAchievements();
                  onClose();
                }}
                className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
              >
                সব ব্যাজ দেখুন
              </button>
            </div>

            {unlockedBadges.length === 0 ? (
              <div className="p-3.5 rounded-xl glass-well text-xs text-[#3F5247]">
                এখনো কোনো ডিজিটাল ব্যাজ আনলক হয়নি। প্রথম মডিউল সম্পন্ন করেই ‘First Step Scholar’ ব্যাজ অর্জন করুন।
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-2.5 rounded-xl glass-well flex items-center gap-2.5"
                  >
                    <AchievementBadgeEmblem
                      iconKey={badge.iconKey}
                      tier={badge.tier}
                      unlocked={true}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-display text-[#132219] truncate">
                        {badge.titleEn}
                      </div>
                      <div className="text-[11px] text-[#3F5247] truncate">
                        {badge.titleBn}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/75 bg-white/45 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetProgress}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3F5247] hover:text-[#DC2626] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>সব অগ্রগতি রিসেট করুন</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold btn-3d-emerald rounded-xl cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>সংরক্ষণ ও বন্ধ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
