"use client";

import React, { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import "../globals.css";

const PLAN_COLORS: Record<string, string> = {
  "Website Care": "var(--neon-blue)",
  "Growth SEO": "var(--accent-2)",
  "Growth+": "var(--accent)",
};

const PLAN_NAMES = Object.keys(PLAN_COLORS);

type Client = {
  email: string;
  current_plan: string;
  plan_since: string;
  website: string | null;
};

export default function Admin() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [pendingChange, setPendingChange] = useState<{ email: string; planName: string } | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [changeError, setChangeError] = useState("");
  const [websiteDrafts, setWebsiteDrafts] = useState<Record<string, string>>({});
  const [savingWebsite, setSavingWebsite] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoadError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    const res = await fetch("/api/admin/client-plans", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    if (!res.ok) {
      setLoadError(body.error ?? "Couldn't load client data.");
      setClients(null);
      return;
    }
    setClients(body.clients);
    setWebsiteDrafts(
      Object.fromEntries((body.clients as Client[]).map((c) => [c.email, c.website ?? ""]))
    );
  };

  const handleSaveWebsite = async (clientEmail: string) => {
    setSavingWebsite(clientEmail);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/admin/set-website", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: clientEmail, website: websiteDrafts[clientEmail] }),
    });
    setSavingWebsite(null);

    if (!res.ok) {
      const body = await res.json();
      window.alert(body.error ?? "Couldn't save website.");
      return;
    }
    fetchClients();
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingSession(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setLoggedIn(!!data.session);
        if (data.session) fetchClients();
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      if (session) fetchClients();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Login isn't connected yet — add your Supabase credentials to .env.local.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (authError) {
      setError(authError.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setClients(null);
  };

  const confirmChangePlan = async () => {
    if (!pendingChange) return;
    setChangingPlan(true);
    setChangeError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/admin/set-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(pendingChange),
    });
    const body = await res.json();
    setChangingPlan(false);

    if (!res.ok) {
      setChangeError(body.error ?? "Couldn't change plan.");
      return;
    }

    setPendingChange(null);
    fetchClients();
  };

  const planCounts = (clients ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.current_plan] = (acc[c.current_plan] ?? 0) + 1;
    return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(planCounts));
  const totalSubscriptions = clients?.length ?? 0;

  if (checkingSession) {
    return (
      <div className="ws-root">
        <SiteNav />
      </div>
    );
  }

  return (
    <div className="ws-root">
      <SiteNav />

      {!loggedIn ? (
        <>
          <header className="ws-section" style={{ paddingTop: "clamp(8rem, 14vw, 11rem)" }}>
            <div className="ws-section-head" style={{ marginBottom: "0" }}>
              <span className="ws-eyebrow">Admin</span>
              <h2>Admin login.</h2>
              <p>Restricted to the site owner.</p>
            </div>
          </header>
          <section className="ws-section" style={{ paddingTop: 0, paddingBottom: "clamp(5rem, 10vw, 8rem)" }}>
            <div className="ws-form-card ws-form-card-static">
              <form className="ws-form" onSubmit={handleLogin}>
                <label className="ws-form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="ws-form-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                {error && <p className="ws-portal-error">{error}</p>}
                <button type="submit" className="ws-btn-primary" disabled={submitting}>
                  {submitting ? "Logging in…" : "Log in"}
                </button>
              </form>
            </div>
          </section>
        </>
      ) : (
        <>
          <header className="ws-section" style={{ paddingTop: "clamp(8rem, 14vw, 11rem)" }}>
            <div className="ws-section-head" style={{ marginBottom: "0" }}>
              <span className="ws-eyebrow">Admin</span>
              <h2>Client plans.</h2>
              <div className="ws-admin-header-actions">
                <Link href="/client-access" className="ws-btn-ghost">
                  View customer page →
                </Link>
                <button type="button" className="ws-btn-ghost" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </div>
          </header>

          <section className="ws-section" style={{ paddingTop: 0 }}>
            {loadError ? (
              <p className="ws-portal-error" style={{ textAlign: "center" }}>
                {loadError}
              </p>
            ) : clients === null ? (
              <p style={{ textAlign: "center" }}>Loading…</p>
            ) : clients.length === 0 ? (
              <p style={{ textAlign: "center" }}>No clients yet.</p>
            ) : (
              <>
                <div className="ws-admin-stats">
                  <div className="ws-admin-stat">
                    <span className="ws-admin-stat-number">{totalSubscriptions}</span>
                    <span className="ws-admin-stat-label">Total subscriptions</span>
                  </div>
                  <div className="ws-admin-stat">
                    <span className="ws-admin-stat-number">{totalSubscriptions}</span>
                    <span className="ws-admin-stat-label">Websites created</span>
                  </div>
                </div>

                <div className="ws-admin-chart">
                  {Object.entries(planCounts).map(([plan, count]) => (
                    <div className="ws-admin-chart-row" key={plan}>
                      <span className="ws-admin-chart-label">{plan}</span>
                      <div className="ws-admin-chart-track">
                        <div
                          className="ws-admin-chart-bar"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            background: PLAN_COLORS[plan] ?? "var(--accent)",
                          }}
                        />
                      </div>
                      <span className="ws-admin-chart-count">{count}</span>
                    </div>
                  ))}
                </div>

                <div className="ws-admin-table-wrap">
                  <table className="ws-admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Website</th>
                        <th>Current plan</th>
                        <th>Since</th>
                        <th>Change plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.email}>
                          <td>{c.email}</td>
                          <td>
                            <div className="ws-admin-website-cell">
                              <input
                                type="text"
                                placeholder="clientsite.com"
                                value={websiteDrafts[c.email] ?? ""}
                                onChange={(e) =>
                                  setWebsiteDrafts((prev) => ({ ...prev, [c.email]: e.target.value }))
                                }
                              />
                              {websiteDrafts[c.email] !== (c.website ?? "") && (
                                <button
                                  type="button"
                                  className="ws-btn-ghost"
                                  onClick={() => handleSaveWebsite(c.email)}
                                  disabled={savingWebsite === c.email}
                                >
                                  {savingWebsite === c.email ? "Saving…" : "Save"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td>{c.current_plan}</td>
                          <td>{new Date(c.plan_since).toLocaleDateString()}</td>
                          <td>
                            <div className="ws-admin-plan-actions">
                              {PLAN_NAMES.filter((p) => p !== c.current_plan).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  className="ws-btn-ghost"
                                  onClick={() => setPendingChange({ email: c.email, planName: p })}
                                >
                                  → {p}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}

      <footer className="ws-footer">
        <span className="ws-footer-brand">
          <span className="ws-logo-crop ws-logo-crop-sm">
            <img src="/assets/webskilletlogo.png" alt="" className="ws-logo-full" />
          </span>
          © {new Date().getFullYear()} Web Skillet
        </span>
        <span>Web design · Social Media · Ads · SEO</span>
      </footer>

      {pendingChange && (
        <div className="ws-confirm-overlay" onClick={() => setPendingChange(null)}>
          <div className="ws-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ws-eyebrow">Confirm change</span>
            <h3>
              Change {pendingChange.email} to {pendingChange.planName}?
            </h3>
            <p>This updates their plan immediately and bypasses their 30-day cooldown.</p>
            {changeError && <p className="ws-portal-error">{changeError}</p>}
            <div className="ws-confirm-actions">
              <button type="button" className="ws-btn-ghost" onClick={() => setPendingChange(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn-primary"
                onClick={confirmChangePlan}
                disabled={changingPlan}
              >
                {changingPlan ? "Saving…" : "Yes, change plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
