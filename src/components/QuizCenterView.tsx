import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Trophy
} from 'lucide-react';
import { Course, EvaluatedAchievement, QuizResult } from '../types/lms';
import { generateCertificateId, toBengaliDigits } from '../utils/lmsHelpers';
import { AchievementBadgeEmblem } from './AchievementBadgeEmblem';

interface QuizCenterViewProps {
  courses: Course[];
  selectedCourseId: string;
  quizResults: Record<string, QuizResult>;
  achievements: EvaluatedAchievement[];
  onSelectCourse: (courseId: string) => void;
  onCompleteQuiz: (result: QuizResult) => void;
  onOpenCertificate: (courseId: string) => void;
  onOpenAchievements: () => void;
}

export const QuizCenterView: React.FC<QuizCenterViewProps> = ({
  courses,
  selectedCourseId,
  quizResults,
  achievements,
  onSelectCourse,
  onCompleteQuiz,
  onOpenCertificate,
  onOpenAchievements
}) => {
  const course =
    courses.find((c) => c.id === selectedCourseId) ?? courses[0];

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedCourseId, setSubmittedCourseId] = useState<string | null>(
    null
  );

  const isSubmitted = submittedCourseId === course.id;
  const questions = course.quiz;
  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined
  ).length;

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) return;
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correct += 1;
    });
    const percentage = Math.round((correct / questions.length) * 100);
    const passed = percentage >= 60;
    const existing = quizResults[course.id];

    const result: QuizResult = {
      courseId: course.id,
      score: correct,
      total: questions.length,
      percentage,
      passed,
      completedAt: new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      certificateId: existing?.certificateId ?? generateCertificateId(course.id)
    };

    onCompleteQuiz(result);
    setSubmittedCourseId(course.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    const next = { ...answers };
    questions.forEach((q) => {
      delete next[q.id];
    });
    setAnswers(next);
    setSubmittedCourseId(null);
  };

  const currentScore = questions.reduce(
    (acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0),
    0
  );
  const currentPercentage =
    questions.length > 0
      ? Math.round((currentScore / questions.length) * 100)
      : 0;
  const currentPassed = currentPercentage >= 60;
  const savedResult = quizResults[course.id];

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-white/75">
        <h1 className="text-3xl font-bold text-[#132219] tracking-tight">
          শিক্ষক দক্ষতা মূল্যায়ন কুইজ কেন্দ্র
        </h1>
        <p className="text-sm sm:text-base text-[#3F5247]">
          প্রতিটি প্রশিক্ষণ মডিউলে পেডাগজি ও শ্রেণিকক্ষ প্রয়োগভিত্তিক ৫টি বহুনির্বাচনী প্রশ্ন রয়েছে। ন্যূনতম ৬০% (৩/৫) নম্বর অর্জন করলে CPD প্রশিক্ষণ সার্টিফিকেট আনলক হবে।
        </p>
      </div>

      {/* Course Selector Segmented Control */}
      <div className="flex flex-wrap items-center gap-2 p-2 glass-well rounded-2xl">
        {courses.map((c) => {
          const isActive = c.id === course.id;
          const res = quizResults[c.id];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelectCourse(c.id);
                setSubmittedCourseId(null);
              }}
              className={`flex-1 min-w-[200px] px-4 py-2.5 text-left rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'btn-3d-glass text-[#132219]'
                  : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
              }`}
            >
              <div className="text-sm font-semibold truncate">{c.title}</div>
              <div className="text-xs font-mono tabular-nums text-[#3F5247] mt-0.5">
                {res
                  ? res.passed
                    ? `উত্তীর্ণ · ${toBengaliDigits(res.percentage)}%`
                    : `সর্বশেষ: ${toBengaliDigits(res.percentage)}%`
                  : 'এখনো অংশগ্রহণ করা হয়নি'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Saved Best Score Notice when not currently viewing submission */}
      {!isSubmitted && savedResult && (
        <div className="glass-surface rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            {savedResult.passed ? (
              <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0" />
            )}
            <span>
              এই কোর্সে আপনার পূর্ববর্তী ফলাফল:{' '}
              <strong className="font-mono tabular-nums">
                {toBengaliDigits(savedResult.score)}/{toBengaliDigits(savedResult.total)} ({toBengaliDigits(savedResult.percentage)}%)
              </strong>{' '}
              — {savedResult.passed ? 'উত্তীর্ণ' : 'পুনরায় চেষ্টা প্রয়োজন'}
            </span>
          </div>
          {savedResult.passed && (
            <button
              type="button"
              onClick={() => onOpenCertificate(course.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>সার্টিফিকেট দেখুন</span>
            </button>
          )}
        </div>
      )}

      {/* Submission Result Summary Card */}
      {isSubmitted && (
        <div
          className={`glass-surface rounded-2xl p-6 space-y-4 ${
            currentPassed ? 'ring-1 ring-[#15803D]/35' : 'ring-1 ring-[#D97706]/35'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {currentPassed ? (
                <CheckCircle2 className="w-7 h-7 text-[#15803D] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-7 h-7 text-[#D97706] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#3F5247]">
                  {currentPassed
                    ? 'অভিনন্দন · কুইজে উত্তীর্ণ'
                    : 'পুনরায় চেষ্টা করুন · ন্যূনতম ৬০% প্রয়োজন'}
                </div>
                <h2 className="text-2xl font-bold text-[#132219] font-mono tabular-nums">
                  আপনার স্কোর: {toBengaliDigits(currentScore)} /{' '}
                  {toBengaliDigits(questions.length)} ({toBengaliDigits(currentPercentage)}%)
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>পুনরায় পরীক্ষা দিন</span>
              </button>

              {currentPassed && (
                <button
                  type="button"
                  onClick={() => onOpenCertificate(course.id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>সার্টিফিকেট সংগ্রহ করুন</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {(() => {
            const unlockedNow = achievements.filter((a) => a.status.unlocked);
            if (unlockedNow.length === 0) return null;
            return (
              <div className="pt-4 border-t border-white/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Trophy className="w-4 h-4 text-[#B45309] shrink-0" />
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-[#132219]">
                      অর্জিত ব্যাজ ({toBengaliDigits(unlockedNow.length)}):
                    </span>
                    {unlockedNow.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        className="inline-flex items-center gap-1.5 text-xs text-[#2C3E33] font-medium"
                      >
                        <AchievementBadgeEmblem
                          iconKey={b.iconKey}
                          tier={b.tier}
                          unlocked={true}
                          size="sm"
                        />
                        <span className="font-display font-semibold">
                          {b.titleEn}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAchievements}
                  className="text-xs font-semibold text-[#15803D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  সব অর্জন দেখুন →
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Questions Form */}
      {questions.length === 0 ? (
        <div className="glass-surface rounded-2xl p-8 text-center space-y-2">
          <h2 className="text-base font-bold text-[#132219]">
            এই কোর্সে এখনো কোনো কুইজ প্রশ্ন যুক্ত করা হয়নি
          </h2>
          <p className="text-sm text-[#3F5247]">
            অ্যাডমিন প্যানেল থেকে কোর্সটি সম্পাদনা করে বহুনির্বাচনী প্রশ্ন যুক্ত করা যাবে।
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {questions.map((q, qIdx) => {
            const userChoice = answers[q.id];
            return (
              <fieldset
                key={q.id}
                className="glass-surface rounded-2xl p-6 space-y-4"
              >
                <legend className="text-base font-bold text-[#132219] leading-snug float-left w-full mb-2">
                  <span className="font-mono tabular-nums text-[#15803D] mr-2">
                    প্রশ্ন ০{toBengaliDigits(qIdx + 1)}.
                  </span>
                  {q.question}
                </legend>
                <div className="clear-both space-y-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userChoice === optIdx;
                    const isCorrectOpt = q.correctIndex === optIdx;

                    let optionStyle =
                      'glass-well text-[#2C3E33] hover:bg-white/75';
                    if (isSubmitted) {
                      if (isCorrectOpt) {
                        optionStyle =
                          'bg-[#ECF2ED]/90 border border-[#15803D] text-[#132219] font-semibold';
                      } else if (isSelected && !isCorrectOpt) {
                        optionStyle =
                          'bg-[#FEF2F2]/90 border border-[#DC2626] text-[#991B1B]';
                      } else {
                        optionStyle = 'bg-white/55 border border-white/75 text-[#3F5247]';
                      }
                    } else if (isSelected) {
                      optionStyle =
                        'bg-[#ECF2ED]/90 border border-[#15803D] text-[#132219] font-semibold shadow-sm';
                    }

                    return (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3.5 rounded-xl transition-all min-h-[46px] ${
                          isSubmitted ? 'cursor-default' : 'cursor-pointer'
                        } ${optionStyle}`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={isSelected}
                          disabled={isSubmitted}
                          onChange={() => handleSelectOption(q.id, optIdx)}
                          className="w-4 h-4 accent-[#15803D] shrink-0"
                        />
                        <span className="text-sm flex-1">{opt}</span>
                        {isSubmitted && isCorrectOpt && (
                          <span className="text-xs font-semibold text-[#15803D] inline-flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>সঠিক উত্তর</span>
                          </span>
                        )}
                        {isSubmitted && isSelected && !isCorrectOpt && (
                          <span className="text-xs font-semibold text-[#DC2626] inline-flex items-center gap-1 shrink-0">
                            <AlertCircle className="w-4 h-4" />
                            <span>ভুল উত্তর</span>
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div className="p-3.5 rounded-xl glass-well text-xs sm:text-sm text-[#2C3E33] leading-relaxed">
                    <strong className="text-[#132219]">ব্যাখ্যা: </strong>
                    {q.explanation}
                  </div>
                )}
              </fieldset>
            );
          })}

          {!isSubmitted && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <span className="text-sm font-mono tabular-nums text-[#3F5247]">
                উত্তর দেওয়া হয়েছে: {toBengaliDigits(answeredCount)} /{' '}
                {toBengaliDigits(questions.length)}
              </span>
              <button
                type="submit"
                disabled={answeredCount < questions.length}
                className="px-6 py-3 text-sm font-semibold btn-3d-emerald disabled:opacity-50 disabled:cursor-not-allowed rounded-xl min-h-[46px] cursor-pointer"
              >
                {answeredCount < questions.length
                  ? `সবগুলো প্রশ্নের উত্তর দিন (${toBengaliDigits(questions.length - answeredCount)}টি বাকি)`
                  : 'কুইজ জমা দিন ও ফলাফল দেখুন'}
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
};
