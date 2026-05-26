"use client";

import { Tab } from "./AdminPanel";
import { LanguageSwitch } from "@/components/language-switch";

const NAV_ITEMS: { key: Tab; icon: React.ReactNode }[] = [
  {
    key: "stats",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="12" width="4" height="10" rx="1" />
        <rect x="9" y="7" width="4" height="15" rx="1" />
        <rect x="16" y="2" width="4" height="20" rx="1" />
      </svg>
    ),
  },
  {
    key: "users",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21v-1a7 7 0 0 1 14 0v1" />
        <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "connections",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="5" cy="12" r="3" />
        <circle cx="19" cy="5" r="3" />
        <circle cx="19" cy="19" r="3" />
        <path d="M8 12h8M16 6.5l-8 4M16 17.5l-8-4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "nodes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "vouchers",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20M6 14h2M10 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function AdminSidebar({
  dict,
  activeTab,
  setActiveTab,
  onLogout,
  lang,
}: {
  dict: any;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  lang: string;
}) {
  return (
    <aside
      className="hidden md:flex flex-col w-60 min-h-screen py-6 px-4 gap-1"
      style={{
        background: "rgba(10, 0, 25, 0.9)",
        borderRight: "1px solid rgba(139,92,246,0.15)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-bold text-white text-sm">{dict.title}</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ key, icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              id={`admin-nav-${key}`}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: active ? "rgba(124,58,237,0.2)" : "transparent",
                color: active ? "#a78bfa" : "rgba(255,255,255,0.5)",
                border: active ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
              }}
            >
              {icon}
              {dict.nav[key]}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-2 pt-4 border-t border-purple-900/20">
        <LanguageSwitch />
        <button
          id="admin-logout-btn"
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
          </svg>
          {dict.logout}
        </button>
      </div>
    </aside>
  );
}
