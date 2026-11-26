import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutGrid,
  Layers,
  Leaf,
  Pause,
  Play,
  PlayCircle,
  Search
} from 'lucide-react';
import {
  Course,
  CourseCategory,
  CustomCourseRecord,
  QuizResult
} from '../types/lms';
import { EcoImage } from './EcoImage';
import { GlassTiltCard } from './GlassTiltCard';
import { toBengaliDigits } from '../utils/lmsHelpers';

interface CourseCarouselSectionProps {
  courses: Course[];
  categoryFilter: CourseCategory;
  onCategoryChange: (category: CourseCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  completedLessonIds: string[];
  quizResults: Record<string, QuizResult>;
  onOpenCourse: (courseId: string) => void;
  onOpenQuizOrCertificate: (courseId: string, passed: boolean) => void;
  onResetFilters: () => void;
}

const CATEGORY_TABS: { id: CourseCategory; label: string }[] = [
  { id: 'all', label: 'সব মডিউল' },
  { id: 'tpack-tech', label: 'টিপ্যাক ও প্রযুক্তি' },
  { id: 'pedagogy-eval', label: 'পেডাগজি ও মূল্যায়ন' },
  { id: 'research-leadership', label: 'গবেষণা ও নেতৃত্ব' }
];

function formatTwoDigitBn(num: number): string {
  const padded = String(num).padStart(2, '0');
  return toBengaliDigits(padded);
}

function getRelativeOffset(index: number, activeIndex: number, total: number): number {
  if (total <= 2) {
    return index - activeIndex;
  }
  let diff = index - activeIndex;
  const half = total / 2;
  if (diff > half) diff -= total;
  if (diff < -half) diff += total;
  return diff;
}

export const CourseCarouselSection: React.FC<CourseCarouselSectionProps> = ({
  courses,
  categoryFilter,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  completedLessonIds,
  quizResults,
  onOpenCourse,
  onOpenQuizOrCertificate,
  onResetFilters
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
    return true;
  });
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const carouselRegionRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    setIsCardHovered(false);
    setIsFocusWithin(false);
    setIsTouching(false);
    setDragOffsetX(0);
  }, [viewMode, categoryFilter, searchQuery, courses.length]);

  useEffect(() => {
    if (courses.length === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= courses.length) {
      setActiveIndex(courses.length - 1);
    }
  }, [courses.length, activeIndex]);

  const safeIndex =
    courses.length === 0 ? 0 : Math.min(activeIndex, courses.length - 1);

  const shouldAutoAdvance =
    viewMode === 'carousel' &&
    courses.length > 1 &&
    isAutoPlayEnabled &&
    !isCardHovered &&
    !isFocusWithin &&
    !isTouching;

  useEffect(() => {
    if (!shouldAutoAdvance) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % courses.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [shouldAutoAdvance, courses.length, safeIndex]);

  const goPrev = useCallback(() => {
    if (courses.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + courses.length) % courses.length);
  }, [courses.length]);

  const goNext = useCallback(() => {
    if (courses.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % courses.length);
  }, [courses.length]);

  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (viewMode !== 'carousel' || courses.length <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  useEffect(() => {
    const el = carouselRegionRef.current;
    if (!el || viewMode !== 'carousel' || courses.length === 0) return;

    const resetTouch = () => {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      isHorizontalSwipeRef.current = null;
      setIsTouching(false);
      setDragOffsetX(0);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      setIsTouching(true);
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      isHorizontalSwipeRef.current = null;
      setDragOffsetX(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (
        touchStartXRef.current === null ||
        touchStartYRef.current === null ||
        e.touches.length !== 1 ||
        courses.length <= 1
      ) {
        return;
      }

      const deltaX = e.touches[0].clientX - touchStartXRef.current;
      const deltaY = e.touches[0].clientY - touchStartYRef.current;

      if (
        isHorizontalSwipeRef.current === null &&
        (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)
      ) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY) * 1.1;
      }

      if (isHorizontalSwipeRef.current) {
        const clamped = Math.max(-140, Math.min(140, deltaX));
        setDragOffsetX(clamped);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      resetTouch();

      if (
        startX === null ||
        startY === null ||
        e.changedTouches.length === 0 ||
        courses.length <= 1
      ) {
        return;
      }

      const deltaX = e.changedTouches[0].clientX - startX;
      const deltaY = e.changedTouches[0].clientY - startY;

      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (deltaX < 0) {
          goNext();
        } else {
          goPrev();
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', resetTouch, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', resetTouch);
    };
  }, [viewMode, courses.length, goNext, goPrev]);

  const renderCourseCard = (course: Course, isFocused: boolean, index: number) => {
    const completedCount = course.lessons.filter((l) =>
      completedLessonIds.includes(l.id)
    ).length;
    const pct =
      course.lessons.length > 0
        ? Math.round((completedCount / course.lessons.length) * 100)
        : 0;
    const quizRes = quizResults[course.id];
    const isDraft =
      'published' in course && !(course as CustomCourseRecord).published;

    const cardContent = (
      <article className="flex flex-col justify-between h-full">
        <div>
          <div className="aspect-[4/3] bg-[#E8EFEA]/70 overflow-hidden border-b border-white/75 relative">
            <EcoImage
              src={course.imagePath}
              alt={course.title}
              fallbackLabel={course.title}
              className="w-full h-full object-cover block"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#132219]/25 via-[#132219]/5 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          </div>

          <div className="p-5 sm:p-6 space-y-2.5">
            {/* Unboxed Metadata with typographic separators */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#3F5247]">
              <span className="font-semibold text-[#15803D]">
                {course.categoryLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span>{course.totalDurationLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{course.levelLabel}</span>
              {isDraft && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#B45309]">খসড়া</span>
                </>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#132219] leading-snug line-clamp-2">
              {course.title}
            </h3>

            <p className="text-sm text-[#3F5247] leading-relaxed line-clamp-3">
              {course.description}
            </p>
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 space-y-4">
          {/* Course Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#3F5247]">
              <span className="font-mono tabular-nums">
                অগ্রগতি: {toBengaliDigits(completedCount)}/
                {toBengaliDigits(course.lessons.length)} মডিউল (
                {toBengaliDigits(pct)}%)
              </span>
              {quizRes?.passed && (
                <span className="inline-flex items-center gap-1 font-semibold text-[#15803D]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CPD সনদ অর্জিত</span>
                </span>
              )}
            </div>
            <div className="w-full h-2 glass-well rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#15803D] to-[#22C55E] transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${pct / 100})` }}
              />
            </div>
          </div>

          {/* Card Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              tabIndex={isFocused ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                if (!isFocused && viewMode === 'carousel') {
                  setActiveIndex(index);
                  return;
                }
                onOpenCourse(course.id);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 shrink-0" />
              <span>
                {completedCount > 0 ? 'প্রশিক্ষণ চালিয়ে যান' : 'প্রশিক্ষণে প্রবেশ'}
              </span>
            </button>

            <button
              type="button"
              tabIndex={isFocused ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                if (!isFocused && viewMode === 'carousel') {
                  setActiveIndex(index);
                  return;
                }
                onOpenQuizOrCertificate(course.id, Boolean(quizRes?.passed));
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
            >
              {quizRes?.passed ? (
                <>
                  <Award className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>সনদ</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>কুইজ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    );

    if (isFocused) {
      return (
        <div
          className="h-full"
          onMouseEnter={() => setIsCardHovered(true)}
          onMouseLeave={() => setIsCardHovered(false)}
          onFocusCapture={() => setIsFocusWithin(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setIsFocusWithin(false);
            }
          }}
        >
          <GlassTiltCard
            maxTiltDeg={4}
            className="glass-card-3d rounded-2xl flex flex-col justify-between h-full ring-1 ring-white/95"
          >
            {cardContent}
          </GlassTiltCard>
        </div>
      );
    }

    return (
      <div
        className="glass-card-3d rounded-2xl flex flex-col justify-between h-full overflow-hidden"
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
      >
        {cardContent}
      </div>
    );
  };

  return (
    <section id="catalog" className="space-y-6">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/75">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-[#132219] tracking-tight">
            শিক্ষক প্রশিক্ষণ মডিউলসমূহ
          </h2>
          <p className="text-sm text-[#3F5247]">
            ডিজিটাল শিক্ষণ, আধুনিক পেডাগজি ও নেতৃত্বের দক্ষতা বাড়াতে পছন্দের প্রশিক্ষণ কোর্সে প্রবেশ করুন।
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="w-4 h-4 text-[#3F5247] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="প্রশিক্ষণ কোর্স খুঁজুন..."
            aria-label="প্রশিক্ষণ কোর্স খুঁজুন"
            className="w-full pl-10 pr-4 py-2 text-sm glass-input rounded-xl text-[#132219] placeholder:text-[#6B7E72] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
          />
        </div>
      </div>

      {/* Category Filter Tabs + Carousel/Grid View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 glass-well rounded-xl w-fit">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onCategoryChange(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                  : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Carousel Stepper & Auto-Play Controls */}
            {viewMode === 'carousel' && (
              <div className="flex items-center gap-1.5 p-1 glass-well rounded-xl">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={courses.length <= 1}
                  aria-label="পূর্ববর্তী কোর্স দেখুন"
                  className="w-8 h-8 rounded-lg btn-3d-glass flex items-center justify-center text-[#132219] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span
                  className="px-2.5 text-xs font-mono tabular-nums font-semibold text-[#132219] whitespace-nowrap select-none"
                  aria-live="polite"
                >
                  {formatTwoDigitBn(safeIndex + 1)} / {formatTwoDigitBn(courses.length)}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={courses.length <= 1}
                  aria-label="পরবর্তী কোর্স দেখুন"
                  className="w-8 h-8 rounded-lg btn-3d-glass flex items-center justify-center text-[#132219] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {courses.length > 1 && (
                  <>
                    <span
                      className="w-px h-5 bg-[#132219]/10 mx-0.5"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => setIsAutoPlayEnabled((prev) => !prev)}
                      aria-pressed={isAutoPlayEnabled}
                      aria-label={
                        isAutoPlayEnabled
                          ? 'অটো-প্লে বিরতি দিন'
                          : 'অটো-প্লে চালু করুন'
                      }
                      title={
                        isAutoPlayEnabled
                          ? 'অটো-প্লে বিরতি দিন'
                          : 'অটো-প্লে চালু করুন'
                      }
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg btn-3d-glass text-xs font-semibold text-[#132219] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isAutoPlayEnabled ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                          <span className="hidden sm:inline">বিরতি</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                          <span className="hidden sm:inline">চালু</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Carousel / Grid Mode Switch */}
            <div
              className="flex items-center gap-1 p-1 glass-well rounded-xl"
              role="group"
              aria-label="কোর্স প্রদর্শনের ধরন"
            >
              <button
                type="button"
                onClick={() => setViewMode('carousel')}
                aria-pressed={viewMode === 'carousel'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'carousel'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#15803D]" />
                <span>ক্যারোসেল</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/40'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#15803D]" />
                <span>সব একসাথে</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State or Course Display */}
      {courses.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center space-y-3">
          <div className="glass-3d-icon-well w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
            <Leaf className="w-6 h-6 text-[#15803D]" />
          </div>
          <h3 className="text-lg font-semibold text-[#132219]">
            কোনো প্রশিক্ষণ কোর্স খুঁজে পাওয়া যায়নি
          </h3>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
          >
            সব মডিউল দেখান
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, idx) => (
            <div key={course.id} className="h-full">
              {renderCourseCard(course, true, idx)}
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={carouselRegionRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="শিক্ষক প্রশিক্ষণ কোর্স ক্যারোসেল"
          tabIndex={0}
          onKeyDown={handleStageKeyDown}
          style={{ touchAction: 'pan-y' }}
          className="space-y-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] rounded-3xl"
        >
          {/* Mobile Swipe Track (< 768px) */}
          <div className="md:hidden relative overflow-hidden rounded-2xl py-2">
            <div
              className={`flex ${
                isTouching && dragOffsetX !== 0
                  ? ''
                  : 'carousel-track-transition'
              }`}
              style={{
                transform: `translate3d(calc(-${safeIndex * 100}% + ${dragOffsetX}px), 0, 0)`
              }}
            >
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  className="w-full shrink-0 px-1"
                  aria-hidden={idx !== safeIndex}
                >
                  {renderCourseCard(course, idx === safeIndex, idx)}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop & Tablet 3D Perspective Coverflow Stage (>= 768px) */}
          <div className="hidden md:block relative overflow-hidden py-6 px-4 glass-surface rounded-3xl">
            {/* Subtle ambient spotlight behind center active card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[360px] rounded-full bg-radial from-[#86EFAC]/25 via-[#A7F3D0]/10 to-transparent blur-2xl"
            />

            {/* Floating Left / Right Stage Navigation Controls */}
            {courses.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="পূর্ববর্তী প্রশিক্ষণ মডিউল"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-2xl btn-3d-glass flex items-center justify-center text-[#132219] cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="পরবর্তী প্রশিক্ষণ মডিউল"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-2xl btn-3d-glass flex items-center justify-center text-[#132219] cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* 3D Perspective Card Arena */}
            <div className="carousel-3d-arena relative mx-auto h-[555px] lg:h-[570px] flex items-center justify-center">
              {courses.map((course, index) => {
                const offset = getRelativeOffset(index, safeIndex, courses.length);
                const absOffset = Math.abs(offset);
                const isFocused = offset === 0;
                const isAdjacent = absOffset === 1;
                const isHiddenFar = absOffset > 1;

                const translateXPercent =
                  offset === 0
                    ? 0
                    : offset > 0
                      ? Math.min(offset, 2) * 76
                      : Math.max(offset, -2) * 76;
                const translateZPx = isFocused ? 0 : isAdjacent ? -110 : -220;
                const scaleVal = isFocused ? 1 : isAdjacent ? 0.87 : 0.74;
                const rotateYDeg = isFocused ? 0 : offset < 0 ? 11 : -11;
                const opacityVal = isFocused ? 1 : isAdjacent ? 0.84 : 0;
                const zIndexVal = isFocused ? 30 : isAdjacent ? 20 : 10;

                return (
                  <div
                    key={course.id}
                    aria-hidden={!isFocused}
                    onClick={() => {
                      if (!isFocused && !isHiddenFar) {
                        setActiveIndex(index);
                      }
                    }}
                    style={{
                      transform: `translate3d(${translateXPercent}%, 0, ${translateZPx}px) scale(${scaleVal}) rotateY(${rotateYDeg}deg)`,
                      opacity: opacityVal,
                      zIndex: zIndexVal
                    }}
                    className={`carousel-card-transition absolute w-[370px] lg:w-[410px] xl:w-[430px] ${
                      isFocused
                        ? 'cursor-default'
                        : isAdjacent
                          ? 'cursor-pointer hover:opacity-100'
                          : 'pointer-events-none'
                    }`}
                  >
                    <div
                      className={
                        isFocused
                          ? ''
                          : 'rounded-2xl transition-opacity duration-200'
                      }
                    >
                      {renderCourseCard(course, isFocused, index)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Slide Selector Dock */}
          {courses.length > 1 && (
            <div className="flex flex-col items-center gap-2.5 px-2">
              {courses.length > 12 && courses[safeIndex] && (
                <div className="text-xs font-semibold text-[#132219] text-center max-w-xl truncate px-3">
                  <span className="font-mono tabular-nums text-[#15803D] mr-1.5">
                    {formatTwoDigitBn(safeIndex + 1)}/{formatTwoDigitBn(courses.length)}
                  </span>
                  <span aria-hidden="true" className="text-[#3F5247] mr-1.5">
                    ·
                  </span>
                  <span>{courses[safeIndex].title}</span>
                </div>
              )}

              <div
                className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 glass-well rounded-2xl max-w-4xl"
                role="tablist"
                aria-label="কোর্স স্লাইড নির্বাচন করুন"
              >
                {courses.map((course, idx) => {
                  const isActive = idx === safeIndex;
                  const compactMode = courses.length > 12;
                  return (
                    <button
                      key={course.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`${toBengaliDigits(idx + 1)} নম্বর কোর্স: ${course.title}`}
                      title={course.title}
                      onClick={() => setActiveIndex(idx)}
                      className={`inline-flex items-center gap-2 ${
                        compactMode ? 'px-1.5 py-1' : 'px-2.5 py-1.5'
                      } rounded-xl text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-white/95 text-[#132219] font-semibold shadow-sm border border-white'
                          : 'text-[#3F5247] hover:text-[#132219] hover:bg-white/45'
                      }`}
                    >
                      <span
                        className={`${
                          compactMode ? 'w-6 h-6' : 'w-5 h-5'
                        } rounded-md flex items-center justify-center font-mono tabular-nums text-[11px] font-bold ${
                          isActive
                            ? 'bg-[#15803D] text-white'
                            : 'bg-white/70 text-[#3F5247]'
                        }`}
                      >
                        {compactMode
                          ? formatTwoDigitBn(idx + 1)
                          : toBengaliDigits(idx + 1)}
                      </span>
                      {!compactMode && (
                        <span className="max-w-[135px] truncate hidden sm:inline">
                          {course.title}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-[#3F5247] md:hidden text-center">
                বামে বা ডানে সোয়াইপ করে কোর্স পরিবর্তন করুন
              </div>

              <div className="text-xs text-[#3F5247] hidden md:block text-center">
                {!isAutoPlayEnabled
                  ? 'অটো-প্লে বন্ধ আছে · কার্ড বা তীর বোতামে ক্লিক করে দেখুন'
                  : isCardHovered
                    ? 'কার্ডে মাউস হোভারের কারণে অটো-প্লে বিরত আছে'
                    : 'কার্ডের ওপর মাউস রাখলে অটো-প্লে স্বয়ংক্রিয়ভাবে থামবে'}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
