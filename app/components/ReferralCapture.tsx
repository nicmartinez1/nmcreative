"use client";

import { useEffect } from "react";

export const REFERRAL_STORAGE_KEY = "ws_referral_code";

// Captures ?ref=<user id> from the URL on any page load and remembers
// it in localStorage, so it's still around later when the visitor
// eventually submits the contact form or signs up — even if they land
// on the homepage first and navigate elsewhere before converting.
export default function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
    }
  }, []);

  return null;
}
