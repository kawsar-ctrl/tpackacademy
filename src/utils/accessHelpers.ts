import { User } from 'firebase/auth';
import {
  AccessControlConfig,
  EffectiveAccessState,
  UserAccessRecord
} from '../types/lms';
import { toBengaliDigits } from './lmsHelpers';

export const DEFAULT_ACCESS_CONTROL: AccessControlConfig = {
  freeTrialDays: 7,
  freeTrialMaxModules: 3,
  freeTrialAllowVideos: true,
  freeTrialAllowMaterialsDownload: false,
  freeTrialAllowQuiz: true,
  freeTrialAllowCertificate: false,
  annualPriceBdt: 1000,
  annualDurationDays: 365,
  paymentInstructions:
    'bKash / Nagad Personal: 01700-000000 (Send Money) করে নিচের ফর্মে Transaction ID ও মোবাইল নম্বর জমা দিন। সুপার অ্যাডমিন যাচাই করে সাথে সাথে ১ বছরের ফুল এক্সেস সক্রিয় করবেন।',
  maintenanceMode: false
};

export function sanitizeSafeMediaUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim().slice(0, 1000);
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

export interface ParsedVideoSource {
  kind: 'youtube' | 'vimeo' | 'gdrive' | 'direct' | 'invalid';
  embedOrSrcUrl: string;
}

