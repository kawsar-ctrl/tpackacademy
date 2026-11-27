import {
  AssignmentArtifactType,
  CertificationPathwayProgress,
  Course,
  PathwayStepId,
  PracticalAssignmentSubmission,
  QuizResult
} from '../types/lms';
import { toBengaliDigits } from './lmsHelpers';

export const EMPTY_PATHWAY_PROGRESS: CertificationPathwayProgress = {
  preAssessments: {},
  interactiveResults: {},
  assignments: {}
};

export interface CoursePathwayStatus {
  completedSteps: number;
  totalSteps: number;
  stepStatus: Record<PathwayStepId, boolean>;
}

export function computeCoursePathwayStatus(
  course: Course,
  completedLessonIds: string[],
  quizResults: Record<string, QuizResult>,
  pathwayProgress: CertificationPathwayProgress
): CoursePathwayStatus {
  const preDone = Boolean(pathwayProgress.preAssessments[course.id]);
  const videosDone =
    course.lessons.length > 0 &&
    course.lessons.every((l) => completedLessonIds.includes(l.id));
  const inter = pathwayProgress.interactiveResults[course.id];
  const interactiveDone = Boolean(
    inter && inter.quizChecked && inter.dragDropSolved && inter.scenarioSolved
  );
  const assignmentDone = Boolean(pathwayProgress.assignments[course.id]);
  const certDone = Boolean(quizResults[course.id]?.passed);

  const stepStatus: Record<PathwayStepId, boolean> = {
    'pre-assessment': preDone,
    'video-lessons': videosDone,
    'interactive-learning': interactiveDone,
    'practical-assignment': assignmentDone,
    certification: certDone
  };

  const completedSteps = Object.values(stepStatus).filter(Boolean).length;

  return {
    completedSteps,
    totalSteps: 5,
    stepStatus
  };
}

export interface PreAssessmentQuestionItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  diagnosticNote: string;
}

