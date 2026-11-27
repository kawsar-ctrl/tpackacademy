import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Crown,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  Users,
  Wallet,
  XCircle
} from 'lucide-react';
import {
  AccessControlConfig,
  AdminRoleRecord,
  PaymentRequestRecord,
  UserAccessRecord
} from '../types/lms';
import { toBengaliDigits } from '../utils/lmsHelpers';

interface SuperAdminControlTabProps {
  currentAdminUid: string;
  accessConfig: AccessControlConfig;
  userAccessList: UserAccessRecord[];
  paymentRequests: PaymentRequestRecord[];
  adminRoles: AdminRoleRecord[];
  onSaveAccessControl: (config: AccessControlConfig) => Promise<void>;
  onUpdateUserAccess: (
    targetUserId: string,
    patch: {
      displayName?: string;
      planTier: UserAccessRecord['planTier'];
      trialStartedAtMs: number;
      trialEndsAtMs: number;
      proActivatedAtMs: number;
      proExpiresAtMs: number;
      allowFullOverride: boolean;
      customNote: string;
    }
  ) => Promise<void>;
  onReviewPaymentRequest: (
    req: PaymentRequestRecord,
    approve: boolean,
    reviewNote: string,
    existingUserAccess?: UserAccessRecord
  ) => Promise<void>;
  onToggleModuleManagerRole: (
    userRec: UserAccessRecord,
    shouldBeManager: boolean
  ) => Promise<void>;
}

type UserFilter = 'all' | 'free_trial' | 'annual_pro' | 'expired' | 'suspended';

function formatDaysLeft(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return 'মেয়াদ শেষ';
  const days = Math.max(1, Math.ceil(diff / 86400000));
  return `${toBengaliDigits(days)} দিন বাকি`;
}

