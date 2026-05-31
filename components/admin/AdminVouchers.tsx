"use client";

import { useEffect, useState, useCallback } from "react";

type Voucher = {
  ID: number;
  Code: string;
  Type: string;
  Description: string;
  ExpiresAt: string;
  IsUsed: boolean;
  Amount: number;
  PlanName: string;
  PlanDuration: number;
};

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "#150028", border: "1px solid rgba(139,92,246,0.3)" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = "rounded-lg px-3 py-2 text-sm text-white w-full outline-none";
const inputStyle = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" };

export default function AdminVouchers({ dict, regkey }: { dict: any; regkey: string }) {
  const d = dict.vouchers;
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filter, setFilter] = useState<"" | "false" | "true">("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "plan",
    description: "",
    expires_at: "",
    amount: 0,
    plan_name: "Premium plan",
    plan_duration: 1,
  });

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?used=${filter}` : "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/vouchers${params}`, {
        headers: { REGKEY: regkey },
      });
      const data = await res.json();
      setVouchers(data.vouchers || []);
    } finally {
      setLoading(false);
    }
  }, [regkey, filter]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const revoke = async (code: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/voucher/${code}`, {
      method: "DELETE",
      headers: { REGKEY: regkey },
    });
    fetchVouchers();
  };

  const createVoucher = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/generatevoucher`, {
      method: "POST",
      headers: { REGKEY: regkey, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    fetchVouchers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{d.title}</h1>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
        >
          + {d.create}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["", "false", "true"] as const).map((f) => {
          const label = f === "" ? d.filterAll : f === "false" ? d.filterActive : d.filterUsed;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === f ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)",
                color: filter === f ? "#a78bfa" : "rgba(255,255,255,0.5)",
                border: filter === f ? "1px solid rgba(124,58,237,0.4)" : "1px solid transparent",
              }}>
              {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500 animate-pulse">Loading...</div>
        ) : vouchers.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{d.empty}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {[d.code, d.type, d.description, d.expires, d.status, d.revoke].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.ID} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-white">{v.Code}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: v.Type === "plan" ? "rgba(124,58,237,0.2)" : "rgba(251,191,36,0.2)",
                        color: v.Type === "plan" ? "#a78bfa" : "#fbbf24",
                      }}>
                      {v.Type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {v.Description || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="text-white text-sm">
                      {new Date(v.ExpiresAt).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: v.IsUsed ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)",
                        color: v.IsUsed ? "#f87171" : "#34d399",
                      }}>
                      {v.IsUsed ? d.used : d.active}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!v.IsUsed && (
                      <button
                        onClick={() => revoke(v.Code)}
                        className="px-3 py-1 rounded-lg text-xs font-medium hover:opacity-80 transition-all"
                        style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
                      >
                        {d.revoke}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {creating && (
        <Modal title={dict.createVoucherModal.title} onClose={() => setCreating(false)}>
          <div className="flex flex-col gap-3">
            <input className={inputCls} style={inputStyle} placeholder={d.code}
              value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <select className={inputCls} style={inputStyle}
              value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="plan">plan</option>
              <option value="balance">balance</option>
            </select>
            <input className={inputCls} style={inputStyle} placeholder={d.description}
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <input className={inputCls} style={inputStyle} type="datetime-local"
              value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: new Date(e.target.value).toISOString() }))} />
            {form.type === "plan" ? (
              <>
                <input className={inputCls} style={inputStyle} placeholder={d.planName}
                  value={form.plan_name} onChange={(e) => setForm((f) => ({ ...f, plan_name: e.target.value }))} />
                <input className={inputCls} style={inputStyle} type="number" min={1} placeholder={d.planDuration}
                  value={form.plan_duration} onChange={(e) => setForm((f) => ({ ...f, plan_duration: Number(e.target.value) }))} />
              </>
            ) : (
              <input className={inputCls} style={inputStyle} type="number" placeholder={d.amount}
                value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400">
                {dict.createVoucherModal.cancel}
              </button>
              <button onClick={createVoucher}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                {dict.createVoucherModal.confirm}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