export function buildPreAssessmentQuestions(
  course: Course
): PreAssessmentQuestionItem[] {
  const customPre = course.pathwayConfig?.preAssessmentQuestions;
  if (Array.isArray(customPre) && customPre.length > 0) {
    return customPre;
  }
  const firstLesson = course.lessons[0];
  const secondLesson = course.lessons[1] ?? firstLesson;
  const thirdLesson = course.lessons[2] ?? secondLesson ?? firstLesson;
  const firstQuiz = course.quiz[0];
  const secondQuiz = course.quiz[1] ?? firstQuiz;

  const q1: PreAssessmentQuestionItem = firstQuiz
    ? {
        id: `${course.id}-pre-1`,
        prompt: `প্রাথমিক ধারণা যাচাই: ${firstQuiz.question}`,
        options: firstQuiz.options,
        correctIndex: firstQuiz.correctIndex,
        diagnosticNote: firstQuiz.explanation
      }
    : {
        id: `${course.id}-pre-1`,
        prompt: `‘${course.title}’ বিষয়ে শ্রেণিকক্ষে পাঠ পরিকল্পনা শুরু করার প্রথম ধাপ কোনটি?`,
        options: [
          'পাঠ্যবইয়ের পৃষ্ঠা মুখস্থ করতে বলা',
          'স্পষ্ট শিখনফল ও শিক্ষার্থীর পূর্বজ্ঞান যাচাই করে পাঠের কৌশল নির্ধারণ',
          'কোনো প্রস্তুতি ছাড়াই সরাসরি পরীক্ষা নেওয়া',
          'শুধু বাড়ির কাজ দেওয়া'
        ],
        correctIndex: 1,
        diagnosticNote:
          'যেকোনো আধুনিক মডিউলে শিখনফল ও শিক্ষার্থীর পূর্বজ্ঞান যাচাই থেকেই কার্যকর পাঠদান শুরু হয়।'
      };

  const q2: PreAssessmentQuestionItem = {
    id: `${course.id}-pre-2`,
    prompt: `“${firstLesson?.title ?? course.title}” প্রয়োগের ক্ষেত্রে কোন শ্রেণিকক্ষ দৃষ্টিভঙ্গিটি সবচেয়ে কার্যকর?`,
    options: [
      'শিক্ষক একটানা বক্তৃতা দেবেন এবং শিক্ষার্থীরা নীরবে শুনবে',
      firstLesson?.material.keyPoints[0] ??
        'শিক্ষার্থী-কেন্দ্রিক সক্রিয় অংশগ্রহণ ও কাঠামোবদ্ধ অনুশীলন নিশ্চিত করা',
      'কেবল সাময়িক পরীক্ষার আগের দিন অনুশীলন করানো',
      'পিছিয়ে পড়া শিক্ষার্থীদের আলোচনা থেকে বাদ রাখা'
    ],
    correctIndex: 1,
    diagnosticNote:
      firstLesson?.material.summary ??
      'সক্রিয় অংশগ্রহণ ও প্রমাণভিত্তিক কৌশল শ্রেণিকক্ষের শিখনফল বহুগুণ বাড়ায়।'
  };

  const q3: PreAssessmentQuestionItem = secondQuiz
    ? {
        id: `${course.id}-pre-3`,
        prompt: `প্রায়োগিক প্রস্তুতি যাচাই: ${secondQuiz.question}`,
        options: secondQuiz.options,
        correctIndex: secondQuiz.correctIndex,
        diagnosticNote: secondQuiz.explanation
      }
    : {
        id: `${course.id}-pre-3`,
        prompt: `“${thirdLesson?.title ?? course.title}” মডিউলটি বাস্তবায়নে সাফল্য মাপার সঠিক উপায় কী?`,
        options: [
          'পাঠ শেষে কোনো যাচাই না করা',
          thirdLesson?.material.actionChecklist[0] ??
            'শিক্ষার্থীর কাজের নমুনা, অংশগ্রহণ ও গঠনমূলক ফিডব্যাক পর্যালোচনা করা',
          'কেবল শ্রেণিকক্ষে নীরবতা বজায় রাখা',
          'মুখস্থ উত্তর মিলিয়ে নেওয়া'
        ],
        correctIndex: 1,
        diagnosticNote:
          'নিয়মিত গঠনমূলক মূল্যায়ন ও প্রামাণিক ফিডব্যাক শিক্ষকের পাঠদানকে পরিমার্জিত করে।'
      };

  return [q1, q2, q3];
}

export interface DragDropStepItem {
  id: string;
  label: string;
  correctOrder: number;
}

export interface InteractiveActivitiesBundle {
  microQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  dragDropSteps: DragDropStepItem[];
  scenario: {
    context: string;
    challenge: string;
    choices: {
      text: string;
      isBest: boolean;
      feedback: string;
    }[];
  };
}

