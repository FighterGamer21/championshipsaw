import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Snowflake, Copy } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Register — ARCTIXMC Championship Season 1" },
      { name: "description", content: "Sign up using your Minecraft username for ARCTIXMC Championship Season 1." },
    ],
  }),
});

const schema = z.object({
  ign: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_]+$/, "Only letters, numbers, underscore"),
  discord: z.string().trim().max(64).optional(),
  version: z.string().optional(),
  attendAll: z.enum(["yes", "no"]),
  agree: z.literal(true),
});

const VERSIONS = ["1.21", "1.20.6", "1.20.4", "1.20.1", "1.19.4", "1.18.2"];

function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [serverIp, setServerIp] = useState("play.arctixmc.net");

  useEffect(() => {
    supabase.from("settings").select("registration_open,event_status,server_ip").eq("id", 1).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setServerIp(data.server_ip ?? "play.arctixmc.net");
        setOpen(data.registration_open && data.event_status !== "REGISTRATION_CLOSED" && data.event_status !== "COMPLETED");
      });
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      ign: String(fd.get("ign") ?? ""),
      discord: String(fd.get("discord") ?? "") || undefined,
      version: String(fd.get("version") ?? "") || undefined,
      attendAll: String(fd.get("attendAll") ?? "yes") as "yes" | "no",
      agree: fd.get("agree") === "on" ? (true as const) : (false as never),
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid form"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("players").insert({
      ign: parsed.data.ign,
      discord_username: parsed.data.discord ?? "",
      minecraft_version: parsed.data.version ?? "1.21",
      timezone: "",
      can_attend_all_days: parsed.data.attendAll === "yes",
      status: "REGISTERED",
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message ?? "";
      if (msg.includes("BANNED")) toast.error("You are banned from registering for this event.");
      else if (error.code === "23505") toast.error("That Minecraft username is already registered.");
      else toast.error(msg);
      return;
    }
    setDone(parsed.data.ign);
  };

  const copyIp = async () => { await navigator.clipboard.writeText(serverIp); toast.success("Server IP copied"); };

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs tracking-[0.3em] text-[#00d4ff]">
            <Snowflake className="h-3 w-3" /> REGISTRATION
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Join the Championship</h1>
          <p className="text-muted-foreground mt-3">Lock in your spot in ARCTIXMC Season 1.</p>
        </div>

        {done ? (
          <div className="mt-10 glass-strong rounded-2xl p-10 text-center glow-cyan">
            <CheckCircle2 className="h-14 w-14 mx-auto text-[#00d4ff]" />
            <h2 className="font-display text-2xl mt-4">You're In, {done}!</h2>
            <p className="text-muted-foreground mt-3">You are registered for ARCTIXMC CHAMPIONSHIP — SEASON 1. Join <span className="text-[#00d4ff] font-mono">{serverIp}</span> before the event starts.</p>
            <div className="mt-5 inline-flex items-center gap-2 glass rounded-full px-3 py-1.5">
              <span className="font-mono text-sm text-[#00d4ff]">{serverIp}</span>
              <button onClick={copyIp} className="rounded-full bg-[#00d4ff] text-[#07111f] p-1.5"><Copy className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <Button asChild className="bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90"><Link to="/bracket">View Bracket</Link></Button>
              <Button asChild variant="outline" className="border-cyan"><Link to="/">Home</Link></Button>
            </div>
          </div>
        ) : !open ? (
          <div className="mt-10 glass-strong rounded-2xl p-10 text-center">
            <h2 className="font-display text-2xl">Registration is currently closed.</h2>
            <p className="text-muted-foreground mt-2">Stay tuned for updates on the news and live pages.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <Button asChild variant="outline" className="border-cyan"><Link to="/news">News</Link></Button>
              <Button asChild className="bg-[#00d4ff] text-[#07111f]"><Link to="/">Home</Link></Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 glass-strong rounded-2xl p-6 sm:p-8 space-y-5">
            <Field label="Minecraft Username (IGN)" required><Input name="ign" required maxLength={32} placeholder="Notch" /></Field>
            <Field label="Discord Username (optional)"><Input name="discord" maxLength={64} placeholder="user or user#0000" /></Field>
            <Field label="Minecraft Version (optional)">
              <Select name="version" defaultValue="1.21">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VERSIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div>
              <Label className="text-sm">Can attend all 3 days?</Label>
              <RadioGroup name="attendAll" defaultValue="yes" className="mt-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="yes" /> Yes</label>
                <label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="no" /> No</label>
              </RadioGroup>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox name="agree" required className="mt-0.5" />
              <span className="text-muted-foreground">I agree to the <Link to="/rules" className="text-[#00d4ff] underline">tournament rules</Link>.</span>
            </label>
            <Button type="submit" disabled={submitting} className="w-full bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90 font-bold">
              {submitting ? "Submitting..." : "Register for Season 1"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">No login or email needed. Just your Minecraft username.</p>
          </form>
        )}
      </section>
    </PageShell>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <Label className="text-sm">{label}{required && <span className="text-[#00d4ff]"> *</span>}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
