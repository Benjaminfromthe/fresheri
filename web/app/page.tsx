import { redirect } from "next/navigation";

// Root / redirects to /marketplace (default locale = en, no prefix)
export default function RootPage() {
  redirect("/marketplace");
}
