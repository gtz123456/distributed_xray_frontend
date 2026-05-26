"use client";

import { useEffect, useState } from "react";

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(2) + " TB";
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + " GB";
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + " MB";
  return bytes + " B";
}

export default function AdminStats({ dict, regkey }: { dict: any; regkey: string }) {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/stats`, {
      headers: { REGKEY: regkey },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setError("Failed to load stats"));
  }, [regkey]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!stats) return <p className="text-gray-400 animate-pulse">Loading...</p>;

  const d = dict.stats;
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{dict.nav.stats}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label={d.totalUsers} value={stats.total_users} color="#a78bfa" />
        <StatCard label={d.verifiedUsers} value={stats.verified_users} color="#60a5fa" />
        <StatCard label={d.premiumUsers} value={stats.premium_users} color="#34d399" />
        <StatCard label={d.onlineUsers} value={stats.online_users} color="#f59e0b" />
        <StatCard
          label={d.totalRevenue}
          value={`$${((stats.total_revenue_cents || 0) / 100).toFixed(2)}`}
          color="#fb7185"
        />
        <StatCard
          label={d.totalTraffic}
          value={formatBytes(stats.total_traffic_used_bytes || 0)}
          color="#c084fc"
        />
      </div>
    </div>
  );
}
