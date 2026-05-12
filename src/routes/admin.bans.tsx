import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Ban as BanIcon, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/bans")({
  component: BansPage,
  head: () => ({ meta: [{ title: "Bans — Admin" }, { name: "robots", content: "noindex" }] }),
});

type Ban = { id: string; ign: string; discord_username: string | null; reason: string; banned_until: string | null; created_at: string };

function BansPage() {
  const [bans, setBans] = useState<Ban[]>([]);
  const [ign, setIgn] = useState("");
  const [discord, setDiscord] = useState("");
  const [reason, setReason] = useState("");
  const [permanent, setPermanent] = useState(true);
  const [days, setDays] = useState(7);

  const load = async () => {
    const { data } = await supabase.from("bans").select("*").order("created_at", { ascending: false });
    setBans((data ?? []) as Ban[]);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!ign.trim()) return toast.error("IGN required");
    const banned_until = permanent ? null : new Date(Date.now() + days * 86400000).toISOString();
    const { error } = await supabase.from("bans").insert({ ign: ign.trim(), discord_username: discord.trim() || null, reason, banned_until });
    if (error) return toast.error(error.message);
    // Also flag any matching player as BANNED
    await supabase.from("players").update({ status: "BANNED" }).ilike("ign", ign.trim());
    toast.success("Player banned");
    setIgn(""); setDiscord(""); setReason("");
    load();
  };

  const unban = async (b: Ban) => {
    const { error } = await supabase.from("bans").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Unbanned");
    load();
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <h1 className="font-display text-3xl">Bans</h1>

        <div className="glass-strong rounded-2xl p-6 space-y-4">
          <div className="text-xs tracking-[0.3em] text-[#00d4ff]">NEW BAN</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Minecraft Username</Label><Input className="mt-1" value={ign} onChange={(e) => setIgn(e.target.value)} /></div>
            <div><Label>Discord (optional)</Label><Input className="mt-1" value={discord} onChange={(e) => setDiscord(e.target.value)} /></div>
          </div>
          <div><Label>Reason</Label><Input className="mt-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Cheating, toxicity, etc." /></div>
          <div className="flex items-center justify-between">
            <div><div className="font-medium">Permanent</div><div className="text-xs text-muted-foreground">Otherwise specify days below</div></div>
            <Switch checked={permanent} onCheckedChange={setPermanent} />
          </div>
          {!permanent && <div><Label>Days</Label><Input type="number" min={1} className="mt-1" value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} /></div>}
          <Button onClick={submit} className="bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90"><BanIcon className="h-4 w-4 mr-2" />Ban Player</Button>
          <p className="text-xs text-muted-foreground">Note: IP / device fingerprint banning is not enabled — only Minecraft username and Discord are used.</p>
        </div>

        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-xs tracking-widest text-muted-foreground bg-white/5"><tr>
              <th className="text-left px-4 py-3">IGN</th><th className="text-left px-4 py-3">Discord</th><th className="text-left px-4 py-3">Reason</th><th className="text-left px-4 py-3">Until</th><th className="text-left px-4 py-3">Banned at</th><th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {bans.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No bans.</td></tr>}
              {bans.map((b) => (
                <tr key={b.id} className="border-t border-cyan/10">
                  <td className="px-4 py-3 font-medium">{b.ign}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.discord_username ?? "—"}</td>
                  <td className="px-4 py-3">{b.reason || "—"}</td>
                  <td className="px-4 py-3">{b.banned_until ? new Date(b.banned_until).toLocaleString() : <span className="text-rose-300">Permanent</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-rose-400"><Trash2 className="h-4 w-4 mr-1" />Unban</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Unban {b.ign}?</AlertDialogTitle><AlertDialogDescription>They will be able to register again.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => unban(b)}>Unban</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </AdminShell>
  );
}
