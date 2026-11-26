import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  CheckCircle2,
  Cloud,
  Leaf,
  Loader2,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  X
} from 'lucide-react';
import { signInWithGoogle, signOutAccount } from '../firebase';

interface LoginPanelModalProps {
  isOpen: boolean;
  authUser: User | null;
  authLoading: boolean;
  learnerName: string;
  designation: string;
  schoolName: string;
  onClose: () => void;
  onOpenProfile: () => void;
}

function getFriendlyAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('auth/unauthorized-domain')) {
    const host =
      typeof window !== 'undefined' && window.location.hostname
        ? window.location.hostname
        : 'tpackacademy.netlify.app';
    return `এই ডোমেইনটি (${host}) Firebase Authorized Domains তালিকায় অনুমোদিত নয়। Firebase Console > Authentication > Settings > Authorized domains-এ "${host}" যুক্ত করুন।`;
  }
  if (msg.includes('auth/popup-closed-by-user')) {
    return 'লগইন পপআপটি বন্ধ করা হয়েছে। সাইন ইন করতে আবার চেষ্টা করুন।';
  }
  if (msg.includes('auth/cancelled-popup-request')) {
    return 'আগের লগইন অনুরোধটি বাতিল হয়েছে। অনুগ্রহ করে আবার সাইন ইন বাটনে ক্লিক করুন।';
  }
  if (msg.includes('auth/popup-blocked')) {
    return 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে এই সাইটের জন্য পপআপ অনুমতি দিয়ে পুনরায় চেষ্টা করুন।';
  }
  if (msg.includes('auth/network-request-failed')) {
    return 'নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।';
  }
  return 'সাইন ইন সম্পন্ন করা যায়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
}

