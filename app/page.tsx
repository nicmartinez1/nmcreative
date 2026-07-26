"use client";

import React, { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import Link from "next/link";
import SiteNav from "./components/SiteNav";
import SiteFooter from "./components/SiteFooter";
import "./globals.css";

/* ==========================================================================
   Web Skillet — single-file marketing page component
   A shared ambient gradient and starfield sit behind the whole page, so the
   sections read as one connected surface rather than stacked, separate
   blocks.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* Scroll-reveal hook                                                      */
/* ---------------------------------------------------------------------- */

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
  id,
  className = "",
  style,
  delay = 0,
  children,
}: {
  as?: keyof React.JSX.IntrinsicElements;
  id?: string;
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
      id={id}
      className={`${className} ${inView ? "ws-in-view" : ""}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </Component>
  );
}

/* ---------------------------------------------------------------------- */
/* Floating stat chip — modern chat-bubble style                          */
/* ---------------------------------------------------------------------- */

function FloatChip({
  color,
  style,
  delay,
  children,
}: {
  color: string;
  style?: CSSProperties;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <Reveal
      className="ws-float-chip"
      delay={delay}
      style={{ ["--chip-color" as string]: color, ...style }}
    >
      <span className="ws-chip-sizzle ws-chip-sizzle-1" aria-hidden="true" />
      <span className="ws-chip-sizzle ws-chip-sizzle-2" aria-hidden="true" />
      <span className="ws-chip-sizzle ws-chip-sizzle-3" aria-hidden="true" />
      <span className="ws-chip-sizzle ws-chip-sizzle-4" aria-hidden="true" />
      <span className="ws-chip-sizzle ws-chip-sizzle-5" aria-hidden="true" />
      <span className="ws-chip-sizzle ws-chip-sizzle-6" aria-hidden="true" />
      {children}
    </Reveal>
  );
}

/* ---------------------------------------------------------------------- */
/* Count-up number for the results section                                 */
/* ---------------------------------------------------------------------- */

function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1500,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const { ref, inView } = useReveal<HTMLSpanElement>(0.5);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    let raf = 0;

    const tick = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(to * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="ws-stat-number">
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/* Expandable service card — bullets up front, full detail on demand       */
/* ---------------------------------------------------------------------- */

function ServiceCard({
  index,
  title,
  bullets,
  blurb,
  icon,
  color,
  points,
  delay,
}: {
  index: string;
  title: string;
  bullets: string[];
  blurb: string;
  icon: ReactNode;
  color: string;
  points: string;
  delay: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article
      className="ws-card ws-in-view"
      style={{ ["--card-color" as string]: color }}
    >
      <span className="ws-card-index">{index}</span>
      <div className="ws-card-icon">{icon}</div>
      <h3>{title}</h3>
      <ul className="ws-card-bullets">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <div className={`ws-card-detail ${open ? "is-open" : ""}`}>
        <div>
          <p>{blurb}</p>
          <svg viewBox="0 0 220 88" className="ws-mini-chart-svg">
            <line x1="34" y1="6" x2="34" y2="62" className="ws-mini-chart-axis" />
            <line x1="34" y1="62" x2="210" y2="62" className="ws-mini-chart-axis" />
            <text x="10" y="34" className="ws-mini-chart-label" transform="rotate(-90 10 34)">
              Growth
            </text>
            <text x="34" y="78" className="ws-mini-chart-label">Month 1</text>
            <text x="210" y="78" className="ws-mini-chart-label" textAnchor="end">Month 6</text>
            <g transform="translate(34 6) scale(0.88 0.8)">
              <polyline points={points} />
            </g>
          </svg>
        </div>
      </div>
      <button
        type="button"
        className="ws-card-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Show less" : "More detail"}
        <svg
          className={`ws-card-chevron ${open ? "is-open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </article>
  );
}

/* ---------------------------------------------------------------------- */
/* Icons                                                                    */
/* ---------------------------------------------------------------------- */

const icon = {
  design: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4.5" width="18" height="15" rx="2.2" />
      <path d="M3 8.5h18" strokeLinecap="round" />
      <circle cx="6" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M7 13.5l3 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  social: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="17.5" cy="5.5" r="2.4" />
      <circle cx="17.5" cy="18.5" r="2.4" />
      <path d="M8.1 10.8l7.4-4.2M8.1 13.2l7.4 4.2" strokeLinecap="round" />
    </svg>
  ),
  ads: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 10v4a1 1 0 0 0 1 1h2l1.5 5H10l-1-5h2.5l6 3V6l-6 3H4a1 1 0 0 0-1 1z" strokeLinejoin="round" />
      <path d="M18.5 9.5a4 4 0 0 1 0 5" strokeLinecap="round" />
    </svg>
  ),
  seo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.3 15.3L21 21" strokeLinecap="round" />
      <path d="M7.5 11.5l1.8 1.8 3.2-3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  ),
  tap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 12.5V6a1.6 1.6 0 0 1 3.2 0v5" strokeLinecap="round" />
      <path d="M12.2 11V4.6a1.6 1.6 0 0 1 3.2 0V11" strokeLinecap="round" />
      <path d="M15.4 11.2V6.4a1.6 1.6 0 0 1 3.2 0v7.6c0 3.9-2.4 7-6.2 7-2.6 0-4-1-5.4-2.8L4 14.8a1.5 1.5 0 0 1 2.3-1.9L9 15.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" strokeLinejoin="round" />
      <path d="M7 5H4.5A2.5 2.5 0 0 0 5.8 9.6M17 5h2.5a2.5 2.5 0 0 1-1.3 4.6" strokeLinecap="round" />
      <path d="M12 13v3.5M8.5 20.5h7M9.5 20.5V17a2.5 2.5 0 0 1 5 0v3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ---------------------------------------------------------------------- */
