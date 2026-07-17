import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/context/AuthProvider";
import { CartProvider } from "@/context/CartProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl font-bold">404</h1>
        <p className="mt-3 text-muted-foreground">This page has wandered off the trail.</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90">Return home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head back home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">Try again</button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hide & Field — Leather Goods & Sports Equipment" },
      { name: "description", content: "Hide & Field offers handcrafted leather goods and durable sports equipment — wallets, bags, jerseys, and gear built for everyday performance." },
      { property: "og:title", content: "Hide & Field — Leather Goods & Sports Equipment" },
      { property: "og:description", content: "Hide & Field offers handcrafted leather goods and durable sports equipment — wallets, bags, jerseys, and gear built for everyday performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Hide & Field — Leather Goods & Sports Equipment" },
      { name: "twitter:description", content: "Hide & Field offers handcrafted leather goods and durable sports equipment — wallets, bags, jerseys, and gear built for everyday performance." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9aef8d1e-219b-4dc6-a523-8ba75539573b" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9aef8d1e-219b-4dc6-a523-8ba75539573b" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1"><Outlet /></main>
            <Footer />
          </div>
          <Toaster richColors position="top-right" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
