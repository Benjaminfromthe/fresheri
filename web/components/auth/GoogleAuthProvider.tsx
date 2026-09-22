"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type React from "react";

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  // If no client ID, render children without provider (auth button self-hides)
  if (!clientId) return <>{children}</>;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
