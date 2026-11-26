export type PdPillarId =
  | 'pedagogy-science'
  | 'digital-ai-data'
  | 'wellbeing-safeguarding'
  | 'leadership-research';

export type PdTierId = 'foundation' | 'practitioner' | 'master';

export interface PdPillarMeta {
  id: PdPillarId;
  code: string;
  titleBn: string;
  subtitleEn: string;
  description: string;
  accentLabel: string;
}

export interface PdTierMeta {
  id: PdTierId;
  labelBn: string;
  subtitleEn: string;
  targetDescription: string;
}

export interface PdFrameworkModuleItem {
  code: string;
  order: number;
  courseId: string;
  shortTitle: string;
  titleBn: string;
  pillarId: PdPillarId;
  tier: PdTierId;
  cpdHours: number;
  focusTag: string;
  competencySummary: string;
}

export interface TeacherCareerStage {
  id: string;
  titleBn: string;
  subtitleEn: string;
  nextMilestoneBn: string;
}

export const PD_FRAMEWORK_PILLARS: PdPillarMeta[] = [
  {
    id: 'pedagogy-science',
    code: 'স্তম্ভ ০১',
    titleBn: 'আধুনিক পেডাগজি ও লার্নিং সায়েন্স',
    subtitleEn: 'Pedagogical Mastery & Learning Science',
    description:
      '৫ই মডেল, ক্লাস ম্যানেজমেন্ট, UDL, PBL/PrBL, মূল্যায়ন, CBE, ডিফারেন্সিয়েটেড নির্দেশনা, STEM/STEAM, নিউরোএডুকেশন ও বিষয়ভিত্তিক PCK।',
    accentLabel: 'শিখন বিজ্ঞান ও মূল্যায়ন'
  },
  {
    id: 'digital-ai-data',
    code: 'স্তম্ভ ০২',
    titleBn: 'টিপ্যাক, আইসিটি, এআই ও ডেটা',
    subtitleEn: 'TPACK, ICT, AI Ethics & Analytics',
    description:
      'TPACK সমন্বয়, ক্লাউড ICT, এআই পাঠ পরিকল্পনা ও নৈতিকতা, ডিজিটাল কনটেন্ট ও H5P, গেমিফিকেশন, ফ্লিপড লার্নিং, সাইবার নিরাপত্তা ও ডেটা অ্যানালিটিক্স।',
    accentLabel: 'স্মার্ট প্রযুক্তি ও ডেটা'
  },
  {
    id: 'wellbeing-safeguarding',
    code: 'স্তম্ভ ০৩',
    titleBn: 'শিশু মনোবিজ্ঞান, সুরক্ষা ও সুস্থতা',
    subtitleEn: 'Psychology, Safeguarding & Wellbeing',
    description:
      'শিশু-কিশোর মনোবিজ্ঞান, আবেগীয় ও সামাজিক শিখন (SEL), শিশু সুরক্ষা নীতি, শিক্ষক-শিক্ষার্থী শিষ্টাচার ও শিক্ষকের বার্নআউট প্রতিরোধ।',
    accentLabel: 'নিরাপদ ও মানবিক স্কুল'
  },
  {
    id: 'leadership-research',
    code: 'স্তম্ভ ০৪',
    titleBn: 'নেতৃত্ব, কারিকুলাম, গবেষণা ও সংযোগ',
    subtitleEn: 'Leadership, Curriculum & Research',
    description:
      'রূপান্তরমূলক শিক্ষা নেতৃত্ব, কারিকুলাম ও UbD ডিজাইন, অ্যাকশন রিসার্চ, ইনস্ট্রাকশনাল কোচিং ও PLC, ২১ শতকের 4Cs, অভিভাবক সংযোগ ও যোগাযোগ দক্ষতা।',
    accentLabel: 'নেতৃত্ব ও গবেষণা'
  }
];

