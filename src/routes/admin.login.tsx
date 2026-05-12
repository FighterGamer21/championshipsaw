import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Snowflake, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
  head: () => ({ meta: [{ title: "Admin Login — ARCTIXMC" }, { name: "robots", content: "noindex" }] }),
});

function AdminLoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user?.id) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
        if (r && r.length > 0) nav({ to: "/admin/dashboard" });
      }
    });
  }, [nav]);

  // Owner email constant kept server-side via DB function `claim_role`.

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) return toast.error(error.message);
      const uid = data.user?.id;
      if (!uid) return toast.error("Login failed");
      // Claim owner/admin role if eligible (no-op otherwise)
      await supabase.rpc("claim_role");
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (!r || r.length === 0) {
        await supabase.auth.signOut();
        return toast.error("This account has no admin access.");
      }
      toast.success("Welcome back");
      nav({ to: "/admin/dashboard" });
    } else {
      const redirectUrl = `${window.location.origin}/admin/login`;
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
      setSubmitting(false);
      if (error) return toast.error(error.message);
      const uid = data.user?.id;
      if (uid) {
        const { data: claimed } = await supabase.rpc("claim_role");
        if (claimed && claimed !== "none" && claimed !== "unauthenticated") {
          toast.success(`${String(claimed).toUpperCase()} account created`);
        } else {
          toast.message("Account created", { description: "Ask the owner to grant you a role." });
        }
      } else {
        toast.message("Check your email", { description: "Confirm your email then sign in." });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(0,212,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.1)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
            <Snowflake className="h-5 w-5 text-[#07111f]" />
          </div>
          <div className="font-display tracking-widest">ARCTIXMC</div>
        </Link>
        <div className="glass-strong rounded-2xl p-8 glow-cyan">
          <div className="flex items-center gap-2 text-[#00d4ff] mb-1"><Shield className="h-4 w-4" /><span className="text-xs tracking-[0.3em]">ADMIN ACCESS</span></div>
          <h1 className="font-display text-2xl mb-6">{mode === "login" ? "Sign In" : "Create Admin"}</h1>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-sm">Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Password</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90 font-bold">
              {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 w-full text-xs text-muted-foreground hover:text-[#00d4ff]">
            {mode === "login" ? "First admin? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
        <Link to="/" className="block text-center mt-6 text-xs text-muted-foreground hover:text-[#00d4ff]">← Back to site</Link>
      </div>
    </div>
  );
}
