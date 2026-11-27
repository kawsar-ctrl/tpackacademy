import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Crown,
  Loader2,
  LogIn,
  ShieldCheck,
  Wallet,
  X
} from 'lucide-react';
import {
  AccessControlConfig,
  EffectiveAccessState,
  PaymentMethodType,
  PaymentRequestRecord
} from '../types/lms';
import { toBengaliDigits } from '../utils/lmsHelpers';

interface AccessUpgradeModalProps {
  isOpen: boolean;
  authUser: User | null;
  learnerName: string;
  totalModulesCount: number;
  accessConfig: AccessControlConfig;
  effectiveAccess: EffectiveAccessState;
  userPaymentRequests: PaymentRequestRecord[];
  onClose: () => void;
  onOpenLogin: () => void;
  onSubmitPaymentRequest: (payload: {
    userName: string;
    method: PaymentMethodType;
    senderPhone: string;
    transactionId: string;
    amountBdt: number;
    note: string;
  }) => Promise<void>;
}

export const AccessUpgradeModal: React.FC<AccessUpgradeModalProps> = ({
  isOpen,
  authUser,
  learnerName,
  totalModulesCount,
  accessConfig,
  effectiveAccess,
  userPaymentRequests,
  onClose,
  onOpenLogin,
  onSubmitPaymentRequest
}) => {
  const [method, setMethod] = useState<PaymentMethodType>('bKash');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!senderPhone.trim() || senderPhone.trim().length < 6) {
      setFeedback({
        type: 'error',
        text: 'অনুগ্রহ করে সঠিক প্রেরক মোবাইল নম্বর লিখুন।'
      });
      return;
    }
    if (!transactionId.trim() || transactionId.trim().length < 3) {
      setFeedback({
        type: 'error',
        text: 'অনুগ্রহ করে বৈধ Transaction ID লিখুন।'
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitPaymentRequest({
        userName: learnerName || authUser?.displayName || 'সম্মানিত শিক্ষক',
        method,
        senderPhone: senderPhone.trim(),
        transactionId: transactionId.trim(),
        amountBdt: accessConfig.annualPriceBdt,
        note: note.trim()
      });
      setSenderPhone('');
      setTransactionId('');
      setNote('');
      setFeedback({
        type: 'success',
        text: 'আপনার পেমেন্ট তথ্য সফলভাবে জমা হয়েছে! সুপার অ্যাডমিন যাচাই করেই ১ বছরের ফুল এক্সেস সক্রিয় করবেন।'
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'পেমেন্ট তথ্য জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1E15]/40 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-upgrade-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-modal rounded-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/75 flex items-center justify-between gap-3 sticky top-0 bg-white/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-2.5">
            <span className="glass-3d-icon-well w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-[#15803D]" />
            </span>
            <div>
              <h2
                id="access-upgrade-modal-title"
                className="text-lg font-bold text-[#132219]"
              >
                TPACK Academy এক্সেস ও বার্ষিক প্রো প্ল্যান
              </h2>
              <p className="text-xs text-[#3F5247]">
                {effectiveAccess.statusLabelBn} · {effectiveAccess.statusDetailBn}
              </p>
            </div>
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

        <div className="p-6 space-y-6">
          {/* Plan Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-well rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#15803D] inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ফ্রি লিমিটেড এক্সেস</span>
                </span>
                <span className="text-sm font-bold font-mono text-[#132219]">
                  ৳০ / {toBengaliDigits(accessConfig.freeTrialDays)} দিন
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#2C3E33]">
                <li>
                  ✓ লগইন করার সাথে সাথে {toBengaliDigits(accessConfig.freeTrialDays)} দিনের ফ্রি এক্সেস
                </li>
                <li>
                  ✓ প্রথম {toBengaliDigits(accessConfig.freeTrialMaxModules)}টি মডিউল ও অনুশীলন কুইজ
                </li>
                <li className="text-[#5B7063]">
                  • পূর্ণাঙ্গ মডিউল, সব ডাউনলোড ও CPD সনদ লকড
                </li>
              </ul>
            </div>

            <div className="glass-card-3d rounded-2xl p-4 ring-1 ring-[#15803D]/35 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#15803D] inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>বার্ষিক ফুল এক্সেস</span>
                </span>
                <span className="text-base font-bold font-mono text-[#15803D]">
                  ৳{toBengaliDigits(accessConfig.annualPriceBdt)} / ১ বছর
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#132219] font-medium">
                <li>
                  ✓ সকল {toBengaliDigits(totalModulesCount)}+ প্রশিক্ষণ মডিউল সম্পূর্ণ আনলকড
                </li>
                <li>✓ সব ভিডিও লেসন, হ্যান্ডআউট ও লেসন প্ল্যান ডাউনলোড</li>
                <li>✓ চূড়ান্ত মূল্যায়ন, ব্যাজ ও অফিশিয়াল CPD সার্টিফিকেট</li>
              </ul>
            </div>
          </div>

          {!authUser ? (
            <div className="glass-well rounded-2xl p-5 text-center space-y-3">
              <p className="text-sm font-semibold text-[#132219]">
                প্রথমে Google অ্যাকাউন্ট দিয়ে লগইন করুন
              </p>
              <p className="text-xs text-[#3F5247]">
                লগইন করলেই স্বয়ংক্রিয়ভাবে {toBengaliDigits(accessConfig.freeTrialDays)} দিনের ফ্রি লিমিটেড এক্সেস পাবেন এবং প্রয়োজনে ১ বছরের ফুল এক্সেসে আপগ্রেড করতে পারবেন।
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Google দিয়ে লগইন করুন</span>
              </button>
            </div>
          ) : effectiveAccess.isProActive ? (
            <div className="p-4 rounded-xl bg-[#ECF2ED]/90 border border-[#15803D]/30 flex items-center gap-3 text-sm text-[#14532D]">
              <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />
              <div>
                <div className="font-bold">আপনার ফুল এক্সেস সক্রিয় রয়েছে!</div>
                <div className="text-xs mt-0.5">
                  {effectiveAccess.statusLabelBn} — সব মডিউল, ভিডিও ও CPD সার্টিফিকেট ব্যবহার করতে পারবেন।
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Instructions */}
              <div className="glass-well rounded-xl p-4 space-y-1.5">
                <div className="text-xs font-bold text-[#15803D] inline-flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>পেমেন্ট নির্দেশনা (৳{toBengaliDigits(accessConfig.annualPriceBdt)} / ১ বছর)</span>
                </div>
                <p className="text-xs text-[#2C3E33] leading-relaxed">
                  {accessConfig.paymentInstructions}
                </p>
              </div>

              {/* Payment Verification Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#3F5247]">
                      পেমেন্ট মাধ্যম
                    </label>
                    <select
                      value={method}
                      onChange={(e) =>
                        setMethod(e.target.value as PaymentMethodType)
                      }
                      className="w-full px-3 py-2 text-sm glass-input rounded-xl text-[#132219]"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#3F5247]">
                      প্রেরক মোবাইল নম্বর *
                    </label>
                    <input
                      type="text"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 text-sm glass-input rounded-xl text-[#132219]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#3F5247]">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="যেমন: 9AB4C7XYZ"
                      className="w-full px-3 py-2 text-sm font-mono glass-input rounded-xl text-[#132219]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#3F5247]">
                    অতিরিক্ত তথ্য / বিদ্যালয়ের নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="যেমন: ১ বছরের প্রো এক্সেস অনুমোদনের জন্য অনুরোধ"
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl text-[#132219]"
                  />
                </div>

                {feedback && (
                  <div
                    role="status"
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      feedback.type === 'success'
                        ? 'bg-[#ECF2ED]/90 border-[#15803D]/30 text-[#14532D]'
                        : 'bg-[#FEF2F2]/90 border-[#FECACA] text-[#B91C1C]'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crown className="w-4 h-4" />
                  )}
                  <span>
                    ৳{toBengaliDigits(accessConfig.annualPriceBdt)} পেমেন্ট যাচাইয়ের জন্য জমা দিন
                  </span>
                </button>
              </form>

              {userPaymentRequests.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-white/75">
                  <div className="text-xs font-bold text-[#132219]">
                    আপনার পূর্বে জমা দেওয়া পেমেন্ট অনুরোধ
                  </div>
                  <div className="space-y-2">
                    {userPaymentRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl glass-well flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#132219]">
                            {req.method} · ৳{toBengaliDigits(req.amountBdt)}
                          </span>{' '}
                          <span className="font-mono text-[#3F5247]">
                            (TrxID: {req.transactionId})
                          </span>
                          {req.reviewNote && (
                            <div className="text-[11px] text-[#5B7063] mt-0.5">
                              {req.reviewNote}
                            </div>
                          )}
                        </div>
                        <span
                          className={`font-semibold ${
                            req.status === 'approved'
                              ? 'text-[#15803D]'
                              : req.status === 'rejected'
                              ? 'text-[#DC2626]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {req.status === 'approved'
                            ? 'অনুমোদিত'
                            : req.status === 'rejected'
                            ? 'প্রত্যাখ্যাত'
                            : 'যাচাই চলছে'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