export const PD_TIERS: PdTierMeta[] = [
  {
    id: 'foundation',
    labelBn: 'প্রারম্ভিক (Foundation)',
    subtitleEn: 'Tier 1 · Core Readiness',
    targetDescription: 'প্রতিটি শিক্ষকের জন্য মৌলিক TPACK, পেডাগজি, শ্রেণিকক্ষ শৃঙ্খলা, সুরক্ষা, যোগাযোগ ও সুস্থতার ভিত্তি'
  },
  {
    id: 'practitioner',
    labelBn: 'অনুশীলন (Practitioner)',
    subtitleEn: 'Tier 2 · Applied Mastery',
    targetDescription: 'ICT/AI, UDL, PBL, ডিজিটাল কনটেন্ট, ডিফারেন্সিয়েশন, নিউরোএডুকেশন ও ডেটা-ভিত্তিক পাঠদান'
  },
  {
    id: 'master',
    labelBn: 'মাস্টার (Master Educator)',
    subtitleEn: 'Tier 3 · Leadership & Innovation',
    targetDescription: 'শিক্ষা নেতৃত্ব, কারিকুলাম এক্সপার্ট, কোচিং, অ্যাকশন রিসার্চ, CBE, AI নৈতিকতা ও বিষয়ভিত্তিক PCK'
  }
];

