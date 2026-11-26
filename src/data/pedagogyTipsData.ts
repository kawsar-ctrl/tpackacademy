import { Course, LearnerProgress, PedagogyTip, TrainingSession } from '../types/lms';
import { hasLessonNoteContent } from '../utils/lmsHelpers';

export const PEDAGOGY_TIPS: PedagogyTip[] = [
  // Course 1: tpack-digital-teaching
  {
    id: 'tip-tpk-1',
    courseId: 'tpack-digital-teaching',
    lessonId: 'tpk-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'TPACK সমন্বয় (CK + PK + TK)',
    title: 'আগে শিখনফল, পরে ডিজিটাল টুল নির্বাচন',
    strategy:
      'ক্লাসে নতুন কোনো অ্যাপ বা অ্যানিমেশন ব্যবহার করার আগে নিজেকে প্রশ্ন করুন—শিক্ষার্থীরা কী শিখবে (CK) এবং কোন কৌশলে ভালো বুঝবে (PK)। এরপর কেবল সেই টুলটিই (TK) বেছে নিন যা জটিল ধারণাটি দৃশ্যমান করে তোলে।',
    classroomTakeaway:
      'আজকের লেসন প্ল্যানে একটি কঠিন ধারণার পাশে লিখুন: কোন ভিজ্যুয়াল বা সিমুলেশন এটিকে সহজ করবে এবং নেট না থাকলে বিকল্প বোর্ড-চিত্র কী হবে।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-tpk-2',
    courseId: 'tpack-digital-teaching',
    lessonId: 'tpk-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'TCK · প্রযুক্তি ও বিষয়জ্ঞান',
    title: 'বিমূর্ত বিষয় বোঝাতে ইন্টারঅ্যাক্টিভ সিমুলেশন',
    strategy:
      'ভগ্নাংশ, অণু-পরমাণুর গঠন বা জ্যামিতিক রূপান্তরের মতো অদৃশ্য বা বিমূর্ত ধারণাগুলো কেবল মুখে বললে মুখস্থনির্ভরতা বাড়ে। প্রযুক্তির (TCK) সাহায্যে চলক পরিবর্তন করে ফলাফল দেখালে ধারণা স্থায়ী হয়।',
    classroomTakeaway:
      'আগামী ক্লাসে পাঠ শুরুর প্রথম ২ মিনিটে একটি সিমুলেশন বা ডায়াগ্রাম দেখিয়ে শিক্ষার্থীদের অনুমান করতে বলুন—"এখানে মান বাড়ালে কী ঘটবে?"',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-tpk-3',
    courseId: 'tpack-digital-teaching',
    lessonId: 'tpk-l2',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'TPK · মাল্টিমিডিয়া ডিজাইন',
    title: 'স্লাইডে কগনিটিভ লোড কমাতে ৬×৬ নিয়ম',
    strategy:
      'পাওয়ারপয়েন্ট স্লাইডে বড় অনুচ্ছেদ রাখলে শিক্ষার্থীরা পড়া ও শোনার মধ্যে মনোযোগ ভাগ করতে গিয়ে মূল কথা হারিয়ে ফেলে। প্রতি স্লাইডে সর্বোচ্চ ৬টি বুলেট লাইন ও প্রতি লাইনে ৬ শব্দের মধ্যে সীমাবদ্ধ রাখুন।',
    classroomTakeaway:
      'আপনার পরবর্তী প্রেজেন্টেশনের যেকোনো ১টি টেক্সট-ভারী স্লাইডকে সংক্ষিপ্ত পয়েন্ট ও একটি প্রাসঙ্গিক চিত্রে রূপান্তর করুন এবং ফন্ট অন্তত ২৪pt রাখুন।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-tpk-4',
    courseId: 'tpack-digital-teaching',
    lessonId: 'tpk-l2',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'TPK · ফ্লিপড ক্লাসরুম',
    title: '৫ মিনিটের মাইক্রো-কনসেপ্ট ভিডিও কৌশল',
    strategy:
      'দীর্ঘ ৪০ মিনিটের লেকচার রেকর্ডিংয়ের বদলে ৪–৫ মিনিটের ছোট মাইক্রো-ভিডিও বা ভয়েস-নোট আগে দিলে শিক্ষার্থীরা বাড়িতে নিজের গতিতে মূল ধারণা দেখে আসতে পারে, ফলে ক্লাস সময় আলোচনায় বাঁচে।',
    classroomTakeaway:
      'আগামী অধ্যায়ের সবচেয়ে জরুরি সংজ্ঞা বা সূত্রটি ৩ মিনিটে মোবাইল ভয়েস-নোট বা সংক্ষিপ্ত স্লাইডে রেকর্ড করে ক্লাসের আগে শেয়ার করুন।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-tpk-5',
    courseId: 'tpack-digital-teaching',
    lessonId: 'tpk-l3',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'TPK · ব্লেন্ডেড ও LMS ফ্লো',
    title: 'প্রতি ১০ মিনিটে ১টি দ্রুত কনসেপ্ট-চেক পোল',
    strategy:
      'ডিজিটাল বা হাইব্রিড ক্লাসে শিক্ষার্থীরা একটানা শুনতে শুনতে নিষ্ক্রিয় হয়ে পড়ে। প্রতি ১০–১২ মিনিট পরপর ১টি ছোট কুইজ, হ্যান্ড-রেইজ পোল বা এক-শব্দের উত্তর নিলে অংশগ্রহণ সাথে সাথে ফিরে আসে।',
    classroomTakeaway:
      'আজকের পাঠের মাঝামাঝি ১টি বহুনির্বাচনী বা সত্য-মিথ্যা প্রশ্ন প্রস্তুত রাখুন—হাত তুলে বা চ্যাটে ৩০ সেকেন্ডে সবার মতামত নিন।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-tpk-6',
    courseId: 'tpack-digital-teaching',
    lessonId: 'tpk-l4',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'ডিজিটাল নৈতিকতা ও AI-সচেতনতা',
    title: 'AI-সহায়ক কনটেন্টে শিক্ষকের তথ্য যাচাই ও প্রাইভেসি',
    strategy:
      'লেসন প্ল্যান বা প্রশ্নের খসড়া তৈরিতে এআই সহায়তা নেওয়া সময় বাঁচায়, তবে পাঠ্যবইয়ের তথ্যের সাথে মিলিয়ে যাচাই ছাড়া তা ক্লাসে ব্যবহার করা উচিত নয়। পাশাপাশি শিক্ষার্থীর নাম, নম্বর বা ছবি উন্মুক্ত প্ল্যাটফর্মে দেবেন না।',
    classroomTakeaway:
      'যেকোনো ডিজিটাল ওয়ার্কশিট বা স্লাইড ব্যবহারের আগে ১টি তথ্য উৎস ও শিক্ষার্থীদের ডেটা-গোপনীয়তা পরীক্ষা করে নিন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },

  // Course 2: modern-pedagogy-assessment
  {
    id: 'tip-ped-1',
    courseId: 'modern-pedagogy-assessment',
    lessonId: 'ped-m1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'PK · 5E সক্রিয় শিখন',
    title: 'Engage ধাপে ৩ মিনিটের কৌতূহল-উদ্দীপক প্রশ্ন',
    strategy:
      'ক্লাসের শুরুতেই সংজ্ঞা বা অধ্যায়ের নাম না লিখে বাস্তব জীবনের একটি ছোট ধাঁধা, ছবি বা “কেন এমন হয়?” প্রশ্ন দিয়ে শুরু করুন। এতে শিক্ষার্থীর পূর্বজ্ঞানের সাথে নতুন পাঠের মানসিক সংযোগ তৈরি হয়।',
    classroomTakeaway:
      'আগামী ক্লাসের প্রথম ৩ মিনিট পাঠ্যবই না খুলিয়ে কেবল ১টি বাস্তব উদাহরণ বা প্রশ্ন নিয়ে শিক্ষার্থীদের মতামত বোর্ডে লিখুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ped-2',
    courseId: 'modern-pedagogy-assessment',
    lessonId: 'ped-m1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'PCK · ব্লুমস উচ্চতর চিন্তন (HOTS)',
    title: '“কী?” প্রশ্নের সাথে “কেন ও কীভাবে?” যুক্ত করা',
    strategy:
      'শুধু স্মরণনির্ভর প্রশ্ন (“সংজ্ঞা বলো”) শিক্ষার্থীদের চিন্তন দক্ষতা সীমিত করে। পাঠের অন্তত ৪০% প্রশ্ন প্রয়োগ (Apply), বিশ্লেষণ (Analyze) বা মূল্যায়ন (Evaluate) স্তর থেকে করলে গভীর বোঝাপড়া গড়ে ওঠে।',
    classroomTakeaway:
      'আজকের বাড়ির কাজ বা ক্লাস টেস্টে অন্তত ১টি প্রশ্নে “উদাহরণসহ যুক্তি দাও” অথবা “দুটি পদ্ধতির তুলনা করো” যুক্ত করুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ped-3',
    courseId: 'modern-pedagogy-assessment',
    lessonId: 'ped-m2',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'PK · গঠনমূলক মূল্যায়ন',
    title: 'ক্লাস শেষে ২ মিনিটের এক্সিট টিকিট (Exit Ticket)',
    strategy:
      'সাময়িক পরীক্ষার জন্য অপেক্ষা না করে পিরিয়ডের শেষ ২ মিনিটে ছোট কাগজে বা মুখে ২টি প্রশ্ন করুন—“আজকের ১টি মূল বিষয় কী এবং কোন অংশটি এখনো অস্পষ্ট?” পরের ক্লাস ঠিক সেখান থেকেই শুরু করা যায়।',
    classroomTakeaway:
      'ঘণ্টা বাজার ৩ মিনিট আগে শিক্ষার্থীদের খাতার কোণে বা ছোট স্লিপে “আজ কী বুঝলাম / কী বুঝতে চাই” এক লাইনে লিখতে দিন।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ped-4',
    courseId: 'modern-pedagogy-assessment',
    lessonId: 'ped-m2',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'PK · রুব্রিক ও ফিডব্যাক',
    title: 'স্বচ্ছ ফিডব্যাকের “স্যান্ডউইচ পদ্ধতি”',
    strategy:
      'খাতায় শুধু লাল কালি বা নম্বর দিলে শিক্ষার্থী নিরুৎসাহিত হয়। প্রথমে কাজের ভালো দিক উল্লেখ, এরপর উন্নয়নের সুনির্দিষ্ট পরামর্শ এবং শেষে উৎসাহবাক্য দিলে শিক্ষার্থী ভুল থেকে শেখে।',
    classroomTakeaway:
      'আজ অন্তত ৫ জন শিক্ষার্থীর খাতা বা অ্যাসাইনমেন্টে নম্বরের পাশে ১টি প্রশংসা ও ১টি নির্দিষ্ট উন্নয়নের উপায় লিখে দিন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ped-5',
    courseId: 'modern-pedagogy-assessment',
    lessonId: 'ped-m3',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'PK · ইতিবাচক শ্রেণিকক্ষ ব্যবস্থাপনা',
    title: 'নিষেধাজ্ঞার বদলে ইতিবাচক নির্দেশনা ও টাইমড ট্রানজিশন',
    strategy:
      '“গোলমাল কোরো না” বলার চেয়ে “এখন ২ মিনিট নীরবে জোড়ায় আলোচনা করো” বললে শিক্ষার্থীরা ঠিক কী করতে হবে তা পরিষ্কার বুঝতে পারে। স্পষ্ট সময়সীমা ক্লাসের শৃঙ্খলা স্বাভাবিক রাখে।',
    classroomTakeaway:
      'এক কাজ থেকে আরেক কাজে যাওয়ার আগে মুখে স্পষ্ট টাইমার দিন—“আমাদের হাতে ঠিক ৩ মিনিট সময় আছে, তারপর দলনেতা উত্তর বলবে।”',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ped-6',
    courseId: 'modern-pedagogy-assessment',
    lessonId: 'ped-m4',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'PK · অন্তর্ভুক্তিমূলক শিক্ষা (UDL)',
    title: 'শতভাগ অংশগ্রহণের জন্য Think-Pair-Share কৌশল',
    strategy:
      'সরাসরি প্রশ্ন করলে কেবল সামনের সারির ২–৩ জন হাত তোলে। আগে ৩০ সেকেন্ড একা ভাবতে দিন (Think), এরপর পাশের সহপাঠীর সাথে ১ মিনিট মিলিয়ে নিতে বলুন (Pair), তারপর শেয়ার করান (Share)—লাজুক শিক্ষার্থীরাও আত্মবিশ্বাস পায়।',
    classroomTakeaway:
      'আজকের গুরুত্বপূর্ণ প্রশ্নটিতে সরাসরি উত্তর না চেয়ে “আগে ১ মিনিট পাশের বন্ধুর সাথে আলোচনা করে নাও” প্রয়োগ করুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },

  // Course 3: research-leadership-communication
  {
    id: 'tip-ldr-1',
    courseId: 'research-leadership-communication',
    lessonId: 'ldr-l1',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'শ্রেণিকক্ষ অ্যাকশন রিসার্চ',
    title: 'ছোট ও পরিমাপযোগ্য সমস্যার ওপর অ্যাকশন রিসার্চ',
    strategy:
      'শ্রেণিকক্ষ গবেষণার জন্য বড় প্রকল্পের প্রয়োজন নেই। “৭ম শ্রেণির বানান ভুল” বা “ভগ্নাংশের যোগে ভীতি”—এমন ১টি নির্দিষ্ট সমস্যা নিয়ে ২–৪ সপ্তাহ একটি নতুন কৌশল প্রয়োগ করে প্রাক ও উত্তর ফলাফল তুলনা করুন।',
    classroomTakeaway:
      'আপনার ক্লাসের সবচেয়ে বেশি পুনরাবৃত্তি হওয়া ১টি শিখন-সমস্যা নোটবুকে লিখে ২ সপ্তাহের জন্য একটি ছোট সমাধান-চক্র পরিকল্পনা করুন।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ldr-2',
    courseId: 'research-leadership-communication',
    lessonId: 'ldr-l1',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'প্রমাণভিত্তিক প্রতিফলন',
    title: 'পিরিয়ড শেষে ১-মিনিটের টিচিং রিফ্লেকশন নোট',
    strategy:
      'প্রতিটি ক্লাসের অভিজ্ঞতাই মূল্যবান ডেটা। ক্লাস শেষে শুধু লিখে রাখুন—কোন উদাহরণটি শিক্ষার্থীরা তাড়াতাড়ি বুঝেছে এবং কোথায় আটকে গেছে; এই ধারাবাহিক নোটই পরের সপ্তাহের পাঠকে নিখুঁত করে।',
    classroomTakeaway:
      'এই প্ল্যাটফর্মের ব্যক্তিগত পাঠ নোটবুক ব্যবহার করে আজকের মডিউল সম্পর্কে ২ লাইনের শ্রেণিকক্ষ প্রতিফলন সংরক্ষণ করুন।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ldr-3',
    courseId: 'research-leadership-communication',
    lessonId: 'ldr-l2',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'PBL · ২১ শতকের 4Cs',
    title: 'দলীয় কাজে স্পষ্ট ভূমিকা বণ্টন (Role Cards)',
    strategy:
      'গ্রুপ ওয়ার্ক দিলে অনেক সময় ১–২ জন সব কাজ করে আর বাকিরা চুপ থাকে। প্রতিটি দলে দলনেতা, সময়-রক্ষক, নোট-লেখক ও উপস্থাপক দায়িত্ব ভাগ করে দিলে সবার সক্রিয় অংশগ্রহণ নিশ্চিত হয়।',
    classroomTakeaway:
      'পরবর্তী দলীয় অনুশীলনে ৪টি ভূমিকা বোর্ডে লিখে দিন এবং কাজ শুরুর আগে প্রতিটি দলকে নিজেদের ভূমিকা ঠিক করে নিতে বলুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ldr-4',
    courseId: 'research-leadership-communication',
    lessonId: 'ldr-l2',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'PBL · পিয়ার ফিডব্যাক',
    title: 'সহপাঠী মূল্যায়নে “আমি পছন্দ করেছি / আমি প্রস্তাব করছি”',
    strategy:
      'শিক্ষার্থীরা সহপাঠীর কাজের গঠনমূলক সমালোচনা করতে প্রায়ই দ্বিধায় থাকে। তাদের দুটি সহজ বাক্য কাঠামো দিন: “আমি তোমার কাজের … দিকটি পছন্দ করেছি” এবং “আরও ভালো করতে … যোগ করার প্রস্তাব করছি।”',
    classroomTakeaway:
      'দলীয় উপস্থাপনা শেষে প্রতিটি দলকে অন্য দলের জন্য অন্তত ১টি প্রশংসা ও ১টি প্রস্তাব লিখিতভাবে দিতে বলুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ldr-5',
    courseId: 'research-leadership-communication',
    lessonId: 'ldr-l3',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'যোগাযোগ ও PLC নেতৃত্ব',
    title: 'অভিভাবক বৈঠকে ২+১ ইতিবাচক অগ্রগতি কাঠামো',
    strategy:
      'অভিভাবক-শিক্ষক বৈঠক (PTM) কেবল দুর্বলতা বলার জায়গা নয়। প্রথমে শিক্ষার্থীর ২টি ইতিবাচক শক্তি বা চেষ্টা তুলে ধরে তারপর ১টি উন্নয়নের সহজ উপায় বললে অভিভাবকরা আস্থার সাথে সহযোগিতা করেন।',
    classroomTakeaway:
      'আসন্ন অভিভাবক যোগাযোগের আগে পিছিয়ে থাকা ৩ জন শিক্ষার্থীর অন্তত ২টি ইতিবাচক আচরণ বা প্রচেষ্টা নোট করে রাখুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ldr-6',
    courseId: 'research-leadership-communication',
    lessonId: 'ldr-l4',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'পেশাগত পোর্টফোলিও ও CPD',
    title: 'সহজ ৩-ফোল্ডার ডিজিটাল টিচিং পোর্টফোলিও',
    strategy:
      'বছরের শেষে সনদ ও সেরা কাজ খুঁজতে না চাইলে শুরু থেকেই ৩টি ফোল্ডার রাখুন—(১) সেরা লেসন প্ল্যান, (২) শিক্ষার্থীর কাজের নমুনা ও রুব্রিক, (৩) অর্জিত CPD সনদ ও অ্যাকশন রিসার্চ নোট।',
    classroomTakeaway:
      'আপনার অর্জিত লেসন নোট, কুইজ ফলাফল ও CPD সনদগুলো এক জায়গায় সংরক্ষণ করতে আজই ১টি পোর্টফোলিও ফোল্ডার গুছিয়ে নিন।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },

  // Course 4: classroom-management-modern
  {
    id: 'tip-cm-1',
    courseId: 'classroom-management-modern',
    lessonId: 'cm-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'PBIS · ৫:১ ইতিবাচক অনুপাত',
    title: '১টি সংশোধনের বিপরীতে ৫টি সুনির্দিষ্ট প্রশংসা',
    strategy:
      'আচরণ বদলাতে তিরস্কারের চেয়ে প্রশংসা অনেক দ্রুত কাজ করে। “খুব ভালো” বলার বদলে সুনির্দিষ্ট আচরণের প্রশংসা করুন—“সাদিয়া, তুমি খুব দ্রুত খাতা খুলে কাজ শুরু করেছ, ধন্যবাদ।”',
    classroomTakeaway:
      'আজকের পিরিয়ডে অন্তত ৫ জন শিক্ষার্থীর প্রচেষ্টা ও শৃঙ্খলাবোধের সুনির্দিষ্ট প্রশংসা করুন।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-cm-2',
    courseId: 'classroom-management-modern',
    lessonId: 'cm-l3',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'রেস্টোরেটিভ ও ডি-এস্কেলেশন',
    title: 'সবার সামনে তর্ক নয়—নিচু স্বরে ব্যক্তিগত সংশোধন',
    strategy:
      'পুরো ক্লাসের সামনে শিক্ষার্থীকে শাসালে সে আত্মরক্ষায় আরও জেদি হয়ে উঠতে পারে। পাশে গিয়ে নিচু স্বরে শান্তভাবে বলুন কী প্রত্যাশিত, এতে সম্মান ও শৃঙ্খলা দুটোই বাঁচে।',
    classroomTakeaway:
      'পরবর্তী কোনো আচরণগত চ্যালেঞ্জে দূর থেকে চিৎকার না করে কাছে গিয়ে শান্ত ২ বাক্যে সমাধান করুন।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },

  // Course 5: education-leadership-modern
  {
    id: 'tip-el-1',
    courseId: 'education-leadership-modern',
    lessonId: 'el-l1',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'ইনস্ট্রাকশনাল লিডারশীপ',
    title: 'দোষ খোঁজার বদলে ৫-মিনিটের কোচিং লার্নিং ওয়াক',
    strategy:
      'সহকর্মীর ক্লাসে ঢুকে ভুল খোঁজার চেয়ে “শিক্ষার্থীরা কীভাবে সক্রিয়ভাবে শিখছে” তা পর্যবেক্ষণ করে প্রশংসা ও ১টি কৌতূহলোদ্দীপক প্রশ্ন দিলে পুরো স্কুলের শিক্ষণ সংস্কৃতি বদলে যায়।',
    classroomTakeaway:
      'এই সপ্তাহে একজন সহকর্মীর ক্লাসের ১টি সফল কৌশল নোট করে তাকে লিখিত প্রশংসা বার্তা পাঠান।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-el-2',
    courseId: 'education-leadership-modern',
    lessonId: 'el-l3',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'ডেটা-ভিত্তিক নেতৃত্ব (ABC)',
    title: 'উপস্থিতি-আচরণ-অগ্রগতি (ABC) আগাম সতর্কতা যাচাই',
    strategy:
      'বার্ষিক পরীক্ষার ফলের জন্য অপেক্ষা না করে প্রতি মাসে অনুপস্থিতি ও সাপ্তাহিক কাজের ঘাটতি দেখলে ঝরে পড়ার ঝুঁকিতে থাকা শিক্ষার্থীকে সময়মতো সহায়তা দেওয়া যায়।',
    classroomTakeaway:
      'টানা ২ দিন অনুপস্থিত থাকা শিক্ষার্থীর পরিবারের সাথে আজই সহানুভূতিশীল ফলো-আপ যোগাযোগ করুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },

  // Course 6: ict-in-education-modern
  {
    id: 'tip-ict-1',
    courseId: 'ict-in-education-modern',
    lessonId: 'ict-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'ICT · SAMR রূপান্তর স্তর',
    title: 'কাগজের প্রতিস্থাপন পেরিয়ে ক্লাউড-সহযোগিতা',
    strategy:
      'স্লাইডে কেবল বইয়ের লেখা দেখানো হলো Substitution; কিন্তু শিক্ষার্থীরা দলীয়ভাবে ক্লাউড স্লাইডে বা ডিজিটাল বোর্ডে সমাধান সাজালে তা প্রকৃত রূপান্তর (Transformation) ঘটায়।',
    classroomTakeaway:
      'আজকের একটি একক কাজকে জোড়ায় বা দলীয় ডিজিটাল ডায়াগ্রাম তৈরিতে রূপান্তর করে দেখুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ict-2',
    courseId: 'ict-in-education-modern',
    lessonId: 'ict-l3',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'ICT · অফলাইন-ফার্স্ট এডটেক',
    title: 'সবসময় পেনড্রাইভে “Plan-B Offline Kit” রাখুন',
    strategy:
      'ওয়াইফাই বা মোবাইল ডেটা যেকোনো মুহূর্তে ধীর হতে পারে। প্রয়োজনীয় স্লাইড, PDF ও অফলাইন HTML5 সিমুলেশন আগে থেকে ডাউনলোড করা থাকলে স্মার্ট ক্লাস কখনোই থামবে না।',
    classroomTakeaway:
      'আগামীকালের ক্লাসের সব ডিজিটাল উপকরণ আজই অফলাইন ফোল্ডারে সংরক্ষণ করে যাচাই করুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },

  // Course 7: ai-in-education-modern
  {
    id: 'tip-ai-1',
    courseId: 'ai-in-education-modern',
    lessonId: 'ai-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'AI প্রম্পট ইঞ্জিনিয়ারিং (RTCF)',
    title: 'RTCF সূত্রে এআই থেকে নিখুঁত বাংলা লেসন খসড়া',
    strategy:
      'এআই-কে শুধু “লেসন দাও” বলবেন না; Role (ভূমিকা), Task (কাজ), Context (বাংলাদেশের শ্রেণি ও সময়) এবং Format (রুব্রিক/তালিকা) বলে দিলে তাৎক্ষণিক মানসম্মত খসড়া পাবেন।',
    classroomTakeaway:
      'আগামী পাঠের জন্য RTCF কাঠামোয় ১টি প্রম্পট লিখে ৩ স্তরের অনুশীলন প্রশ্ন খসড়া করে যাচাই করুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ai-2',
    courseId: 'ai-in-education-modern',
    lessonId: 'ai-l3',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'AI নৈতিকতা ও তথ্য যাচাই',
    title: 'ক্লাসে “Spot the AI Error” সমালোচনামূলক অনুশীলন',
    strategy:
      'শিক্ষার্থীদের এআই ব্যবহার নিষিদ্ধ করার বদলে এআই-তৈরি একটি উত্তরের ভেতর থেকে তথ্যগত বা যুক্তিগত ভুল খুঁজে বের করতে দিলে তাদের বিশ্লেষণ ক্ষমতা বহুগুণ বাড়ে।',
    classroomTakeaway:
      'যেকোনো অধ্যায়ের ওপর এআই-এর লেখা ১টি সংক্ষিপ্ত উত্তরের ২টি ত্রুটি পাঠ্যবই দিয়ে যাচাই করতে দিন।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },

  // Course 8: inclusive-education-udl
  {
    id: 'tip-inc-1',
    courseId: 'inclusive-education-udl',
    lessonId: 'inc-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'UDL · বহুমুখী প্রবেশগম্যতা',
    title: 'একই পাঠে দেখা, শোনা ও হাতের কাজের বিকল্প রাখা',
    strategy:
      'কেবল মুখে বললে শ্রবণ বা মনোযোগ-ভিন্নতা থাকা শিক্ষার্থী পিছিয়ে পড়ে। মূল পয়েন্ট বোর্ডে লেখা, চিত্র দেখানো এবং ছোট হাতে-কলমে কাজ যুক্ত করলে সবার জন্য পাঠ সহজ হয়।',
    classroomTakeaway:
      'আজকের মূল ধারণাটি বোঝাতে মৌখিক ব্যাখ্যার সাথে অন্তত ১টি ভিজ্যুয়াল বা স্পর্শযোগ্য উদাহরণ রাখুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-inc-2',
    courseId: 'inclusive-education-udl',
    lessonId: 'inc-l2',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'নিউরোডাইভার্সিটি সহায়তা',
    title: 'নির্দেশনা ৩টি ছোট ধাপে ভেঙে দেওয়া (Chunking)',
    strategy:
      'ডিসলেক্সিয়া বা ADHD থাকা শিক্ষার্থীদের কাছে একটানা বড় অনুচ্ছেদ বা ৫টি নির্দেশনা একসাথে ভীতিকর মনে হতে পারে। কাজকে ছোট ৩টি ধাপে ভাগ করে দিলে তারা আত্মবিশ্বাসের সাথে শেষ করে।',
    classroomTakeaway:
      'বোর্ডের কোণে আজকের ক্লাসের “১ → ২ → ৩” ধাপভিত্তিক ভিজ্যুয়াল চেকলিস্ট লিখে রাখুন।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },

  // Course 9: manners-etiquettes-educators
  {
    id: 'tip-me-1',
    courseId: 'manners-etiquettes-educators',
    lessonId: 'me-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'শিষ্টাচার ও রোল-মডেলিং',
    title: 'দরজায় হাসিমুখে স্বাগত ও ব্যঙ্গমুক্ত ভাষা',
    strategy:
      'শিক্ষক যখন দরজায় দাঁড়িয়ে হাসিমুখে অভিবাদন জানান এবং শিক্ষার্থীর কথা মনোযোগ দিয়ে শোনেন, তখন শিক্ষার্থীরাও সহপাঠীদের প্রতি বিনয় ও শ্রদ্ধাশীল আচরণ শিখে নেয়।',
    classroomTakeaway:
      'আজ ক্লাসে প্রবেশ করেই প্রথম ১ মিনিট সবার কুশল জেনে তারপর পাঠ শুরু করুন।',
    prepTimeLabel: '১ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-me-2',
    courseId: 'manners-etiquettes-educators',
    lessonId: 'me-l4',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'শালীন সংলাপ ও নেটিকেট',
    title: 'ভিন্নমতে “ব্যক্তিকে নয়, ধারণাকে যুক্তি দিয়ে যাচাই”',
    strategy:
      'আলোচনায় দ্বিমত হলে শিক্ষার্থীরা অনেক সময় ব্যক্তিগত আক্রমণ করে ফেলে। তাদের শেখান—“আমি তোমার কথার এই অংশের সাথে ভিন্নমত পোষণ করছি কারণ…”।',
    classroomTakeaway:
      'ক্লাসে আলোচনার আগে ৩টি সৌজন্যমূলক সম্মতি ও ভিন্নমত প্রকাশের বাক্য বোর্ডে লিখে দিন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },

  // Course 10: child-psychology-learning
  {
    id: 'tip-cp-1',
    courseId: 'child-psychology-learning',
    lessonId: 'cp-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'শিশু মনোবিজ্ঞান · মনোযোগ স্প্যান',
    title: 'বয়স + ২ মিনিট বিরতিতে মস্তিষ্ক সতেজ রাখা',
    strategy:
      'শিশু-কিশোরদের ওয়ার্কিং মেমোরি একটানা দীর্ঘ বক্তৃতা ধরে রাখতে পারে না। প্রতি ১২–১৫ মিনিট পর ২ মিনিটের প্রশ্ন, স্ট্রেচিং বা জোড়ায় আলোচনা স্মৃতি ধারণ বাড়ায়।',
    classroomTakeaway:
      'আজকের পিরিয়ডের মাঝামাঝি ২ মিনিটের “ব্রেইন-ব্রেক ও রিকল” বিরতি রেখে দেখুন মনোযোগ কেমন ফেরে।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-cp-2',
    courseId: 'child-psychology-learning',
    lessonId: 'cp-l3',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'গ্রোথ মাইন্ডসেট · Power of Yet',
    title: '“আমি পারি না” বদলে “আমি এখনো পারিনি (Yet)”',
    strategy:
      'বুদ্ধিমত্তার বদলে চেষ্টা ও কৌশলের প্রশংসা করলে শিক্ষার্থীর ভেতরে গ্রোথ মাইন্ডসেট গড়ে ওঠে এবং ভুলকে সে শেখার সিঁড়ি হিসেবে দেখতে শেখে।',
    classroomTakeaway:
      'ক্লাসের একটি সাধারণ ভুলকে “আজকের সেরা শেখার ভুল” হিসেবে তুলে ধরে সমাধানের পথ আলোচনা করুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },

  // Course 11: curriculum-expert-design
  {
    id: 'tip-ce-1',
    courseId: 'curriculum-expert-design',
    lessonId: 'ce-l1',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'UbD · ব্যাকওয়ার্ড ডিজাইন',
    title: 'আগে শিখনফল ও প্রমাণ, পরে ক্লাসের কাজ সাজানো',
    strategy:
      'পাঠ্যবইয়ের পৃষ্ঠা ধরে এগোনোর বদলে আগে ঠিক করুন—ইউনিট শেষে শিক্ষার্থী কী বাস্তব দক্ষতা দেখাবে। তারপর সেই অনুযায়ী মূল্যায়ন ও শ্রেণিকক্ষ অনুশীলন নির্বাচন করুন।',
    classroomTakeaway:
      'আসন্ন ইউনিটের শুরুতে ১টি গভীর “Essential Question” লিখুন যা শিক্ষার্থীদের চিন্তায় খোরাক জোগাবে।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-ce-2',
    courseId: 'curriculum-expert-design',
    lessonId: 'ce-l2',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'Constructive Alignment',
    title: 'শিখনফল, অনুশীলন ও প্রশ্নের অ্যাকশন ভার্ব মিলিয়ে নেওয়া',
    strategy:
      'শিখনফলে যদি থাকে “বিশ্লেষণ ও প্রয়োগ”, আর পরীক্ষায় আসে কেবল সংজ্ঞা মুখস্থ, তবে অ্যালাইনমেন্ট ভেঙে যায়। এই তিন স্তরে একই চিন্তন-গভীরতা বজায় রাখুন।',
    classroomTakeaway:
      'আপনার পরবর্তী ক্লাস টেস্টের প্রতিটি প্রশ্নের পাশে সেটি কোন শিখনফল যাচাই করছে তা ট্যাগ করে দেখুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },

  // 22 Smart PD Framework Modules (pd-01 to pd-22)
  {
    id: 'tip-pd01',
    courseId: 'pd-01-pbl',
    lessonId: 'pd01-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'PBL · Driving Question',
    title: 'কৌতূহল-জাগানিয়া Driving Question দিয়ে প্রজেক্ট শুরু',
    strategy:
      '“পানি দূষণের ওপর পোস্টার বানাও” বলার বদলে জিজ্ঞাসা করুন—“আমাদের বিদ্যালয়ের আঙিনায় বৃষ্টির পানি অপচয় রোধে কীভাবে কম খরচে সমাধান তৈরি করা যায়?” এতে শিক্ষার্থীর বাস্তব অনুসন্ধান জাগে।',
    classroomTakeaway:
      'আসন্ন প্রজেক্টের জন্য ১টি উন্মুক্ত ও স্থানীয় বাস্তবতা-ভিত্তিক Driving Question লিখে শিক্ষার্থীদের মতামত নিন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd02',
    courseId: 'pd-02-assessment-literacy',
    lessonId: 'pd02-l1',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'Assessment Literacy · প্রশ্নপত্র মান',
    title: 'প্রশ্নপত্রে HOTS ও LOTS ভারসাম্য বজায় রাখা',
    strategy:
      'কেবল সংজ্ঞা ও মুখস্থ তথ্য পরীক্ষা করলে শিক্ষার্থীদের চিন্তাশক্তি যাচাই হয় না। প্রতিটি সাপ্তাহিক পরীক্ষায় অন্তত ৪০% প্রশ্ন প্রয়োগ ও বিশ্লেষণ স্তর থেকে রাখুন।',
    classroomTakeaway:
      'পরবর্তী ক্লাস টেস্টের আগে প্রশ্নের পাশে ব্লুমস স্তর (স্মরণ/প্রয়োগ/বিশ্লেষণ) লিখে ভারসাম্য যাচাই করুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd03',
    courseId: 'pd-03-sel',
    lessonId: 'pd03-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'SEL · CASEL আবেগীয় চেক-ইন',
    title: 'ক্লাসের শুরুতে ১-মিনিটের “Mood Meter Check-in”',
    strategy:
      'শিক্ষার্থীরা মানসিক চাপে থাকলে পাঠে মন দিতে পারে না। পাঠ শুরুর আগে ১ মিনিট হাত বা আঙুলের সংকেতে তাদের আজকের অনুভূতি জেনে নিলে সহমর্মিতা ও মনোযোগ দুটোই বাড়ে।',
    classroomTakeaway:
      'আজকের প্রথম পিরিয়ডে শিক্ষার্থীদের ১–৫ স্কেলে নিজেদের আজকের মানসিক শক্তি জানাতে বলুন।',
    prepTimeLabel: '১ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd04',
    courseId: 'pd-04-digital-content',
    lessonId: 'pd04-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'Instructional Design · মাইক্রো-লার্নিং',
    title: 'ইন্টারঅ্যাক্টিভ H5P বা পজ-কুইজ যুক্ত ভিডিও লেসন',
    strategy:
      'একটানা ভিডিও দেখার চেয়ে প্রতি ২ মিনিট পর ভিডিও থামিয়ে ১টি ছোট প্রশ্ন করলে শিক্ষার্থীর সক্রিয় মনোযোগ তিনগুণ বাড়ে।',
    classroomTakeaway:
      'ক্লাসে কোনো শিক্ষামূলক ভিডিও দেখানোর সময় অন্তত ২ জায়গায় পজ করে “এরপর কী ঘটবে?” জিজ্ঞাসা করুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd05',
    courseId: 'pd-05-stem-steam',
    lessonId: 'pd05-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'STEAM · Engineering Design',
    title: 'কম খরচের উপকরণে ২০-মিনিটের প্রোটোটাইপ চ্যালেঞ্জ',
    strategy:
      'কাগজ, স্ট্র, বোতল বা কার্ডবোর্ডের মতো সহজলভ্য উপকরণ দিয়ে দলগত মডেল বানাতে দিলে বিজ্ঞান, গণিত ও সৃজনশীল নকশার সমন্বয় ঘটে।',
    classroomTakeaway:
      'পরবর্তী বিজ্ঞান বা গণিত ক্লাসে তত্ত্ব বোঝানোর পর ১৫ মিনিট কাগজ/কার্ড দিয়ে মডেল তৈরি করতে দিন।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd06',
    courseId: 'pd-06-gamification',
    lessonId: 'pd06-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'Gamification · প্রগতি ও কুয়েস্ট',
    title: 'নম্বরের চাপ ছাড়া “টিম কুয়েস্ট ও বোনাস ব্যাজ”',
    strategy:
      'সবাইকে একে অপরের বিরুদ্ধে প্রতিযোগিতায় না নামিয়ে দলীয় লক্ষ্য পূরণে (“সবাই মিলে ৯০% সমাধান করলে টিম ব্যাজ”) গেমিফিকেশন সাজালে সহযোগিতা বাড়ে।',
    classroomTakeaway:
      'আজকের অনুশীলনকে ৩টি ধাপ (“ব্রোঞ্জ → সিলভার → গোল্ড”) চ্যালেঞ্জে ভাগ করে বোর্ডে দেখান।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd07',
    courseId: 'pd-07-parent-engagement',
    lessonId: 'pd07-l1',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'Parent Engagement · ইতিবাচক বার্তা',
    title: 'শুধু অভিযোগ নয়—মাসে ১টি ইতিবাচক “Good News Note”',
    strategy:
      'অভিভাবকরা শুধু সমস্যার সময় স্কুলের ডাক পেলে যোগাযোগ এড়িয়ে চলেন। শিক্ষার্থীর ছোট উন্নতির কথা জানিয়ে সংক্ষিপ্ত শুভেচ্ছা বার্তা পাঠালে আস্থার সেতু তৈরি হয়।',
    classroomTakeaway:
      'এই সপ্তাহে ৩ জন শিক্ষার্থীর অভিভাবককে সন্তানের ১টি ভালো প্রচেষ্টার কথা জানিয়ে বার্তা পাঠান।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd08',
    courseId: 'pd-08-digital-citizenship',
    lessonId: 'pd08-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'Digital Citizenship · তথ্য যাচাই',
    title: 'পোস্ট শেয়ার করার আগে “SIFT” তথ্য-যাচাই নিয়ম',
    strategy:
      'অনলাইন গুজব ও সাইবার ঝুঁকি থেকে শিক্ষার্থীদের বাঁচাতে শেখান—Stop (থামো), Investigate source (উৎস দেখো), Find better coverage, Trace original context।',
    classroomTakeaway:
      'ক্লাসে ৫ মিনিটে ১টি ভাইরাল তথ্যের উৎস কীভাবে যাচাই করতে হয় তা লাইভ দেখিয়ে দিন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd09',
    courseId: 'pd-09-instructional-coaching',
    lessonId: 'pd09-l1',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'Instructional Coaching · Peer Observation',
    title: 'সহকর্মী পর্যবেক্ষণে ১টি প্রশংসা ও ১টি কৌতূহল প্রশ্ন',
    strategy:
      'পিয়ার অবজারভেশন কখনোই ত্রুটি ধরার পরীক্ষা নয়; বরং “আপনার প্রশ্ন-কৌশলে শিক্ষার্থীরা দারুণ সাড়া দিয়েছে—এই অংশটি কীভাবে ভেবেছিলেন?” বললে কোচিং সংস্কৃতি গড়ে ওঠে।',
    classroomTakeaway:
      'মাসে অন্তত ১ বার পাশের ক্লাসের সহকর্মীর সাথে ১৫-মিনিটের অ-মূল্যায়নমূলক Lesson Study বিনিময় করুন।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd10',
    courseId: 'pd-10-data-analytics',
    lessonId: 'pd10-l1',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'Learning Analytics · Item Analysis',
    title: 'কোন প্রশ্নে ৬০%-এর বেশি ভুল হলো তা আলাদা করা',
    strategy:
      'খাতা দেখার পর মোট নম্বরের চেয়ে কোন নির্দিষ্ট প্রশ্নে অর্ধেকের বেশি শিক্ষার্থী ভুল করেছে তা চিহ্নিত করলে পরদিন ঠিক সেই ধারণাটিই নতুনভাবে শেখানো যায়।',
    classroomTakeaway:
      'সর্বশেষ টেস্টের সবচেয়ে কঠিন ২টি প্রশ্ন চিহ্নিত করে আগামী ক্লাসের শুরুতে ৫ মিনিট পুনরায় ব্যাখ্যা করুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd11',
    courseId: 'pd-11-child-safeguarding',
    lessonId: 'pd11-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'Child Safeguarding · নিরাপদ পরিবেশ',
    title: 'ভয় ও উপহাসমুক্ত “Zero-Mocking” শ্রেণিকক্ষ অঙ্গীকার',
    strategy:
      'সহপাঠীর ভুল উত্তরে হাসি-ঠাট্টা করলে অনেক শিশু চিরতরে কথা বলা বন্ধ করে দেয়। প্রথম দিন থেকেই “ভুল মানেই শেখার চেষ্টা, উপহাস নিষিদ্ধ” নীতি কার্যকর করুন।',
    classroomTakeaway:
      'কেউ ভুল উত্তর দিলে সহপাঠীদের দিয়ে “ধন্যবাদ চেষ্টা করার জন্য” বলার অভ্যাস তৈরি করুন।',
    prepTimeLabel: '১ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd12',
    courseId: 'pd-12-differentiated-instruction',
    lessonId: 'pd12-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'Differentiated Instruction · ৩ স্তরের অনুশীলন',
    title: 'একই পাঠে “Must Do / Should Do / Aspire To” টাস্ক',
    strategy:
      'সব শিক্ষার্থীর কাজের গতি এক নয়। মূল ন্যূনতম কাজ (Must Do) সবার জন্য রেখে দ্রুত সম্পন্নকারীদের জন্য চ্যালেঞ্জিং এক্সটেনশন (Aspire To) রাখলে কেউ বসে থাকে না।',
    classroomTakeaway:
      'আজকের ওয়ার্কশিটে ২টি মৌলিক প্রশ্ন ও শেষে ১টি বোনাস চ্যালেঞ্জ প্রশ্ন যোগ করুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd13',
    courseId: 'pd-13-21st-century-skills',
    lessonId: 'pd13-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: '21st Century Skills · 4Cs',
    title: 'প্রতিটি দলীয় কাজে 4Cs কাঠামো যুক্ত করা',
    strategy:
      'শিক্ষার্থীরা যখন দলগতভাবে কোনো সমস্যা নিয়ে বিতর্ক (Critical Thinking), নতুন সমাধান ভাবনা (Creativity), যৌথ কাজ (Collaboration) ও উপস্থাপনা (Communication) করে, তখন 4Cs জীবন্ত হয়।',
    classroomTakeaway:
      'পরবর্তী পাঠের শেষে ৫ মিনিট দুটি দলকে তাদের সমাধানের পক্ষে ও বিপক্ষে যুক্তি উপস্থাপন করতে দিন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd14',
    courseId: 'pd-14-competency-based-ed',
    lessonId: 'pd14-l1',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'CBE · যোগ্যতা প্রমাণ',
    title: '“কী পড়ানো হলো” নয়—“কী করতে পারছে” তা যাচাই',
    strategy:
      'যোগ্যতাভিত্তিক শিক্ষায় অধ্যায় শেষ করা লক্ষ্য নয়; বরং শিক্ষার্থী অর্জিত দক্ষতা বাস্তব পরিস্থিতিতে প্রয়োগ করতে পারছে কি না তা পারফরম্যান্স কাজের মাধ্যমে দেখা হয়।',
    classroomTakeaway:
      'ইউনিট শেষে তাত্ত্বিক প্রশ্নের পাশাপাশি ১টি ক্ষুদ্র পারফরম্যান্স/হাতে-কলমে দক্ষতা চেকলিস্ট ব্যবহার করুন।',
    prepTimeLabel: '৫ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd15',
    courseId: 'pd-15-flipped-blended',
    lessonId: 'pd15-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'Flipped & Blended · অফলাইন প্রবেশগম্যতা',
    title: 'অডিও/পিডিএফ প্রি-রিডিং দিয়ে সহজ ফ্লিপড ক্লাস',
    strategy:
      'সব শিক্ষার্থীর বাসায় দ্রুত ইন্টারনেট নাও থাকতে পারে। ২ পৃষ্ঠার প্রিন্টেড ব্রিফ বা ২-মিনিটের হোয়াটসঅ্যাপ অডিও আগে পাঠালেও কার্যকর ফ্লিপড ক্লাসরুম চলে।',
    classroomTakeaway:
      'আগামী ক্লাসের মূল ১টি উদাহরণ আগে দিয়ে আসুন যাতে ক্লাস সময়ের পুরোটাই অনুশীলনে ব্যয় হয়।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd16',
    courseId: 'pd-16-research-innovation',
    lessonId: 'pd16-l1',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'Action Research · ডেটা ট্রায়াঙ্গুলেশন',
    title: '১টি নতুন কৌশল পরীক্ষার আগে বেসলাইন নোট রাখা',
    strategy:
      'নতুন কোনো শিক্ষণ কৌশল প্রয়োগের আগে ক্লাসের বর্তমান অবস্থা (যেমন অংশগ্রহণের হার বা সঠিক উত্তরের %) লিখে রাখলে ২ সপ্তাহ পর প্রকৃত পরিবর্তন মাপা সহজ হয়।',
    classroomTakeaway:
      'আপনার নির্বাচিত ১টি শ্রেণিকক্ষ সমস্যার আজকের বেসলাইন তথ্য ১টি ছোট টেবিলে টুকে রাখুন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd17',
    courseId: 'pd-17-language-communication',
    lessonId: 'pd17-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'Communication · ICQ ও বিরতি',
    title: 'নির্দেশনার পর ২-সেকেন্ড বিরতি ও ICQ যাচাই',
    strategy:
      'কাজের নির্দেশনা দিয়েই থেমে না গিয়ে “কাজটি কি একা করবেন না জোড়ায়?”—একটি সংক্ষিপ্ত ICQ প্রশ্ন করলে শ্রেণিকক্ষের বিভ্রান্তি ৮০% কমে যায়।',
    classroomTakeaway:
      'আজ দলীয় বা একক কাজ দেওয়ার সাথে সাথে ১টি সংক্ষিপ্ত ICQ প্রশ্ন করুন।',
    prepTimeLabel: '১ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd18',
    courseId: 'pd-18-neuroeducation',
    lessonId: 'pd18-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'Neuroeducation · Retrieval Practice',
    title: 'ক্লাস শুরুর ৩ মিনিটে বই-বন্ধ “Brain Dump” রিকল',
    strategy:
      'গত ক্লাসের নোট দেখে পড়ার চেয়ে বই বন্ধ করে যা মনে পড়ে তা ৩ মিনিটে লিখে বের করা (Retrieval Practice) মস্তিষ্কের দীর্ঘমেয়াদি স্মৃতিকে দ্বিগুণ শক্তিশালী করে।',
    classroomTakeaway:
      'পিরিয়ড শুরুর প্রথম ৩ মিনিট গত ক্লাসের ৩টি মূল পয়েন্ট স্মৃতি থেকে লিখতে দিন।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd19',
    courseId: 'pd-19-problem-based-learning',
    lessonId: 'pd19-l1',
    conceptKind: 'শ্রেণিকক্ষ কৌশল',
    tpackDimension: 'PrBL · সক্রেটিক প্রশ্ন',
    title: 'উত্তর বলে না দিয়ে “K-W-H” বোর্ডে অনুসন্ধান',
    strategy:
      'শিক্ষার্থী সমস্যা সমাধানের মাঝপথে আটকে গেলে সরাসরি সূত্র না বলে প্রশ্ন করুন—“আমরা কী জানি (K), আর কী জানতে হবে (W)?” এতে স্ব-নিয়ন্ত্রিত চিন্তা গড়ে ওঠে।',
    classroomTakeaway:
      'বোর্ডে Know / Need-to-Know দুই কলাম এঁকে শিক্ষার্থীদের নিজেদের প্রশ্ন নিজেরাই লিখতে দিন।',
    prepTimeLabel: '৩ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd20',
    courseId: 'pd-20-teacher-wellbeing',
    lessonId: 'pd20-l1',
    conceptKind: 'গবেষণা ও নেতৃত্ব',
    tpackDimension: 'Teacher Wellbeing · বক্স ব্রিদিং',
    title: 'কঠিন ক্লাস শেষে ১-মিনিটের Micro-Recovery বিরতি',
    strategy:
      'পরপর ক্লাসের চাপে স্নায়ুতন্ত্র ক্লান্ত হয়ে পড়লে বার্নআউট বাড়ে। পিরিয়ডের মাঝে ৪-৪-৪-৪ বক্স ব্রিদিং ও পানি পান তাৎক্ষণিক মানসিক স্থিরতা ফেরায়।',
    classroomTakeaway:
      'আজ দুটি ক্লাসের বিরতিতে অন্তত ৬০ সেকেন্ড গভীর শ্বাস নিয়ে চোখ বিশ্রাম দিন।',
    prepTimeLabel: '১ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd21',
    courseId: 'pd-21-academic-integrity-ai',
    lessonId: 'pd21-l1',
    conceptKind: 'মূল্যায়ন টিপ',
    tpackDimension: 'AI Ethics · Traffic-Light নীতি',
    title: 'অ্যাসাইনমেন্টে Red–Amber–Green AI নির্দেশিকা',
    strategy:
      'শিক্ষার্থীরা যেন বিভ্রান্ত না হয়, সেজন্য কাজের শুরুতেই জানিয়ে দিন—এতে AI ব্যবহার নিষিদ্ধ (Red), নাকি শুধু ধারণা/প্রুফরিডিংয়ের জন্য সহায়ক (Amber)।',
    classroomTakeaway:
      'পরবর্তী অ্যাসাইনমেন্টের শীর্ষে AI ব্যবহারের অনুমোদিত সীমা স্পষ্ট করে উল্লেখ করুন।',
    prepTimeLabel: '২ মিনিট প্রস্তুতি'
  },
  {
    id: 'tip-pd22',
    courseId: 'pd-22-subject-pedagogy',
    lessonId: 'pd22-l1',
    conceptKind: 'TPACK ধারণা',
    tpackDimension: 'Subject PCK · POE / CRA / CLT',
    title: 'বিষয় অনুযায়ী সঠিক কৌশল: POE, CRA এবং TBLT',
    strategy:
      'বিজ্ঞানে পরীক্ষার আগে অনুমান (POE), গণিতে বাস্তব-চিত্র-প্রতীক (CRA) এবং ইংরেজিতে বাস্তব কাজ-ভিত্তিক সংলাপ (TBLT) ব্যবহার করলে বিষয়ভিত্তিক ভীতি দূর হয়।',
    classroomTakeaway:
      'আপনার নিজের বিষয়ের জন্য POE, CRA বা TBLT থেকে অন্তত ১টি ধাপ আজকের পাঠে যুক্ত করুন।',
    prepTimeLabel: '৪ মিনিট প্রস্তুতি'
  }
];

export interface StudyingContextSummary {
  studyingCourses: Course[];
  isPersonalized: boolean;
  reasonByCourseId: Record<string, string>;
}

/**
 * Infers which courses the teacher is currently studying based on lesson progress,
 * materials read, saved notes, quiz attempts, and registered live sessions.
 */
export function getStudyingCoursesSummary(
  courses: Course[],
  progress: LearnerProgress,
  sessions: TrainingSession[]
): StudyingContextSummary {
  const registeredSessionCourseIds = new Set(
    sessions
      .filter((s) => progress.registeredSessionIds.includes(s.id))
      .map((s) => s.courseId)
  );

  const inProgress: Course[] = [];
  const startedOrCompleted: Course[] = [];
  const reasonByCourseId: Record<string, string> = {};

  for (const course of courses) {
    const lessonIds = new Set(course.lessons.map((l) => l.id));
    const materialIds = new Set(course.lessons.map((l) => l.material.id));

    const completedCount = progress.completedLessonIds.filter((id) =>
      lessonIds.has(id)
    ).length;
    const readCount = progress.readMaterialIds.filter((id) =>
      materialIds.has(id)
    ).length;
    const notesCount = course.lessons.filter((l) =>
      hasLessonNoteContent(progress.lessonNotes?.[l.id])
    ).length;
    const quizResult = progress.quizResults[course.id];
    const hasSession = registeredSessionCourseIds.has(course.id);

    const hasAnyActivity =
      completedCount > 0 ||
      readCount > 0 ||
      notesCount > 0 ||
      Boolean(quizResult) ||
      hasSession;

    if (!hasAnyActivity) continue;

    const isFullyDone =
      completedCount === course.lessons.length && Boolean(quizResult?.passed);

    if (completedCount > 0 && completedCount < course.lessons.length) {
      reasonByCourseId[course.id] = 'চলমান মডিউল';
    } else if (readCount > 0 || notesCount > 0) {
      reasonByCourseId[course.id] = 'পাঠ ও নোট অধ্যয়নরত';
    } else if (hasSession) {
      reasonByCourseId[course.id] = 'নিবন্ধিত সেশন';
    } else if (quizResult && !quizResult.passed) {
      reasonByCourseId[course.id] = 'কুইজ প্রস্তুতি';
    } else {
      reasonByCourseId[course.id] = 'সম্পন্ন ও চর্চিত';
    }

    startedOrCompleted.push(course);
    if (!isFullyDone) {
      inProgress.push(course);
    }
  }

  if (inProgress.length > 0) {
    return {
      studyingCourses: inProgress,
      isPersonalized: true,
      reasonByCourseId
    };
  }

  if (startedOrCompleted.length > 0) {
    return {
      studyingCourses: startedOrCompleted,
      isPersonalized: true,
      reasonByCourseId
    };
  }

  return {
    studyingCourses: courses,
    isPersonalized: false,
    reasonByCourseId: {}
  };
}
