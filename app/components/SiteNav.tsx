"use client";

import { useState } from "react";
import Link from "next/link";

export default function SiteNav({ logoHref = "/" }: { logoHref?: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="ws-nav">
        <Link href={logoHref} className="ws-logo">
          <span className="ws-logo-crop">
            <img src="/assets/webskilletlogo.png" alt="Web Skillet" className="ws-logo-full" />
          </span>
        </Link>
        <ul className="ws-nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/examples">Examples</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
        <Link href="/contact" className="ws-nav-cta">Start a project</Link>
        <button
          type="button"
          className={`ws-nav-burger ${open ? "is-open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
      <div className={`ws-nav-mobile ${open ? "is-open" : ""}`}>
        <Link href="/" onClick={close}>Home</Link>
        <Link href="/examples" onClick={close}>Examples</Link>
        <Link href="/about" onClick={close}>About</Link>
        <Link href="/contact" onClick={close}>Contact</Link>
        <Link href="/contact" className="ws-btn-primary" onClick={close}>
          Start a project
        </Link>
      </div>
    </>
  );
}
