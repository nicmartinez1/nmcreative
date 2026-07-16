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
  business_name: string | null;
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
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [changeError, setChangeError] = useState("");
  const [lastAction, setLastAction] = useState<{
    label: string;
    email: string;
    previousPlan: string | null;
  } | null>(null);
  const [undoing, setUndoing] = useState(false);

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

  useEffect(() => {
    if (!lastAction) return;
    const timer = setTimeout(() => setLastAction(null), 8000);
    return () => clearTimeout(timer);
  }, [lastAction]);

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

    const previousPlan = clients?.find((c) => c.email === pendingChange.email)?.current_plan ?? null;

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

    setLastAction({
      label: `Changed ${pendingChange.email} to ${pendingChange.planName}.`,
      email: pendingChange.email,
      previousPlan,
    });
    setPendingChange(null);
    fetchClients();
  };

  const confirmRemovePlan = async () => {
    if (!pendingRemoval) return;
    setChangingPlan(true);
    setChangeError("");

    const previousPlan = clients?.find((c) => c.email === pendingRemoval)?.current_plan ?? null;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/admin/remove-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: pendingRemoval }),
    });
    const body = await res.json();
    setChangingPlan(false);

    if (!res.ok) {
      setChangeError(body.error ?? "Couldn't remove subscription.");
      return;
    }

    setLastAction({
      label: `Removed ${pendingRemoval}'s subscription.`,
      email: pendingRemoval,
      previousPlan,
    });
    setPendingRemoval(null);
    fetchClients();
  };

  const undoLastAction = async () => {
    if (!lastAction?.previousPlan) {
      setLastAction(null);
      return;
    }
    setUndoing(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch("/api/admin/set-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: lastAction.email, planName: lastAction.previousPlan }),
    });

    setUndoing(false);
    setLastAction(null);
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
                    <colgroup>
                      <col style={{ width: "30%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "14%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Business name</th>
                        <th>Current plan</th>
                        <th>Since</th>
                        <th>Change plan</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.email}>
                          <td>{c.email}</td>
                          <td>{c.business_name || "—"}</td>
                          <td>{c.current_plan}</td>
                          <td>{new Date(c.plan_since).toLocaleDateString()}</td>
                          <td>
                            <select
                              className="ws-admin-plan-select"
                              value={c.current_plan}
                              onChange={(e) => {
                                if (e.target.value !== c.current_plan) {
                                  setPendingChange({ email: c.email, planName: e.target.value });
                                }
                              }}
                            >
                              {PLAN_NAMES.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="ws-btn-ghost"
                              onClick={() => setPendingRemoval(c.email)}
                            >
                              Remove
                            </button>
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

      {pendingRemoval && (
        <div className="ws-confirm-overlay" onClick={() => setPendingRemoval(null)}>
          <div className="ws-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ws-eyebrow">Confirm removal</span>
            <h3>Remove {pendingRemoval}&rsquo;s subscription?</h3>
            <p>This clears their plan entirely — they&rsquo;ll no longer show as an active subscriber.</p>
            {changeError && <p className="ws-portal-error">{changeError}</p>}
            <div className="ws-confirm-actions">
              <button type="button" className="ws-btn-ghost" onClick={() => setPendingRemoval(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn-primary"
                onClick={confirmRemovePlan}
                disabled={changingPlan}
              >
                {changingPlan ? "Removing…" : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {lastAction && (
        <div className="ws-toast ws-admin-undo-toast" role="status">
          {lastAction.label}
          {lastAction.previousPlan && (
            <button type="button" className="ws-btn-ghost" onClick={undoLastAction} disabled={undoing}>
              {undoing ? "Undoing…" : "Undo"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
