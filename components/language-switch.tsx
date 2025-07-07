"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export const LanguageSwitch = () => {
  const pathname = usePathname(); // TODO: bug 
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLang = pathname.split('/')[1];

  const switchLanguage = (lang: string) => {
    if (lang !== currentLang) {
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
      
      const newPath = pathname.replace(`/${currentLang}`, `/${lang}`);
      router.push(newPath);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span>{currentLang === 'en' ? 'English' : '中文'}</span>
        <svg
          className={`ml-1 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 flex flex-col" role="menu" aria-orientation="vertical">
            <button
              onClick={() => switchLanguage('en')}
              className={`w-full text-left px-4 py-2 text-sm ${
                currentLang === 'en' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              role="menuitem"
            >
              English
            </button>
            <button
              onClick={() => switchLanguage('zh')}
              className={`w-full text-left px-4 py-2 text-sm ${
                currentLang === 'zh' 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              role="menuitem"
            >
              中文
            </button>
          </div>
        </div>
      )}
    </div>
  );
};