export const LoginPanelModal: React.FC<LoginPanelModalProps> = ({
  isOpen,
  authUser,
  authLoading,
  learnerName,
  designation,
  schoolName,
  onClose,
  onOpenProfile
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorText(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorText(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorText(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setErrorText(null);
    setSubmitting(true);
    try {
      await signOutAccount();
      onClose();
    } catch (err) {
      setErrorText(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1E15]/35 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-panel-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md glass-modal rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/75 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="glass-3d-icon-well w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
            </span>
            <h2
              id="login-panel-modal-title"
              className="text-lg font-bold text-[#132219]"
            >
              {authUser ? 'শিক্ষক অ্যাকাউন্ট সেশন' : 'TPACK Academy লগইন প্যানেল'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-[#3F5247] hover:bg-white/70 hover:text-[#132219] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {authLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-sm text-[#3F5247]">
              <Loader2 className="w-6 h-6 animate-spin text-[#15803D]" />
              <span>অ্যাকাউন্ট সেশন যাচাই করা হচ্ছে...</span>
            </div>
          ) : authUser ? (
            <div className="space-y-5">
              {/* Signed-in Account Card */}
              <div className="p-4 rounded-xl glass-well flex items-center gap-3.5">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={learnerName || authUser.displayName || 'শিক্ষক'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#15803D] text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
                    {(learnerName || authUser.displayName || 'শি').charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-[#132219] truncate">
                      {learnerName || authUser.displayName || 'সম্মানিত শিক্ষক'}
                    </span>
                    <ShieldCheck
                      className="w-4 h-4 text-[#15803D] shrink-0"
                      aria-label="যাচাইকৃত অ্যাকাউন্ট"
                    />
                  </div>
                  <div className="text-xs text-[#3F5247] truncate">
                    {authUser.email}
                  </div>
                  {(designation || schoolName) && (
                    <div className="text-[11px] text-[#5B7063] truncate">
                      {[designation, schoolName].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl glass-well ring-1 ring-[#15803D]/20 flex items-start gap-2.5 text-xs text-[#14532D]">
                <Cloud className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  আপনার কোর্স অগ্রগতি, কুইজ ফলাফল, ব্যক্তিগত নোট এবং অর্জিত ব্যাজসমূহ আপনার Google অ্যাকাউন্টের সাথে নিরাপদভাবে ক্লাউডে সিঙ্ক হচ্ছে।
                </span>
              </div>

              {errorText && (
                <div className="p-3 rounded-xl bg-[#FEF2F2]/90 border border-[#FECACA] text-xs text-[#B91C1C]">
                  {errorText}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#15803D]" />
                  <span>প্রোফাইল সম্পাদনা</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSignOut}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#B91C1C] bg-[#FEF2F2]/90 hover:bg-[#FEE2E2] border border-[#FECACA] rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>লগ আউট</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#132219]">
                  শিক্ষক প্রশিক্ষণ পোর্টালে সাইন ইন করুন
                </h3>
                <p className="text-sm text-[#3F5247] leading-relaxed">
                  আপনার Google অ্যাকাউন্ট দিয়ে সাইন ইন করলে যেকোনো ডিভাইস থেকে কোর্স অগ্রগতি, কুইজ নম্বর, ব্যক্তিগত নোট এবং CPD সার্টিফিকেট সংরক্ষণ করতে পারবেন।
                </p>
              </div>

              {/* Benefits List */}
              <ul className="space-y-2.5 text-xs text-[#2C3E33] glass-well rounded-xl p-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                  <span>কোর্স মডিউল, অধ্যয়ন সময় ও ব্যক্তিগত নোট ক্লাউডে সংরক্ষণ</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                  <span>অর্জিত ডিজিটাল ব্যাজ ও CPD সার্টিফিকেট তথ্য সুরক্ষিত রাখা</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                  <span>নিরাপদ Google প্রমাণীকরণ — কোনো অতিরিক্ত পাসওয়ার্ডের প্রয়োজন নেই</span>
                </li>
              </ul>

              {errorText && (
                <div className="p-3 rounded-xl bg-[#FEF2F2]/90 border border-[#FECACA] text-xs text-[#B91C1C]">
                  {errorText}
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleGoogleSignIn}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[46px] disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2.5 text-xs font-medium text-[#3F5247] hover:text-[#132219] transition-colors cursor-pointer"
                >
                  অতিথি হিসেবে ব্রাউজ করা চালিয়ে যান
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface InlineLoginPanelProps {
  authUser: User | null;
  authLoading: boolean;
  learnerName: string;
  onOpenLoginModal: () => void;
  onSignOut: () => void;
}

export const InlineLoginPanel: React.FC<InlineLoginPanelProps> = ({
  authUser,
  authLoading,
  learnerName,
  onOpenLoginModal,
  onSignOut
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleQuickSignIn = async () => {
    setInlineError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setInlineError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <section
        aria-label="অ্যাকাউন্ট অবস্থা"
        className="glass-surface rounded-2xl px-5 py-4 flex items-center gap-3 text-xs text-[#3F5247]"
      >
        <Loader2 className="w-4 h-4 animate-spin text-[#15803D]" />
        <span>শিক্ষক অ্যাকাউন্ট সেশন যাচাই করা হচ্ছে...</span>
      </section>
    );
  }

  if (authUser) {
    return (
      <section
        aria-label="লগইনকৃত শিক্ষক অ্যাকাউন্ট"
        className="glass-surface ring-1 ring-[#15803D]/25 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {authUser.photoURL ? (
            <img
              src={authUser.photoURL}
              alt={learnerName || authUser.displayName || 'শিক্ষক'}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#15803D] text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              {(learnerName || authUser.displayName || 'শি').charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[#132219] truncate">
                স্বাগতম, {learnerName || authUser.displayName || 'সম্মানিত শিক্ষক'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D]">
                <Cloud className="w-3 h-3" />
                <span>ক্লাউড সিঙ্ক সক্রিয়</span>
              </span>
            </div>
            <div className="text-xs text-[#3F5247] truncate">
              সংযুক্ত অ্যাকাউন্ট: {authUser.email}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenLoginModal}
            className="px-3.5 py-2 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl cursor-pointer"
          >
            অ্যাকাউন্ট তথ্য
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#3F5247] hover:text-[#B91C1C] btn-3d-glass rounded-xl cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগ আউট</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="শিক্ষক লগইন প্যানেল"
      className="glass-surface rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
    >
      <div className="flex items-start gap-4 max-w-2xl">
        <div className="glass-3d-icon-well w-11 h-11 rounded-xl text-[#15803D] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#15803D]">
            শিক্ষক অ্যাকাউন্ট লগইন প্যানেল · ক্লাউড সিঙ্ক
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#132219]">
            আপনার প্রশিক্ষণ অগ্রগতি ও CPD সনদ নিরাপদে সংরক্ষণ করতে সাইন ইন করুন
          </h2>
          <p className="text-xs sm:text-sm text-[#3F5247] leading-relaxed">
            Google অ্যাকাউন্ট দিয়ে লগইন করলে আপনার সম্পন্ন মডিউল, কুইজ স্কোর, ব্যক্তিগত নোট ও ডিজিটাল ব্যাজ ক্লাউডে সংরক্ষিত থাকবে।
          </p>
          {inlineError && (
            <p className="text-xs font-medium text-[#B91C1C] pt-1">
              {inlineError}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <button
          type="button"
          disabled={submitting}
          onClick={handleQuickSignIn}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap min-h-[44px] disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          <span>Google দিয়ে লগইন করুন</span>
        </button>
        <button
          type="button"
          onClick={onOpenLoginModal}
          className="px-3.5 py-2.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[44px] cursor-pointer"
        >
          বিস্তারিত দেখুন
        </button>
      </div>
    </section>
  );
};
