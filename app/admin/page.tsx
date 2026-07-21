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

const WEBSITE_BUILD_PRICE = 2000;

function formatDate(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

type Client = {
  email: string;
  current_plan: string;
  plan_since: string;
  business_name: string | null;
  has_website: boolean;
  has_subscription: boolean;
  monthly_amount: number | null;
};

type PlanRequest = {
  id: number;
  email: string;
  business_name: string | null;
  plan_name: string;
  requested_at: string;
};

type ReferralSummary = {
  referrer_user_id: string;
  email: string;
  business_name: string | null;
  count: number;
  referred: { email: string; source: string; created_at: string }[];
};

type ContactMessage = {
  id: number;
  business_name: string;
  phone: string;
  email: string;
  address: string | null;
  is_startup: boolean;
  services: string[];
  message: string | null;
  created_at: string;
  read: boolean;
};

type LastAction =
  | { kind: "plan"; label: string; email: string; previousPlan: string }
  | {
      kind: "billing";
      label: string;
      email: string;
      previousBilling: { has_website: boolean; has_subscription: boolean; monthly_amount: number | null };
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
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [billingDrafts, setBillingDrafts] = useState<Record<string, string>>({});
  const [pendingBilling, setPendingBilling] = useState<{
    email: string;
    hasWebsite: boolean;
    hasSubscription: boolean;
    monthlyAmount: number | null;
  } | null>(null);
  const [billingSubmitting, setBillingSubmitting] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [planRequest, setPlanRequest] = useState<PlanRequest | null>(null);
  const [pendingResolution, setPendingResolution] = useState<{
    id: number;
    decision: "approve" | "deny";
    email: string;
    planName: string;
  } | null>(null);
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [pendingMessageDeletion, setPendingMessageDeletion] = useState<number | null>(null);
  const [pendingClearRead, setPendingClearRead] = useState(false);
  const [messageActionError, setMessageActionError] = useState("");
  const [referrals, setReferrals] = useState<ReferralSummary[] | null>(null);

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

  const fetchPlanRequest = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    const res = await fetch("/api/admin/plan-activity", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (res.ok) setPlanRequest(body.request);
  };

  const fetchMessages = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    const res = await fetch("/api/admin/messages", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (res.ok) setMessages(body.messages);
  };

  const fetchReferrals = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    const res = await fetch("/api/admin/referrals", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (res.ok) setReferrals(body.referrals);
  };

  const refreshData = () => {
    fetchClients();
    fetchPlanRequest();
    fetchMessages();
    fetchReferrals();
  };

  const toggleMessageRead = async (m: ContactMessage) => {
    setMessageActionError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/admin/messages/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: m.id, read: !m.read }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessageActionError(body.error ?? "Couldn't update that message.");
      return;
    }
    fetchMessages();
  };

  const confirmDeleteMessage = async () => {
    if (pendingMessageDeletion === null) return;
    setMessageActionError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/admin/messages/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: pendingMessageDeletion }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessageActionError(body.error ?? "Couldn't delete that message.");
      return;
    }
    setPendingMessageDeletion(null);
    fetchMessages();
  };

  const confirmClearRead = async () => {
    setMessageActionError("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/admin/messages/clear-read", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessageActionError(body.error ?? "Couldn't clear those messages.");
      return;
    }
    setPendingClearRead(false);
    fetchMessages();
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
        if (data.session) refreshData();
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      if (session) refreshData();
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

    const previousPlan = clients?.find((c) => c.email === pendingChange.email)?.current_plan;
    if (!previousPlan) {
      setChangingPlan(false);
      return;
    }

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
      kind: "plan",
      label: `Changed ${pendingChange.email} to ${pendingChange.planName}.`,
      email: pendingChange.email,
      previousPlan,
    });
    setPendingChange(null);
    refreshData();
  };

  const confirmRemovePlan = async () => {
    if (!pendingRemoval) return;
    setChangingPlan(true);
    setChangeError("");

    const previousPlan = clients?.find((c) => c.email === pendingRemoval)?.current_plan;
    if (!previousPlan) {
      setChangingPlan(false);
      return;
    }

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
      kind: "plan",
      label: `Removed ${pendingRemoval}'s subscription.`,
      email: pendingRemoval,
      previousPlan,
    });
    setPendingRemoval(null);
    refreshData();
  };

  const commitMonthlyAmount = (c: Client) => {
    if (!c.has_subscription) return;
    const raw = billingDrafts[c.email];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (trimmed !== "" && Number.isNaN(parsed)) return;
    if (parsed === c.monthly_amount) return;
    setPendingBilling({
      email: c.email,
      hasWebsite: c.has_website,
      hasSubscription: c.has_subscription,
      monthlyAmount: parsed,
    });
  };

  const confirmBilling = async () => {
    if (!pendingBilling) return;
    setBillingSubmitting(true);
    setBillingError("");

    const current = clients?.find((c) => c.email === pendingBilling.email);
    const previousBilling = {
      has_website: current?.has_website ?? false,
      has_subscription: current?.has_subscription ?? false,
      monthly_amount: current?.monthly_amount ?? null,
    };

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/admin/set-billing", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: pendingBilling.email,
        hasWebsite: pendingBilling.hasWebsite,
        hasSubscription: pendingBilling.hasSubscription,
        monthlyAmount: pendingBilling.hasSubscription ? pendingBilling.monthlyAmount : null,
      }),
    });
    const body = await res.json();
    setBillingSubmitting(false);

    if (!res.ok) {
      setBillingError(body.error ?? "Couldn't update billing.");
      return;
    }

    setLastAction({
      kind: "billing",
      label: `Updated billing for ${pendingBilling.email}.`,
      email: pendingBilling.email,
      previousBilling,
    });
    setPendingBilling(null);
    setBillingDrafts((prev) => {
      const next = { ...prev };
      delete next[pendingBilling.email];
      return next;
    });
    refreshData();
  };

  const undoLastAction = async () => {
    if (!lastAction) return;
    setUndoing(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (lastAction.kind === "plan") {
      await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: lastAction.email, planName: lastAction.previousPlan }),
      });
    } else {
      await fetch("/api/admin/set-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: lastAction.email,
          hasWebsite: lastAction.previousBilling.has_website,
          hasSubscription: lastAction.previousBilling.has_subscription,
          monthlyAmount: lastAction.previousBilling.monthly_amount,
        }),
      });
    }

    setUndoing(false);
    setLastAction(null);
    refreshData();
  };

  const resolvePlanRequest = async () => {
    if (!pendingResolution) return;
    setResolveSubmitting(true);
    setResolveError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch("/api/admin/resolve-plan-request", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ requestId: pendingResolution.id, decision: pendingResolution.decision }),
    });
    const body = await res.json();
    setResolveSubmitting(false);

    if (!res.ok) {
      setResolveError(body.error ?? "Couldn't resolve that request.");
      return;
    }

    setPendingResolution(null);
    refreshData();
  };

  const planCounts = (clients ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.current_plan] = (acc[c.current_plan] ?? 0) + 1;
    return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(planCounts));
  const totalSubscriptions = (clients ?? []).filter((c) => c.has_subscription).length;
  const totalMonthlyRevenue = (clients ?? []).reduce((sum, c) => sum + (c.monthly_amount ?? 0), 0);
  const websitesBuilt = (clients ?? []).filter((c) => c.has_website).length;
  const websiteRevenue = websitesBuilt * WEBSITE_BUILD_PRICE;

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
                    <span className="ws-admin-stat-number">${totalMonthlyRevenue.toLocaleString()}</span>
                    <span className="ws-admin-stat-label">Monthly recurring revenue</span>
                  </div>
                  <div className="ws-admin-stat">
                    <span className="ws-admin-stat-number">{websitesBuilt}</span>
                    <span className="ws-admin-stat-label">Websites built</span>
                  </div>
                  <div className="ws-admin-stat">
                    <span className="ws-admin-stat-number">${websiteRevenue.toLocaleString()}</span>
                    <span className="ws-admin-stat-label">Website build revenue</span>
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

                {planRequest && (
                  <div className="ws-admin-activity">
                    <span className="ws-admin-activity-title">Pending plan request</span>
                    <div className="ws-admin-activity-row">
                      <span className="ws-admin-activity-who">
                        {planRequest.business_name
                          ? `${planRequest.business_name} · ${planRequest.email}`
                          : planRequest.email}
                      </span>
                      <span className="ws-admin-activity-what">
                        wants to switch to <strong>{planRequest.plan_name}</strong>
                      </span>
                      <span className="ws-admin-activity-when">{formatDate(planRequest.requested_at)}</span>
                    </div>
                    <div className="ws-admin-activity-actions">
                      <button
                        type="button"
                        className="ws-btn-ghost"
                        onClick={() =>
                          setPendingResolution({
                            id: planRequest.id,
                            decision: "deny",
                            email: planRequest.email,
                            planName: planRequest.plan_name,
                          })
                        }
                      >
                        Deny
                      </button>
                      <button
                        type="button"
                        className="ws-btn-primary"
                        onClick={() =>
                          setPendingResolution({
                            id: planRequest.id,
                            decision: "approve",
                            email: planRequest.email,
                            planName: planRequest.plan_name,
                          })
                        }
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                )}

                <div className="ws-admin-table-wrap">
                  <table className="ws-admin-table">
                    <colgroup>
                      <col style={{ width: "15rem" }} />
                      <col style={{ width: "9rem" }} />
                      <col style={{ width: "11.5rem" }} />
                      <col style={{ width: "4rem" }} />
                      <col style={{ width: "7.5rem" }} />
                      <col style={{ width: "4rem" }} />
                      <col style={{ width: "7rem" }} />
                      <col style={{ width: "7rem" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th className="ws-admin-business-name">Business name</th>
                        <th>Plan</th>
                        <th>Sub.</th>
                        <th>Monthly $</th>
                        <th>Website</th>
                        <th>Since</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.email}>
                          <td className="ws-admin-email-cell" title={c.email}>{c.email}</td>
                          <td className="ws-admin-business-name">{c.business_name || "—"}</td>
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
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={c.has_subscription}
                              onChange={(e) =>
                                setPendingBilling({
                                  email: c.email,
                                  hasWebsite: c.has_website,
                                  hasSubscription: e.target.checked,
                                  monthlyAmount: e.target.checked ? c.monthly_amount : null,
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="ws-admin-billing-input"
                              placeholder="—"
                              disabled={!c.has_subscription}
                              value={
                                c.has_subscription
                                  ? billingDrafts[c.email] ?? (c.monthly_amount != null ? String(c.monthly_amount) : "")
                                  : ""
                              }
                              onChange={(e) =>
                                setBillingDrafts((prev) => ({ ...prev, [c.email]: e.target.value }))
                              }
                              onBlur={() => commitMonthlyAmount(c)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={c.has_website}
                              onChange={(e) =>
                                setPendingBilling({
                                  email: c.email,
                                  hasWebsite: e.target.checked,
                                  hasSubscription: c.has_subscription,
                                  monthlyAmount: c.monthly_amount,
                                })
                              }
                            />
                          </td>
                          <td>{formatDate(c.plan_since)}</td>
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

          <section className="ws-section" style={{ paddingTop: 0 }}>
            <div className="ws-admin-messages">
              <div className="ws-admin-messages-header">
                <span className="ws-admin-activity-title">
                  Messages{" "}
                  {messages && messages.some((m) => !m.read) && (
                    <span className="ws-admin-messages-badge">
                      {messages.filter((m) => !m.read).length} new
                    </span>
                  )}
                </span>
                {messages && messages.some((m) => m.read) && (
                  <div className="ws-admin-messages-header-actions">
                    <button type="button" className="ws-btn-ghost" onClick={() => setPendingClearRead(true)}>
                      Clear read messages
                    </button>
                  </div>
                )}
              </div>
              {messageActionError && <p className="ws-portal-error">{messageActionError}</p>}
              {messages === null ? (
                <p className="ws-admin-messages-empty">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="ws-admin-messages-empty">No inquiries yet.</p>
              ) : (
                <ul className="ws-admin-messages-list">
                  {messages.map((m) => (
                    <li key={m.id} className={m.read ? "" : "is-unread"}>
                      <div className="ws-admin-message-head">
                        <span className="ws-admin-message-from">
                          {m.business_name} · <a href={`mailto:${m.email}`}>{m.email}</a> · {m.phone}
                        </span>
                        <div className="ws-admin-message-head-right">
                          <span className="ws-admin-message-when">{formatDate(m.created_at)}</span>
                          <button
                            type="button"
                            className={m.read ? "ws-btn-ghost" : "ws-btn-primary"}
                            onClick={() => toggleMessageRead(m)}
                          >
                            {m.read ? "Mark unread" : "Mark as read"}
                          </button>
                        </div>
                      </div>
                      <p className="ws-admin-message-meta">
                        {m.is_startup ? "New/startup business" : m.address || "No address given"}
                        {m.services.length > 0 ? ` · Interested in: ${m.services.join(", ")}` : ""}
                      </p>
                      {m.message && <p className="ws-admin-message-body">{m.message}</p>}
                      <div className="ws-admin-message-actions">
                        <button
                          type="button"
                          className="ws-btn-ghost"
                          onClick={() => setPendingMessageDeletion(m.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="ws-section" style={{ paddingTop: 0 }}>
            <div className="ws-admin-messages">
              <span className="ws-admin-activity-title">Referrals</span>
              {referrals === null ? (
                <p className="ws-admin-messages-empty">Loading…</p>
              ) : referrals.length === 0 ? (
                <p className="ws-admin-messages-empty">No referrals yet.</p>
              ) : (
                <ul className="ws-admin-messages-list">
                  {referrals.map((r) => (
                    <li key={r.referrer_user_id}>
                      <div className="ws-admin-message-head">
                        <span className="ws-admin-message-from">
                          {r.business_name ? `${r.business_name} · ${r.email}` : r.email}
                        </span>
                        <span className="ws-admin-message-when">
                          {r.count} referral{r.count === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="ws-admin-message-meta">
                        {r.referred.map((x) => `${x.email} (${x.source}, ${formatDate(x.created_at)})`).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

      {pendingBilling && (
        <div className="ws-confirm-overlay" onClick={() => setPendingBilling(null)}>
          <div className="ws-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ws-eyebrow">Confirm billing update</span>
            <h3>Update billing for {pendingBilling.email}?</h3>
            <p>
              Website build: {pendingBilling.hasWebsite ? `Yes ($${WEBSITE_BUILD_PRICE.toLocaleString()})` : "No"}
              <br />
              Monthly subscription: {pendingBilling.hasSubscription ? "Yes" : "No"}
              <br />
              Monthly amount:{" "}
              {pendingBilling.hasSubscription
                ? pendingBilling.monthlyAmount != null
                  ? `$${pendingBilling.monthlyAmount.toLocaleString()}`
                  : "Not set"
                : "—"}
            </p>
            {billingError && <p className="ws-portal-error">{billingError}</p>}
            <div className="ws-confirm-actions">
              <button type="button" className="ws-btn-ghost" onClick={() => setPendingBilling(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn-primary"
                onClick={confirmBilling}
                disabled={billingSubmitting}
              >
                {billingSubmitting ? "Saving…" : "Yes, update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingResolution && (
        <div className="ws-confirm-overlay" onClick={() => setPendingResolution(null)}>
          <div className="ws-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ws-eyebrow">
              Confirm {pendingResolution.decision === "approve" ? "approval" : "denial"}
            </span>
            <h3>
              {pendingResolution.decision === "approve" ? "Approve" : "Deny"} {pendingResolution.email}&rsquo;s
              request to switch to {pendingResolution.planName}?
            </h3>
            <p>
              {pendingResolution.decision === "approve"
                ? "This applies the plan change immediately and emails them to confirm."
                : "This clears the request — they can submit a new one once they're outside their cooldown."}
            </p>
            {resolveError && <p className="ws-portal-error">{resolveError}</p>}
            <div className="ws-confirm-actions">
              <button type="button" className="ws-btn-ghost" onClick={() => setPendingResolution(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="ws-btn-primary"
                onClick={resolvePlanRequest}
                disabled={resolveSubmitting}
              >
                {resolveSubmitting ? "Saving…" : `Yes, ${pendingResolution.decision}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingMessageDeletion !== null && (
        <div className="ws-confirm-overlay" onClick={() => setPendingMessageDeletion(null)}>
          <div className="ws-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ws-eyebrow">Confirm delete</span>
            <h3>Delete this message?</h3>
            <p>This can&rsquo;t be undone.</p>
            {messageActionError && <p className="ws-portal-error">{messageActionError}</p>}
            <div className="ws-confirm-actions">
              <button type="button" className="ws-btn-ghost" onClick={() => setPendingMessageDeletion(null)}>
                Cancel
              </button>
              <button type="button" className="ws-btn-primary" onClick={confirmDeleteMessage}>
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingClearRead && (
        <div className="ws-confirm-overlay" onClick={() => setPendingClearRead(false)}>
          <div className="ws-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ws-eyebrow">Confirm clear</span>
            <h3>Delete all read messages?</h3>
            <p>
              Export them first if you want to keep a record — this deletes every message marked read and
              can&rsquo;t be undone.
            </p>
            {messageActionError && <p className="ws-portal-error">{messageActionError}</p>}
            <div className="ws-confirm-actions">
              <button type="button" className="ws-btn-ghost" onClick={() => setPendingClearRead(false)}>
                Cancel
              </button>
              <button type="button" className="ws-btn-primary" onClick={confirmClearRead}>
                Yes, clear
              </button>
            </div>
          </div>
        </div>
      )}

      {lastAction && (
        <div className="ws-toast ws-admin-undo-toast" role="status">
          {lastAction.label}
          <button type="button" className="ws-btn-ghost" onClick={undoLastAction} disabled={undoing}>
            {undoing ? "Undoing…" : "Undo"}
          </button>
        </div>
      )}
    </div>
  );
}