export const SuperAdminControlTab: React.FC<SuperAdminControlTabProps> = ({
  currentAdminUid,
  accessConfig,
  userAccessList,
  paymentRequests,
  adminRoles,
  onSaveAccessControl,
  onUpdateUserAccess,
  onReviewPaymentRequest,
  onToggleModuleManagerRole
}) => {
  const [policyDraft, setPolicyDraft] =
    useState<AccessControlConfig>(accessConfig);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyFeedback, setPolicyFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [busyReqId, setBusyReqId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    setPolicyDraft(accessConfig);
  }, [accessConfig]);

  const managerUidSet = useMemo(
    () => new Set(adminRoles.map((r) => r.uid)),
    [adminRoles]
  );

  const userByUid = useMemo(() => {
    const map = new Map<string, UserAccessRecord>();
    userAccessList.forEach((u) => map.set(u.uid, u));
    return map;
  }, [userAccessList]);

  const nowMs = Date.now();

  const stats = useMemo(() => {
    const total = userAccessList.length;
    const proCount = userAccessList.filter(
      (u) =>
        u.allowFullOverride ||
        (u.planTier === 'annual_pro' &&
          (u.proExpiresAtMs === 0 || u.proExpiresAtMs > nowMs))
    ).length;
    const trialCount = userAccessList.filter(
      (u) => u.planTier === 'free_trial' && u.trialEndsAtMs > nowMs
    ).length;
    const pendingPayments = paymentRequests.filter(
      (r) => r.status === 'pending'
    ).length;
    return { total, proCount, trialCount, pendingPayments };
  }, [userAccessList, paymentRequests, nowMs]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return userAccessList.filter((u) => {
      const matchesSearch =
        !q ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (userFilter === 'annual_pro') {
        return (
          u.allowFullOverride ||
          (u.planTier === 'annual_pro' &&
            (u.proExpiresAtMs === 0 || u.proExpiresAtMs > nowMs))
        );
      }
      if (userFilter === 'free_trial') {
        return u.planTier === 'free_trial' && u.trialEndsAtMs > nowMs;
      }
      if (userFilter === 'expired') {
        return (
          (u.planTier === 'free_trial' && u.trialEndsAtMs <= nowMs) ||
          (u.planTier === 'annual_pro' &&
            u.proExpiresAtMs > 0 &&
            u.proExpiresAtMs <= nowMs)
        );
      }
      if (userFilter === 'suspended') {
        return u.planTier === 'suspended';
      }
      return true;
    });
  }, [userAccessList, userSearch, userFilter, nowMs]);

  const sortedPayments = useMemo(() => {
    return [...paymentRequests].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.createdAtMs - a.createdAtMs;
    });
  }, [paymentRequests]);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPolicyFeedback(null);
    setPolicySaving(true);
    try {
      await onSaveAccessControl(policyDraft);
      setPolicyFeedback({
        type: 'success',
        text: 'প্ল্যাটফর্ম এক্সেস নীতি সফলভাবে Firestore-এ সংরক্ষিত হয়েছে।'
      });
    } catch {
      setPolicyFeedback({
        type: 'error',
        text: 'এক্সেস নীতি সংরক্ষণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      });
    } finally {
      setPolicySaving(false);
    }
  };

  const runUserAction = async (
    userRec: UserAccessRecord,
    label: string,
    fn: () => Promise<void>
  ) => {
    setActionFeedback(null);
    setBusyUid(userRec.uid);
    try {
      await fn();
      setActionFeedback({
        type: 'success',
        text: `${userRec.displayName}: ${label} সম্পন্ন হয়েছে।`
      });
    } catch {
      setActionFeedback({
        type: 'error',
        text: `${userRec.displayName}-এর এক্সেস হালনাগাদ ব্যর্থ হয়েছে।`
      });
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">নিবন্ধিত শিক্ষক</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219] mt-1">
            {toBengaliDigits(stats.total)} জন
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            গুগল লগইনকৃত ব্যবহারকারী
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">সক্রিয় ফ্রি ট্রায়াল</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#15803D] mt-1">
            {toBengaliDigits(stats.trialCount)} জন
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            {toBengaliDigits(accessConfig.freeTrialDays)} দিন · সর্বোচ্চ{' '}
            {toBengaliDigits(accessConfig.freeTrialMaxModules)} মডিউল
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">১ বছরের প্রো সদস্য</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#B45309] mt-1">
            {toBengaliDigits(stats.proCount)} জন
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            ৳{toBengaliDigits(accessConfig.annualPriceBdt)} /{' '}
            {toBengaliDigits(accessConfig.annualDurationDays)} দিন ফুল এক্সেস
          </div>
        </div>
        <div className="glass-card-3d rounded-2xl p-4">
          <div className="text-xs text-[#3F5247]">অপেক্ষমাণ পেমেন্ট</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#132219] mt-1">
            {toBengaliDigits(stats.pendingPayments)}টি
          </div>
          <div className="text-[11px] text-[#5B7063] mt-0.5">
            যাচাই ও অনুমোদনের অপেক্ষায়
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            actionFeedback.type === 'success'
              ? 'bg-[#ECF2ED]/90 border-[#15803D]/30 text-[#14532D]'
              : 'bg-[#FEF2F2]/90 border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Section 1: Payment Verification Queue */}
      <div className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/75">
          <div className="flex items-center gap-2.5">
            <span className="glass-3d-icon-well w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-[#15803D]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#132219]">
                ৳{toBengaliDigits(accessConfig.annualPriceBdt)} বার্ষিক প্রো পেমেন্ট যাচাইকরণ কিউ
              </h2>
              <p className="text-xs text-[#3F5247]">
                শিক্ষকদের পাঠানো bKash / Nagad / Rocket / Bank Transaction ID যাচাই করে ১ বছরের ফুল এক্সেস সক্রিয় করুন।
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-[#15803D]">
            মোট অনুরোধ: {toBengaliDigits(sortedPayments.length)}টি
          </span>
        </div>

        {sortedPayments.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#3F5247] glass-well rounded-xl">
            এখনো কোনো পেমেন্ট ভেরিফিকেশন অনুরোধ আসেনি।
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPayments.map((req) => {
              const isPending = req.status === 'pending';
              const isBusy = busyReqId === req.id;
              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl glass-well flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isPending ? 'ring-1 ring-[#15803D]/35' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-[#132219]">
                        {req.userName}
                      </span>
                      <span className="text-[#3F5247]">{req.userEmail}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#15803D]">
                        {req.method} · ৳{toBengaliDigits(req.amountBdt)}
                      </span>
                      <span aria-hidden="true">·</span>
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
                          : 'অপেক্ষমাণ'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#132219]">
                      TrxID: <strong>{req.transactionId}</strong> · প্রেরক:{' '}
                      {req.senderPhone}
                    </div>
                    {req.note && (
                      <div className="text-xs text-[#3F5247]">
                        নোট: {req.note}
                      </div>
                    )}
                    {req.reviewNote && (
                      <div className="text-[11px] text-[#5B7063]">
                        অ্যাডমিন মন্তব্য: {req.reviewNote}
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={reviewNotes[req.id] ?? ''}
                        onChange={(e) =>
                          setReviewNotes((prev) => ({
                            ...prev,
                            [req.id]: e.target.value
                          }))
                        }
                        placeholder="মন্তব্য (ঐচ্ছিক)"
                        className="px-3 py-1.5 text-xs glass-input rounded-lg w-40 text-[#132219]"
                      />
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setBusyReqId(req.id);
                          setActionFeedback(null);
                          try {
                            await onReviewPaymentRequest(
                              req,
                              true,
                              reviewNotes[req.id] || 'পেমেন্ট যাচাই সম্পন্ন, ১ বছরের ফুল এক্সেস সক্রিয়।',
                              userByUid.get(req.userId)
                            );
                            setActionFeedback({
                              type: 'success',
                              text: `${req.userName}-এর পেমেন্ট অনুমোদিত এবং ১ বছরের প্রো এক্সেস সক্রিয় হয়েছে।`
                            });
                          } catch {
                            setActionFeedback({
                              type: 'error',
                              text: 'পেমেন্ট অনুমোদনে ত্রুটি হয়েছে।'
                            });
                          } finally {
                            setBusyReqId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold btn-3d-emerald rounded-xl cursor-pointer disabled:opacity-60"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>অনুমোদন ও ১ বছর প্রো</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setBusyReqId(req.id);
                          setActionFeedback(null);
                          try {
                            await onReviewPaymentRequest(
                              req,
                              false,
                              reviewNotes[req.id] || 'প্রদত্ত Transaction ID যাচাই করা যায়নি।',
                              userByUid.get(req.userId)
                            );
                            setActionFeedback({
                              type: 'success',
                              text: `${req.userName}-এর পেমেন্ট অনুরোধ প্রত্যাখ্যান করা হয়েছে।`
                            });
                          } catch {
                            setActionFeedback({
                              type: 'error',
                              text: 'পেমেন্ট প্রত্যাখ্যান করতে ত্রুটি হয়েছে।'
                            });
                          } finally {
                            setBusyReqId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl cursor-pointer disabled:opacity-60"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>প্রত্যাখ্যান</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: User Access Control Table */}
      <div className="glass-surface rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/75">
          <div className="flex items-center gap-2.5">
            <span className="glass-3d-icon-well w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#15803D]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#132219]">
                শিক্ষক ও ইউজার এক্সেস নিয়ন্ত্রণ প্যানেল
              </h2>
              <p className="text-xs text-[#3F5247]">
                যেকোনো শিক্ষকের ৭ দিনের ট্রায়াল বাড়ান, ১ বছরের প্রো সক্রিয় করুন, ওভাররাইড দিন, স্থগিত করুন অথবা মডিউল ম্যানেজার করুন।
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#3F5247] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="নাম বা ইমেইল খুঁজুন..."
                className="pl-8 pr-3 py-1.5 text-xs glass-input rounded-xl text-[#132219] w-52"
              />
            </div>
          </div>
        </div>

        {/* User Tier Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 glass-well rounded-xl w-fit">
          {(
            [
              { id: 'all', label: 'সকল' },
              { id: 'free_trial', label: 'ফ্রি ট্রায়াল' },
              { id: 'annual_pro', label: '১ বছর প্রো' },
              { id: 'expired', label: 'মেয়াদোত্তীর্ণ' },
              { id: 'suspended', label: 'স্থগিত' }
            ] as { id: UserFilter; label: string }[]
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setUserFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                userFilter === f.id
                  ? 'btn-3d-glass text-[#132219] font-semibold'
                  : 'text-[#3F5247] hover:text-[#132219]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#3F5247] glass-well rounded-xl">
            এই ফিল্টারে কোনো ইউজার পাওয়া যায়নি।
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const isSelf = u.uid === currentAdminUid;
              const isManager = managerUidSet.has(u.uid);
              const isBusy = busyUid === u.uid;
              const isProActive =
                u.allowFullOverride ||
                (u.planTier === 'annual_pro' &&
                  (u.proExpiresAtMs === 0 || u.proExpiresAtMs > nowMs));
              const isSuspended = u.planTier === 'suspended';

              return (
                <div
                  key={u.uid}
                  className="p-4 rounded-xl glass-well flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-sm font-bold text-[#132219]">
                        {u.displayName}
                      </span>
                      {isSelf && (
                        <span className="font-semibold text-[#15803D]">
                          · সুপার অ্যাডমিন (আপনি)
                        </span>
                      )}
                      {isManager && !isSelf && (
                        <span className="font-semibold text-[#15803D]">
                          · মডিউল ম্যানেজার
                        </span>
                      )}
                      {u.allowFullOverride && (
                        <span className="font-semibold text-[#B45309]">
                          · ফুল ওভাররাইড সক্রিয়
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#3F5247] truncate">
                      {u.email}
                    </div>
                    <div className="text-[11px] font-mono text-[#3F5247] flex flex-wrap items-center gap-2">
                      <span>
                        প্ল্যান:{' '}
                        <strong
                          className={
                            isSuspended
                              ? 'text-[#DC2626]'
                              : isProActive
                              ? 'text-[#15803D]'
                              : 'text-[#132219]'
                          }
                        >
                          {isSuspended
                            ? 'স্থগিত'
                            : isProActive
                            ? '১ বছর প্রো'
                            : '৭ দিনের ফ্রি ট্রায়াল'}
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        মেয়াদ:{' '}
                        {isProActive
                          ? u.proExpiresAtMs > 0
                            ? formatDaysLeft(u.proExpiresAtMs)
                            : 'সীমাহীন ওভাররাইড'
                          : formatDaysLeft(u.trialEndsAtMs)}
                      </span>
                      {u.customNote && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{u.customNote}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!isSelf && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void runUserAction(u, '১ বছরের প্রো এক্সেস সক্রিয়', () =>
                            onUpdateUserAccess(u.uid, {
                              planTier: 'annual_pro',
                              trialStartedAtMs: u.trialStartedAtMs,
                              trialEndsAtMs: u.trialEndsAtMs,
                              proActivatedAtMs: Date.now(),
                              proExpiresAtMs:
                                Date.now() +
                                accessConfig.annualDurationDays * 86400000,
                              allowFullOverride: false,
                              customNote: 'সুপার অ্যাডমিন কর্তৃক ১ বছরের প্রো অনুমোদিত'
                            })
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold btn-3d-emerald rounded-lg cursor-pointer disabled:opacity-60"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>১ বছর প্রো</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          const base = Math.max(Date.now(), u.trialEndsAtMs);
                          void runUserAction(u, '+৭ দিন ট্রায়াল বর্ধিত', () =>
                            onUpdateUserAccess(u.uid, {
                              planTier: 'free_trial',
                              trialStartedAtMs: u.trialStartedAtMs || Date.now(),
                              trialEndsAtMs: base + 7 * 86400000,
                              proActivatedAtMs: 0,
                              proExpiresAtMs: 0,
                              allowFullOverride: false,
                              customNote: 'সুপার অ্যাডমিন কর্তৃক +৭ দিন ট্রায়াল যুক্ত'
                            })
                          );
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer disabled:opacity-60"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>+৭ দিন ট্রায়াল</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void runUserAction(
                            u,
                            u.allowFullOverride
                              ? 'ফুল ওভাররাইড বন্ধ'
                              : 'ফুল ওভাররাইড চালু',
                            () =>
                              onUpdateUserAccess(u.uid, {
                                planTier: u.planTier === 'suspended' ? 'free_trial' : u.planTier,
                                trialStartedAtMs: u.trialStartedAtMs,
                                trialEndsAtMs: u.trialEndsAtMs,
                                proActivatedAtMs: u.proActivatedAtMs,
                                proExpiresAtMs: u.proExpiresAtMs,
                                allowFullOverride: !u.allowFullOverride,
                                customNote: !u.allowFullOverride
                                  ? 'সুপার অ্যাডমিন ফুল ওভাররাইড'
                                  : ''
                              })
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer disabled:opacity-60"
                      >
                        <Unlock className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>
                          {u.allowFullOverride ? 'ওভাররাইড বন্ধ' : 'ফুল ওভাররাইড'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void runUserAction(
                            u,
                            isManager
                              ? 'মডিউল ম্যানেজার অপসারণ'
                              : 'মডিউল ম্যানেজার নিয়োগ',
                            () => onToggleModuleManagerRole(u, !isManager)
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#132219] btn-3d-glass rounded-lg cursor-pointer disabled:opacity-60"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>
                          {isManager ? 'ম্যানেজার সরান' : 'ম্যানেজার করুন'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void runUserAction(
                            u,
                            isSuspended ? 'অ্যাকাউন্ট সচল' : 'অ্যাকাউন্ট স্থগিত',
                            () =>
                              onUpdateUserAccess(u.uid, {
                                planTier: isSuspended ? 'free_trial' : 'suspended',
                                trialStartedAtMs: u.trialStartedAtMs,
                                trialEndsAtMs: u.trialEndsAtMs,
                                proActivatedAtMs: isSuspended ? 0 : u.proActivatedAtMs,
                                proExpiresAtMs: isSuspended ? 0 : u.proExpiresAtMs,
                                allowFullOverride: false,
                                customNote: isSuspended
                                  ? 'সুপার অ্যাডমিন কর্তৃক পুনরায় সচল'
                                  : 'সুপার অ্যাডমিন কর্তৃক স্থগিত'
                              })
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-60 ${
                          isSuspended
                            ? 'btn-3d-glass text-[#15803D]'
                            : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>সচল করুন</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>স্থগিত</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Global Access Control Policy */}
      <form
        onSubmit={handleSavePolicy}
        className="glass-surface rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/75">
          <span className="glass-3d-icon-well w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <Settings2 className="w-4 h-4 text-[#15803D]" />
          </span>
          <div>
            <h2 className="text-base font-bold text-[#132219]">
              প্ল্যাটফর্ম এক্সেস নীতি ও সাবস্ক্রিপশন সেটিংস
            </h2>
            <p className="text-xs text-[#3F5247]">
              ফ্রি ট্রায়ালের সময়সীমা, সীমিত মডিউল সংখ্যা, ফিচার অনুমতি, বার্ষিক প্রো মূল্য ও পেমেন্ট নির্দেশনা নির্ধারণ করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#3F5247]">
              ফ্রি ট্রায়াল মেয়াদ (দিন)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={policyDraft.freeTrialDays}
              onChange={(e) =>
                setPolicyDraft((prev) => ({
                  ...prev,
                  freeTrialDays: Number(e.target.value) || 7
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono glass-input rounded-xl text-[#132219]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#3F5247]">
              ট্রায়ালে উন্মুক্ত মডিউল সংখ্যা
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={policyDraft.freeTrialMaxModules}
              onChange={(e) =>
                setPolicyDraft((prev) => ({
                  ...prev,
                  freeTrialMaxModules: Number(e.target.value) || 3
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono glass-input rounded-xl text-[#132219]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#3F5247]">
              বার্ষিক ফুল এক্সেস ফি (টাকা)
            </label>
            <input
              type="number"
              min={0}
              max={100000}
              value={policyDraft.annualPriceBdt}
              onChange={(e) =>
                setPolicyDraft((prev) => ({
                  ...prev,
                  annualPriceBdt: Number(e.target.value) || 1000
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono glass-input rounded-xl text-[#132219]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#3F5247]">
              প্রো মেয়াদ (দিন)
            </label>
            <input
              type="number"
              min={30}
              max={1095}
              value={policyDraft.annualDurationDays}
              onChange={(e) =>
                setPolicyDraft((prev) => ({
                  ...prev,
                  annualDurationDays: Number(e.target.value) || 365
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono glass-input rounded-xl text-[#132219]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              {
                key: 'freeTrialAllowVideos',
                label: 'ট্রায়ালে ভিডিও প্লে অনুমতি'
              },
              {
                key: 'freeTrialAllowMaterialsDownload',
                label: 'ট্রায়ালে উপকরণ ডাউনলোড অনুমতি'
              },
              {
                key: 'freeTrialAllowQuiz',
                label: 'ট্রায়ালে মূল্যায়ন কুইজ অনুমতি'
              },
              {
                key: 'freeTrialAllowCertificate',
                label: 'ট্রায়ালে CPD সনদ ডাউনলোড'
              }
            ] as {
              key:
                | 'freeTrialAllowVideos'
                | 'freeTrialAllowMaterialsDownload'
                | 'freeTrialAllowQuiz'
                | 'freeTrialAllowCertificate';
              label: string;
            }[]
          ).map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 p-3 rounded-xl glass-well text-xs font-medium text-[#132219] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={policyDraft[item.key]}
                onChange={(e) =>
                  setPolicyDraft((prev) => ({
                    ...prev,
                    [item.key]: e.target.checked
                  }))
                }
                className="w-4 h-4 accent-[#15803D] rounded cursor-pointer"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#3F5247]">
            পেমেন্ট নির্দেশনা (bKash / Nagad / Rocket / Bank নম্বর ও তথ্য)
          </label>
          <textarea
            rows={3}
            value={policyDraft.paymentInstructions}
            onChange={(e) =>
              setPolicyDraft((prev) => ({
                ...prev,
                paymentInstructions: e.target.value
              }))
            }
            className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-[#132219]"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/75">
          <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-[#B91C1C] cursor-pointer">
            <input
              type="checkbox"
              checked={policyDraft.maintenanceMode}
              onChange={(e) =>
                setPolicyDraft((prev) => ({
                  ...prev,
                  maintenanceMode: e.target.checked
                }))
              }
              className="w-4 h-4 accent-[#DC2626] rounded cursor-pointer"
            />
            <ShieldAlert className="w-4 h-4" />
            <span>রক্ষণাবেক্ষণ মোড (চালু থাকলে শুধু সুপার অ্যাডমিন প্রবেশ করতে পারবেন)</span>
          </label>

          <button
            type="submit"
            disabled={policySaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] cursor-pointer disabled:opacity-60"
          >
            {policySaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>এক্সেস নীতি সংরক্ষণ করুন</span>
          </button>
        </div>

        {policyFeedback && (
          <div
            role="status"
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              policyFeedback.type === 'success'
                ? 'bg-[#ECF2ED]/90 border-[#15803D]/30 text-[#14532D]'
                : 'bg-[#FEF2F2]/90 border-[#FECACA] text-[#B91C1C]'
            }`}
          >
            {policyFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{policyFeedback.text}</span>
          </div>
        )}
      </form>
    </div>
  );
};
