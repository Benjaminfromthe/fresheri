"use client";

import type React from "react";

// Dynamically import GoogleOAuthProvider to prevent SSR crash when
// NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.
// The Google OAuth SDK accesses browser globals on load — must be client-only.
import dynamic from "next/dynamic";

const GoogleOAuthProvider = dynamic(
  () => import("@react-oauth/google").then((m) => m.GoogleOAuthProvider),
  { ssr: false }
);

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // No client ID configured — render children directly, Google button self-hides
  if (!clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
