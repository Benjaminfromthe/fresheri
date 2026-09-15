import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign In — Fresheri",
  description: "Sign in or create your Fresheri account to buy, sell, and track fresh produce.",
};

// Server component — AuthCard is "use client" so it handles all interactivity
export default function AuthPage() {
  return <AuthCard />;
}
