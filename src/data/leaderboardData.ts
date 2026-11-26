export interface CohortTeacherEntry {
  id: string;
  name: string;
  designation: string;
  schoolName: string;
  district: string;
  totalStudySeconds: number;
  completedQuizModules: number;
  averageQuizPercentage: number;
  completedLessonsCount: number;
}

export const COHORT_TEACHER_PEERS: CohortTeacherEntry[] = [
  {
    id: 'peer-sharmin',
    name: 'শারমিন সুলতানা',
    designation: 'সিনিয়র শিক্ষক (বিজ্ঞান)',
    schoolName: 'কুমিল্লা মডেল গার্লস স্কুল',
    district: 'কুমিল্লা',
    totalStudySeconds: 22 * 3600 + 40 * 60, // ২২ ঘ. ৪০ মি.
    completedQuizModules: 3,
    averageQuizPercentage: 93,
    completedLessonsCount: 12
  },
  {
    id: 'peer-najmul',
    name: 'নাজমুল হক',
    designation: 'সহকারী শিক্ষক (গণিত)',
    schoolName: 'চাঁদপুর সরকারি উচ্চ বিদ্যালয়',
    district: 'চাঁদপুর',
    totalStudySeconds: 18 * 3600 + 15 * 60, // ১৮ ঘ. ১৫ মি.
    completedQuizModules: 3,
    averageQuizPercentage: 87,
    completedLessonsCount: 11
  },
  {
    id: 'peer-farzana',
    name: 'ফারজানা ইয়াসমিন',
    designation: 'সহকারী শিক্ষক (বাওবি)',
    schoolName: 'রাজশাহী আদর্শ উচ্চ বিদ্যালয়',
    district: 'রাজশাহী',
    totalStudySeconds: 15 * 3600 + 50 * 60, // ১৫ ঘ. ৫০ মি.
    completedQuizModules: 2,
    averageQuizPercentage: 90,
    completedLessonsCount: 9
  },
  {
    id: 'peer-mahmudul',
    name: 'মাহমুদুল হাসান',
    designation: 'সহকারী শিক্ষক (ইংরেজি)',
    schoolName: 'বগুড়া জিলা স্কুল',
    district: 'বগুড়া',
    totalStudySeconds: 11 * 3600 + 25 * 60, // ১১ ঘ. ২৫ মি.
    completedQuizModules: 2,
    averageQuizPercentage: 80,
    completedLessonsCount: 8
  },
  {
    id: 'peer-sayed',
    name: 'আবু সাঈদ',
    designation: 'সহকারী শিক্ষক (পদার্থবিজ্ঞান)',
    schoolName: 'সিলেট সরকারি পাইলট উচ্চ বিদ্যালয়',
    district: 'সিলেট',
    totalStudySeconds: 7 * 3600 + 45 * 60, // ৭ ঘ. ৪৫ মি.
    completedQuizModules: 1,
    averageQuizPercentage: 80,
    completedLessonsCount: 5
  },
  {
    id: 'peer-roksana',
    name: 'রোকসানা পারভীন',
    designation: 'প্রধান শিক্ষক (ভারপ্রাপ্ত)',
    schoolName: 'খুলনা সবুজ বাংলা মাধ্যমিক বিদ্যালয়',
    district: 'খুলনা',
    totalStudySeconds: 4 * 3600 + 20 * 60, // ৪ ঘ. ২০ মি.
    completedQuizModules: 1,
    averageQuizPercentage: 80,
    completedLessonsCount: 3
  },
  {
    id: 'peer-tanvir',
    name: 'তানভীর আহমেদ',
    designation: 'সহকারী শিক্ষক (আইসিটি)',
    schoolName: 'চট্টগ্রাম কলেজিয়েট স্কুল',
    district: 'চট্টগ্রাম',
    totalStudySeconds: 1 * 3600 + 30 * 60, // ১ ঘ. ৩০ মি.
    completedQuizModules: 0,
    averageQuizPercentage: 0,
    completedLessonsCount: 2
  }
];
