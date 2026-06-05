"use client";

import { useState } from "react";

import { LanguageSwitch } from "@/components/language-switch";

export default function AdminLogin({
  dict,
  lang,
  onLogin,
}: {
  dict: any;
  lang: string;
  onLogin: (key: string) => void;
}) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/admin/stats`,
        {
          headers: { REGKEY: key },
        },
      );

      if (res.ok) {
        onLogin(key);
      } else {
        setError(dict.loginFailed);
      }
    } catch {
      setError(dict.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #060010 0%, #0d001f 100%)",
      }}
    >
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>

      <div
        className="w-full max-w-sm rounded-2xl border border-purple-900/50 p-8"
        style={{
          background: "rgba(20, 0, 40, 0.8)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 40px rgba(139,92,246,0.15)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            <svg fill="none" height="28" viewBox="0 0 24 24" width="28">
              <path
                d="M12 2L3 7v10l9 5 9-5V7L12 2z"
                stroke="white"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
              <path
                d="M12 22V12M3 7l9 5 9-5"
                stroke="white"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">{dict.title}</h1>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            required
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
            id="admin-regkey"
            placeholder={dict.regkeyPlaceholder}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
            type="password"
            value={key}
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(139,92,246,0.3)")
            }
            onChange={(e) => setKey(e.target.value)}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(139,92,246,0.8)")
            }
          />

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            className="w-full rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            disabled={loading}
            id="admin-login-btn"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            type="submit"
          >
            {loading ? "..." : dict.login}
          </button>
        </form>
      </div>
    </div>
  );
}
