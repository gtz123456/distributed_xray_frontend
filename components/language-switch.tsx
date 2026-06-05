"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export const LanguageSwitch = ({ lang }: { lang?: string }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLang = lang || pathname.split("/")[1];

  const switchLanguage = (lang: string) => {
    if (lang !== currentLang) {
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;

      const newPath = pathname.replace(`/${currentLang}`, `/${lang}`);

      window.location.href = newPath; // Force full page reload to avoid client-side crashes
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        className="flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentLang === "en" ? "English" : "中文"}</span>
        <svg
          className={`ml-1 h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            fillRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 z-50">
          <div
            aria-orientation="vertical"
            className="py-1 flex flex-col"
            role="menu"
          >
            <button
              className={`w-full text-left px-4 py-2 text-sm ${
                currentLang === "en"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              role="menuitem"
              onClick={() => switchLanguage("en")}
            >
              English
            </button>
            <button
              className={`w-full text-left px-4 py-2 text-sm ${
                currentLang === "zh"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              role="menuitem"
              onClick={() => switchLanguage("zh")}
            >
              中文
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
