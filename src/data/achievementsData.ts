import {
  AchievementDefinition,
  Course,
  EvaluatedAchievement,
  LearnerProgress
} from '../types/lms';
import { toBengaliDigits } from '../utils/lmsHelpers';

function countCourseLessonsCompleted(
  course: Course | undefined,
  completedLessonIds: string[]
): number {
  if (!course) return 0;
  return course.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-step-scholar',
    titleEn: 'First Step Scholar',
    titleBn: 'প্রথম মডিউল অভিযাত্রী',
    category: 'cpd-milestone',
    categoryLabel: 'সামগ্রিক মাইলফলক',
    tier: 'emerald',
    tierLabel: 'প্রারম্ভিক সম্মাননা',
    iconKey: 'compass',
    description:
      'যেকোনো একটি প্রশিক্ষণ মডিউল সম্পন্ন করে পেশাগত দক্ষতা উন্নয়নের যাত্রা শুরু করুন।',
    criteriaLabel: 'যেকোনো ১টি মডিউল সম্পন্ন',
    targetTab: 'classroom',
    targetCourseId: 'tpack-digital-teaching',
    ctaLabel: 'প্রথম মডিউল দেখুন',
    evaluate: (progress) => {
      const done = Math.min(1, progress.completedLessonIds.length);
      return {
        unlocked: done >= 1,
        current: done,
        target: 1,
        percentage: done >= 1 ? 100 : 0,
        progressLabel: `${toBengaliDigits(done)}/${toBengaliDigits(1)} মডিউল`
      };
    }
  },
  {
    id: 'tech-savvy-educator',
    titleEn: 'Tech-Savvy Educator',
    titleBn: 'প্রযুক্তি-দক্ষ শিক্ষক',
    category: 'module-mastery',
    categoryLabel: 'মডিউল দক্ষতা',
    tier: 'emerald',
    tierLabel: 'সবুজ পদক',
    iconKey: 'cpu',
    description:
      'TPACK ফ্রেমওয়ার্ক, মাল্টিমিডিয়া কনটেন্ট, হাইব্রিড এলএমএস ও নৈতিক এডটেক—এই ৪টি ডিজিটাল শিক্ষণ মডিউল সম্পন্ন করুন।',
    criteriaLabel: 'TPACK ও প্রযুক্তি কোর্সের সব ৪টি মডিউল সম্পন্ন',
    targetTab: 'classroom',
    targetCourseId: 'tpack-digital-teaching',
    ctaLabel: 'TPACK মডিউল সম্পন্ন করুন',
    evaluate: (progress, courses) => {
      const course = courses.find((c) => c.id === 'tpack-digital-teaching');
      const total = course?.lessons.length ?? 4;
      const done = countCourseLessonsCompleted(course, progress.completedLessonIds);
      const pct = Math.round((done / total) * 100);
      return {
        unlocked: done >= total,
        current: done,
        target: total,
        percentage: pct,
        progressLabel: `${toBengaliDigits(done)}/${toBengaliDigits(total)} মডিউল`
      };
    }
  },
  {
    id: 'pedagogy-pro',
    titleEn: 'Pedagogy Pro',
    titleBn: 'পেডাগজি প্রো',
    category: 'module-mastery',
    categoryLabel: 'মডিউল দক্ষতা',
    tier: 'gold',
    tierLabel: 'স্বর্ণ পদক',
    iconKey: 'award',
    description:
      'আধুনিক পেডাগজি ও মূল্যায়ন কোর্সের ৪টি মডিউল সম্পন্ন করার পাশাপাশি মূল্যায়ন কুইজে কমপক্ষে ৮০% (৪/৫) নম্বর অর্জন করুন।',
    criteriaLabel: 'পেডাগজি কোর্সের ৪টি মডিউল + কুইজে ৮০%+ স্কোর',
    targetTab: 'classroom',
    targetCourseId: 'modern-pedagogy-assessment',
    ctaLabel: 'পেডাগজি কোর্সে যান',
    evaluate: (progress, courses) => {
      const course = courses.find((c) => c.id === 'modern-pedagogy-assessment');
      const lessonTotal = course?.lessons.length ?? 4;
      const lessonDone = countCourseLessonsCompleted(
        course,
        progress.completedLessonIds
      );
      const quizRes = progress.quizResults['modern-pedagogy-assessment'];
      const highScoreDone = quizRes && quizRes.percentage >= 80 ? 1 : 0;
      const current = lessonDone + highScoreDone;
      const target = lessonTotal + 1;
      const pct = Math.round((current / target) * 100);
      return {
        unlocked: lessonDone >= lessonTotal && highScoreDone === 1,
        current,
        target,
        percentage: pct,
        progressLabel: `${toBengaliDigits(lessonDone)}/${toBengaliDigits(lessonTotal)} মডিউল · কুইজ ${
          highScoreDone ? '৮০%+' : 'বাকি'
        }`
      };
    }
  },
  {
    id: 'action-research-pioneer',
    titleEn: 'Action Research Pioneer',
    titleBn: 'শিক্ষক নেতৃত্ব ও গবেষণা পথিকৃৎ',
    category: 'module-mastery',
    categoryLabel: 'মডিউল দক্ষতা',
    tier: 'emerald',
    tierLabel: 'সবুজ পদক',
    iconKey: 'users',
    description:
      'অ্যাকশন রিসার্চ, প্রজেক্ট-বেজড লার্নিং, অভিভাবক সংযোগ ও পেশাগত পোর্টফোলিও মডিউলগুলো সম্পন্ন করুন।',
    criteriaLabel: 'গবেষণা ও নেতৃত্ব কোর্সের সব ৪টি মডিউল সম্পন্ন',
    targetTab: 'classroom',
    targetCourseId: 'research-leadership-communication',
    ctaLabel: 'নেতৃত্ব কোর্সে যান',
    evaluate: (progress, courses) => {
      const course = courses.find(
        (c) => c.id === 'research-leadership-communication'
      );
      const total = course?.lessons.length ?? 4;
      const done = countCourseLessonsCompleted(course, progress.completedLessonIds);
      const pct = Math.round((done / total) * 100);
      return {
        unlocked: done >= total,
        current: done,
        target: total,
        percentage: pct,
        progressLabel: `${toBengaliDigits(done)}/${toBengaliDigits(total)} মডিউল`
      };
    }
  },
  {
    id: 'assessment-distinction',
    titleEn: 'Assessment Distinction',
    titleBn: 'উচ্চতর মূল্যায়ন পারদর্শী',
    category: 'quiz-excellence',
    categoryLabel: 'কুইজ উৎকর্ষ',
    tier: 'gold',
    tierLabel: 'স্বর্ণ পদক',
    iconKey: 'target',
    description:
      'কমপক্ষে ২টি প্রশিক্ষণ কোর্সের মূল্যায়ন কুইজে ৮০% বা তার বেশি নম্বর অর্জন করে বিশ্লেষণী দক্ষতা প্রমাণ করুন।',
    criteriaLabel: '২টি কোর্সের কুইজে ৮০%+ নম্বর অর্জন',
    targetTab: 'quiz',
    targetCourseId: 'tpack-digital-teaching',
    ctaLabel: 'মূল্যায়ন কুইজ দিন',
    evaluate: (progress) => {
      const highScores = Object.values(progress.quizResults).filter(
        (r) => r.passed && r.percentage >= 80
      ).length;
      const clamped = Math.min(2, highScores);
      return {
        unlocked: highScores >= 2,
        current: clamped,
        target: 2,
        percentage: Math.round((clamped / 2) * 100),
        progressLabel: `${toBengaliDigits(clamped)}/${toBengaliDigits(2)} কোর্সে ৮০%+`
      };
    }
  },
  {
    id: 'quiz-ace',
    titleEn: 'Quiz Ace 100%',
    titleBn: 'শতভাগ কুইজ বিজয়ী',
    category: 'quiz-excellence',
    categoryLabel: 'কুইজ উৎকর্ষ',
    tier: 'gold',
    tierLabel: 'সর্বোচ্চ স্কোর পদক',
    iconKey: 'trophy',
    description:
      'যেকোনো একটি কোর্সের মূল্যায়ন কুইজে ৫টি প্রশ্নের মধ্যে ৫টিতেই সঠিক উত্তর দিয়ে ১০০% নম্বর অর্জন করুন।',
    criteriaLabel: 'যেকোনো ১টি কুইজে ১০০% (৫/৫) স্কোর',
    targetTab: 'quiz',
    targetCourseId: 'tpack-digital-teaching',
    ctaLabel: 'কুইজ চ্যালেঞ্জ নিন',
    evaluate: (progress) => {
      const perfectCount = Object.values(progress.quizResults).filter(
        (r) => r.percentage === 100
      ).length;
      const done = Math.min(1, perfectCount);
      return {
        unlocked: perfectCount >= 1,
        current: done,
        target: 1,
        percentage: done * 100,
        progressLabel: done ? '১০০% স্কোর অর্জিত' : '০/১ শতভাগ স্কোর'
      };
    }
  },
  {
    id: 'resource-curator',
    titleEn: 'Lesson Plan Curator',
    titleBn: 'লেসন প্ল্যান সংগ্রাহক',
    category: 'cpd-milestone',
    categoryLabel: 'সামগ্রিক মাইলফলক',
    tier: 'emerald',
    tierLabel: 'সবুজ পদক',
    iconKey: 'book',
    description:
      'শ্রেণিকক্ষে ব্যবহারের জন্য কমপক্ষে ৬টি প্রশিক্ষণ উপকরণ ও লেসন প্ল্যান পঠিত বা ডাউনলোড হিসেবে সংরক্ষণ করুন।',
    criteriaLabel: 'কমপক্ষে ৬টি প্রশিক্ষণ উপকরণ পঠিত',
    targetTab: 'materials',
    ctaLabel: 'উপকরণ লাইব্রেরি দেখুন',
    evaluate: (progress) => {
      const target = 6;
      const count = Math.min(target, progress.readMaterialIds.length);
      return {
        unlocked: progress.readMaterialIds.length >= target,
        current: count,
        target,
        percentage: Math.round((count / target) * 100),
        progressLabel: `${toBengaliDigits(count)}/${toBengaliDigits(target)} উপকরণ`
      };
    }
  },
  {
    id: 'tpack-master-educator',
    titleEn: 'TPACK Master Educator',
    titleBn: 'সর্বাঙ্গীণ TPACK মাস্টার',
    category: 'cpd-milestone',
    categoryLabel: 'সামগ্রিক মাইলফলক',
    tier: 'forest',
    tierLabel: 'গ্র্যান্ড মাস্টার সম্মাননা',
    iconKey: 'calendar',
    description:
      'TPACK Academy-র সকল কোর্সের মডিউল সম্পন্ন করুন এবং প্রতিটি কোর্সের CPD মূল্যায়ন কুইজে উত্তীর্ণ হোন।',
    criteriaLabel: 'সকল মডিউল + সকল CPD কুইজ উত্তীর্ণ',
    targetTab: 'classroom',
    targetCourseId: 'tpack-digital-teaching',
    ctaLabel: 'সম্পূর্ণ কারিকুলাম দেখুন',
    evaluate: (progress, courses) => {
      const totalLessons = courses.reduce((s, c) => s + c.lessons.length, 0);
      const doneLessons = courses.reduce(
        (s, c) => s + countCourseLessonsCompleted(c, progress.completedLessonIds),
        0
      );
      const passedQuizzes = courses.filter(
        (c) => progress.quizResults[c.id]?.passed
      ).length;
      const target = totalLessons + courses.length;
      const current = doneLessons + passedQuizzes;
      return {
        unlocked: doneLessons >= totalLessons && passedQuizzes >= courses.length,
        current,
        target,
        percentage: Math.round((current / target) * 100),
        progressLabel: `${toBengaliDigits(doneLessons)}/${toBengaliDigits(totalLessons)} মডিউল · ${toBengaliDigits(passedQuizzes)}/${toBengaliDigits(courses.length)} কুইজ`
      };
    }
  }
];

export function evaluateAchievements(
  progress: LearnerProgress,
  courses: Course[]
): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map((def) => {
    const status = def.evaluate(progress, courses);
    return {
      ...def,
      status,
      earnedAt: status.unlocked
        ? progress.unlockedAchievementDates?.[def.id]
        : undefined
    };
  });
}
