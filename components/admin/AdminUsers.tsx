"use client";

import { useEffect, useState, useCallback } from "react";

type User = {
  id: number;
  email: string;
  uuid: string;
  plan: string;
  traffic_used: number;
  traffic_limit: number;
  balance: number;
  plan_end: string;
  is_verified: boolean;
};

function formatBytes(b: number) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
  if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
  return b + " B";
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "#150028", border: "1px solid rgba(139,92,246,0.3)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminUsers({ dict, regkey }: { dict: any; regkey: string }) {
  const d = dict.users;
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals
  const [setPlanUser, setSetPlanUser] = useState<User | null>(null);
  const [balanceUser, setBalanceUser] = useState<User | null>(null);
  const [setPlanVal, setSetPlanVal] = useState({ plan: "Premium plan", action: "add", delta_amount: 1, delta_unit: "months", end_date: new Date().toISOString().split('T')[0] });
  const [balanceVal, setBalanceVal] = useState({ amount: 0, note: "" });

  const fetchUsers = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), page_size: "20" });
        if (planFilter) params.set("plan", planFilter);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/admin/users?${params}`, {
          headers: { REGKEY: regkey },
        });
        const data = await res.json();
        if (p === 1) setUsers(data.users || []);
        else setUsers((prev) => [...prev, ...(data.users || [])]);
        setTotal(data.total || 0);
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [regkey, planFilter]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const action = async (path: string, method = "POST", body?: object) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}${path}`, {
      method,
      headers: { REGKEY: regkey, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    fetchUsers(1);
  };

  const filtered = search
    ? users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const tdClass = "px-4 py-3 text-sm";
  const btnClass = "px-2 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{d.title}</h1>
        <div className="flex gap-2 flex-wrap">
          <input
            placeholder={d.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="">{d.allPlans}</option>
            <option value="Free plan">Free plan</option>
            <option value="Premium plan">Premium plan</option>
          </select>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {[d.email, d.plan, d.traffic, d.balance, d.planEnd, d.actions].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.35)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                className="hover:bg-white/[0.02] transition-colors">
                <td className={tdClass}>
                  <div className="text-white font-medium">{u.email}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{u.uuid.slice(0, 8)}…</div>
                </td>
                <td className={tdClass}>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: u.plan === "Premium plan" ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.08)",
                      color: u.plan === "Premium plan" ? "#a78bfa" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {u.plan}
                  </span>
                </td>
                <td className={tdClass}>
                  <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {formatBytes(u.traffic_used)} / {u.traffic_limit === -1 ? "∞" : formatBytes(u.traffic_limit)}
                  </div>
                  {u.traffic_limit > 0 && (
                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", width: 80 }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (u.traffic_used / u.traffic_limit) * 100)}%`,
                          background: u.traffic_used / u.traffic_limit > 0.8 ? "#f87171" : "#7c3aed",
                        }}
                      />
                    </div>
                  )}
                </td>
                <td className={tdClass} style={{ color: "rgba(255,255,255,0.7)" }}>
                  ${(u.balance / 100).toFixed(2)}
                </td>
                <td className={tdClass} style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                  {new Date(u.plan_end).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                </td>
                <td className={tdClass}>
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => { setSetPlanUser(u); setSetPlanVal({ plan: "Premium plan", action: "add", delta_amount: 1, delta_unit: "months", end_date: new Date().toISOString().split('T')[0] }); }}
                      className={btnClass}
                      style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
                    >{d.setPlan}</button>
                    <button
                      onClick={() => { setBalanceUser(u); setBalanceVal({ amount: 0, note: "" }); }}
                      className={btnClass}
                      style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}
                    >{d.addBalance}</button>
                    <button
                      onClick={() => action(`/admin/user/${u.uuid}/resettraffic`)}
                      className={btnClass}
                      style={{ background: "rgba(52,211,153,0.2)", color: "#34d399" }}
                    >{d.resetTraffic}</button>
                    <button
                      onClick={() => { if (confirm(d.confirmBan)) action(`/admin/user/${u.uuid}/ban`); }}
                      className={btnClass}
                      style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}
                    >{d.ban}</button>
                    <button
                      onClick={() => action(`/admin/user/${u.uuid}/unban`)}
                      className={btnClass}
                      style={{ background: "rgba(52,211,153,0.15)", color: "#6ee7b7" }}
                    >{d.unban}</button>
                    <button
                      onClick={() => { if (confirm(d.confirmDelete)) action(`/admin/user/${u.uuid}`, "DELETE"); }}
                      className={btnClass}
                      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
                    >{d.delete}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="py-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            No users found
          </div>
        )}
        {users.length < total && (
          <div className="p-4 text-center">
            <button
              onClick={() => fetchUsers(page + 1)}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "rgba(124,58,237,0.3)" }}
            >
              {d.loadMore} ({users.length}/{total})
            </button>
          </div>
        )}
      </div>

      {/* Set Plan Modal */}
      {setPlanUser && (
        <Modal title={dict.setPlanModal.title} onClose={() => setSetPlanUser(null)}>
          <div className="flex flex-col gap-3">
            <select
              value={setPlanVal.plan}
              onChange={(e) => setSetPlanVal((v) => ({ ...v, plan: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <option value="Free plan">Free plan</option>
              <option value="Premium plan">Premium plan</option>
            </select>
            
            <select
              value={setPlanVal.action}
              onChange={(e) => setSetPlanVal((v) => ({ ...v, action: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <option value="add">{dict.setPlanModal.actionModify || "Modify Duration"}</option>
              <option value="set">{dict.setPlanModal.actionSet || "Set Exact Date"}</option>
            </select>

            {setPlanVal.action === "add" ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={setPlanVal.delta_amount}
                  onChange={(e) => setSetPlanVal((v) => ({ ...v, delta_amount: Number(e.target.value) }))}
                  placeholder={dict.setPlanModal.amount || "Amount"}
                  className="rounded-lg px-3 py-2 text-sm text-white outline-none flex-1"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
                />
                <select
                  value={setPlanVal.delta_unit}
                  onChange={(e) => setSetPlanVal((v) => ({ ...v, delta_unit: e.target.value }))}
                  className="rounded-lg px-3 py-2 text-sm text-white outline-none w-28"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <option value="days">{dict.setPlanModal.unitDays || "Days"}</option>
                  <option value="months">{dict.setPlanModal.unitMonths || "Months"}</option>
                  <option value="years">{dict.setPlanModal.unitYears || "Years"}</option>
                </select>
              </div>
            ) : (
              <input
                type="date"
                value={setPlanVal.end_date}
                onChange={(e) => setSetPlanVal((v) => ({ ...v, end_date: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", colorScheme: "dark" }}
              />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setSetPlanUser(null)} className="px-4 py-2 rounded-xl text-sm text-gray-400">
                {dict.setPlanModal.cancel}
              </button>
              <button
                onClick={async () => {
                  await action(`/admin/user/${setPlanUser.uuid}/setplan`, "POST", setPlanVal);
                  setSetPlanUser(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
              >
                {dict.setPlanModal.confirm}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Balance Modal */}
      {balanceUser && (
        <Modal title={dict.addBalanceModal.title} onClose={() => setBalanceUser(null)}>
          <div className="flex flex-col gap-3">
            <input
              type="number"
              value={balanceVal.amount}
              onChange={(e) => setBalanceVal((v) => ({ ...v, amount: Number(e.target.value) }))}
              placeholder={dict.addBalanceModal.amount}
              className="rounded-lg px-3 py-2 text-sm text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
            <input
              value={balanceVal.note}
              onChange={(e) => setBalanceVal((v) => ({ ...v, note: e.target.value }))}
              placeholder={dict.addBalanceModal.note}
              className="rounded-lg px-3 py-2 text-sm text-white"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBalanceUser(null)} className="px-4 py-2 rounded-xl text-sm text-gray-400">
                {dict.addBalanceModal.cancel}
              </button>
              <button
                onClick={async () => {
                  await action(`/admin/user/${balanceUser.uuid}/addbalance`, "POST", {
                    ...balanceVal,
                    amount: balanceVal.amount * 100
                  });
                  setBalanceUser(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
              >
                {dict.addBalanceModal.confirm}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
