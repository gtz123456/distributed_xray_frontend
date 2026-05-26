"use client";

import { useEffect, useState } from "react";

type Node = {
  service_id: string;
  public_ip: string;
  description: string;
  tags: string[];
};

export default function AdminNodes({ dict, regkey }: { dict: any; regkey: string }) {
  const d = dict.nodes;
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/nodes`, {
      headers: { REGKEY: regkey },
    })
      .then((r) => r.json())
      .then((data) => setNodes(data.nodes || []))
      .finally(() => setLoading(false));
  }, [regkey]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{d.title}</h1>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500 animate-pulse">Loading...</div>
        ) : nodes.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{d.empty}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[d.ip, d.description, d.tags, d.serviceId].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.service_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white font-medium text-sm">{n.public_ip}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {n.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(n.tags || []).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {n.service_id}
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
