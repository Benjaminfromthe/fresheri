import type React from "react";

// Minimal root layout — Next.js requires html + body here.
// All locale-aware rendering happens in app/[locale]/layout.tsx
// which wraps children with NextIntlClientProvider.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
