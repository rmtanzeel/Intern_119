import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/" }),
  head: () => ({ meta: [{ title: "Sign in — Hide & Field" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const { redirect } = Route.useSearch();
  const nav = Route.useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  if (user) {
    nav({ to: redirect || "/" });
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = mode === "signup"
      ? z.object({ email: z.string().email(), password: z.string().min(6), fullName: z.string().min(2) })
      : z.object({ email: z.string().email(), password: z.string().min(1), fullName: z.string().optional() });
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setBusy(true);
    const { error } = mode === "login"
      ? await signIn(form.email, form.password)
      : await signUp(form.email, form.password, form.fullName);
    setBusy(false);
    if (error) return toast.error(error);
    toast.success(mode === "login" ? "Welcome back" : "Account created");
    nav({ to: redirect || "/" });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <Card className="p-8">
        <h1 className="font-serif text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "Sign in to continue." : "Join Hide & Field."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={mode === "signup" ? 6 : undefined} />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground hover:opacity-90">
            {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? "New to Hide & Field?" : "Already have an account?"}{" "}
          <button className="font-medium text-accent hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">← Back to home</Link>
        </p>
      </Card>
    </div>
  );
}
