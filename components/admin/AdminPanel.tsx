"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLogin from "./AdminLogin";
import AdminSidebar from "./AdminSidebar";
import AdminStats from "./AdminStats";
import AdminUsers from "./AdminUsers";
import AdminConnections from "./AdminConnections";
import AdminNodes from "./AdminNodes";
import AdminVouchers from "./AdminVouchers";
import AdminCluster from "./AdminCluster";

export type Tab = "stats" | "users" | "connections" | "nodes" | "vouchers" | "cluster";

export default function AdminPanel({ dict, lang }: { dict: any; lang: string }) {
  const [regkey, setRegkey] = useState<string>("");
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("stats");

  // Persist regkey in sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_regkey");
    if (saved) {
      setRegkey(saved);
      setAuthed(true);
    }
  }, []);

  const handleLogin = useCallback((key: string) => {
    setRegkey(key);
    sessionStorage.setItem("admin_regkey", key);
    setAuthed(true);
  }, []);

  const handleLogout = useCallback(() => {
    setRegkey("");
    setAuthed(false);
    sessionStorage.removeItem("admin_regkey");
  }, []);

  if (!authed) {
    return <AdminLogin dict={dict} lang={lang} onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen text-white" style={{ background: "linear-gradient(135deg, #060010 0%, #0d001f 100%)" }}>
      <AdminSidebar dict={dict} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} lang={lang} />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {activeTab === "stats" && <AdminStats dict={dict} regkey={regkey} />}
        {activeTab === "users" && <AdminUsers dict={dict} regkey={regkey} />}
        {activeTab === "connections" && <AdminConnections dict={dict} regkey={regkey} />}
        {activeTab === "nodes" && <AdminNodes dict={dict} regkey={regkey} />}
        {activeTab === "vouchers" && <AdminVouchers dict={dict} regkey={regkey} />}
        {activeTab === "cluster" && <AdminCluster dict={dict} regkey={regkey} />}
      </main>
    </div>
  );
}
