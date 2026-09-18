import { redirect } from "next/navigation";

// Root / → default locale landing page (no prefix for 'en')
export default function RootPage() {
  redirect("/");
}
