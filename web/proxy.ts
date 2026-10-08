import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths EXCEPT:
    //   _next (Next.js internals)
    //   _vercel (Vercel internals)
    //   api/* (Next.js API routes — must not be locale-wrapped)
    //   files with extensions (static assets)
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