export function buildInteractiveActivities(
  course: Course
): InteractiveActivitiesBundle {
  const l1 = course.lessons[0];
  const l2 = course.lessons[1] ?? l1;
  const l3 = course.lessons[2] ?? l2 ?? l1;

  const customQuiz = course.pathwayConfig?.interactiveMicroQuiz;
  const targetQuiz = course.quiz[2] ?? course.quiz[0];
  const microQuiz =
    customQuiz && customQuiz.question.trim()
      ? customQuiz
      : targetQuiz
        ? {
            question: targetQuiz.question,
            options: targetQuiz.options,
            correctIndex: targetQuiz.correctIndex,
            explanation: targetQuiz.explanation
          }
        : {
            question: `‘${course.title}’ মডিউল অনুসারে পাঠদানের মূল লক্ষ্য কী?`,
            options: [
              'শুধুমাত্র মুখস্থ নির্ভরতা বাড়ানো',
              'সক্রিয় শিখন, বাস্তব প্রয়োগ ও গঠনমূলক মূল্যায়ন নিশ্চিত করা',
              'শিক্ষার্থীদের প্রশ্ন করা নিরুৎসাহিত করা',
              'কেবল লেকচার নোট কপি করানো'
            ],
            correctIndex: 1,
            explanation:
              'সক্রিয় অংশগ্রহণ ও বাস্তব প্রয়োগই আধুনিক পেশাগত দক্ষতা উন্নয়ন কাঠামোর প্রাণ।'
          };

  const customDragSteps = course.pathwayConfig?.interactiveDragSteps;
  const orderedSteps: DragDropStepItem[] =
    Array.isArray(customDragSteps) &&
    customDragSteps.length === 4 &&
    customDragSteps.every((s) => s.trim().length > 0)
      ? customDragSteps.map((label, idx) => ({
          id: `${course.id}-step-${idx + 1}`,
          label: label.trim(),
          correctOrder: idx + 1
        }))
      : [
          {
            id: `${course.id}-step-1`,
            label: `ধাপ ১ · ভিত্তি ও উদ্দেশ্য: ${l1?.chapters[0]?.title ?? l1?.title ?? 'পূর্বজ্ঞান সংযোগ ও লক্ষ্য নির্ধারণ'}`,
            correctOrder: 1
          },
          {
            id: `${course.id}-step-2`,
            label: `ধাপ ২ · মূল অনুশীলন: ${l2?.chapters[0]?.title ?? l2?.title ?? 'সক্রিয় শ্রেণিকক্ষ কৌশল প্রয়োগ'}`,
            correctOrder: 2
          },
          {
            id: `${course.id}-step-3`,
            label: `ধাপ ৩ · কৌশল বাস্তবায়ন: ${l2?.material.actionChecklist[0] ?? l1?.material.actionChecklist[0] ?? 'সহযোগিতামূলক কাজ ও প্রমাণ সংগ্রহ'}`,
            correctOrder: 3
          },
          {
            id: `${course.id}-step-4`,
            label: `ধাপ ৪ · মূল্যায়ন ও প্রতিফলন: ${l3?.chapters[1]?.title ?? l3?.title ?? 'গঠনমূলক ফিডব্যাক ও শিখন যাচাই'}`,
            correctOrder: 4
          }
        ];

  // Deterministic scramble [2, 0, 3, 1] so teacher genuinely reorders it
  const dragDropSteps: DragDropStepItem[] = [
    orderedSteps[2],
    orderedSteps[0],
    orderedSteps[3],
    orderedSteps[1]
  ];

  const customScenario = course.pathwayConfig?.interactiveScenario;
  const activity = l1?.material.classroomActivity;
  const scenario =
    customScenario &&
    customScenario.challenge.trim() &&
    customScenario.choices.length >= 2
      ? customScenario
      : {
          context: `${activity?.gradeLevel ?? 'মাধ্যমিক শ্রেণি'} (${activity?.duration ?? '৪৫ মিনিট'}) — বিষয়: ${course.title}`,
          challenge:
            course.lessons.length > 0
              ? `আপনার ক্লাসে “${l1.title}” পরিচালনার সময় দেখা গেল অর্ধেকের বেশি শিক্ষার্থী মূল ধারণায় আটকে গেছে এবং নীরবে বসে আছে। এখন আপনার সর্বোত্তম পদক্ষেপ কোনটি?`
              : 'ক্লাসের অর্ধেক শিক্ষার্থী পাঠের মূল ধাপে আটকে গেছে। এখন আপনার সর্বোত্তম পদক্ষেপ কোনটি?',
          choices: [
            {
              text: 'পাঠ থামিয়ে পুরো অধ্যায়টি আবার একটানা রিডিং পড়ে শোনানো',
              isBest: false,
              feedback:
                'একটানা রিডিং পড়া বা পুনরায় লেকচার দিলে শিক্ষার্থীর কগনিটিভ লোড বাড়ে কিন্তু জটিলতা দূর হয় না।'
            },
            {
              text:
                l1?.material.actionChecklist[0]
                  ? `কৌশল পরিবর্তন করে “${l1.material.actionChecklist[0]}” প্রয়োগ করা ও জোড়ায় ২ মিনিটের আলোচনা দিয়ে স্ক্যাফোল্ড করা`
                  : 'জটিল অংশটি ছোট ধাপে ভেঙে জোড়ায় আলোচনা ও তাৎক্ষণিক কনসেপ্ট-চেকের মাধ্যমে সহায়তা করা',
              isBest: true,
              feedback:
                'চমৎকার সিদ্ধান্ত! ছোট ধাপে স্ক্যাফোল্ডিং, জোড়ায় আলোচনা এবং মডিউলের ব্যবহারিক কৌশল প্রয়োগ করলে পিছিয়ে থাকা শিক্ষার্থীরাও দ্রুত ধারণা ধরতে পারে।'
            },
            {
              text: 'যারা বুঝতে পারছে না তাদের বাদ দিয়ে দ্রুত পরবর্তী অধ্যায়ে চলে যাওয়া',
              isBest: false,
              feedback:
                'শিখন ঘাটতি (Learning Gap) রেখে পরবর্তী অধ্যায়ে গেলে শিক্ষার্থীরা পরের পাঠগুলোতেও পিছিয়ে পড়বে।'
            }
          ]
        };

  return {
    microQuiz,
    dragDropSteps,
    scenario
  };
}