export function parseVideoSource(rawUrl: string | undefined | null): ParsedVideoSource {
  const safe = sanitizeSafeMediaUrl(rawUrl);
  if (!safe) return { kind: 'invalid', embedOrSrcUrl: '' };

  try {
    const u = new URL(safe);
    const host = u.hostname.toLowerCase();

    // YouTube
    if (host.includes('youtube.com') || host === 'youtu.be') {
      let videoId = '';
      if (host === 'youtu.be') {
        videoId = u.pathname.replace(/^\//, '').split('/')[0] || '';
      } else if (u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.split('/')[2] || '';
      } else if (u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/')[2] || '';
      } else {
        videoId = u.searchParams.get('v') || '';
      }
      if (/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
        return {
          kind: 'youtube',
          embedOrSrcUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
        };
      }
    }

    // Vimeo
    if (host.includes('vimeo.com')) {
      const match = u.pathname.match(/\/(\d{5,15})/);
      if (match) {
        return {
          kind: 'vimeo',
          embedOrSrcUrl: `https://player.vimeo.com/video/${match[1]}`
        };
      }
    }

    // Google Drive
    if (host.includes('drive.google.com')) {
      const fileMatch = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      const idParam = u.searchParams.get('id');
      const driveId = fileMatch?.[1] || idParam || '';
      if (driveId && /^[a-zA-Z0-9_-]{10,80}$/.test(driveId)) {
        return {
          kind: 'gdrive',
          embedOrSrcUrl: `https://drive.google.com/file/d/${driveId}/preview`
        };
      }
    }

    return { kind: 'direct', embedOrSrcUrl: safe };
  } catch {
    return { kind: 'invalid', embedOrSrcUrl: '' };
  }
}

export function computeEffectiveAccess(params: {
  authUser: User | null;
  isSuperAdmin: boolean;
  isDelegatedModuleManager: boolean;
  userAccess: UserAccessRecord | null;
  accessConfig: AccessControlConfig;
  nowMs?: number;
}): EffectiveAccessState {
  const {
    authUser,
    isSuperAdmin,
    isDelegatedModuleManager,
    userAccess,
    accessConfig,
    nowMs = Date.now()
  } = params;

  const isVerifiedSignedIn = Boolean(authUser && authUser.emailVerified);

  if (!isVerifiedSignedIn) {
    return {
      status: 'guest',
      isSignedIn: false,
      isSuperAdmin: false,
      isModuleManager: false,
      isProActive: false,
      isTrialActive: false,
      daysRemaining: 0,
      allowedModuleCount: 0,
      canAccessFeatures: false,
      canPlayVideos: false,
      canDownloadMaterials: false,
      canTakeQuiz: false,
      canGetCertificate: false,
      canManageModules: false,
      canControlPlatform: false,
      statusLabelBn: 'লগইন প্রয়োজন',
      statusDetailBn: `লগইন করলে ${toBengaliDigits(accessConfig.freeTrialDays)} দিনের ফ্রি লিমিটেড এক্সেস পাবেন`
    };
  }

  if (isSuperAdmin) {
    return {
      status: 'super_admin',
      isSignedIn: true,
      isSuperAdmin: true,
      isModuleManager: true,
      isProActive: true,
      isTrialActive: false,
      daysRemaining: 365,
      allowedModuleCount: Number.POSITIVE_INFINITY,
      canAccessFeatures: true,
      canPlayVideos: true,
      canDownloadMaterials: true,
      canTakeQuiz: true,
      canGetCertificate: true,
      canManageModules: true,
      canControlPlatform: true,
      statusLabelBn: 'সুপার অ্যাডমিন',
      statusDetailBn: 'সম্পূর্ণ প্ল্যাটফর্ম, মডিউল ও এক্সেস কন্ট্রোল'
    };
  }

  if (accessConfig.maintenanceMode) {
    return {
      status: 'maintenance',
      isSignedIn: true,
      isSuperAdmin: false,
      isModuleManager: false,
      isProActive: false,
      isTrialActive: false,
      daysRemaining: 0,
      allowedModuleCount: 0,
      canAccessFeatures: false,
      canPlayVideos: false,
      canDownloadMaterials: false,
      canTakeQuiz: false,
      canGetCertificate: false,
      canManageModules: false,
      canControlPlatform: false,
      statusLabelBn: 'রক্ষণাবেক্ষণ চলছে',
      statusDetailBn: 'সুপার অ্যাডমিন কর্তৃক সাময়িক রক্ষণাবেক্ষণ চালু রয়েছে।'
    };
  }

  if (userAccess?.planTier === 'suspended') {
    return {
      status: 'suspended',
      isSignedIn: true,
      isSuperAdmin: false,
      isModuleManager: false,
      isProActive: false,
      isTrialActive: false,
      daysRemaining: 0,
      allowedModuleCount: 0,
      canAccessFeatures: false,
      canPlayVideos: false,
      canDownloadMaterials: false,
      canTakeQuiz: false,
      canGetCertificate: false,
      canManageModules: false,
      canControlPlatform: false,
      statusLabelBn: 'এক্সেস স্থগিত',
      statusDetailBn:
        userAccess.customNote ||
        'আপনার অ্যাকাউন্টের এক্সেস সুপার অ্যাডমিন কর্তৃক সাময়িকভাবে স্থগিত করা হয়েছে।'
    };
  }

  if (isDelegatedModuleManager) {
    return {
      status: 'module_manager',
      isSignedIn: true,
      isSuperAdmin: false,
      isModuleManager: true,
      isProActive: true,
      isTrialActive: false,
      daysRemaining: 365,
      allowedModuleCount: Number.POSITIVE_INFINITY,
      canAccessFeatures: true,
      canPlayVideos: true,
      canDownloadMaterials: true,
      canTakeQuiz: true,
      canGetCertificate: true,
      canManageModules: true,
      canControlPlatform: false,
      statusLabelBn: 'মডিউল ম্যানেজার',
      statusDetailBn: 'সব মডিউল এক্সেস ও মডিউল এডিট সুবিধা সক্রিয়'
    };
  }

  const hasFullOverride = Boolean(userAccess?.allowFullOverride);
  const proActive =
    hasFullOverride ||
    (userAccess?.planTier === 'annual_pro' &&
      (userAccess.proExpiresAtMs === 0 || userAccess.proExpiresAtMs > nowMs));

  if (proActive) {
    const msLeft =
      userAccess && userAccess.proExpiresAtMs > nowMs
        ? userAccess.proExpiresAtMs - nowMs
        : accessConfig.annualDurationDays * 86400000;
    const daysRemaining = Math.max(1, Math.ceil(msLeft / 86400000));
    return {
      status: 'annual_pro',
      isSignedIn: true,
      isSuperAdmin: false,
      isModuleManager: false,
      isProActive: true,
      isTrialActive: false,
      daysRemaining,
      allowedModuleCount: Number.POSITIVE_INFINITY,
      canAccessFeatures: true,
      canPlayVideos: true,
      canDownloadMaterials: true,
      canTakeQuiz: true,
      canGetCertificate: true,
      canManageModules: false,
      canControlPlatform: false,
      statusLabelBn: `প্রো প্ল্যান (${toBengaliDigits(daysRemaining)} দিন বাকি)`,
      statusDetailBn: '১ বছরের পূর্ণাঙ্গ এক্সেস — সব মডিউল, ভিডিও ও সনদ আনলকড'
    };
  }

  // Evaluate 7-day free trial (if record is still initializing, optimistically grant initial trial window)
  const fallbackTrialEnd = nowMs + accessConfig.freeTrialDays * 86400000;
  const trialEndsAt = userAccess ? userAccess.trialEndsAtMs : fallbackTrialEnd;
  const msLeft = trialEndsAt - nowMs;

  if (msLeft > 0) {
    const daysRemaining = Math.max(1, Math.ceil(msLeft / 86400000));
    return {
      status: 'free_trial',
      isSignedIn: true,
      isSuperAdmin: false,
      isModuleManager: false,
      isProActive: false,
      isTrialActive: true,
      daysRemaining,
      allowedModuleCount: Math.max(1, accessConfig.freeTrialMaxModules),
      canAccessFeatures: true,
      canPlayVideos: accessConfig.freeTrialAllowVideos,
      canDownloadMaterials: accessConfig.freeTrialAllowMaterialsDownload,
      canTakeQuiz: accessConfig.freeTrialAllowQuiz,
      canGetCertificate: accessConfig.freeTrialAllowCertificate,
      canManageModules: false,
      canControlPlatform: false,
      statusLabelBn: `ফ্রি ট্রায়াল (${toBengaliDigits(daysRemaining)} দিন বাকি)`,
      statusDetailBn: `প্রথম ${toBengaliDigits(accessConfig.freeTrialMaxModules)}টি মডিউল উন্মুক্ত · ফুল এক্সেস ৳${toBengaliDigits(accessConfig.annualPriceBdt)}/বছর`
    };
  }

  return {
    status: 'trial_expired',
    isSignedIn: true,
    isSuperAdmin: false,
    isModuleManager: false,
    isProActive: false,
    isTrialActive: false,
    daysRemaining: 0,
    allowedModuleCount: 0,
    canAccessFeatures: false,
    canPlayVideos: false,
    canDownloadMaterials: false,
    canTakeQuiz: false,
    canGetCertificate: false,
    canManageModules: false,
    canControlPlatform: false,
    statusLabelBn: 'ফ্রি ট্রায়াল শেষ',
    statusDetailBn: `১ বছরের ফুল এক্সেস পেতে ৳${toBengaliDigits(accessConfig.annualPriceBdt)} প্যাকেজ সক্রিয় করুন`
  };
}
