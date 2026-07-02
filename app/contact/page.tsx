"use client";

import React, { useEffect, useRef, useState, type ReactNode, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import "../globals.css";

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
  const [isStartup, setIsStartup] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleService = (s: string) => {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        </Reveal>
      </header>

      <section className="ws-section" style={{ paddingTop: 0, paddingBottom: "clamp(5rem, 10vw, 8rem)" }}>
        <div className="ws-form-card ws-form-card-static">
          {submitted ? (
            <div className="ws-form-success">
              <span className="ws-eyebrow" style={{ color: "var(--growth-soft)" }}>Got it</span>
              <h3>Thanks, that&rsquo;s in.</h3>
              <p>
                This form isn&rsquo;t wired up to a real inbox yet, so nothing
                was actually sent. Once a contact address is set up, this same
                form will go straight there.
              </p>
            </div>
          ) : (
            <form className="ws-form" onSubmit={handleSubmit}>
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
                <span>What are you working with? (optional)</span>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Current site, rough budget, timeline, whatever's useful."
                />
              </label>

              <button type="submit" className="ws-btn-primary">
                Request pricing
              </button>
            </form>
          )}
        </div>
      </section>

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
