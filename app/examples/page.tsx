"use client";

import React, { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
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
  ...rest
}: {
  as?: keyof React.JSX.IntrinsicElements | React.ComponentType<any>;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  children: ReactNode;
  [key: string]: any;
}) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const Component = Tag as any;
  return (
    <Component
      ref={ref}
      className={`${className} ${inView ? "ws-in-view" : ""}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Component>
  );
}

function BrowserMock({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 320 200" className="ws-example-mock" style={{ ["--card-color" as string]: color }}>
      <rect x="1" y="1" width="318" height="198" rx="12" className="ws-example-mock-frame" />
      <circle cx="16" cy="16" r="3" className="ws-example-mock-dot" />
      <circle cx="26" cy="16" r="3" className="ws-example-mock-dot" />
      <circle cx="36" cy="16" r="3" className="ws-example-mock-dot" />
      <rect x="0" y="28" width="320" height="1" className="ws-example-mock-frame" />
      <rect x="16" y="46" width="140" height="14" rx="4" className="ws-example-mock-bar-strong" />
      <rect x="16" y="68" width="200" height="8" rx="3" className="ws-example-mock-bar" />
      <rect x="16" y="82" width="160" height="8" rx="3" className="ws-example-mock-bar" />
      <rect x="16" y="104" width="70" height="24" rx="12" className="ws-example-mock-cta" />
      <rect x="16" y="146" width="88" height="42" rx="8" className="ws-example-mock-block" />
      <rect x="116" y="146" width="88" height="42" rx="8" className="ws-example-mock-block" />
      <rect x="216" y="146" width="88" height="42" rx="8" className="ws-example-mock-block" />
    </svg>
  );
}

const examples = [
  {
    title: "Restaurant & Café",
    color: "var(--accent)",
    body: "Menu, hours, and online ordering front and center. Most people decide where to eat about five minutes before they walk in.",
    previewImage: "/assets/resturauntandcafemock.png",
  },
  {
    title: "Home & Trade Services",
    color: "var(--accent-2)",
    body: "Reviews, service areas, and a booking form above the fold, built for people searching with a problem right now, not browsing.",
    previewImage: "/assets/homeandtradeservices.png",
  },
  {
    title: "Retail & Boutique",
    color: "var(--growth-soft)",
    body: "Product photography that doesn't fight the layout, plus a checkout that doesn't lose people on the last click.",
    previewImage: "/assets/retailandbotique.png",
  },
  {
    title: "Custom",
    color: "var(--neon-blue)",
    body: "Doesn't fit a template? We scope it from scratch: whatever your business actually needs, credentials and case studies included where it matters.",
    link: "/contact",
  },
];

export default function Examples() {
  const [preview, setPreview] = useState<{ title: string; image: string } | null>(null);

  return (
    <div className="ws-root">
      <SiteNav />

      <header className="ws-section" style={{ paddingTop: "clamp(8rem, 14vw, 11rem)" }}>
        <Reveal className="ws-section-head" style={{ marginBottom: "0" }}>
          <span className="ws-eyebrow">Examples</span>
          <h2>The kind of sites we build.</h2>
          <p>
            Every business searches differently, so every site needs a
            different job to do. Here&rsquo;s how that plays out across a few
            common types of businesses we work with.
          </p>
        </Reveal>
      </header>

      <section className="ws-section" style={{ paddingTop: 0 }}>
        <div className="ws-examples-grid">
          {examples.map((ex, i) => (
            <Reveal
              as={ex.link ? Link : "article"}
              href={ex.link}
              key={ex.title}
              className={`ws-example-card ${ex.previewImage || ex.link ? "ws-example-card-hoverable" : ""}`}
              delay={i * 90}
              style={{ ["--card-color" as string]: ex.color }}
              onClick={() => ex.previewImage && setPreview({ title: ex.title, image: ex.previewImage })}
            >
              <BrowserMock color={ex.color} />
              <h3>{ex.title}</h3>
              <p>{ex.body}</p>
              {ex.previewImage && <span className="ws-example-preview-hint">Click to preview →</span>}
              {ex.link && <span className="ws-example-preview-hint">Get in touch →</span>}
            </Reveal>
          ))}
        </div>
      </section>

      <section className="ws-section ws-cta">
        <Reveal>
          <span className="ws-eyebrow">See yours here next</span>
        </Reveal>
        <Reveal delay={80} as="h2">
          What would your business look like, done right?
        </Reveal>
        <Reveal delay={160}>
          <p>
            Tell us what you're working with, and we'll reply with a plan, not a
            sales pitch.
          </p>
        </Reveal>
        <Reveal delay={240} className="ws-cta-actions">
          <Link href="/contact" className="ws-btn-primary">
            Book a free consult
          </Link>
        </Reveal>
      </section>

      <SiteFooter />

      {preview && (
        <div className="ws-preview-overlay" onClick={() => setPreview(null)}>
          <div className="ws-preview-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="ws-preview-modal-head">
              <span>{preview.title}</span>
              <button
                type="button"
                className="ws-preview-close"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="ws-preview-scroll">
              <img src={preview.image} alt={`${preview.title} example site`} className="ws-preview-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
