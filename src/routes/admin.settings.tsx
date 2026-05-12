import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, RefreshCw, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Admin" }, { name: "robots", content: "noindex" }] }),
});

type Settings = {
  id: number; registration_open: boolean; current_day: number; current_round: string | null;
  event_status: string; api_key: string | null; event_start_at: string | null;
  event_name: string; server_ip: string; homepage_title: string; homepage_subtitle: string;
  max_registrations: number | null; rules_text: string; prize_details: string;
  discord_link: string | null; store_link: string | null; footer_text: string;
  visible_sections: Record<string, boolean>;
};

const EVENT_STATUSES = ["UPCOMING", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "LIVE", "PAUSED", "COMPLETED"];
const SECTION_KEYS = ["news", "featured", "event_details", "schedule", "rules", "top3", "champion"];

function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [eventStart, setEventStart] = useState("");

  const load = async () => {
    const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
    if (data) {
      setS(data as Settings);
      setEventStart(data.event_start_at ? new Date(data.event_start_at).toISOString().slice(0, 16) : "");
    }
  };
  useEffect(() => { load(); }, []);

  if (!s) return <AdminShell><div className="p-10 text-muted-foreground">Loading…</div></AdminShell>;

  const update = async (patch: Partial<Settings>) => {
    const { error } = await supabase.from("settings").update(patch).eq("id", 1);
    if (error) return toast.error(error.message);
    setS({ ...s, ...patch });
    toast.success("Saved");
  };

  const generateKey = () => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const key = "arx_" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
    update({ api_key: key });
  };

  const resetEvent = async () => {
    const { error: eliminationsError } = await supabase.from("eliminations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (eliminationsError) return toast.error(eliminationsError.message);
    const { error: playersError } = await supabase.from("players").update({ status: "REGISTERED", current_day: 0, current_round: null, checked_in_at: null }).neq("id", "00000000-0000-0000-0000-000000000000");
    if (playersError) return toast.error(playersError.message);
    const { error: roundsError } = await supabase.from("rounds").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (roundsError) return toast.error(roundsError.message);
    const { error: settingsError } = await supabase.from("settings").update({ current_day: 0, current_round: null, event_status: "upcoming" }).eq("id", 1);
    if (settingsError) return toast.error(settingsError.message);
    toast.success("Event reset");
    load();
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <h1 className="font-display text-3xl">Settings</h1>

        <Card title="Homepage & Branding">
          <div className="space-y-4">
            <div><Label>Event Name</Label><Input className="mt-1" value={s.event_name ?? ""} onChange={(e) => setS({ ...s, event_name: e.target.value })} onBlur={(e) => update({ event_name: e.target.value })} /></div>
            <div><Label>Server IP</Label><Input className="mt-1" value={s.server_ip ?? ""} onChange={(e) => setS({ ...s, server_ip: e.target.value })} onBlur={(e) => update({ server_ip: e.target.value })} /></div>
            <div><Label>Homepage Title</Label><Input className="mt-1" value={s.homepage_title ?? ""} onChange={(e) => setS({ ...s, homepage_title: e.target.value })} onBlur={(e) => update({ homepage_title: e.target.value })} /></div>
            <div><Label>Homepage Subtitle</Label><Input className="mt-1" value={s.homepage_subtitle ?? ""} onChange={(e) => setS({ ...s, homepage_subtitle: e.target.value })} onBlur={(e) => update({ homepage_subtitle: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Discord Link</Label><Input className="mt-1" value={s.discord_link ?? ""} onChange={(e) => setS({ ...s, discord_link: e.target.value })} onBlur={(e) => update({ discord_link: e.target.value || null })} /></div>
              <div><Label>Store Link</Label><Input className="mt-1" value={s.store_link ?? ""} onChange={(e) => setS({ ...s, store_link: e.target.value })} onBlur={(e) => update({ store_link: e.target.value || null })} /></div>
            </div>
            <div><Label>Footer Text</Label><Input className="mt-1" value={s.footer_text ?? ""} onChange={(e) => setS({ ...s, footer_text: e.target.value })} onBlur={(e) => update({ footer_text: e.target.value })} /></div>
          </div>
        </Card>

        <Card title="Event Status & Registration">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><div className="font-medium">Registration Open</div><div className="text-sm text-muted-foreground">When off, public form is disabled.</div></div>
              <Switch checked={s.registration_open} onCheckedChange={(v) => update({ registration_open: v })} />
            </div>
            <div><Label>Event Status</Label>
              <Select value={s.event_status} onValueChange={(v) => update({ event_status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_STATUSES.map((x) => <SelectItem key={x} value={x}>{x.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Max Registrations (optional)</Label><Input type="number" className="mt-1" value={s.max_registrations ?? ""} onChange={(e) => setS({ ...s, max_registrations: e.target.value ? Number(e.target.value) : null })} onBlur={(e) => update({ max_registrations: e.target.value ? Number(e.target.value) : null })} /></div>
          </div>
        </Card>

        <Card title="Homepage Sections">
          <p className="text-sm text-muted-foreground mb-3">Toggle which sections appear on the homepage.</p>
          {SECTION_KEYS.map((k) => (
            <div key={k} className="flex items-center justify-between py-1.5">
              <span className="capitalize text-sm">{k.replace(/_/g, " ")}</span>
              <Switch checked={!!s.visible_sections?.[k]} onCheckedChange={(v) => update({ visible_sections: { ...(s.visible_sections ?? {}), [k]: v } })} />
            </div>
          ))}
        </Card>

        <Card title="Rules & Prizes">
          <div className="space-y-4">
            <div><Label>Rules Text (shown on homepage)</Label><Textarea className="mt-1" rows={6} value={s.rules_text ?? ""} onChange={(e) => setS({ ...s, rules_text: e.target.value })} onBlur={(e) => update({ rules_text: e.target.value })} /></div>
            <div><Label>Prize Details</Label><Textarea className="mt-1" rows={4} value={s.prize_details ?? ""} onChange={(e) => setS({ ...s, prize_details: e.target.value })} onBlur={(e) => update({ prize_details: e.target.value })} /></div>
          </div>
        </Card>

        <Card title="Event Start Time">
          <Label className="text-sm">Used for the public countdown</Label>
          <div className="flex gap-2 mt-2">
            <Input type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
            <Button onClick={() => update({ event_start_at: eventStart ? new Date(eventStart).toISOString() : null })} className="bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90">Save</Button>
          </div>
        </Card>

        <Card title="Plugin API Key">
          <p className="text-sm text-muted-foreground">Use this key from the Minecraft plugin to authenticate API calls. Treat it like a password.</p>
          <div className="mt-3 flex gap-2">
            <Input readOnly value={s.api_key ?? "Not generated"} className="font-mono text-xs" />
            <Button variant="outline" className="border-cyan" onClick={() => { if (s.api_key) { navigator.clipboard.writeText(s.api_key); toast.success("Copied"); } }}><Copy className="h-4 w-4" /></Button>
            <Button onClick={generateKey} className="bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90"><RefreshCw className="h-4 w-4 mr-2" />{s.api_key ? "Rotate" : "Generate"}</Button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">Available plugin endpoints (planned):</div>
            <div><code>GET /api/public/players</code> — list registered players</div>
            <div><code>POST /api/public/players/:id/status</code> — update player status</div>
            <div><code>POST /api/public/eliminations</code> — submit an elimination</div>
            <div><code>GET /api/public/event</code> — fetch current event state</div>
            <div><code>POST /api/public/event/round</code> — set the current round</div>
            <div className="pt-2">Auth header: <code>x-api-key: &lt;your key&gt;</code></div>
          </div>
        </Card>

        <Card title="Danger Zone">
          <p className="text-sm text-muted-foreground">Reset all rounds, eliminations, and player progress. Players keep their registration.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-3"><AlertTriangle className="h-4 w-4 mr-2" />Reset Event</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset the entire event?</AlertDialogTitle>
                <AlertDialogDescription>All rounds, eliminations, and player progress will be wiped. Players are kept but reset to REGISTERED.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetEvent}>Reset Event</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </div>
    </AdminShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-6">
      <div className="text-xs tracking-[0.3em] text-[#00d4ff] mb-4">{title.toUpperCase()}</div>
      {children}
    </div>
  );
}