/* Content                                                                  */
/* ---------------------------------------------------------------------- */

const services = [
  {
    index: "01",
    title: "Web Design",
    color: "var(--accent)",
    bullets: [
      "Responsive on every device",
      "Built to convert, not just look nice",
      "Live in weeks, not quarters",
    ],
    blurb:
      "Fast, responsive sites built around how people actually shop, not how they look frozen in a mockup.",
    icon: icon.design,
    points: "0,60 40,58 80,50 120,42 160,28 200,10",
  },
  {
    index: "02",
    title: "Social Media Management",
    color: "var(--accent-2)",
    bullets: [
      "Content calendars & scheduling",
      "Real replies, real voice",
      "Consistent across every platform",
    ],
    blurb:
      "Content calendars, real replies, and a voice that actually sounds like you, consistent everywhere, built to turn followers into visitors.",
    icon: icon.social,
    points: "0,65 40,60 80,55 120,38 160,22 200,12",
  },
  {
    index: "03",
    title: "Ad Campaigns",
    color: "var(--growth-soft)",
    bullets: [
      "Search & social media campaigns",
      "Tested and retuned monthly",
      "Every dollar tracked",
    ],
    blurb:
      "Paid search and social media campaigns that get tested, measured, and retuned until every dollar you spend is earning its place.",
    icon: icon.ads,
    points: "0,62 40,64 80,52 120,44 160,30 200,14",
  },
  {
    index: "04",
    title: "SEO Optimization",
    color: "var(--neon-blue)",
    bullets: [
      "Technical fixes & audits",
      "On-page content strategy",
      "Link building that lasts",
    ],
    blurb:
      "Technical fixes, on-page content, and link building aimed at one thing: showing up on the page people actually scroll, and converting that visibility into sales.",
    icon: icon.seo,
    points: "0,68 40,62 80,50 120,36 160,20 200,8",
  },
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
      "Customer rewards & loyalty setup (e.g. Toast, for restaurants)",
      "Projected additional followers and up to 3x more customers",
    ],
  },
];

