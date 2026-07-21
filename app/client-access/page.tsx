"use client";

import React, { useEffect, useState, type ReactNode, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import "../globals.css";

function Reveal({
  as: Tag = "div",
  className = "",
  style,
  delay = 0,
  children,
}: {
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  children: ReactNode;
}) {
  const Component = Tag as any;
  return (
    <Component
      className={`${className} ws-in-view`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </Component>
  );
}

function Toast({ planName, onDismiss }: { planName: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [planName, onDismiss]);

  return (
    <div className="ws-toast" role="status">
      ✓ Requested a switch to <strong>{planName}</strong> — awaiting approval.
    </div>
  );
}

const plans = [
  {
    name: "Website Care",
    price: "$99–149/month",
    tagline: "Keep things running",
    color: "var(--neon-blue)",
    features: [
      "Uptime & security monitoring",
      "Software and plugin updates",
      "Monthly backups",
      "Minor content edits",
    ],
  },
  {
    name: "Growth SEO",
    price: "$299–499/month",
    tagline: "Grow your visibility",
    color: "var(--accent-2)",
    features: [
      "Everything in Website Care",
      "Ongoing on-page SEO",
      "Keyword & ranking tracking",
      "Monthly performance report",
    ],
  },
  {
    name: "Growth+",
    price: "Starting at $999/month",
    tagline: "Full growth package",
    color: "var(--accent)",
    featured: true,
    features: [
      "Everything in Growth SEO",
      "Social media management",
      "Ad campaign management",
      "Customer rewards & loyalty setup (e.g. Toast, for restaurants)",
      "Projected additional followers and up to 3x more customers",
    ],
  },
];

export default function ClientAccess() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [signupReferralCode, setSignupReferralCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(plans[0].name);
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [pendingRequestPlan, setPendingRequestPlan] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [switchConfirmation, setSwitchConfirmation] = useState("");
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [signupSent, setSignupSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  const [passwordSet, setPasswordSet] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const needsPasswordSetup =
    (authHash.includes("type=invite") || authHash.includes("type=recovery")) && !passwordSet;

  const loadPlan = async (uid: string) => {
    const { data } = await supabase
      .from("plan_changes")
      .select("plan_name, changed_at")
      .eq("user_id", uid)
      .order("changed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setCurrentPlan(data.plan_name);
      setLastChangedAt(data.changed_at);
    }

    const { data: profile } = await supabase
      .from("client_profiles")
      .select("has_website")
      .eq("user_id", uid)
      .maybeSingle();
    setHasWebsite(profile?.has_website ?? false);

    const { data: existingRequest } = await supabase
      .from("plan_requests")
      .select("plan_name")
      .eq("user_id", uid)
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setPendingRequestPlan(existingRequest?.plan_name ?? null);
  };

  const loadReferralCount = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/referrals/mine", { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    if (res.ok) {
      setReferralCount(body.count ?? 0);
      setMyReferralCode(body.referralCode ?? null);
    }
  };

  const copyReferralCode = () => {
    if (!myReferralCode) return;
    navigator.clipboard.writeText(myReferralCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    });
  };

  const PLAN_COOLDOWN_DAYS = 30;
  const nextSwitchDate = lastChangedAt
    ? new Date(new Date(lastChangedAt).getTime() + PLAN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const isLocked = (!!nextSwitchDate && nextSwitchDate.getTime() > Date.now()) || !!pendingRequestPlan;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingSession(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) {
          setLoggedIn(true);
          setUserId(data.session.user.id);
          setEmail(data.session.user.email ?? "");
          loadPlan(data.session.user.id);
          loadReferralCount();
        }
      })
      .catch(() => {
        // Supabase unreachable — fall through to the login form.
      })
      .finally(() => setCheckingSession(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      if (session) {
        setUserId(session.user.id);
        setEmail(session.user.email ?? "");
        loadPlan(session.user.id);
        loadReferralCount();
      } else {
        setUserId(null);
      }
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

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Login isn't connected yet — add your Supabase credentials to .env.local.");
      return;
    }

    setSubmitting(true);
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/client-access`,
        data: { business_name: businessName },
      },
    });
    setSubmitting(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    fetch("/api/notify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, referralCode: signupReferralCode }),
    }).catch(() => {
      // Best-effort — a failed welcome email shouldn't block signup.
    });

    // If email confirmation is off, Supabase returns a session immediately
    // and onAuthStateChange picks it up; otherwise, prompt to check inbox.
    if (!data.session) {
      setSignupSent(true);
    }
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Login isn't connected yet — add your Supabase credentials to .env.local.");
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/client-access`,
    });
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setUserId(null);
  };

  const requestSwitchPlan = (planName: string) => {
    if (!userId || isLocked) return;
    setPendingPlan(planName);
  };

  const cancelSwitchPlan = () => setPendingPlan(null);

  const confirmSwitchPlan = async () => {
    if (!pendingPlan) return;
    const planName = pendingPlan;
    setPendingPlan(null);

    const { error: insertError } = await supabase
      .from("plan_requests")
      .insert({ user_id: userId, plan_name: planName });
    if (insertError) {
      window.alert(insertError.message);
      return;
    }

    setPendingRequestPlan(planName);
    setSwitchConfirmation(planName);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (token) {
      fetch("/api/notify-plan-change", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planName }),
      }).catch(() => {
        // Best-effort — a failed notification shouldn't block the request itself.
      });
    }
  };

  const handleSetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSettingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSettingPassword(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
    setPasswordSet(true);
  };

  if (needsPasswordSetup) {
    return (
      <div className="ws-root">
        <SiteNav />
        <header className="ws-section" style={{ paddingTop: "clamp(8rem, 14vw, 11rem)" }}>
          <Reveal className="ws-section-head" style={{ marginBottom: "0" }}>
            <span className="ws-eyebrow">Client access</span>
            <h2>Set your password.</h2>
            <p>You&rsquo;ve been invited to Web Skillet — choose a password to finish setting up your account.</p>
          </Reveal>
        </header>
        <section className="ws-section" style={{ paddingTop: 0, paddingBottom: "clamp(5rem, 10vw, 8rem)" }}>
          <div className="ws-form-card ws-form-card-static">
            <form className="ws-form" onSubmit={handleSetPassword}>
              <label className="ws-form-field">
                <span>New password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </label>
              {error && <p className="ws-portal-error">{error}</p>}
              <button type="submit" className="ws-btn-primary" disabled={settingPassword}>
                {settingPassword ? "Saving…" : "Set password & continue"}
              </button>
            </form>
          </div>
        </section>
      </div>
    );
  }

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
            <Reveal className="ws-section-head" style={{ marginBottom: "0" }}>
              <span className="ws-eyebrow">Client access</span>
              <h2>
                {mode === "login" && "Welcome back."}
                {mode === "signup" && "Create your account."}
                {mode === "forgot" && "Reset your password."}
              </h2>
              <p>
                {mode === "login" &&
                  "Log in to check your project status, reach your support team, or upgrade your plan."}
                {mode === "signup" && "Set up your own login in seconds — no need to wait on an invite."}
                {mode === "forgot" && "We'll email you a link to set a new password."}
              </p>
            </Reveal>
          </header>

          <section className="ws-section" style={{ paddingTop: 0, paddingBottom: "clamp(5rem, 10vw, 8rem)" }}>
            <div className="ws-form-card ws-form-card-static">
              {signupSent ? (
                <div className="ws-form-success">
                  <span className="ws-eyebrow" style={{ color: "var(--growth-soft)" }}>Almost there</span>
                  <h3>Check your email.</h3>
                  <p>
                    We sent a confirmation link to <strong>{email}</strong>. Click
                    it to verify your account, then come back and{" "}
                    <button
                      type="button"
                      className="ws-btn-ghost"
                      onClick={() => {
                        setSignupSent(false);
                        setMode("login");
                      }}
                    >
                      log in
                    </button>
                    .
                  </p>
                </div>
              ) : resetSent ? (
                <div className="ws-form-success">
                  <span className="ws-eyebrow" style={{ color: "var(--growth-soft)" }}>Check your inbox</span>
                  <h3>Password reset link sent.</h3>
                  <p>
                    We sent a reset link to <strong>{email}</strong>. Click it to
                    choose a new password.
                  </p>
                  <button
                    type="button"
                    className="ws-btn-ghost"
                    onClick={() => {
                      setResetSent(false);
                      setMode("login");
                    }}
                  >
                    Back to log in
                  </button>
                </div>
              ) : (
                <>
                  <form
                    className="ws-form"
                    onSubmit={
                      mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword
                    }
                  >
                    {mode === "signup" && (
                      <>
                        <label className="ws-form-field">
                          <span>Business name</span>
                          <input
                            type="text"
                            placeholder="Riverside Coffee Co."
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                          />
                        </label>
                        <label className="ws-form-field">
                          <span>Referral code (optional)</span>
                          <input
                            type="text"
                            placeholder="e.g. RIVERSIDE-8K2Q"
                            value={signupReferralCode}
                            onChange={(e) => setSignupReferralCode(e.target.value)}
                          />
                        </label>
                      </>
                    )}
                    <label className="ws-form-field">
                      <span>Email</span>
                      <input
                        type="email"
                        placeholder="you@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </label>
                    {mode !== "forgot" && (
                      <label className="ws-form-field">
                        <span>Password</span>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={mode === "signup" ? 6 : undefined}
                          required
                        />
                      </label>
                    )}
                    {mode === "login" && (
                      <button
                        type="button"
                        className="ws-btn-ghost ws-portal-forgot-link"
                        onClick={() => {
                          setMode("forgot");
                          setError("");
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                    {error && <p className="ws-portal-error">{error}</p>}
                    <button type="submit" className="ws-btn-primary" disabled={submitting}>
                      {submitting
                        ? mode === "login"
                          ? "Logging in…"
                          : mode === "signup"
                            ? "Creating account…"
                            : "Sending…"
                        : mode === "login"
                          ? "Log in"
                          : mode === "signup"
                            ? "Create account"
                            : "Send reset link"}
                    </button>
                  </form>
                  <p className="ws-portal-signup-note">
                    {mode === "login" && (
                      <>
                        New client?{" "}
                        <button
                          type="button"
                          className="ws-btn-ghost"
                          onClick={() => {
                            setMode("signup");
                            setError("");
                          }}
                        >
                          Create an account
                        </button>
                      </>
                    )}
                    {(mode === "signup" || mode === "forgot") && (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="ws-btn-ghost"
                          onClick={() => {
                            setMode("login");
                            setError("");
                          }}
                        >
                          Log in
                        </button>
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <header className="ws-section" style={{ paddingTop: "clamp(8rem, 14vw, 11rem)" }}>
            <Reveal className="ws-section-head" style={{ marginBottom: "0" }}>
              <span className="ws-eyebrow">Client access</span>
              <h2>
                Welcome back{email ? `, ${email.split("@")[0]}` : ""}.
              </h2>
              {email.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase() && (
                <Link href="/admin" className="ws-btn-ghost">
                  Admin dashboard →
                </Link>
              )}
              <button type="button" className="ws-btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </Reveal>
          </header>

          {hasWebsite && (
            <section className="ws-section" style={{ paddingTop: 0, paddingBottom: 0 }}>
              <Reveal className="ws-portal-website-banner">
                🎉 Your website is complete and live!
              </Reveal>
            </section>
          )}

          <section className="ws-section" style={{ paddingTop: 0 }}>
            <Reveal className="ws-portal-support-banner">
              <div>
                <h3>Get IT help</h3>
                <p>
                  Hosting, security, or anything technical is handled by our
                  IT partner directly — reach them any time.
                </p>
              </div>
              <div className="ws-portal-contact">
                <a href="mailto:support@[itpartner].com" className="ws-btn-primary">
                  support@[itpartner].com
                </a>
                <a href="tel:+10000000000" className="ws-btn-ghost">
                  (000) 000-0000
                </a>
              </div>
              <span className="ws-portal-placeholder-note">
                Placeholder contact — swap in once the partnership is finalized.
              </span>
            </Reveal>

            <Reveal delay={80} className="ws-portal-card">
              <h3>Need support?</h3>
              <p>
                Bug, question, or a small change you need made — send it
                over and your team will get back to you.
              </p>
              <Link href="/contact" className="ws-btn-ghost">
                Message support →
              </Link>
            </Reveal>

            <Reveal delay={160} className="ws-portal-card">
              <h3>Refer a business</h3>
              <p>
                Know another business that could use this? Have them mention your code when they sign up
                or reach out, and we&rsquo;ll know it came from you.
                {referralCount > 0 && (
                  <>
                    {" "}
                    You&rsquo;ve referred <strong>{referralCount}</strong>{" "}
                    {referralCount === 1 ? "business" : "businesses"} so far.
                  </>
                )}
              </p>
              {myReferralCode && <p className="ws-portal-referral-code">{myReferralCode}</p>}
              <button type="button" className="ws-btn-ghost" onClick={copyReferralCode} disabled={!myReferralCode}>
                {codeCopied ? "Copied!" : "Copy your referral code"}
              </button>
            </Reveal>
          </section>

          <section className="ws-section" style={{ paddingTop: 0 }}>
            <Reveal className="ws-section-head">
              <span className="ws-eyebrow">Subscription</span>
              <h2>Manage your plan.</h2>
              <p>
                You&rsquo;re currently on <strong>{currentPlan}</strong>.{" "}
                {pendingRequestPlan
                  ? `Your request to switch to ${pendingRequestPlan} is awaiting approval.`
                  : isLocked && nextSwitchDate
                    ? `You can request a change that will take effect on ${nextSwitchDate.toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}.`
                    : "Request a switch any time — it takes effect once approved."}
              </p>
            </Reveal>
            <div className="ws-plan-grid">
              {plans.map((plan, i) => {
                const isCurrent = plan.name === currentPlan;
                return (
                  <Reveal
                    as="article"
                    key={plan.name}
                    className={`ws-plan-card ${plan.featured ? "is-featured" : ""} ${isCurrent ? "is-current" : ""}`}
                    delay={i * 90}
                    style={{ ["--plan-color" as string]: plan.color }}
                  >
                    {isCurrent ? (
                      <span className="ws-plan-badge ws-plan-badge-current">Current plan</span>
                    ) : (
                      plan.featured && <span className="ws-plan-badge">Most popular</span>
                    )}
                    <h3>{plan.name}</h3>
                    <p className="ws-plan-tagline">{plan.tagline}</p>
                    <ul className="ws-plan-features">
                      {plan.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <button type="button" className="ws-btn-ghost" disabled>
                        Your current plan
                      </button>
                    ) : pendingRequestPlan === plan.name ? (
                      <button type="button" className="ws-btn-ghost" disabled>
                        Request pending approval
                      </button>
                    ) : isLocked ? (
                      <>
                        <p className="ws-plan-contact-note">
                          Curious about pricing for {plan.name}? Reach out any time.
                        </p>
                        <Link href="/contact" className="ws-btn-ghost">
                          Contact to change plan
                        </Link>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="ws-btn-primary"
                        onClick={() => requestSwitchPlan(plan.name)}
                      >
                        Request this plan
                      </button>
                    )}
                  </Reveal>
                );
              })}
            </div>
            <p className="ws-portal-signup-note">
              Need to cancel instead?{" "}
              <Link href="/contact" className="ws-btn-ghost">
                Contact your account manager
              </Link>
              .
            </p>
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

      {switchConfirmation && (
        <Toast planName={switchConfirmation} onDismiss={() => setSwitchConfirmation("")} />
      )}

      {pendingPlan && (
        <div className="ws-confirm-overlay" onClick={cancelSwitchPlan}>
          <div className="ws-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="ws-eyebrow">Confirm request</span>
            <h3>Request a switch to {pendingPlan}?</h3>
            <p>
              This sends a request to your account manager for approval — it won&rsquo;t take effect until
              they approve it, and you won&rsquo;t be able to submit another request until this one is
              resolved or 30 days pass.
            </p>
            <div className="ws-confirm-actions">
              <button type="button" className="ws-btn-ghost" onClick={cancelSwitchPlan}>
                Cancel
              </button>
              <button type="button" className="ws-btn-primary" onClick={confirmSwitchPlan}>
                Yes, send request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