export const PD_FRAMEWORK_ITEMS: PdFrameworkModuleItem[] = [
  {
    code: 'PD-০১',
    order: 1,
    courseId: 'tpack-digital-teaching',
    shortTitle: 'TPACK Framework & Digital Teaching',
    titleBn: 'প্রযুক্তি, পেডাগজি ও বিষয়জ্ঞানের সমন্বিত স্মার্ট পাঠদান',
    pillarId: 'digital-ai-data',
    tier: 'foundation',
    cpdHours: 12,
    focusTag: 'TPACK সমন্বয়',
    competencySummary: 'CK-PK-TK সমন্বয়, মাল্টিমিডিয়া ডিজাইন, হাইব্রিড LMS ও নিরাপদ এডটেক'
  },
  {
    code: 'PD-০২',
    order: 2,
    courseId: 'modern-pedagogy-assessment',
    shortTitle: 'Modern Pedagogy & Assessment',
    titleBn: 'ব্লুমস ট্যাক্সোনমি, ৫ই মডেল, রুব্রিক ও অন্তর্ভুক্তিমূলক পাঠদান',
    pillarId: 'pedagogy-science',
    tier: 'foundation',
    cpdHours: 10,
    focusTag: '৫ই ও মূল্যায়ন',
    competencySummary: 'উচ্চতর চিন্তন দক্ষতা, ৪-স্তরের রুব্রিক, ইতিবাচক শৃঙ্খলা ও UDL'
  },
  {
    code: 'PD-০৩',
    order: 3,
    courseId: 'research-leadership-communication',
    shortTitle: 'Action Research & Teacher Leadership',
    titleBn: 'অ্যাকশন রিসার্চ, যোগাযোগ, PLC ও পেশাগত পোর্টফোলিও',
    pillarId: 'leadership-research',
    tier: 'practitioner',
    cpdHours: 10,
    focusTag: 'রিসার্চ ও PLC',
    competencySummary: 'শ্রেণিকক্ষ গবেষণা চক্র, প্রজেক্ট-ভিত্তিক শিখন ও টিচিং পোর্টফোলিও'
  },
  {
    code: 'PD-০৪',
    order: 4,
    courseId: 'classroom-management-modern',
    shortTitle: 'Classroom Management (PBIS)',
    titleBn: 'প্রো-অ্যাক্টিভ রুটিন, কো-রেগুলেশন ও রেস্টোরেটিভ শৃঙ্খলা',
    pillarId: 'pedagogy-science',
    tier: 'foundation',
    cpdHours: 10,
    focusTag: 'শ্রেণিকক্ষ শৃঙ্খলা',
    competencySummary: 'PBIS ফ্রেমওয়ার্ক, স্মার্ট ট্রানজিশন ও অ-শাস্তিমূলক আচরণ সংশোধন'
  },
  {
    code: 'PD-০৫',
    order: 5,
    courseId: 'education-leadership-modern',
    shortTitle: 'Educational Leadership',
    titleBn: 'রূপান্তরমূলক নেতৃত্ব, ইনস্ট্রাকশনাল কোচিং ও স্কুল সংস্কৃতি',
    pillarId: 'leadership-research',
    tier: 'master',
    cpdHours: 12,
    focusTag: 'শিক্ষা নেতৃত্ব',
    competencySummary: 'ডিস্ট্রিবিউটেড টিম নেতৃত্ব, ABC ডেটা ও পরিবর্তন ব্যবস্থাপনা'
  },
  {
    code: 'PD-০৬',
    order: 6,
    courseId: 'ict-in-education-modern',
    shortTitle: 'ICT in Education (SAMR)',
    titleBn: 'স্মার্ট শ্রেণিকক্ষ, ক্লাউড সহযোগিতা ও অফলাইন-সক্ষম এডটেক',
    pillarId: 'digital-ai-data',
    tier: 'practitioner',
    cpdHours: 12,
    focusTag: 'স্মার্ট ICT ও SAMR',
    competencySummary: 'SAMR রূপান্তর স্তর, ইন্টারঅ্যাক্টিভ বোর্ড ও লো-ব্যান্ডউইথ সিমুলেশন'
  },
  {
    code: 'PD-০৭',
    order: 7,
    courseId: 'ai-in-education-modern',
    shortTitle: 'AI in Education',
    titleBn: 'এআই-চালিত পাঠ পরিকল্পনা, RTCF প্রম্পটিং ও এথিক্যাল টিচিং',
    pillarId: 'digital-ai-data',
    tier: 'practitioner',
    cpdHours: 12,
    focusTag: 'AI লেসন ডিজাইন',
    competencySummary: 'RTCF প্রম্পট ইঞ্জিনিয়ারিং, অ্যাডাপ্টিভ ডিফারেন্সিয়েশন ও হ্যালুসিনেশন যাচাই'
  },
  {
    code: 'PD-০৮',
    order: 8,
    courseId: 'inclusive-education-udl',
    shortTitle: 'Inclusive Education (UDL 3.0)',
    titleBn: 'নিউরোডাইভার্সিটি, IEP অভিযোজন ও সমতাভিত্তিক শ্রেণিকক্ষ',
    pillarId: 'pedagogy-science',
    tier: 'practitioner',
    cpdHours: 12,
    focusTag: 'অন্তর্ভুক্তিমূলক UDL',
    competencySummary: 'UDL 3.0 প্রবেশগম্যতা, ডিসলেক্সিয়া ও ADHD সহায়তা এবং স্ক্যাফোল্ডিং'
  },
  {
    code: 'PD-০৯',
    order: 9,
    courseId: 'manners-etiquettes-educators',
    shortTitle: 'Manners & Etiquettes',
    titleBn: 'শিক্ষক-শিক্ষার্থী শিষ্টাচার, সম্মানজনক সংলাপ ও ডিজিটাল নেটিকেট',
    pillarId: 'wellbeing-safeguarding',
    tier: 'foundation',
    cpdHours: 8,
    focusTag: 'শিষ্টাচার ও নেটিকেট',
    competencySummary: 'রোল-মডেলিং, শালীন ভিন্নমত প্রকাশ ও পেশাদার আচরণবিধি'
  },
  {
    code: 'PD-১০',
    order: 10,
    courseId: 'child-psychology-learning',
    shortTitle: 'Child Psychology & Learning',
    titleBn: 'শিশু-কিশোর মনোবিজ্ঞান, এক্সিকিউটিভ ফাংশন ও ট্রমা-ইনফর্মড কেয়ার',
    pillarId: 'wellbeing-safeguarding',
    tier: 'practitioner',
    cpdHours: 12,
    focusTag: 'শিশু মনোবিজ্ঞান',
    competencySummary: 'বিকাশগত চাহিদা, মনোযোগ স্প্যান, নিরাপদ সংযুক্তি ও গ্রোথ মাইন্ডসেট'
  },
  {
    code: 'PD-১১',
    order: 11,
    courseId: 'curriculum-expert-design',
    shortTitle: 'Curriculum Expert & UbD Design',
    titleBn: 'ব্যাকওয়ার্ড ডিজাইন, Constructive Alignment ও কারিকুলাম ম্যাপিং',
    pillarId: 'leadership-research',
    tier: 'master',
    cpdHours: 12,
    focusTag: 'কারিকুলাম ডিজাইন',
    competencySummary: 'UbD ৩-ধাপ নকশা, যোগ্যতা ম্যাপিং ও স্পাইরাল শিক্ষাক্রম সমন্বয়'
  },
  {
    code: 'PD-১২',
    order: 12,
    courseId: 'pd-01-pbl',
    shortTitle: 'Project-Based Learning (PBL)',
    titleBn: 'প্রকল্পভিত্তিক শিখন ও বাস্তব সমস্যা সমাধান',
    pillarId: 'pedagogy-science',
    tier: 'practitioner',
    cpdHours: 8,
    focusTag: 'PBL ও সৃজনশীলতা',
    competencySummary: 'Driving Question, দলীয় প্রজেক্ট পরিচালনা ও পাবলিক শোকেস মূল্যায়ন'
  },
  {
    code: 'PD-১৩',
    order: 13,
    courseId: 'pd-02-assessment-literacy',
    shortTitle: 'Assessment Literacy & Evaluation',
    titleBn: 'ব্লুমস, Formative/Summative, রুব্রিক ও ফিডব্যাক',
    pillarId: 'pedagogy-science',
    tier: 'foundation',
    cpdHours: 8,
    focusTag: 'মূল্যায়ন দক্ষতা',
    competencySummary: 'ন্যায়সঙ্গত রুব্রিক, গঠনমূলক প্রশ্নপত্র ও কার্যকর ফিডব্যাক প্রদান'
  },
  {
    code: 'PD-১৪',
    order: 14,
    courseId: 'pd-03-sel',
    shortTitle: 'Social Emotional Learning (SEL)',
    titleBn: 'আবেগীয় বুদ্ধিমত্তা, সহমর্মিতা ও মানসিক সুস্থতা',
    pillarId: 'wellbeing-safeguarding',
    tier: 'foundation',
    cpdHours: 8,
    focusTag: 'CASEL ৫ দক্ষতা',
    competencySummary: 'শিক্ষার্থীর আত্মনিয়ন্ত্রণ, সহমর্মিতা ও ইতিবাচক সম্পর্ক গঠন'
  },
  {
    code: 'PD-১৫',
    order: 15,
    courseId: 'pd-04-digital-content',
    shortTitle: 'Digital Content & Instructional Design',
    titleBn: 'ভিডিও, অ্যানিমেশন, H5P ও ডিজিটাল ম্যাটেরিয়াল',
    pillarId: 'digital-ai-data',
    tier: 'practitioner',
    cpdHours: 10,
    focusTag: 'ইনস্ট্রাকশনাল ডিজাইন',
    competencySummary: 'Mayer মাল্টিমিডিয়া নীতি ও ইন্টারঅ্যাক্টিভ ডিজিটাল পাঠ নির্মাণ'
  },
  {
    code: 'PD-১৬',
    order: 16,
    courseId: 'pd-05-stem-steam',
    shortTitle: 'STEM & STEAM Education',
    titleBn: 'বিজ্ঞান, প্রযুক্তি, প্রকৌশল, গণিত ও শিল্পকলা সমন্বয়',
    pillarId: 'pedagogy-science',
    tier: 'practitioner',
    cpdHours: 10,
    focusTag: 'হাতে-কলমে STEAM',
    competencySummary: 'Engineering Design Process ও আন্তঃবিষয়ক প্রোটোটাইপিং'
  },
  {
    code: 'PD-১৭',
    order: 17,
    courseId: 'pd-06-gamification',
    shortTitle: 'Gamification & Experiential Learning',
    titleBn: 'গেমভিত্তিক শিক্ষণ, পয়েন্ট, ব্যাজ ও অভিজ্ঞতাভিত্তিক শিখন',
    pillarId: 'digital-ai-data',
    tier: 'practitioner',
    cpdHours: 8,
    focusTag: 'গেমিফিকেশন ও Kolb',
    competencySummary: 'সক্রিয় কুইজ, প্রেষণামূলক চ্যালেঞ্জ ও অভিজ্ঞতাভিত্তিক শিখন চক্র'
  },
  {
    code: 'PD-১৮',
    order: 18,
    courseId: 'pd-07-parent-engagement',
    shortTitle: 'Parent Engagement & Communication',
    titleBn: 'অভিভাবক-শিক্ষক সংযোগ ও অংশীদারত্ব',
    pillarId: 'leadership-research',
    tier: 'foundation',
    cpdHours: 8,
    focusTag: 'অভিভাবক সংযোগ',
    competencySummary: 'কাঠামোবদ্ধ অভিভাবক সম্মেলন, সংবেদনশীল সংলাপ ও হোম-স্কুল সেতু'
  },
  {
    code: 'PD-১৯',
    order: 19,
    courseId: 'pd-08-digital-citizenship',
    shortTitle: 'Digital Citizenship & Cyber Safety',
    titleBn: 'অনলাইন নিরাপত্তা, সাইবার বুলিং প্রতিরোধ ও তথ্য যাচাই',
    pillarId: 'digital-ai-data',
    tier: 'foundation',
    cpdHours: 8,
    focusTag: 'সাইবার নিরাপত্তা',
    competencySummary: 'ডিজিটাল ফুটপ্রিন্ট, কপিরাইট ও নিরাপদ অনলাইন নাগরিকত্ব'
  },
  {
    code: 'PD-২০',
    order: 20,
    courseId: 'pd-09-instructional-coaching',
    shortTitle: 'Instructional Coaching & Mentoring',
    titleBn: 'Peer Observation, Lesson Study ও PLC মেন্টরিং',
    pillarId: 'leadership-research',
    tier: 'master',
    cpdHours: 8,
    focusTag: 'Lesson Study ও PLC',
    competencySummary: 'সহকর্মী-ভিত্তিক কোচিং চক্র ও স্কুল প্রফেশনাল লার্নিং কমিউনিটি'
  },
  {
    code: 'PD-২১',
    order: 21,
    courseId: 'pd-10-data-analytics',
    shortTitle: 'Data-Driven Teaching & Analytics',
    titleBn: 'পারফরম্যান্স বিশ্লেষণ ও Learning Gap শনাক্তকরণ',
    pillarId: 'digital-ai-data',
    tier: 'practitioner',
    cpdHours: 8,
    focusTag: 'লার্নিং অ্যানালিটিক্স',
    competencySummary: 'আইটেম বিশ্লেষণ, ঝুঁকিপূর্ণ শিক্ষার্থী চিহ্নিতকরণ ও প্রমাণভিত্তিক সিদ্ধান্ত'
  },
  {
    code: 'PD-২২',
    order: 22,
    courseId: 'pd-11-child-safeguarding',
    shortTitle: 'Child Safeguarding & Wellbeing',
    titleBn: 'শিশু সুরক্ষা নীতি, বুলিং প্রতিরোধ ও পজিটিভ ডিসিপ্লিন',
    pillarId: 'wellbeing-safeguarding',
    tier: 'foundation',
    cpdHours: 8,
    focusTag: 'শিশু সুরক্ষা নীতি',
    competencySummary: 'নিরাপদ ও ভয়মুক্ত বিদ্যালয় পরিবেশ এবং সুরক্ষা রিপোর্টিং প্রোটোকল'
  },
  {
    code: 'PD-২৩',
    order: 23,
    courseId: 'pd-12-differentiated-instruction',
    shortTitle: 'Differentiated & Personalized Learning',
    titleBn: 'শিক্ষার্থীর সক্ষমতা অনুযায়ী পাঠ, Remedial ও Enrichment',
    pillarId: 'pedagogy-science',
    tier: 'practitioner',
    cpdHours: 8,
    focusTag: 'ডিফারেন্সিয়েটেড পাঠ',
    competencySummary: 'কনটেন্ট-প্রসেস-প্রোডাক্ট বৈচিত্র্য ও রোটেশন স্টেশন পরিচালনা'
  },
  {
    code: 'PD-২৪',
    order: 24,
    courseId: 'pd-13-21st-century-skills',
    shortTitle: '21st Century Skills (4Cs)',
    titleBn: 'Critical Thinking, Creativity, Collaboration, Communication',
    pillarId: 'leadership-research',
    tier: 'foundation',
    cpdHours: 8,
    focusTag: '4Cs দক্ষতা বিকাশ',
    competencySummary: 'প্রতিটি বিষয়ের দৈনন্দিন পাঠদানে 4Cs কাঠামো ও দলীয় ভূমিকা বণ্টন'
  },
  {
    code: 'PD-২৫',
    order: 25,
    courseId: 'pd-14-competency-based-ed',
    shortTitle: 'Competency-Based Education (CBE)',
    titleBn: 'যোগ্যতাভিত্তিক শিখন ও পারফরম্যান্স মূল্যায়ন',
    pillarId: 'pedagogy-science',
    tier: 'master',
    cpdHours: 10,
    focusTag: 'যোগ্যতাভিত্তিক শিক্ষা',
    competencySummary: 'মাস্টারি-ভিত্তিক অগ্রগতি, দক্ষতা প্রদর্শন ও পারফরম্যান্স সূচক'
  },
  {
    code: 'PD-২৬',
    order: 26,
    courseId: 'pd-15-flipped-blended',
    shortTitle: 'Flipped & Blended Learning',
    titleBn: 'Flipped Classroom ও অনলাইন-অফলাইন হাইব্রিড শিক্ষণ',
    pillarId: 'digital-ai-data',
    tier: 'practitioner',
    cpdHours: 8,
    focusTag: 'হাইব্রিড ও ফ্লিপড',
    competencySummary: 'প্রি-ক্লাস মাইক্রো-লেসন ও ইন-ক্লাস সক্রিয় অনুশীলনের সুষম সমন্বয়'
  },
  {
    code: 'PD-২৭',
    order: 27,
    courseId: 'pd-16-research-innovation',
    shortTitle: 'Research & Innovation in Teaching',
    titleBn: 'Action Research, ক্লাসরুম গবেষণা ও শিক্ষণ উদ্ভাবন',
    pillarId: 'leadership-research',
    tier: 'master',
    cpdHours: 8,
    focusTag: 'অ্যাকশন রিসার্চ',
    competencySummary: 'Plan-Act-Observe-Reflect চক্র, ট্রায়াঙ্গুলেশন ও উদ্ভাবন পাইলট'
  },
  {
    code: 'PD-২৮',
    order: 28,
    courseId: 'pd-17-language-communication',
    shortTitle: 'Language & Communication Skills',
    titleBn: 'Academic English, Public Speaking ও পেশাদার যোগাযোগ',
    pillarId: 'leadership-research',
    tier: 'foundation',
    cpdHours: 8,
    focusTag: 'পেশাদার যোগাযোগ',
    competencySummary: 'স্পষ্ট শ্রেণিকক্ষ নির্দেশনা, স্টোরিটেলিং উপস্থাপনা ও একাডেমিক লিখন'
  },
  {
    code: 'PD-২৯',
    order: 29,
    courseId: 'pd-18-neuroeducation',
    shortTitle: 'Neuroeducation & Brain-Based Learning',
    titleBn: 'মস্তিষ্কভিত্তিক শিখন, Memory, Attention ও Learning Science',
    pillarId: 'pedagogy-science',
    tier: 'practitioner',
    cpdHours: 8,
    focusTag: 'ব্রেইন-বেজড লার্নিং',
    competencySummary: 'Cognitive Load নিয়ন্ত্রণ, Dual Coding, Retrieval ও Spaced Practice'
  },
  {
    code: 'PD-৩০',
    order: 30,
    courseId: 'pd-19-problem-based-learning',
    shortTitle: 'Problem-Based Learning (PrBL)',
    titleBn: 'বাস্তব সমস্যা বিশ্লেষণ, Inquiry ও সক্রেটিক চিন্তন',
    pillarId: 'pedagogy-science',
    tier: 'master',
    cpdHours: 8,
    focusTag: 'ইনকোয়ারি ও PrBL',
    competencySummary: 'Anchor Problem, KWHLAQ বোর্ড ও প্রমাণনির্ভর সমাধান ডিফেন্স'
  },
  {
    code: 'PD-৩১',
    order: 31,
    courseId: 'pd-20-teacher-wellbeing',
    shortTitle: 'Teacher Wellbeing & Resilience',
    titleBn: 'Stress Management, Burnout প্রতিরোধ ও Work-Life Balance',
    pillarId: 'wellbeing-safeguarding',
    tier: 'foundation',
    cpdHours: 6,
    focusTag: 'শিক্ষক সুস্থতা',
    competencySummary: 'বার্নআউট প্রতিরোধ, সময়-সীমানা, ব্যাচিং ও সহকর্মী সহায়তা'
  },
  {
    code: 'PD-৩২',
    order: 32,
    courseId: 'pd-21-academic-integrity-ai',
    shortTitle: 'Academic Integrity & AI Ethics',
    titleBn: 'প্লেজিয়ারিজম প্রতিরোধ, তথ্য যাচাই ও Responsible AI Use',
    pillarId: 'digital-ai-data',
    tier: 'master',
    cpdHours: 8,
    focusTag: 'AI এথিক্স ও সততা',
    competencySummary: 'AI Hallucination শনাক্তকরণ, Traffic-Light নীতি ও AI-Resilient কাজ'
  },
  {
    code: 'PD-৩৩',
    order: 33,
    courseId: 'pd-22-subject-pedagogy',
    shortTitle: 'Subject-Specific Pedagogy (PCK)',
    titleBn: 'Biology, Physics, Chemistry, Math ও English-এর আধুনিক কৌশল',
    pillarId: 'pedagogy-science',
    tier: 'master',
    cpdHours: 10,
    focusTag: 'বিষয়ভিত্তিক PCK',
    competencySummary: 'POE বিজ্ঞান ইনকোয়ারি, গণিত CRA মডেল ও ইংরেজি CLT/TBLT'
  }
];