const localBenefits = [
  {
    title: "Show up before they walk in",
    body: "Most people search a business online before ever visiting: hours, reviews, photos. A real site puts you in that decision before they reach your door.",
    icon: icon.pin,
  },
  {
    title: "Turn searches into foot traffic",
    body: "Directions, services, and a clear way to book or call turn an online search into someone walking through your actual front door.",
    icon: icon.tap,
  },
  {
    title: "Compete with the chains",
    body: "Local SEO lets a single-location shop outrank national chains for the searches that actually matter in its own neighborhood.",
    icon: icon.trophy,
  },
  {
    title: "Sell after you've locked up",
    body: "Online booking, ordering, or even just a contact form that works at 9pm keeps you making sales while the lights are off.",
    icon: icon.clock,
  },
];

const processSteps = [
  { label: "Scan", title: "Audit", body: "We look at your current site, traffic, and channels to find what's actually holding growth back." },
  { label: "Blueprint", title: "Plan", body: "A prioritized roadmap across design, content, and campaigns, scoped to your budget, not ours." },
  { label: "Build", title: "Build & launch", body: "Design, copy, and campaigns go live in weeks, not quarters, with you reviewing at every stage." },
  { label: "Ship", title: "Optimize", body: "Monthly reporting and iteration, so traffic, engagement, and sales keep compounding after launch." },
];

/* ---------------------------------------------------------------------- */
/* Page                                                                     */
/* ---------------------------------------------------------------------- */

