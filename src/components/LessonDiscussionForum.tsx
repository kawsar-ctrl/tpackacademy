import React, { useMemo, useState } from 'react';
import {
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Plus,
  Search,
  Send,
  ThumbsUp,
  Trash2,
  X
} from 'lucide-react';
import {
  Course,
  DiscussionPost,
  DiscussionPostType,
  DiscussionReply,
  Lesson
} from '../types/lms';
import { STARTER_DISCUSSION_POSTS } from '../data/discussionData';
import { toBengaliDigits } from '../utils/lmsHelpers';

interface LessonDiscussionForumProps {
  course: Course;
  lesson: Lesson;
  learnerName: string;
  designation: string;
  schoolName: string;
  customPosts: DiscussionPost[];
  customReplies: Record<string, DiscussionReply[]>;
  helpfulIds: string[];
  onCreatePost: (post: {
    courseId: string;
    lessonId: string;
    type: DiscussionPostType;
    title: string;
    body: string;
  }) => void;
  onDeletePost: (postId: string) => void;
  onAddReply: (postId: string, body: string) => void;
  onToggleHelpful: (postId: string) => void;
}

export const LessonDiscussionForum: React.FC<LessonDiscussionForumProps> = ({
  course,
  lesson,
  learnerName,
  designation,
  schoolName,
  customPosts,
  customReplies,
  helpfulIds,
  onCreatePost,
  onDeletePost,
  onAddReply,
  onToggleHelpful
}) => {
  const [scope, setScope] = useState<'lesson' | 'course'>('lesson');
  const [typeFilter, setTypeFilter] = useState<'all' | DiscussionPostType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [newType, setNewType] = useState<DiscussionPostType>('question');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplyBoxIds, setOpenReplyBoxIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const lessonMap = useMemo(() => {
    const map: Record<string, Lesson> = {};
    course.lessons.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [course.lessons]);

  const mergedCoursePosts = useMemo(() => {
    const allBase = [
      ...customPosts.filter((p) => p.courseId === course.id),
      ...STARTER_DISCUSSION_POSTS.filter((p) => p.courseId === course.id)
    ];

    return allBase.map((post) => {
      const extraReplies = customReplies[post.id] ?? [];
      return {
        ...post,
        replies: [...post.replies, ...extraReplies]
      };
    });
  }, [customPosts, customReplies, course.id]);

  const visiblePosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mergedCoursePosts.filter((post) => {
      const scopeOk = scope === 'course' || post.lessonId === lesson.id;
      const typeOk = typeFilter === 'all' || post.type === typeFilter;
      const searchOk =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.body.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q) ||
        post.replies.some((r) => r.body.toLowerCase().includes(q));
      return scopeOk && typeOk && searchOk;
    });
  }, [mergedCoursePosts, scope, lesson.id, typeFilter, searchQuery]);

  const currentLessonCount = mergedCoursePosts.filter(
    (p) => p.lessonId === lesson.id
  ).length;

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    const body = newBody.trim();
    if (!title || !body) return;

    onCreatePost({
      courseId: course.id,
      lessonId: lesson.id,
      type: newType,
      title,
      body
    });

    setNewTitle('');
    setNewBody('');
    setComposerOpen(false);
    setScope('lesson');
  };

  const handleSubmitReply = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = (replyDrafts[postId] ?? '').trim();
    if (!text) return;
    onAddReply(postId, text);
    setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
    setOpenReplyBoxIds((prev) => ({ ...prev, [postId]: false }));
  };

  return (
    <section
      aria-labelledby="discussion-forum-heading"
      className="glass-surface rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/75">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              শিক্ষক আলোচনা ফোরাম · {lesson.number} ({toBengaliDigits(currentLessonCount)}টি আলোচনা)
            </span>
          </div>
          <h2
            id="discussion-forum-heading"
            className="text-xl font-bold text-[#132219]"
          >
            প্রশ্ন জিজ্ঞাসা ও শ্রেণিকক্ষ অভিজ্ঞতা বিনিময়
          </h2>
          <p className="text-xs sm:text-sm text-[#3F5247]">
            এই মডিউল সম্পর্কে সহকর্মী শিক্ষক ও প্রশিক্ষকদের কাছে প্রশ্ন করুন কিংবা আপনার শ্রেণিকক্ষ প্রয়োগের অভিজ্ঞতা শেয়ার করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposerOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
        >
          {composerOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>ফর্ম বন্ধ করুন</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>নতুন প্রশ্ন / অভিজ্ঞতা লিখুন</span>
            </>
          )}
        </button>
      </div>

      {/* Composer Form */}
      {composerOpen && (
        <form
          onSubmit={handleSubmitPost}
          className="p-5 rounded-2xl glass-well ring-1 ring-[#15803D]/25 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#3F5247]">
              পোস্টকারী:{' '}
              <strong className="text-[#132219]">
                {learnerName.trim() || 'সম্মানিত শিক্ষক'}
              </strong>
              {designation ? ` · ${designation}` : ''}
              {schoolName ? ` (${schoolName})` : ''}
            </div>

            <div className="flex items-center gap-1 p-1 glass-well rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setNewType('question')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  newType === 'question'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#15803D]" />
                <span>প্রশ্ন জিজ্ঞাসা</span>
              </button>
              <button
                type="button"
                onClick={() => setNewType('experience')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  newType === 'experience'
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219]'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#B45309]" />
                <span>অভিজ্ঞতা শেয়ার</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="discussion-post-title"
              className="block text-xs font-semibold text-[#132219]"
            >
              শিরোনাম ({lesson.number}: {lesson.title})
            </label>
            <input
              id="discussion-post-title"
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={
                newType === 'question'
                  ? 'সংক্ষেপে আপনার প্রশ্নটি লিখুন...'
                  : 'আপনার শ্রেণিকক্ষ প্রয়োগের শিরোনাম লিখুন...'
              }
              className="w-full px-3.5 py-2.5 text-sm glass-input rounded-xl text-[#132219] placeholder:text-[#6B7E72] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="discussion-post-body"
              className="block text-xs font-semibold text-[#132219]"
            >
              বিস্তারিত বিবরণ
            </label>
            <textarea
              id="discussion-post-body"
              rows={3}
              required
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder={
                newType === 'question'
                  ? 'আপনার শ্রেণিকক্ষের প্রেক্ষাপট ও সুনির্দিষ্ট প্রশ্নটি বিস্তারিত লিখুন...'
                  : 'কোন কৌশলটি ব্যবহার করেছেন এবং শিক্ষার্থীদের প্রতিক্রিয়া কেমন ছিল তা লিখুন...'
              }
              className="w-full p-3.5 text-sm glass-input rounded-xl text-[#132219] placeholder:text-[#6B7E72] focus:outline-none focus:ring-2 focus:ring-[#15803D] resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#3F5247] btn-3d-glass rounded-xl cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim() || !newBody.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-3d-emerald disabled:opacity-50 rounded-xl cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ফোরামে প্রকাশ করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Switcher */}
          <div className="flex items-center gap-1 p-1 glass-well rounded-xl">
            <button
              type="button"
              onClick={() => setScope('lesson')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                scope === 'lesson'
                  ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                  : 'text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              এই মডিউল ({toBengaliDigits(currentLessonCount)})
            </button>
            <button
              type="button"
              onClick={() => setScope('course')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                scope === 'course'
                  ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                  : 'text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              পুরো কোর্স ({toBengaliDigits(mergedCoursePosts.length)})
            </button>
          </div>

          {/* Post Type Filter */}
          <div className="flex items-center gap-1 p-1 glass-well rounded-xl">
            {(
              [
                { id: 'all', label: 'সব' },
                { id: 'question', label: 'প্রশ্ন' },
                { id: 'experience', label: 'অভিজ্ঞতা' }
              ] as { id: 'all' | DiscussionPostType; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  typeFilter === t.id
                    ? 'bg-white/95 text-[#132219] shadow-sm font-semibold border border-white'
                    : 'text-[#3F5247] hover:text-[#132219]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-60">
          <Search
            className="w-3.5 h-3.5 text-[#3F5247] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="আলোচনা খুঁজুন..."
            aria-label="আলোচনা খুঁজুন"
            className="w-full pl-8 pr-3 py-2 text-xs glass-input rounded-xl text-[#132219] placeholder:text-[#6B7E72] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
          />
        </div>
      </div>

      {/* Threads List */}
      {visiblePosts.length === 0 ? (
        <div className="p-8 rounded-2xl glass-well text-center space-y-3">
          <MessageSquare className="w-7 h-7 text-[#3F5247] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#132219]">
              {scope === 'lesson'
                ? `${lesson.number}-এ এখনো কোনো আলোচনা নেই`
                : 'এই ফিল্টারে কোনো আলোচনা পাওয়া যায়নি'}
            </h3>
            <p className="text-xs text-[#3F5247]">
              আপনি প্রথম প্রশ্ন জিজ্ঞাসা করে কিংবা শ্রেণিকক্ষ অভিজ্ঞতা শেয়ার করে আলোচনা শুরু করতে পারেন।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="px-4 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer"
            >
              আলোচনা শুরু করুন
            </button>
            {scope === 'lesson' && mergedCoursePosts.length > 0 && (
              <button
                type="button"
                onClick={() => setScope('course')}
                className="px-4 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
              >
                পুরো কোর্সের আলোচনা দেখুন ({toBengaliDigits(mergedCoursePosts.length)})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-white/75 glass-well rounded-2xl">
          {visiblePosts.map((post) => {
            const isHelpful = helpfulIds.includes(post.id);
            const displayHelpful = post.helpfulCount + (isHelpful ? 1 : 0);
            const postLesson = lessonMap[post.lessonId];
            const replyBoxOpen = Boolean(openReplyBoxIds[post.id]);

            return (
              <article key={post.id} className="p-5 space-y-3.5">
                {/* Unboxed Metadata Line */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5D52]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        post.type === 'question'
                          ? 'text-[#15803D]'
                          : 'text-[#B45309]'
                      }`}
                    >
                      {post.type === 'question' ? (
                        <HelpCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Lightbulb className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {post.type === 'question'
                          ? 'প্রশ্ন'
                          : 'শ্রেণিকক্ষ অভিজ্ঞতা'}
                      </span>
                    </span>
                    {postLesson && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{postLesson.number}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#132219]">
                      {post.authorName}
                    </span>
                    {post.authorRole && (
                      <span>({post.authorRole})</span>
                    )}
                    {post.schoolName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{post.schoolName}</span>
                      </>
                    )}
                  </div>

                  <span className="font-mono tabular-nums shrink-0">
                    {post.createdAt}
                  </span>
                </div>

                {/* Title & Body */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#132219] leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[#2C3E33] leading-relaxed max-w-[75ch] whitespace-pre-line">
                    {post.body}
                  </p>
                </div>

                {/* Replies */}
                {post.replies.length > 0 && (
                  <div className="pl-4 sm:pl-6 space-y-2.5 pt-1">
                    {post.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-3.5 rounded-xl bg-white/75 border border-white space-y-1 shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[#132219]">
                              {reply.authorName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                reply.isInstructor
                                  ? 'font-semibold text-[#15803D]'
                                  : 'text-[#3F5247]'
                              }
                            >
                              {reply.authorRole}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums text-[#3F5247]">
                            {reply.createdAt}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#2C3E33] leading-relaxed whitespace-pre-line">
                          {reply.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleHelpful(post.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer ${
                        isHelpful
                          ? 'btn-3d-glass ring-1 ring-[#15803D]/50 text-[#15803D]'
                          : 'btn-3d-glass text-[#3F5247] hover:text-[#132219]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>
                        সহায়ক ({toBengaliDigits(displayHelpful)})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenReplyBoxIds((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id]
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>
                        উত্তর দিন ({toBengaliDigits(post.replies.length)})
                      </span>
                    </button>
                  </div>

                  {post.isOwn && (
                    <div className="flex items-center gap-2">
                      {confirmDeleteId === post.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onDeletePost(post.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg cursor-pointer"
                          >
                            নিশ্চিত মুছুন
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 text-xs font-medium text-[#3F5247] btn-3d-glass rounded-lg cursor-pointer"
                          >
                            বাতিল
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="inline-flex items-center gap-1 text-xs text-[#3F5247] hover:text-[#DC2626] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>মুছুন</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline Reply Form */}
                {replyBoxOpen && (
                  <form
                    onSubmit={(e) => handleSubmitReply(e, post.id)}
                    className="pt-2 flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      required
                      value={replyDrafts[post.id] ?? ''}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [post.id]: e.target.value
                        }))
                      }
                      placeholder="আপনার উত্তর বা পরামর্শ লিখুন..."
                      className="flex-1 px-3.5 py-2 text-xs sm:text-sm glass-input rounded-xl text-[#132219] placeholder:text-[#6B7E72] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                    />
                    <button
                      type="submit"
                      disabled={!(replyDrafts[post.id] ?? '').trim()}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold btn-3d-emerald disabled:opacity-50 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>উত্তর পাঠান</span>
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