export function getTeacherCareerStage(
  completedModulesCount: number,
  passedQuizzesCount: number
): TeacherCareerStage {
  const score = completedModulesCount + passedQuizzesCount;
  if (score >= 46 || (completedModulesCount >= 26 && passedQuizzesCount >= 22)) {
    return {
      id: 'master-educator',
      titleBn: 'মাস্টার এডুকেটর ও মেন্টর',
      subtitleEn: 'Stage 4 · Master Educator',
      nextMilestoneBn: 'আপনি স্মার্ট ফ্রেমওয়ার্কের সর্বোচ্চ পেশাগত স্তর অর্জন করেছেন'
    };
  }
  if (score >= 22 || passedQuizzesCount >= 12) {
    return {
      id: 'skilled-mentor',
      titleBn: 'দক্ষ অনুশীলনকারী ও কোচ',
      subtitleEn: 'Stage 3 · Proficient Practitioner',
      nextMilestoneBn: 'মাস্টার স্তরে পৌঁছাতে আরও মূল্যায়ন কুইজ ও স্তর-৩ মডিউল সম্পন্ন করুন'
    };
  }
  if (score >= 6 || completedModulesCount >= 3) {
    return {
      id: 'developing-practitioner',
      titleBn: 'উদীয়মান স্মার্ট শিক্ষক',
      subtitleEn: 'Stage 2 · Developing Practitioner',
      nextMilestoneBn: 'প্রতিটি স্তম্ভ থেকে অন্তত ১টি মডিউল ও কুইজ সম্পন্ন করে দক্ষ স্তরে এগোন'
    };
  }
  return {
    id: 'foundation-explorer',
    titleBn: 'প্রারম্ভিক অভিযাত্রী',
    subtitleEn: 'Stage 1 · Foundation Explorer',
    nextMilestoneBn: 'Foundation স্তরের মডিউল দিয়ে আপনার স্মার্ট CPD যাত্রা শুরু করুন'
  };
}
