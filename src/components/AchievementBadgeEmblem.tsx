import React from 'react';
import {
  Award,
  BookOpen,
  CalendarCheck,
  Compass,
  Cpu,
  Lock,
  Target,
  Trophy,
  Users
} from 'lucide-react';
import { AchievementIconKey, AchievementTier } from '../types/lms';

interface AchievementBadgeEmblemProps {
  iconKey: AchievementIconKey;
  tier: AchievementTier;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ICONS: Record<AchievementIconKey, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  compass: Compass,
  users: Users,
  target: Target,
  book: BookOpen,
  award: Award,
  trophy: Trophy,
  calendar: CalendarCheck
};

export const AchievementBadgeEmblem: React.FC<AchievementBadgeEmblemProps> = ({
  iconKey,
  tier,
  unlocked,
  size = 'md'
}) => {
  const Icon = ICONS[iconKey] ?? Award;

  const dimensions =
    size === 'sm'
      ? 'w-11 h-11'
      : size === 'lg'
      ? 'w-20 h-20'
      : 'w-16 h-16';

  const iconSize =
    size === 'sm'
      ? 'w-4 h-4'
      : size === 'lg'
      ? 'w-7 h-7'
      : 'w-6 h-6';

  const palette = !unlocked
    ? {
        outerFill: '#F1F5F2',
        ringStroke: '#CBD5CE',
        dashStroke: '#9EB0A4',
        coreFill: '#E5ECE7',
        iconColor: 'text-[#6A7E71]'
      }
    : tier === 'gold'
    ? {
        outerFill: '#FEF3C7',
        ringStroke: '#B45309',
        dashStroke: '#D97706',
        coreFill: '#B45309',
        iconColor: 'text-white'
      }
    : tier === 'forest'
    ? {
        outerFill: '#DCFCE7',
        ringStroke: '#14532D',
        dashStroke: '#15803D',
        coreFill: '#14532D',
        iconColor: 'text-white'
      }
    : {
        outerFill: '#ECF2ED',
        ringStroke: '#15803D',
        dashStroke: '#22C55E',
        coreFill: '#15803D',
        iconColor: 'text-white'
      };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${dimensions}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 80 80"
        className="w-full h-full block"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="40" cy="40" r="38" fill={palette.outerFill} />
        <circle
          cx="40"
          cy="40"
          r="34"
          stroke={palette.ringStroke}
          strokeWidth="2"
        />
        <circle
          cx="40"
          cy="40"
          r="29"
          stroke={palette.dashStroke}
          strokeWidth="1.25"
          strokeDasharray={unlocked ? '3 3' : '4 4'}
        />
        <circle cx="40" cy="40" r="22" fill={palette.coreFill} />
      </svg>

      <div
        className={`absolute inset-0 flex items-center justify-center ${palette.iconColor}`}
      >
        <Icon className={iconSize} />
      </div>

      {!unlocked && size !== 'sm' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white border border-[#DDE5DF] flex items-center justify-center text-[#6A7E71]">
          <Lock className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
};
