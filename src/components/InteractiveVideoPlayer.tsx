import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Captions,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Lesson } from '../types/lms';
import { formatTimeBn, toBengaliDigits } from '../utils/lmsHelpers';

interface InteractiveVideoPlayerProps {
  lesson: Lesson;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onStudySecondsTick?: (seconds: number) => void;
}

export const InteractiveVideoPlayer: React.FC<InteractiveVideoPlayerProps> = ({
  lesson,
  isCompleted,
  onToggleComplete,
  onStudySecondsTick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.25 | 1.5>(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const phaseRef = useRef(0);
  const studyTickBufferRef = useRef(0);

  // Reset playback when switching lessons
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    phaseRef.current = 0;
    studyTickBufferRef.current = 0;
  }, [lesson.id]);

  // Active chapter based on current time
  const activeChapter = useMemo(() => {
    let current = lesson.chapters[0];
    for (const ch of lesson.chapters) {
      if (currentTime >= ch.timeSec) {
        current = ch;
      }
    }
    return current;
  }, [lesson.chapters, currentTime]);

  // Playback timer + real study time reporter
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      studyTickBufferRef.current += 0.25;
      if (studyTickBufferRef.current >= 5 && onStudySecondsTick) {
        const whole = Math.floor(studyTickBufferRef.current);
        studyTickBufferRef.current -= whole;
        onStudySecondsTick(whole);
      }

      setCurrentTime((prev) => {
        const next = prev + 0.25 * playbackRate;
        if (next >= lesson.durationSec) {
          setIsPlaying(false);
          return lesson.durationSec;
        }
        return next;
      });
    }, 250);
    return () => {
      window.clearInterval(interval);
      if (studyTickBufferRef.current >= 1 && onStudySecondsTick) {
        const whole = Math.floor(studyTickBufferRef.current);
        studyTickBufferRef.current = 0;
        onStudySecondsTick(whole);
      }
    };
  }, [isPlaying, playbackRate, lesson.durationSec, onStudySecondsTick]);

  // Animated ecological visual simulation on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const drawFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (isPlaying && !prefersReducedMotion) {
        phaseRef.current += 0.025 * playbackRate;
      }
      const t = phaseRef.current + currentTime * 0.4;

      // Sky / atmosphere backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0F261A');
      grad.addColorStop(0.55, '#163A28');
      grad.addColorStop(1, '#1E4A33');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle coordinate grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < w; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 40; gy < h; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      const theme = lesson.visualTheme;

      if (theme === 'tpack-venn') {
        // Animated TPACK 3-Circle Venn Diagram (TK, PK, CK)
        const cx = 440;
        const cy = 235;
        const r = 104;
        const pulse = 1 + 0.03 * Math.sin(t * 1.4);

        const circles = [
          { dx: 0, dy: -56, color: 'rgba(56, 189, 248, 0.25)', stroke: '#38BDF8', label: 'TK (প্রযুক্তি)', lx: cx, ly: cy - 125 },
          { dx: -60, dy: 44, color: 'rgba(34, 197, 94, 0.25)', stroke: '#4ADE80', label: 'PK (পেডাগজি)', lx: cx - 135, ly: cy + 80 },
          { dx: 60, dy: 44, color: 'rgba(250, 204, 21, 0.22)', stroke: '#FACC15', label: 'CK (বিষয়জ্ঞান)', lx: cx + 135, ly: cy + 80 }
        ];

        circles.forEach((c) => {
          ctx.fillStyle = c.color;
          ctx.strokeStyle = c.stroke;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx + c.dx, cy + c.dy, r * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ECFDF5';
          ctx.font = '600 13px "Hind Siliguri", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(c.label, c.lx, c.ly);
        });

        // Core TPACK Intersection Highlight
        ctx.fillStyle = 'rgba(21, 128, 61, 0.85)';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 12, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 15px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TPACK', cx, cy + 17);
      } else if (theme === 'digital-media') {
        // Flipped Classroom & Multimedia Cognitive Load Flow
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.fillRect(100, 115, 250, 175);
        ctx.strokeRect(100, 115, 250, 175);

        ctx.fillStyle = '#ECFDF5';
        ctx.font = '700 14px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('১. ডিজিটাল পাঠ প্রস্তুতি', 120, 148);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 12px "Hind Siliguri", sans-serif';
        ctx.fillText('• ৬×৬ স্লাইড বিন্যাস (২৪pt+)', 120, 182);
        ctx.fillText('• ৪–৬ মিনিটের মাইক্রো-ভিডিও', 120, 210);
        ctx.fillText('• অফলাইন PDF ব্যাকআপ', 120, 238);

        // Animated flow arrow
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(355, 202);
        ctx.lineTo(505, 202);
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
          const p = (t * 0.6 + i / 4) % 1;
          ctx.fillStyle = '#86EFAC';
          ctx.beginPath();
          ctx.arc(360 + p * 140, 202, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#4ADE80';
        ctx.lineWidth = 2;
        ctx.fillRect(510, 115, 270, 175);
        ctx.strokeRect(510, 115, 270, 175);

        ctx.fillStyle = '#ECFDF5';
        ctx.font = '700 14px "Hind Siliguri", sans-serif';
        ctx.fillText('২. শ্রেণিকক্ষে সক্রিয় অনুশীলন', 530, 148);
        ctx.fillStyle = '#86EFAC';
        ctx.font = '500 12px "Hind Siliguri", sans-serif';
        ctx.fillText('• রিয়েল-টাইম পোল ও কুইজ', 530, 182);
        ctx.fillText('• দলীয় সমস্যা সমাধান ও আলোচনা', 530, 210);
        ctx.fillText('• তাৎক্ষণিক রুব্রিক ফিডব্যাক', 530, 238);

        ctx.fillStyle = '#E0F2FE';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Blended & Flipped Learning Workflow | TPACK Academy', 440, 345);
      } else if (theme === 'pedagogy-5e') {
        // 5E Instructional Model Interactive Cycle
        const cx = 440;
        const cy = 215;
        const radius = 122;

        ctx.strokeStyle = 'rgba(134, 239, 172, 0.22)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        const arcStart = t * 0.45;
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, arcStart, arcStart + Math.PI * 0.9);
        ctx.stroke();

        const stages = [
          '১. Engage (আগ্রহ)',
          '২. Explore (অনুসন্ধান)',
          '৩. Explain (ব্যাখ্যা)',
          '৪. Elaborate (প্রয়োগ)',
          '৫. Evaluate (মূল্যায়ন)'
        ];
        stages.forEach((label, idx) => {
          const angle = -Math.PI / 2 + (idx * Math.PI * 2) / stages.length;
          const nx = cx + Math.cos(angle) * radius;
          const ny = cy + Math.sin(angle) * radius;

          ctx.fillStyle = '#0F261A';
          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(nx, ny, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ECFDF5';
          ctx.font = '600 13px "Hind Siliguri", sans-serif';
          ctx.textAlign = nx < cx - 20 ? 'right' : nx > cx + 20 ? 'left' : 'center';
          const lx = nx < cx - 20 ? nx - 24 : nx > cx + 20 ? nx + 24 : nx;
          const ly = ny < cy - 60 ? ny - 24 : ny > cy + 60 ? ny + 32 : ny + 4;
          ctx.fillText(label, lx, ly);
        });

        ctx.fillStyle = '#DCFCE7';
        ctx.font = '700 16px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('5E শিখন মডেল', cx, cy - 4);
        ctx.fillStyle = '#86EFAC';
        ctx.font = '500 12px "Hind Siliguri", sans-serif';
        ctx.fillText('সক্রিয় শ্রেণিকক্ষ চক্র', cx, cy + 18);
      } else if (theme === 'assessment-rubric') {
        // 4-Level Formative Rubric Matrix Visualization
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.fillRect(110, 95, 660, 275);
        ctx.strokeRect(110, 95, 660, 275);

        ctx.fillStyle = '#ECFDF5';
        ctx.font = '700 15px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('৪-স্তরের গঠনমূলক মূল্যায়ন রুব্রিক (Formative Rubric)', 135, 132);

        const criteria = [
          '১. বিষয়গত নির্ভুলতা',
          '২. দলীয় সহযোগিতা',
          '৩. বিশ্লেষণ ও যুক্তি',
          '৪. উপস্থাপনা দক্ষতা'
        ];
        criteria.forEach((rowLabel, idx) => {
          const ry = 165 + idx * 48;
          ctx.fillStyle = '#CBD5E1';
          ctx.font = '500 13px "Hind Siliguri", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(rowLabel, 135, ry + 18);

          for (let lvl = 0; lvl < 4; lvl++) {
            const bx = 365 + lvl * 95;
            const activeIdx = Math.floor((t * 0.6 + idx) % 4);
            const isHighlighted = lvl <= Math.max(2, activeIdx);
            ctx.fillStyle = isHighlighted ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = isHighlighted ? '#22C55E' : '#334155';
            ctx.lineWidth = 1.5;
            ctx.fillRect(bx, ry, 82, 28);
            ctx.strokeRect(bx, ry, 82, 28);

            ctx.fillStyle = isHighlighted ? '#86EFAC' : '#94A3B8';
            ctx.font = '600 11px "Hind Siliguri", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`স্তর ${lvl + 1}`, bx + 41, ry + 18);
          }
        });
      } else if (theme === 'classroom-collab') {
        // 21st Century 4Cs Collaboration Hub
        const cx = 440;
        const cy = 225;
        const nodes = [
          { x: cx - 180, y: cy - 75, title: 'Critical Thinking', sub: 'সমালোচনামূলক চিন্তা' },
          { x: cx + 180, y: cy - 75, title: 'Creativity', sub: 'সৃজনশীল সমাধান' },
          { x: cx - 180, y: cy + 75, title: 'Collaboration', sub: 'দলীয় সহযোগিতা' },
          { x: cx + 180, y: cy + 75, title: 'Communication', sub: 'কার্যকর যোগাযোগ' }
        ];

        ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
        ctx.lineWidth = 2.5;
        nodes.forEach((n) => {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#4ADE80';
          ctx.fillRect(n.x - 95, n.y - 32, 190, 64);
          ctx.strokeRect(n.x - 95, n.y - 32, 190, 64);

          ctx.fillStyle = '#ECFDF5';
          ctx.font = '600 13px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(n.title, n.x, n.y - 4);
          ctx.fillStyle = '#86EFAC';
          ctx.font = '500 12px "Hind Siliguri", sans-serif';
          ctx.fillText(n.sub, n.x, n.y + 16);
        });

        ctx.fillStyle = '#15803D';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 15px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('২১ শতকের 4Cs', cx, cy + 5);
      } else {
        // Action Research 4-Step Cycle (Plan -> Act -> Observe -> Reflect)
        const cx = 440;
        const cy = 220;
        const radius = 115;

        ctx.strokeStyle = 'rgba(134, 239, 172, 0.25)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        const startA = t * 0.5;
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startA, startA + Math.PI * 1.15);
        ctx.stroke();

        const steps = [
          '১. Plan (পরিকল্পনা)',
          '২. Act (প্রয়োগ)',
          '৩. Observe (পর্যবেক্ষণ)',
          '৪. Reflect (প্রতিফলন)'
        ];
        steps.forEach((label, idx) => {
          const angle = -Math.PI / 2 + (idx * Math.PI * 2) / steps.length;
          const nx = cx + Math.cos(angle) * radius;
          const ny = cy + Math.sin(angle) * radius;

          ctx.fillStyle = '#0F261A';
          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(nx, ny, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ECFDF5';
          ctx.font = '600 13px "Hind Siliguri", sans-serif';
          ctx.textAlign = nx < cx - 15 ? 'right' : nx > cx + 15 ? 'left' : 'center';
          const lx = nx < cx - 15 ? nx - 24 : nx > cx + 15 ? nx + 24 : nx;
          const ly = ny < cy - 50 ? ny - 24 : ny > cy + 50 ? ny + 32 : ny + 4;
          ctx.fillText(label, lx, ly);
        });

        ctx.fillStyle = '#DCFCE7';
        ctx.font = '700 16px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('অ্যাকশন রিসার্চ চক্র', cx, cy + 5);
      }

      // Top-left lesson label inside stage
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(20, 18, 285, 34);
      ctx.fillStyle = '#ECFDF5';
      ctx.font = '600 13px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${lesson.number} · ${activeChapter.title}`, 32, 40);

      if (isPlaying && !prefersReducedMotion) {
        animId = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentTime, playbackRate, lesson.visualTheme, lesson.number, activeChapter.title]);

  const progressPct = Math.min(100, (currentTime / lesson.durationSec) * 100);

  return (
    <div className="glass-surface rounded-2xl overflow-hidden">
      {/* 16:9 Stage */}
      <div className="relative aspect-video bg-[#0F261A] select-none">
        <canvas
          ref={canvasRef}
          width={880}
          height={495}
          className="w-full h-full block object-cover"
          aria-label={`${lesson.title} — ইন্টারঅ্যাক্টিভ ভিডিও লেসন`}
        />

        {/* Center Play Overlay when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={() => {
              if (currentTime >= lesson.durationSec) setCurrentTime(0);
              setIsPlaying(true);
            }}
            aria-label="ভিডিও চালু করুন"
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 hover:bg-black/35 transition-colors cursor-pointer group"
          >
            <span className="w-16 h-16 rounded-full btn-3d-emerald flex items-center justify-center group-hover:scale-105 transition-transform">
              <Play className="w-7 h-7 ml-1" fill="currentColor" />
            </span>
            <span className="mt-3 text-sm font-medium text-white bg-black/60 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-xl">
              {currentTime > 0 && currentTime < lesson.durationSec
                ? 'পাঠ পুনরায় চালু করুন'
                : 'ভিডিও লেসন দেখুন'}
            </span>
          </button>
        )}

        {/* Measured Captions Scrim */}
        {showCaptions && (
          <div className="absolute bottom-3 inset-x-4 flex justify-center pointer-events-none">
            <div className="max-w-2xl bg-black/75 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm px-4 py-2 rounded-xl text-center leading-relaxed">
              {activeChapter.caption}
            </div>
          </div>
        )}
      </div>

      {/* Player Controls Bar */}
      <div className="p-4 border-t border-white/75 bg-white/55 backdrop-blur-md space-y-3">
        {/* Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tabular-nums text-[#3F5247] w-11 shrink-0">
            {formatTimeBn(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={lesson.durationSec}
              step={1}
              value={Math.floor(currentTime)}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
              aria-label="ভিডিও টাইমলাইন"
              className="w-full accent-[#15803D] cursor-pointer h-1.5"
            />
          </div>
          <span className="text-xs font-mono tabular-nums text-[#3F5247] w-11 text-right shrink-0">
            {lesson.durationLabel}
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isPlaying && currentTime >= lesson.durationSec) {
                  setCurrentTime(0);
                }
                setIsPlaying((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>বিরতি</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>চালু করুন</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTime(0);
                setIsPlaying(true);
              }}
              aria-label="শুরু থেকে দেখুন"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl btn-3d-glass text-[#3F5247] hover:text-[#132219] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? 'শব্দ চালু করুন' : 'শব্দ বন্ধ করুন'}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl btn-3d-glass text-[#3F5247] hover:text-[#132219] cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowCaptions((c) => !c)}
              aria-pressed={showCaptions}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                showCaptions
                  ? 'btn-3d-glass ring-1 ring-[#15803D]/50 text-[#15803D]'
                  : 'btn-3d-glass text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              <Captions className="w-4 h-4" />
              <span>সাবটাইটেল</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPlaybackRate((r) => (r === 1 ? 1.25 : r === 1.25 ? 1.5 : 1))
              }
              className="px-3 py-2 text-xs font-mono font-semibold rounded-xl btn-3d-glass text-[#3F5247] hover:text-[#132219] whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
            >
              {toBengaliDigits(playbackRate)}x
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleComplete}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
              isCompleted
                ? 'btn-3d-glass ring-1 ring-[#15803D]/50 text-[#15803D]'
                : 'btn-3d-glass text-[#132219]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'পাঠ সম্পন্ন হয়েছে' : 'পাঠ সম্পন্ন চিহ্নিত করুন'}</span>
          </button>
        </div>

        {/* Chapter Jump Strip */}
        <div className="pt-2 border-t border-white/75 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#3F5247] mr-1">অধ্যায়সমূহ:</span>
          {lesson.chapters.map((ch) => {
            const isCurrent = activeChapter.timeSec === ch.timeSec;
            return (
              <button
                key={ch.timeSec}
                type="button"
                onClick={() => {
                  setCurrentTime(ch.timeSec);
                  setIsPlaying(true);
                }}
                className={`px-2.5 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-white/95 text-[#15803D] font-semibold shadow-xs border border-[#15803D]/30'
                    : 'glass-well text-[#3F5247] hover:text-[#132219] hover:bg-white/75'
                }`}
              >
                <span className="font-mono tabular-nums mr-1.5">
                  {formatTimeBn(ch.timeSec)}
                </span>
                {ch.title}
              </button>
            );
          })}
          <span className="ml-auto text-xs font-mono tabular-nums text-[#3F5247]">
            {toBengaliDigits(Math.round(progressPct))}% দেখা হয়েছে
          </span>
        </div>
      </div>
    </div>
  );
};