export default function WebSkillet() {
  return (
    <div className="ws-root">
      <SiteNav logoHref="#top" />

      <header id="top" className="ws-hero">
        <div className="ws-hero-bg" aria-hidden="true">
          <picture>
            <source media="(max-width: 720px)" srcSet="/assets/hero-mobile.png" />
            <img
              className="ws-hero-bg-img"
              src="/assets/hero-final.png"
              alt=""
            />
          </picture>
          <div className="ws-hero-bg-scrim" />
          <div className="ws-hero-shine" aria-hidden="true" />
          <div className="ws-hero-glow-pulse" aria-hidden="true" />
        </div>

        <div className="ws-section ws-hero-inner">
          <div className="ws-hero-copy">
            <Reveal className="ws-eyebrow ws-eyebrow-plain">Web design · social media · ads · SEO</Reveal>
            <Reveal delay={80}>
              <h1>
                Growth isn&rsquo;t luck. <em>It&rsquo;s built.</em>
              </h1>
            </Reveal>
            <Reveal delay={140} className="ws-hero-kicker">
              Built page by page. Grown post by post. Proven click by click.
            </Reveal>
            <Reveal delay={200} className="ws-hero-sub">
              We build fast, modern websites, optimize them to rank on Google, and run the social and
              ad campaigns that bring customers through the door — all built specifically to grow your
              business.
            </Reveal>
            <Reveal delay={240} className="ws-hero-actions">
              <Link href="/contact" className="ws-btn-primary">
                Schedule a call
              </Link>
              <a href="#services" className="ws-btn-ghost">
                See the stack ↓
              </a>
            </Reveal>
            <Reveal delay={320} className="ws-hero-note">
              No long-term contracts · Free consult
            </Reveal>
          </div>
        </div>
      </header>

      <section id="services" className="ws-section ws-services">
        <div className="ws-glow-orb" style={{ top: "-4rem", left: "8%", width: "260px", height: "260px", ["--orb-color" as string]: "var(--accent-2)" }} />
        <div className="ws-glow-orb" style={{ bottom: "-6rem", right: "6%", width: "220px", height: "220px", animationDelay: "2s", ["--orb-color" as string]: "var(--accent)" }} />
        <FloatChip
          color="var(--accent-2)"
          style={{ top: "1rem", right: "calc(-50vw + 736px)" }}
        >
          Social traffic grows 2.6× in six months.
        </FloatChip>
        <FloatChip
          color="var(--accent)"
          delay={200}
          style={{ top: "5.5rem", left: "calc(-50vw + 780px)", animationDelay: "1.2s" }}
        >
          Most new sites go live in just two weeks.
        </FloatChip>
        <Reveal className="ws-section-head">
          <span className="ws-eyebrow" style={{ color: "var(--accent-2)" }}>The stack</span>
          <h2>Designed to convert. Built to <em style={{ color: "var(--accent-2)" }}>rank</em>.</h2>
          <p>
            Great design means nothing if no one finds it. We build your site
            and your SEO together from day one, so they're never fighting
            each other, then bring social media and ads in to amplify what's
            already working.
          </p>
        </Reveal>
        <div className="ws-services-grid">
          {services.map((s, i) => (
            <ServiceCard
              key={s.title}
              index={s.index}
              title={s.title}
              bullets={s.bullets}
              blurb={s.blurb}
              icon={s.icon}
              color={s.color}
              points={s.points}
              delay={i * 90}
            />
          ))}
        </div>
      </section>

      <section id="plans" className="ws-section" style={{ paddingTop: 0 }}>
        <Reveal className="ws-section-head">
          <span className="ws-eyebrow" style={{ color: "var(--accent-2)" }}>Ongoing plans</span>
          <h2>Once it&rsquo;s built, keep it <em style={{ color: "var(--accent-2)" }}>growing</em>.</h2>
          <p>
            Every site launches with a plan already in place to keep it
            secure, fast, and found, upgrade whenever you&rsquo;re ready for more.
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
              <p className="ws-plan-tagline">{plan.tagline}</p>
              <ul className="ws-plan-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link href="/contact" className="ws-btn-primary">
                Get started
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="results" className="ws-section ws-results">
        <div className="ws-glow-orb" style={{ top: "-3rem", right: "10%", width: "240px", height: "240px", ["--orb-color" as string]: "var(--growth-soft)" }} />
        <div className="ws-glow-orb" style={{ bottom: "4rem", left: "4%", width: "200px", height: "200px", animationDelay: "1.5s", ["--orb-color" as string]: "var(--accent)" }} />
        <FloatChip
          color="var(--growth-soft)"
          style={{ top: "2.5rem", left: "calc(-50vw + 736px)" }}
        >
          Every month it compounds a little more.
        </FloatChip>
        <FloatChip
          color="var(--accent)"
          delay={200}
          style={{ top: "1rem", right: "calc(-50vw + 780px)", animationDelay: "0.8s" }}
        >
          No guesswork. Every result gets tracked.
        </FloatChip>
        <Reveal className="ws-section-head">
          <span className="ws-eyebrow" style={{ color: "var(--growth-soft)" }}>
            The result
          </span>
          <h2>SEO and social media don't just build an audience. They build <em style={{ color: "var(--growth-soft)" }}>revenue</em>.</h2>
          <p>
            A beautiful site nobody finds is just expensive wallpaper. Pair
            it with real SEO and a social media presence that actually posts, and
            traffic, followers, and sales tend to start climbing at the same
            time. Here's what that curve usually looks like.
          </p>
        </Reveal>

        <div className="ws-results-grid">
          <Reveal>
            <div className="ws-chart-card">
              <div className="ws-chart-label-row">
                <span>Traffic & sales, indexed</span>
                <span>Projected, 6 months</span>
              </div>
              <svg className="ws-chart-svg" viewBox="0 0 420 200">
                <line x1="150" y1="10" x2="150" y2="170" className="ws-chart-divider" />
                <text x="18" y="188" className="ws-chart-mark">Before</text>
                <text x="160" y="188" className="ws-chart-mark">Web Skillet begins</text>
                <text x="360" y="188" className="ws-chart-mark">Month 6</text>

                <polyline
                  className="ws-chart-line"
                  points="10,150 80,148 150,150 220,120 290,80 360,40 410,22"
                />
                <polyline
                  className="ws-chart-line ws-accent"
                  points="10,165 80,164 150,163 220,150 290,138 360,120 410,108"
                />
              </svg>
              <div className="ws-chart-label-row" style={{ marginTop: "0.75rem" }}>
                <span style={{ color: "var(--growth-soft)" }}>● Social media & search traffic</span>
                <span style={{ color: "var(--accent)" }}>● Sales</span>
              </div>
            </div>
          </Reveal>

          <div className="ws-stats-list">
            <Reveal className="ws-stat" delay={0}>
              <CountUp to={3.2} decimals={1} suffix="×" />
              <p>
                <span className="ws-stat-title">Organic search traffic</span>
                Organic search traffic grows 3.2 times over within six months
                once we stop guessing and start optimizing.
              </p>
            </Reveal>
            <Reveal className="ws-stat" delay={100}>
              <CountUp to={2.6} decimals={1} suffix="×" />
              <p>
                <span className="ws-stat-title">Social media traffic</span>
                Social media traffic grows 2.6 times over once your bio link
                finally leads somewhere worth clicking.
              </p>
            </Reveal>
            <Reveal className="ws-stat" delay={200}>
              <CountUp to={47} suffix="%" />
              <p>
                <span className="ws-stat-title">Sales growth</span>
                Sales grow 47% once that traffic lands somewhere actually
                built to close the deal.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal as="div" id="process" className="ws-process">
          {processSteps.map((step, i) => (
            <div className="ws-process-step" key={step.title}>
              <span className="ws-eyebrow">{step.label}</span>
              <h4>{step.title}</h4>
              <p>{step.body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section id="local" className="ws-section ws-local">
        <div className="ws-glow-orb" style={{ top: "-3rem", left: "10%", width: "240px", height: "240px", ["--orb-color" as string]: "var(--neon-blue)" }} />
        <div className="ws-glow-orb" style={{ bottom: "2rem", right: "6%", width: "220px", height: "220px", animationDelay: "1.8s", ["--orb-color" as string]: "var(--accent-2)" }} />
        <FloatChip
          color="var(--neon-blue)"
          style={{ top: "1.25rem", right: "calc(-50vw + 780px)" }}
        >
          Show up right where locals are searching.
        </FloatChip>
        <FloatChip
          color="var(--accent-2)"
          delay={200}
          style={{ top: "5.5rem", left: "calc(-50vw + 736px)", animationDelay: "1.6s" }}
        >
          Your site stays open for business, 24/7.
        </FloatChip>
        <Reveal className="ws-section-head">
          <span className="ws-eyebrow" style={{ color: "var(--neon-blue)" }}>For local businesses</span>
          <h2>Your storefront closes at 6pm. Your website <em style={{ color: "var(--neon-blue)" }}>shouldn&rsquo;t</em>.</h2>
          <p>
            A great location still matters, but the search happens before
            the visit. Brick-and-mortar businesses with a real online
            presence get found, get chosen, and get paid, even when the
            doors are locked.
          </p>
        </Reveal>

        <div className="ws-local-grid">
          <div className="ws-local-list">
            {localBenefits.map((b, i) => (
              <Reveal as="div" key={b.title} className="ws-local-item" delay={i * 90}>
                <span className="ws-local-item-icon">{b.icon}</span>
                <div>
                  <h4>{b.title}</h4>
                  <p>{b.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={180}>
            <div className="ws-local-card">
              <div className="ws-local-card-stat">
                <strong>76%</strong>
                <span>
                  76% of people who search for a local business on their
                  phone visit it within a day.
                </span>
              </div>
              <div className="ws-local-card-stat">
                <strong>3.7×</strong>
                <span>
                  A customer is 3.7 times more likely to buy from a business
                  with a real, working website than one without.
                </span>
              </div>
              <div className="ws-local-card-stat">
                <strong>28%</strong>
                <span>
                  Foot traffic rises by a projected 28% once a local site and
                  search listing are actually optimized.
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="contact" className="ws-section ws-cta">
        <div className="ws-glow-orb" style={{ top: "-2rem", left: "14%", width: "220px", height: "220px", ["--orb-color" as string]: "var(--accent)" }} />
        <div className="ws-glow-orb" style={{ bottom: "-2rem", right: "12%", width: "220px", height: "220px", animationDelay: "2.4s", ["--orb-color" as string]: "var(--accent-2)" }} />
        <Reveal>
          <span className="ws-eyebrow">Let's get building</span>
        </Reveal>
        <Reveal delay={80} as="h2">
          Growth isn&rsquo;t going to build itself.
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
    </div>
  );
}