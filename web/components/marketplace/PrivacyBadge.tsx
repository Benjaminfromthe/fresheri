"use client";

import { ShieldCheck } from "lucide-react";

import { PRIVACY_BADGE_MESSAGE } from "@/lib/constants";

interface PrivacyBadgeProps {
  message?: string;
  compact?: boolean;
}

export default function PrivacyBadge({
  message = PRIVACY_BADGE_MESSAGE,
  compact = false,
}: PrivacyBadgeProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
        <ShieldCheck size={10} />
        Privacy protected
      </span>
    );
  }

  return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
      <ShieldCheck size={14} className="text-blue-500 mt-0.5 shrink-0" />
      <p className="text-xs text-blue-700 leading-relaxed">{message}</p>
    </div>
  );
}
