"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

type UserConn = {
  uuid: string;
  email: string;
  port: number;
  up_bytes: number;
  down_bytes: number;
};

type ClusterNode = {
  service_id: string;
  public_ip: string;
  description?: string;
  tags?: string[];
  online: boolean;
  cpu_percent: number;
  mem_used: number;
  mem_total: number;
  disk_used: number;
  disk_total: number;
  bytes_up_per_sec: number;
  bytes_down_per_sec: number;
  traffic_used_bytes: number;
  traffic_limit_bytes: number;
  connection_count: number;
  connections: UserConn[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes < 1024 ** 4) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${(bytes / 1024 ** 4).toFixed(1)} TB`;
}

function formatSpeed(bytesPerSec: number): string {
  return formatBytes(bytesPerSec) + "/s";
}

function pct(used: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetricBar({
  label,
  value,
  max,
  unit,
  color,
  dangerThreshold = 80,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  dangerThreshold?: number;
}) {
  const p = pct(value, max);
  const isDanger = p > dangerThreshold;
  const barColor = isDanger
    ? "linear-gradient(90deg,#ef4444,#b91c1c)"
    : color || "linear-gradient(90deg,#7c3aed,#2563eb)";

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          {label}
        </span>
        <span className="text-xs font-medium" style={{ color: isDanger ? "#f87171" : "rgba(255,255,255,0.7)" }}>
          {unit ?? `${p}%`}
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 5, background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${p}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  gradient,
  icon,
}: {
  label: string;
  value: string;
  gradient: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl p-4 flex items-center gap-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
          {label}
        </div>
        <div className="text-lg font-bold text-white truncate">{value}</div>
      </div>
    </div>
  );
}

function NodeCard({ node, dict }: { node: ClusterNode; dict: any }) {
  const [expanded, setExpanded] = useState(false);
  const d = dict;
  const trafficPct = pct(node.traffic_used_bytes, node.traffic_limit_bytes);
  const trafficDanger = trafficPct > 80;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${node.online ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-base">{node.public_ip}</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={
                node.online
                  ? { background: "rgba(34,197,94,0.15)", color: "#4ade80" }
                  : { background: "rgba(239,68,68,0.15)", color: "#f87171" }
              }
            >
              {node.online ? d.online : d.offline}
            </span>
            {(node.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}
              >
                {tag}
              </span>
            ))}
          </div>
          {node.description && (
            <p className="text-xs mt-1 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
              {node.description}
            </p>
          )}
        </div>
        {/* Connections badge */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{d.connections}</div>
          <div className="text-lg font-bold" style={{ color: "#a78bfa" }}>{node.connection_count || 0}</div>
        </div>
      </div>

      {/* System metrics */}
      <div className="px-5 pb-3 flex flex-col gap-2.5">
        <MetricBar
          label={d.cpu}
          value={node.cpu_percent}
          max={100}
          dangerThreshold={80}
        />
        <MetricBar
          label={d.memory}
          value={node.mem_used}
          max={node.mem_total}
          unit={`${formatBytes(node.mem_used)} / ${formatBytes(node.mem_total)} (${pct(node.mem_used, node.mem_total)}%)`}
          color="linear-gradient(90deg,#7c3aed,#06b6d4)"
          dangerThreshold={85}
        />
        <MetricBar
          label={d.disk}
          value={node.disk_used}
          max={node.disk_total}
          unit={`${formatBytes(node.disk_used)} / ${formatBytes(node.disk_total)} (${pct(node.disk_used, node.disk_total)}%)`}
          color="linear-gradient(90deg,#2563eb,#0ea5e9)"
          dangerThreshold={90}
        />
      </div>

      {/* Traffic bar */}
      {node.traffic_limit_bytes > 0 && (
        <div className="px-5 mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{d.traffic}</span>
            <span
              className="text-xs font-medium"
              style={{ color: trafficDanger ? "#f87171" : "rgba(255,255,255,0.7)" }}
            >
              {formatBytes(node.traffic_used_bytes)} / {formatBytes(node.traffic_limit_bytes)} ({trafficPct}%)
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 5, background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${trafficPct}%`,
                background: trafficDanger
                  ? "linear-gradient(90deg,#ef4444,#b91c1c)"
                  : "linear-gradient(90deg,#7c3aed,#ec4899)",
              }}
            />
          </div>
        </div>
      )}

      {/* Speed row */}
      <div
        className="mx-5 mb-3 rounded-xl px-4 py-2.5 flex gap-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs" style={{ color: "#4ade80" }}>{d.speedUp}</span>
          <span className="text-sm font-semibold text-white">{formatSpeed(node.bytes_up_per_sec || 0)}</span>
        </div>
        <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs" style={{ color: "#60a5fa" }}>{d.speedDown}</span>
          <span className="text-sm font-semibold text-white">{formatSpeed(node.bytes_down_per_sec || 0)}</span>
        </div>
      </div>

      {/* User connections toggle */}
      {node.connections && node.connections.length > 0 && (
        <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium transition-colors hover:bg-white/[0.02]"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onClick={() => setExpanded((v) => !v)}
          >
            <span>
              {d.connections} ({node.connections.length})
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-200"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {expanded && (
            <div className="overflow-x-auto pb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {[d.uuid, d.email, d.port, d.upBytes, d.downBytes].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {node.connections.map((u) => (
                    <tr
                      key={u.uuid}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="px-5 py-2 font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {u.uuid.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {u.email}
                      </td>
                      <td className="px-5 py-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {u.port}
                      </td>
                      <td className="px-5 py-2" style={{ color: "#4ade80" }}>
                        {formatBytes(u.up_bytes)}
                      </td>
                      <td className="px-5 py-2" style={{ color: "#60a5fa" }}>
                        {formatBytes(u.down_bytes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminCluster({ dict, regkey }: { dict: any; regkey: string }) {
  const d = dict.cluster;

  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/admin/cluster`,
          { headers: { REGKEY: regkey } }
        );
        const data = await res.json();
        setNodes(data.nodes || []);
        setLastUpdated(new Date());
      } catch {
        // keep stale data on error
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [regkey]
  );

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchData(), 10_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  // ── Summaries ──────────────────────────────────────────────────────────
  const onlineNodes = nodes.filter((n) => n.online);
  const totalConns = nodes.reduce((s, n) => s + (n.connection_count || 0), 0);
  const totalUp = nodes.reduce((s, n) => s + (n.bytes_up_per_sec || 0), 0);
  const totalDown = nodes.reduce((s, n) => s + (n.bytes_down_per_sec || 0), 0);

  const formatTime = (date: Date | null) => {
    if (!date) return "—";
    return date.toLocaleTimeString();
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{d.title}</h1>
        <div className="flex items-center gap-3">
          {/* Last updated */}
          {lastUpdated && (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {d.lastUpdated}: {formatTime(lastUpdated)}
            </span>
          )}
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: autoRefresh ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${autoRefresh ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: autoRefresh ? "#a78bfa" : "rgba(255,255,255,0.5)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: autoRefresh ? "#a78bfa" : "rgba(255,255,255,0.3)" }}
            />
            {d.autoRefresh}
          </button>
          {/* Manual refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={refreshing ? "animate-spin" : ""}
            >
              <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {refreshing && d.refreshing}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SummaryCard
          label={d.nodeCount}
          value={`${onlineNodes.length} / ${nodes.length}`}
          gradient="linear-gradient(135deg,#7c3aed,#4f46e5)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <circle cx="12" cy="5" r="3"/>
              <circle cx="5" cy="19" r="3"/>
              <circle cx="19" cy="19" r="3"/>
              <path d="M12 8v4M12 12l-5 5M12 12l5 5" strokeLinecap="round"/>
            </svg>
          }
        />
        <SummaryCard
          label={d.totalConns}
          value={String(totalConns)}
          gradient="linear-gradient(135deg,#2563eb,#0ea5e9)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
            </svg>
          }
        />
        <SummaryCard
          label={d.totalUp}
          value={formatSpeed(totalUp)}
          gradient="linear-gradient(135deg,#059669,#10b981)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <SummaryCard
          label={d.totalDown}
          value={formatSpeed(totalDown)}
          gradient="linear-gradient(135deg,#d97706,#f59e0b)"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
      </div>

      {/* Node cards grid */}
      {loading ? (
        <div className="py-20 text-center text-sm animate-pulse" style={{ color: "rgba(255,255,255,0.3)" }}>
          Loading...
        </div>
      ) : nodes.length === 0 ? (
        <div
          className="py-20 text-center text-sm rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {d.empty}
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 500px), 1fr))" }}
        >
          {nodes.map((node) => (
            <NodeCard key={node.service_id} node={node} dict={d} />
          ))}
        </div>
      )}
    </div>
  );
}