export function buildAssignmentTemplate(
  course: Course,
  artifactType: AssignmentArtifactType
): Omit<PracticalAssignmentSubmission, 'courseId' | 'submittedAt'> {
  const customAssign = course.pathwayConfig?.assignmentDefaults;
  if (
    customAssign &&
    customAssign.defaultType === artifactType &&
    customAssign.title.trim()
  ) {
    return {
      artifactType,
      title: customAssign.title,
      gradeAndDuration: customAssign.gradeAndDuration,
      learningObjective: customAssign.learningObjective,
      activitiesAndMaterials: customAssign.activitiesAndMaterials,
      assessmentMethod: customAssign.assessmentMethod
    };
  }
  const l1 = course.lessons[0];
  const l2 = course.lessons[1] ?? l1;
  const gradeAndDuration = `${l1?.material.classroomActivity.gradeLevel ?? '৬ষ্ঠ – ১০ম শ্রেণি'} · ${l1?.material.classroomActivity.duration ?? '৪৫ মিনিট'}`;
  const cleanTitle = course.title.replace(/^[০-৯]+\s*·\s*/, '');

  if (artifactType === 'worksheet') {
    return {
      artifactType,
      title: `${cleanTitle} — শিক্ষার্থী অনুশীলন ওয়ার্কশিট`,
      gradeAndDuration,
      learningObjective:
        l1?.material.classroomActivity.objective ??
        `${cleanTitle}-এর মূল ধারণা হাতে-কলমে অনুশীলন ও বিশ্লেষণ করা।`,
      activitiesAndMaterials: [
        `১. ওয়ার্ম-আপ প্রশ্ন: ${l1?.chapters[0]?.caption ?? 'পূর্বজ্ঞানের সাথে সংযোগমূলক ১টি সংক্ষিপ্ত প্রশ্ন।'}`,
        `২. দলীয় অনুশীলন কাজ: ${l1?.material.keyPoints[0] ?? 'মূল ধারণার ওপর ৩ ধাপের প্র্যাকটিস টাস্ক।'}`,
        `৩. এক্সটেনশন চ্যালেঞ্জ: ${l2?.material.keyPoints[0] ?? 'বাস্তব জীবনের একটি সমস্যা সমাধান।'}`
      ].join('\n'),
      assessmentMethod:
        '৩-স্তরের স্ব-মূল্যায়ন রুব্রিক ও ক্লাস শেষে ২-মিনিটের এক্সিট টিকিট যাচাই।'
    };
  }

  if (artifactType === 'digital-content') {
    return {
      artifactType,
      title: `${cleanTitle} — মাইক্রো-ডিজিটাল কনটেন্ট ও স্লাইড স্ক্রিপ্ট`,
      gradeAndDuration: `${l1?.material.classroomActivity.gradeLevel ?? 'সকল শ্রেণি'} · ৫ মিনিট মাইক্রো-কনটেন্ট`,
      learningObjective:
        l2?.material.classroomActivity.objective ??
        `${cleanTitle}-এর জটিল ধারণা ৩টি ভিজ্যুয়াল স্লাইড ও ১টি কুইজ পোলের মাধ্যমে উপস্থাপন।`,
      activitiesAndMaterials: [
        `স্লাইড ১ (Hook · ১ মি.): ${l1?.chapters[0]?.title ?? 'আকর্ষণীয় বাস্তব প্রশ্ন ও চিত্র'}`,
        `স্লাইড ২ (Core Concept · ২ মি.): ${l1?.material.keyPoints[0] ?? 'মূল সূত্র/ধারণার ডায়াগ্রাম ও সংক্ষিপ্ত বুলেট পয়েন্ট'}`,
        `স্লাইড ৩ (Interactive Check · ২ মি.): ${l1?.material.actionChecklist[0] ?? 'শিক্ষার্থীর জন্য ১টি পজ-কুইজ ও প্র্যাকটিস প্রম্পট'}`
      ].join('\n'),
      assessmentMethod:
        'ডিজিটাল পোল / H5P তাৎক্ষণিক প্রতিক্রিয়া ও অফলাইন ব্যাকআপ পিডিএফ হ্যান্ডআউট।'
    };
  }

  return {
    artifactType: 'lesson-plan',
    title: `${cleanTitle} — ৪৫ মিনিটের আধুনিক লেসন প্ল্যান`,
    gradeAndDuration,
    learningObjective:
      l1?.material.classroomActivity.objective ??
      `${cleanTitle}-এর শিক্ষণ কৌশল শ্রেণিকক্ষে সফলভাবে প্রয়োগ করা।`,
    activitiesAndMaterials: [
      `• সূচনা (৫ মি.): ${l1?.chapters[0]?.title ?? 'কৌতূহল-উদ্দীপক প্রশ্ন ও পূর্বজ্ঞান যাচাই'}`,
      `• মূল কার্যক্রম (২৫ মি.): ${l1?.material.keyPoints[0] ?? 'সক্রিয় দলীয় অনুসন্ধান ও শিক্ষকের স্ক্যাফোল্ডিং'}`,
      `• উপকরণ: ${l1?.material.formatLabel ?? 'প্রিন্টেড হ্যান্ডআউট'}, বোর্ড-ডায়াগ্রাম ও ${l1?.material.actionChecklist[0] ?? 'কার্যক্রম কার্ড'}`
    ].join('\n'),
    assessmentMethod:
      'পিরিয়ড চলাকালীন পর্যবেক্ষণ চেকলিস্ট এবং ক্লাস শেষে ২-মিনিটের এক্সিট টিকিট মূল্যায়ন।'
  };
}

