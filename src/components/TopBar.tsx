import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Leaf, LogIn, Menu, X } from 'lucide-react';
import { NavTab } from '../types/lms';

interface TopBarProps {
  activeTab: NavTab;
  authUser: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  onNavigate: (tab: NavTab) => void;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'courses', label: 'কোর্সসমূহ' },
  { id: 'materials', label: 'প্রশিক্ষণ উপকরণ' },
  { id: 'quiz', label: 'কুইজ' },
  { id: 'calendar', label: 'প্রশিক্ষণ ক্যালেন্ডার' },
  { id: 'achievements', label: 'অর্জন ও ব্যাজ' },
  { id: 'certificate', label: 'সার্টিফিকেট' },
  { id: 'admin', label: 'অ্যাডমিন' }
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  authUser,
  authLoading,
  isAdmin,
  onNavigate,
  onOpenProfile,
  onOpenLogin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleNavItems = isAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.id !== 'admin');

  const handleNavClick = (tab: NavTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  const shortDisplayName = authUser?.displayName
    ? authUser.displayName.split(' ')[0]
    : 'অ্যাকাউন্ট';

  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-5">
        {/* Zone 1: Brand Title (single line, no badges) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('courses');
          }}
          className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#132219] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] rounded-xl"
        >
          <span className="glass-3d-icon-well w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5 text-[#15803D]" aria-hidden="true" />
          </span>
          <span className="font-display tracking-tight">TPACK Academy</span>
        </a>

        {/* Zone 2: Navigation links */}
        <nav
          aria-label="প্রধান নেভিগেশন"
          className="hidden md:flex items-center gap-3 lg:gap-5 text-[13px] lg:text-sm font-medium"
        >
          {visibleNavItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'courses' && activeTab === 'classroom');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`py-1.5 whitespace-nowrap shrink-0 transition-all duration-150 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] rounded-xs cursor-pointer ${
                  isActive
                    ? 'text-[#15803D] border-[#15803D] font-semibold drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]'
                    : 'text-[#3F5247] border-transparent hover:text-[#132219] hover:border-[#9EB5A7]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Login + Profile Actions + Mobile toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenLogin}
            disabled={authLoading}
            className="hidden sm:inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#15803D] cursor-pointer min-h-[40px] disabled:opacity-60"
          >
            {authUser ? (
              <>
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName ?? 'শিক্ষক'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-white/90 shadow-xs"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[#15803D] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    {shortDisplayName.charAt(0)}
                  </span>
                )}
                <span className="max-w-[96px] truncate">{shortDisplayName}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                <span>লগইন</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold btn-3d-emerald rounded-xl whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#15803D] cursor-pointer min-h-[40px]"
          >
            শিক্ষক প্রোফাইল
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl btn-3d-glass text-[#132219] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/75 bg-white/85 backdrop-blur-xl px-4 py-3 space-y-1 shadow-lg">
          {visibleNavItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === 'courses' && activeTab === 'classroom');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-white/90 text-[#15803D] font-semibold shadow-xs border border-white'
                    : 'text-[#3F5247] hover:bg-white/60 hover:text-[#132219]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-white/75 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLogin();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#132219] btn-3d-glass rounded-xl min-h-[44px] cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
              <span>{authUser ? `${shortDisplayName} · অ্যাকাউন্ট` : 'Google দিয়ে লগইন'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="w-full px-4 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl min-h-[44px] cursor-pointer"
            >
              শিক্ষক প্রোফাইল
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
