"use client";

import { useEffect, useState } from "react";

import TerminalModal from "./TerminalModal";

type Node = {
  service_id: string;
  public_ip: string;
  description: string;
  tags: string[];
};

export default function AdminNodes({
  dict,
  regkey,
}: {
  dict: any;
  regkey: string;
}) {
  const d = dict.nodes;
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [shellNode, setShellNode] = useState<string | null>(null);
  const [openTagsNode, setOpenTagsNode] = useState<string | null>(null);

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
        className="rounded-2xl overflow-visible"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500 animate-pulse">
            Loading...
          </div>
        ) : nodes.length === 0 ? (
          <div
            className="py-12 text-center text-sm"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {d.empty}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[d.ip, d.description, d.tags, d.serviceId, "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr
                  key={n.service_id}
                  className="hover:bg-white/[0.02] transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white font-medium text-sm">
                        {n.public_ip}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 text-sm"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {n.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {n.tags && n.tags.length > 0 ? (
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                        <div
                          className="px-2 py-1 rounded-md text-xs cursor-pointer flex items-center gap-1 transition-colors hover:bg-blue-500/30"
                          style={{
                            background: "rgba(59,130,246,0.2)",
                            color: "#60a5fa",
                          }}
                          onClick={() =>
                            setOpenTagsNode(
                              openTagsNode === n.service_id
                                ? null
                                : n.service_id,
                            )
                          }
                        >
                          {n.tags.length} Unlocked{" "}
                          <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>
                            ▼
                          </span>
                        </div>
                        {openTagsNode === n.service_id && (
                          <>
                            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenTagsNode(null)}
                            />
                            <div
                              className="absolute left-0 top-full mt-2 flex flex-col gap-1.5 p-2 rounded-lg shadow-xl z-50 min-w-[140px] max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
                              style={{
                                background: "#111827",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            >
                              {[...n.tags]
                                .sort((a, b) => a.localeCompare(b))
                                .map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 rounded text-xs text-center border border-white/5"
                                    style={{
                                      background: "rgba(255,255,255,0.03)",
                                      color: "rgba(255,255,255,0.8)",
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-xs font-mono"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {n.service_id}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs font-medium text-white transition-colors"
                      onClick={() => setShellNode(n.service_id)}
                    >
                      Shell
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {shellNode && (
        <TerminalModal
          regkey={regkey}
          serviceId={shellNode}
          onClose={() => setShellNode(null)}
        />
      )}
    </div>
  );
}
