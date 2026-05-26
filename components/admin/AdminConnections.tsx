"use client";

import { useEffect, useState } from "react";

type Connection = {
  uuid: string;
  email: string;
  node_ip: string;
  node_port: string;
  last_heartbeat: string;
};

export default function AdminConnections({ dict, regkey }: { dict: any; regkey: string }) {
  const d = dict.connections;
  const [conns, setConns] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/connections`, {
        headers: { REGKEY: regkey },
      });
      const data = await res.json();
      setConns(data.connections || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConns(); }, []);

  const kick = async (uuid: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/user/${uuid}/disconnect`, {
      method: "POST",
      headers: { REGKEY: regkey },
    });
    fetchConns();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{d.title}</h1>
        <button
          onClick={fetchConns}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-80"
          style={{ background: "rgba(124,58,237,0.3)" }}
        >
          ↻ Refresh
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500 animate-pulse">Loading...</div>
        ) : conns.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            {d.empty}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[d.email, d.node, d.port, d.lastSeen, d.disconnect].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conns.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">{c.email}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{c.uuid.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{c.node_ip}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {c.node_port}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {new Date(c.last_heartbeat).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => kick(c.uuid)}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
                    >
                      {d.disconnect}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
