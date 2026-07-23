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

const values = [
  {
    title: "One team, not four vendors",
    color: "var(--accent)",
    body: "Your site, your social media, and your search strategy get built together, so they pull in the same direction instead of fighting each other.",
  },
  {
    title: "Built to convert, not just look nice",
    color: "var(--accent-2)",
    body: "A pretty site that doesn't turn visitors into customers is expensive wallpaper. Every page has a job to do.",
  },
  {
    title: "Real reporting, no vanity metrics",
    color: "var(--growth-soft)",
    body: "We report on traffic, leads, and sales, not just page views. If a number doesn't tie back to revenue, we don't lead with it.",
  },
  {
    title: "Small enough to actually call",
    color: "var(--neon-blue)",
    body: "No ticket queues or account managers relaying messages. You talk directly to the people doing the work.",
  },
];

export default function About() {
  return (
    <div className="ws-root">
      <SiteNav />

      <header className="ws-section" style={{ paddingTop: "clamp(8rem, 14vw, 11rem)" }}>
        <Reveal className="ws-section-head" style={{ marginBottom: "0" }}>
          <span className="ws-eyebrow">About</span>
          <h2>We&rsquo;re a small studio. That&rsquo;s on purpose.</h2>
          <p>
            Most businesses end up with a web designer, a social media
            person, an SEO consultant, and an ads agency: four different
            vendors with four different opinions, none of them talking to
            each other. Web Skillet is what happens when one team builds all
            of it together instead.
          </p>
        </Reveal>
      </header>

      <section className="ws-section" style={{ paddingTop: 0 }}>
        <div className="ws-examples-grid">
          {values.map((v, i) => (
            <Reveal
              as="article"
              key={v.title}
              className="ws-example-card"
              delay={i * 90}
              style={{ ["--card-color" as string]: v.color }}
            >
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="ws-section ws-cta">
        <Reveal>
          <span className="ws-eyebrow">Let's talk</span>
        </Reveal>
        <Reveal delay={80} as="h2">
          Want to know if we&rsquo;re the right fit?
        </Reveal>
        <Reveal delay={160}>
          <p>
            Tell us what you're working with, and we'll give you a straight
            answer, not a sales pitch.
          </p>
        </Reveal>
        <Reveal delay={240} className="ws-cta-actions">
          <Link href="/contact" className="ws-btn-primary">
            Book a free consult
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