export function downloadPracticalAssignmentTxt(
  courseTitle: string,
  teacherName: string,
  submission: PracticalAssignmentSubmission
): void {
  const typeLabel =
    submission.artifactType === 'worksheet'
      ? 'Worksheet (শিক্ষার্থী ওয়ার্কশিট)'
      : submission.artifactType === 'digital-content'
        ? 'Digital Content (ডিজিটাল কনটেন্ট ডিজাইন)'
        : 'Lesson Plan (পাঠ পরিকল্পনা)';

  const lines = [
    '====================================================================',
    'TPACK Academy · Smart Teacher Certification Pathway (Step 4 Assignment)',
    '====================================================================',
    `শিক্ষক: ${teacherName || 'প্রশিক্ষণার্থী শিক্ষক'}`,
    `মডিউল: ${courseTitle}`,
    `কাজের ধরন: ${typeLabel}`,
    `শিরোনাম: ${submission.title}`,
    `শ্রেণি ও সময়কাল: ${submission.gradeAndDuration}`,
    `জমাদানের তারিখ: ${submission.submittedAt}`,
    submission.attachmentName ? `সংযুক্ত নথি: ${submission.attachmentName}` : '',
    '',
    '--- প্রত্যাশিত শিখনফল (Learning Objective) ---',
    submission.learningObjective,
    '',
    '--- মূল কার্যক্রম, ধাপ ও উপকরণ ---',
    submission.activitiesAndMaterials,
    '',
    '--- মূল্যায়ন কৌশল (Assessment Strategy) ---',
    submission.assessmentMethod,
    '',
    '====================================================================',
    `মোট ধাপ সম্পন্ন হয়েছে: ${toBengaliDigits(4)}/৫ · TPACK Academy`
  ].filter((line) => line !== undefined);

  const blob = new Blob([lines.join('\n')], {
    type: 'text/plain;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${submission.courseId}-${submission.artifactType}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
