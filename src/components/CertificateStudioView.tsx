import React, { useEffect, useRef } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Lock,
  Printer,
  User
} from 'lucide-react';
import { Course, QuizResult } from '../types/lms';
import { toBengaliDigits } from '../utils/lmsHelpers';

interface CertificateStudioViewProps {
  courses: Course[];
  selectedCourseId: string;
  learnerName: string;
  designation: string;
  schoolName: string;
  quizResults: Record<string, QuizResult>;
  onSelectCourse: (courseId: string) => void;
  onUpdateLearnerName: (name: string) => void;
  onUpdateDesignation: (designation: string) => void;
  onUpdateSchoolName: (schoolName: string) => void;
  onGoToQuiz: (courseId: string) => void;
}

export const CertificateStudioView: React.FC<CertificateStudioViewProps> = ({
  courses,
  selectedCourseId,
  learnerName,
  designation,
  schoolName,
  quizResults,
  onSelectCourse,
  onUpdateLearnerName,
  onUpdateDesignation,
  onUpdateSchoolName,
  onGoToQuiz
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const course =
    courses.find((c) => c.id === selectedCourseId) ?? courses[0];
  const result = quizResults[course.id];
  const isUnlocked = Boolean(result?.passed);

  const displayName = learnerName.trim() || 'সম্মানিত প্রশিক্ষণার্থী শিক্ষক';
  const displayAffil = [designation.trim(), schoolName.trim()]
    .filter(Boolean)
    .join(' · ');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isUnlocked || !result) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Botanical ivory paper background
    ctx.fillStyle = '#FAFDF9';
    ctx.fillRect(0, 0, w, h);

    // Subtle botanical corner leaf motifs
    const drawCornerLeaves = (
      cx: number,
      cy: number,
      flipX: number,
      flipY: number
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(flipX, flipY);
      ctx.fillStyle = 'rgba(21, 128, 61, 0.09)';
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate(0.18 * i);
        ctx.beginPath();
        ctx.ellipse(90, 26, 70, 18, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };
    drawCornerLeaves(48, 48, 1, 1);
    drawCornerLeaves(w - 48, 48, -1, 1);
    drawCornerLeaves(48, h - 48, 1, -1);
    drawCornerLeaves(w - 48, h - 48, -1, -1);

    // Outer double botanical frame
    ctx.strokeStyle = '#14532D';
    ctx.lineWidth = 8;
    ctx.strokeRect(36, 36, w - 72, h - 72);

    ctx.strokeStyle = '#86EFAC';
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 54, w - 108, h - 108);

    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(64, 64, w - 128, h - 128);

    // Top Emblem Circle
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.arc(w / 2, 144, 40, 0, Math.PI * 2);
    ctx.fill();

    // Minimal Leaf Vector inside Emblem
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(w / 2, 144, 12, 24, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 8, 158);
    ctx.lineTo(w / 2 + 8, 130);
    ctx.stroke();

    // Academy Title
    ctx.fillStyle = '#15803D';
    ctx.font = '700 26px "Outfit", "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TPACK Academy · শিক্ষক পেশাগত দক্ষতা উন্নয়ন ইনস্টিটিউট', w / 2, 226);

    // Main Certificate Heading
    ctx.fillStyle = '#132219';
    ctx.font = '700 50px "Hind Siliguri", sans-serif';
    ctx.fillText('শিক্ষক প্রশিক্ষণ সনদপত্র', w / 2, 298);

    ctx.fillStyle = '#4A5D52';
    ctx.font = '500 20px "Outfit", sans-serif';
    ctx.fillText(
      `CERTIFICATE OF CONTINUING PROFESSIONAL DEVELOPMENT (${course.cpdHoursLabel})`,
      w / 2,
      338
    );

    // Divider line
    ctx.strokeStyle = '#CBD5CE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 240, 368);
    ctx.lineTo(w / 2 + 240, 368);
    ctx.stroke();

    // Recipient Intro
    ctx.fillStyle = '#4A5D52';
    ctx.font = '500 25px "Hind Siliguri", sans-serif';
    ctx.fillText('এই মর্মে প্রত্যয়ন করা যাচ্ছে যে,', w / 2, 424);

    // Teacher Name
    ctx.fillStyle = '#14532D';
    ctx.font = '700 58px "Hind Siliguri", sans-serif';
    ctx.fillText(displayName, w / 2, 504);

    // Designation & School Name
    if (displayAffil) {
      ctx.fillStyle = '#2C3E33';
      ctx.font = '600 24px "Hind Siliguri", sans-serif';
      ctx.fillText(displayAffil, w / 2, 548);
    }

    // Underline
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 300, 574);
    ctx.lineTo(w / 2 + 300, 574);
    ctx.stroke();

    // Course Completion Text
    ctx.fillStyle = '#2C3E33';
    ctx.font = '500 25px "Hind Siliguri", sans-serif';
    ctx.fillText(
      `শিক্ষক পেশাগত দক্ষতা উন্নয়ন (CPD · ${course.cpdHoursLabel}) বিষয়ক প্রশিক্ষণ কোর্স`,
      w / 2,
      634
    );

    ctx.fillStyle = '#132219';
    ctx.font = '700 36px "Hind Siliguri", sans-serif';
    ctx.fillText(`“${course.title}”`, w / 2, 692);

    ctx.fillStyle = '#2C3E33';
    ctx.font = '500 23px "Hind Siliguri", sans-serif';
    ctx.fillText(
      `সফলভাবে সম্পন্ন করেছেন এবং মূল্যায়ন পরীক্ষায় ${toBengaliDigits(result.percentage)}% (${toBengaliDigits(result.score)}/${toBengaliDigits(result.total)}) নম্বর অর্জন করেছেন।`,
      w / 2,
      748
    );

    // Footer Columns: Date / Seal / Instructor Signature
    const footerY = 920;

    // Left: Date & ID
    ctx.textAlign = 'left';
    ctx.fillStyle = '#132219';
    ctx.font = '600 22px "Hind Siliguri", sans-serif';
    ctx.fillText(`প্রদানের তারিখ: ${result.completedAt}`, 140, footerY);
    ctx.fillStyle = '#4A5D52';
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillText(`ID: ${result.certificateId}`, 140, footerY + 36);

    // Center: Verified Seal
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, footerY - 12, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(21, 128, 61, 0.08)';
    ctx.fill();
    ctx.fillStyle = '#14532D';
    ctx.textAlign = 'center';
    ctx.font = '700 18px "Hind Siliguri", sans-serif';
    ctx.fillText('যাচাইকৃত', w / 2, footerY - 14);
    ctx.font = '600 13px "Outfit", sans-serif';
    ctx.fillText('TPACK CERTIFIED', w / 2, footerY + 12);

    // Right: Instructor Signature
    ctx.textAlign = 'right';
    ctx.strokeStyle = '#132219';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w - 430, footerY - 22);
    ctx.lineTo(w - 140, footerY - 22);
    ctx.stroke();

    ctx.fillStyle = '#132219';
    ctx.font = '700 22px "Hind Siliguri", sans-serif';
    ctx.fillText(course.instructor, w - 140, footerY + 12);
    ctx.fillStyle = '#4A5D52';
    ctx.font = '400 18px "Hind Siliguri", sans-serif';
    ctx.fillText(course.instructorRole, w - 140, footerY + 42);
  }, [isUnlocked, result, displayName, displayAffil, course]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `TPACK-Academy-Certificate-${course.id}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-white/75">
        <h1 className="text-3xl font-bold text-[#132219] tracking-tight">
          শিক্ষক CPD সার্টিফিকেট স্টুডিও
        </h1>
        <p className="text-sm sm:text-base text-[#3F5247]">
          উত্তীর্ণ প্রশিক্ষণ মডিউলের জন্য আপনার নাম, পদবি ও বিদ্যালয়ের নাম যুক্ত করে অফিশিয়াল CPD সার্টিফিকেট PNG ডাউনলোড বা PDF প্রিন্ট করুন।
        </p>
      </div>

      {/* Course Selector + Teacher Credentials */}
      <div className="glass-surface rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#3F5247]">
            প্রশিক্ষণ কোর্স নির্বাচন করুন
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {courses.map((c) => {
              const res = quizResults[c.id];
              const passed = Boolean(res?.passed);
              const isSelected = c.id === course.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCourse(c.id)}
                  className={`p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'btn-3d-glass ring-1 ring-[#15803D] bg-white/95'
                      : 'glass-well hover:bg-white/75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className="text-[#3F5247]">
                      {c.categoryLabel} · {c.cpdHoursLabel}
                    </span>
                    {passed ? (
                      <CheckCircle2
                        className="w-4 h-4 text-[#15803D] shrink-0"
                        aria-label="আনলকড"
                      />
                    ) : (
                      <Lock
                        className="w-3.5 h-3.5 text-[#5B7063] shrink-0"
                        aria-label="লক করা"
                      />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[#132219] line-clamp-1">
                    {c.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="cert-learner-name"
              className="block text-xs font-semibold text-[#3F5247]"
            >
              শিক্ষকের পূর্ণ নাম
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-[#3F5247] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="cert-learner-name"
                type="text"
                value={learnerName}
                onChange={(e) => onUpdateLearnerName(e.target.value)}
                placeholder="আপনার নাম লিখুন..."
                className="w-full pl-10 pr-4 py-2.5 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cert-designation"
              className="block text-xs font-semibold text-[#3F5247]"
            >
              পদবি
            </label>
            <input
              id="cert-designation"
              type="text"
              value={designation}
              onChange={(e) => onUpdateDesignation(e.target.value)}
              placeholder="যেমন: সহকারী শিক্ষক (বিজ্ঞান)"
              className="w-full px-3.5 py-2.5 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cert-school-name"
              className="block text-xs font-semibold text-[#3F5247]"
            >
              বিদ্যালয় / প্রতিষ্ঠানের নাম
            </label>
            <div className="relative">
              <Building2
                className="w-4 h-4 text-[#3F5247] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="cert-school-name"
                type="text"
                value={schoolName}
                onChange={(e) => onUpdateSchoolName(e.target.value)}
                placeholder="বিদ্যালয়ের নাম লিখুন..."
                className="w-full pl-10 pr-4 py-2.5 text-sm glass-input rounded-xl text-[#132219] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Stage or Locked Prompt */}
      {isUnlocked && result ? (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-surface rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 rounded-xl glass-3d-icon-well flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-[#15803D]" />
              </div>
              <div>
                <span className="font-semibold text-[#132219]">
                  শিক্ষক CPD সার্টিফিকেট প্রস্তুত!
                </span>{' '}
                <span className="text-[#3F5247] font-mono tabular-nums text-xs">
                  ({result.certificateId} · স্কোর {toBengaliDigits(result.percentage)}%)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>PNG ডাউনলোড করুন</span>
              </button>
            </div>
          </div>

          <div className="glass-surface rounded-2xl p-3 sm:p-5">
            <div
              id="printable-certificate"
              className="bg-white border border-[#DDE5DF] rounded-xl p-2 sm:p-3 overflow-hidden shadow-md"
            >
              <canvas
                ref={canvasRef}
                width={1600}
                height={1130}
                className="w-full h-auto block rounded-lg border border-[#E6ECE7]"
                aria-label={`${course.title} কোর্সের শিক্ষক প্রশিক্ষণ সার্টিফিকেট প্রিভিউ`}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-surface rounded-2xl p-10 sm:p-14 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl glass-3d-icon-well flex items-center justify-center mx-auto text-[#3F5247]">
            <Lock className="w-6 h-6 text-[#15803D]" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-[#132219]">
              সার্টিফিকেট এখনো আনলক হয়নি
            </h2>
            <p className="text-sm text-[#3F5247] leading-relaxed">
              “{course.title}” কোর্সের CPD সার্টিফিকেট পেতে শিক্ষক দক্ষতা মূল্যায়ন কুইজে অন্তত ৬০% (৫টির মধ্যে ৩টি সঠিক উত্তর) অর্জন করতে হবে।
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onGoToQuiz(course.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>এখনই মূল্যায়ন কুইজ দিন</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
