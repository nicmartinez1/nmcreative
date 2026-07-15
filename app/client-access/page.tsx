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
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(plans[0].name);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  const loadPlan = async (uid: string) => {
    const { data } = await supabase
      .from("plan_changes")
      .select("plan_name")
      .eq("user_id", uid)
      .order("changed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setCurrentPlan(data.plan_name);
  };

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setUserId(null);
  };

  const handleSwitchPlan = async (planName: string) => {
    if (!userId) return;
    setSwitchingPlan(true);
    const { error: insertError } = await supabase
      .from("plan_changes")
      .insert({ user_id: userId, plan_name: planName });
    setSwitchingPlan(false);
    if (!insertError) {
      setCurrentPlan(planName);
    }
  };

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
              <h2>Welcome back.</h2>
              <p>
                Log in to check your project status, reach your support
                team, or upgrade your plan.
              </p>
            </Reveal>
          </header>

          <section className="ws-section" style={{ paddingTop: 0, paddingBottom: "clamp(5rem, 10vw, 8rem)" }}>
            <div className="ws-form-card ws-form-card-static">
              <form className="ws-form" onSubmit={handleLogin}>
                <label className="ws-form-field">
                  <span>Business email</span>
                  <input
                    type="email"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="ws-form-field">
                  <span>Password</span>
                  <input
                    type="password"
                    placeholder="••••••••"
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
              <p className="ws-portal-signup-note">
                Not a client yet?{" "}
                <Link href="/contact" className="ws-btn-ghost">
                  Get in touch
                </Link>{" "}
                to get set up.
              </p>
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
              <p>Here&rsquo;s where your project stands, and how to reach us.</p>
              <button type="button" className="ws-btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </Reveal>
          </header>

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
          </section>

          <section className="ws-section" style={{ paddingTop: 0 }}>
            <Reveal className="ws-section-head">
              <span className="ws-eyebrow">Subscription</span>
              <h2>Manage your plan.</h2>
              <p>
                You&rsquo;re currently on <strong>{currentPlan}</strong>. Switch
                any time — changes take effect on your next billing cycle.
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
                    <p className="ws-plan-price">{plan.price}</p>
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
                    ) : (
                      <button
                        type="button"
                        className="ws-btn-primary"
                        disabled={switchingPlan}
                        onClick={() => handleSwitchPlan(plan.name)}
                      >
                        {switchingPlan ? "Switching…" : "Switch to this plan"}
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
    </div>
  );
}
