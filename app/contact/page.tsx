"use client";

import React, { useEffect, useRef, useState, type ReactNode, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import Script from "next/script";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import "../globals.css";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

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
  const { ref, inView } = useReveal<HTMLDivElement>();
  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      className={`${className} ${inView ? "ws-in-view" : ""}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </Component>
  );
}

const serviceOptions = ["Web Design", "Social Media Management", "Ad Campaigns", "SEO Optimization"];

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isStartup, setIsStartup] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleService = (s: string) => {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const startAnotherRequest = () => {
    formRef.current?.reset();
    setIsStartup(false);
    setServices([]);
    setSubmitted(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: formData.get("businessName"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),
        isStartup,
        services,
        message: formData.get("message"),
        referralCode: formData.get("referralCode"),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong — try again in a moment.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="ws-root">
      <SiteNav />

      <header className="ws-section" style={{ paddingTop: "clamp(8rem, 14vw, 11rem)" }}>
        <Reveal className="ws-section-head" style={{ marginBottom: "0" }}>
          <span className="ws-eyebrow">Contact</span>
          <h2>Tell us about the business.</h2>
          <p>
            A few details on what you run and what you need, and we&rsquo;ll
            reply with a plan and a rough price, not a sales pitch.
          </p>
          <p>
            Prefer email? Send us a message about our services directly at{" "}
            <a href="mailto:webskillet.net@gmail.com">webskillet.net@gmail.com</a>.
          </p>
        </Reveal>
      </header>

      <section className="ws-section" style={{ paddingTop: 0, paddingBottom: "clamp(5rem, 10vw, 8rem)" }}>
        <div className="ws-form-card ws-form-card-static">
          {submitted ? (
            <div className="ws-form-success">
              <span className="ws-eyebrow" style={{ color: "var(--growth-soft)" }}>Got it</span>
              <h3>Thanks, that&rsquo;s in.</h3>
              <p>We got your message and will reply soon with a plan and a rough price.</p>
              <button type="button" className="ws-btn-ghost" onClick={startAnotherRequest}>
                Submit another request
              </button>
            </div>
          ) : (
            <form className="ws-form" ref={formRef} onSubmit={handleSubmit}>
              <div className="ws-form-row">
                <label className="ws-form-field">
                  <span>Business name</span>
                  <input type="text" name="businessName" placeholder="e.g. Riverside Coffee Co." required />
                </label>
                <label className="ws-form-field">
                  <span>Phone number</span>
                  <input type="tel" name="phone" placeholder="(555) 123-4567" required />
                </label>
              </div>

              <div className="ws-form-row">
                <label className="ws-form-field">
                  <span>Email</span>
                  <input type="email" name="email" placeholder="you@business.com" required />
                </label>
                <label className="ws-form-field">
                  <span>Business address {isStartup && <em>(optional)</em>}</span>
                  <input
                    type="text"
                    name="address"
                    placeholder={isStartup ? "Not open yet, leave blank" : "123 Main St, Your City"}
                    disabled={isStartup}
                    required={!isStartup}
                  />
                </label>
              </div>

              <label className="ws-form-checkbox">
                <input
                  type="checkbox"
                  checked={isStartup}
                  onChange={(e) => setIsStartup(e.target.checked)}
                />
                <span>This is a new / startup business, no storefront or address yet</span>
              </label>

              <div className="ws-form-field">
                <span>What are you interested in?</span>
                <div className="ws-form-pills">
                  {serviceOptions.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`ws-form-pill ${services.includes(s) ? "is-selected" : ""}`}
                      onClick={() => toggleService(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <label className="ws-form-field">
                <span>Need something more specific? (optional)</span>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Tell us exactly what you need — current site, rough budget, timeline, or a specific request."
                />
              </label>

              <label className="ws-form-field">
                <span>Referral code (optional)</span>
                <input type="text" name="referralCode" placeholder="e.g. RIVERSIDE-8K2Q" />
              </label>

              {error && <p className="ws-portal-error">{error}</p>}
              <button
                type="submit"
                className="ws-btn-primary"
                style={{ justifySelf: "center" }}
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Request pricing"}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="ws-section" style={{ paddingTop: 0 }}>
        <div className="ws-form-card ws-form-card-static" style={{ maxWidth: "56rem" }}>
          <span className="ws-eyebrow">Or talk it through</span>
          <h3 style={{ margin: "0.4rem 0 0.5rem" }}>Schedule a call</h3>
          <p style={{ marginBottom: "1.25rem", color: "rgba(21, 14, 40, 0.68)" }}>
            Free, no pressure — just a quick conversation about what your business needs.
          </p>
          {CALENDLY_URL ? (
            <>
              <div className="calendly-inline-widget" data-url={CALENDLY_URL} style={{ minWidth: "280px", height: "700px" }} />
              <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
            </>
          ) : (
            <p className="ws-portal-error">
              Scheduling isn&rsquo;t connected yet — add NEXT_PUBLIC_CALENDLY_URL to enable it.
            </p>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
