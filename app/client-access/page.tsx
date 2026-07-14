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

const progressSteps = [
  { label: "Discovery", status: "done" },
  { label: "Design", status: "done" },
  { label: "Build", status: "active" },
  { label: "Review", status: "upcoming" },
  { label: "Launch", status: "upcoming" },
];

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Login isn't connected yet — use the dev bypass below to preview the portal.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
  };

  const handleDevBypass = () => {
    setError("");
    setLoggedIn(true);
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
              {process.env.NODE_ENV === "development" && (
                <button
                  type="button"
                  className="ws-btn-ghost ws-portal-dev-bypass"
                  onClick={handleDevBypass}
                >
                  Skip login (dev only) →
                </button>
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
              <p>Here&rsquo;s where your project stands, and how to reach us.</p>
              <button type="button" className="ws-btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </Reveal>
          </header>

          <section className="ws-section" style={{ paddingTop: 0 }}>
            <Reveal className="ws-portal-card">
              <h3>Project progress</h3>
              <div className="ws-portal-steps">
                {progressSteps.map((step, i) => (
                  <div className={`ws-portal-step is-${step.status}`} key={step.label}>
                    <span className="ws-portal-step-dot">{step.status === "done" ? "✓" : i + 1}</span>
                    <span className="ws-portal-step-label">{step.label}</span>
                  </div>
                ))}
              </div>
              <p className="ws-portal-note">
                Example timeline shown here — once your build starts, this
                reflects real progress from your project team.
              </p>
            </Reveal>

            <div className="ws-portal-grid">
              <Reveal delay={80} className="ws-portal-card">
                <h3>Need support?</h3>
                <p>
                  Bug, question, or a small change you need made — send it
                  over and your team will get back to you.
                </p>
                <Link href="/contact" className="ws-btn-primary">
                  Message support
                </Link>
              </Reveal>

              <Reveal delay={160} className="ws-portal-card">
                <h3>Get IT help</h3>
                <p>
                  Hosting, security, or anything technical — chat with our
                  IT team live, or send a message and we&rsquo;ll get it
                  sorted.
                </p>
                <Link href="/contact" className="ws-btn-ghost">
                  Chat with IT support →
                </Link>
              </Reveal>
            </div>
          </section>

          <section className="ws-section" style={{ paddingTop: 0 }}>
            <Reveal className="ws-section-head">
              <span className="ws-eyebrow">Upgrade</span>
              <h2>Ready to grow further?</h2>
              <p>
                Add ongoing SEO or a full marketing push whenever you&rsquo;re
                ready — no need to start over with a new team.
              </p>
            </Reveal>
            <div className="ws-plan-grid">
              {plans.map((plan, i) => (
                <Reveal
                  as="article"
                  key={plan.name}
                  className={`ws-plan-card ${plan.featured ? "is-featured" : ""}`}
                  delay={i * 90}
                  style={{ ["--plan-color" as string]: plan.color }}
                >
                  {plan.featured && <span className="ws-plan-badge">Most popular</span>}
                  <h3>{plan.name}</h3>
                  <p className="ws-plan-price">{plan.price}</p>
                  <p className="ws-plan-tagline">{plan.tagline}</p>
                  <ul className="ws-plan-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link href="/contact" className="ws-btn-primary">
                    Request this plan
                  </Link>
                </Reveal>
              ))}
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
    </div>
  );
}
