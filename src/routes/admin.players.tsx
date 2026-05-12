import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Search, Trash2 } from "lucide-react";
import { downloadCSV } from "@/lib/csv";
import { PLAYER_STATUSES, STATUS_STYLES, type PlayerStatus } from "@/lib/event";
import { adminErrorMessage, requireRow } from "@/lib/admin-db";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/players")({
  component: PlayersPage,
  head: () => ({ meta: [{ title: "Players - Admin" }, { name: "robots", content: "noindex" }] }),
});

type Player = {
  id: string; ign: string; discord_username: string; minecraft_version: string; timezone: string;
  can_attend_all_days: boolean; status: PlayerStatus; current_day: number; current_round: string | null;
  registered_at: string; checked_in_at: string | null;
};

function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  const load = async () => {
    const { data } = await supabase.from("players").select("*").order("registered_at", { ascending: false });
    setPlayers((data ?? []) as Player[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-players").on("postgres_changes", { event: "*", schema: "public", table: "players" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (filter !== "ALL" && p.status !== filter) return false;
      if (q && !`${p.ign} ${p.discord_username}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [players, q, filter]);

  const setStatus = async (p: Player, status: PlayerStatus, extra: Partial<Player> = {}) => {
    try {
      const update: Partial<Player> = { status, ...extra };
      if (status === "CHECKED_IN" && !p.checked_in_at) update.checked_in_at = new Date().toISOString();
      const { data, error } = await supabase.from("players").update(update).eq("id", p.id).select("*").maybeSingle();
      if (error) throw error;
      const updated = requireRow(data as Player | null, "Player status update");

      if (status === "ELIMINATED" || status === "DISQUALIFIED") {
        const { data: elimination, error: eliminationError } = await supabase.from("eliminations").insert({
          player_id: p.id, day: updated.current_day || 1, round_name: updated.current_round ?? "Unknown", reason: status === "DISQUALIFIED" ? "Disqualified" : "Eliminated",
        }).select("id").maybeSingle();
        if (eliminationError) throw eliminationError;
        requireRow(elimination, "Elimination history insert");
      }

      setPlayers((list) => list.map((row) => (row.id === updated.id ? updated : row)));
      toast.success(`${p.ign} -> ${status}`);
      load();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  const delPlayer = async (p: Player) => {
    try {
      const { data, error } = await supabase.from("players").delete().eq("id", p.id).select("id").maybeSingle();
      if (error) throw error;
      requireRow(data, "Player delete");
      toast.success(`Deleted ${p.ign}`);
      load();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  const banPlayer = async (p: Player) => {
    try {
      const { data: ban, error } = await supabase.from("bans").insert({ ign: p.ign, discord_username: p.discord_username || null, reason: "Banned by admin", banned_until: null }).select("id").maybeSingle();
      if (error) throw error;
      requireRow(ban, "Ban insert");
      const { data: updated, error: playerError } = await supabase.from("players").update({ status: "BANNED" }).eq("id", p.id).select("*").maybeSingle();
      if (playerError) throw playerError;
      requireRow(updated, "Player ban status update");
      toast.success(`${p.ign} banned`);
      load();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  const exportCSV = () => {
    downloadCSV("arctixmc-players.csv", filtered.map((p) => ({
      ign: p.ign, discord: p.discord_username, version: p.minecraft_version, timezone: p.timezone,
      attend_all: p.can_attend_all_days, status: p.status, day: p.current_day, round: p.current_round ?? "",
      registered_at: p.registered_at, checked_in_at: p.checked_in_at ?? "",
    })));
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <h1 className="font-display text-3xl">Players</h1>
            <p className="text-muted-foreground mt-1">{filtered.length} of {players.length} shown</p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="border-cyan"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search IGN or Discord" className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {PLAYER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 glass-strong rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs tracking-widest text-muted-foreground bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">IGN</th>
                  <th className="text-left px-4 py-3">Discord</th>
                  <th className="text-left px-4 py-3">Ver</th>
                  <th className="text-left px-4 py-3">TZ</th>
                  <th className="text-left px-4 py-3">All Days</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Day</th>
                  <th className="text-left px-4 py-3">Round</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No players found.</td></tr>}
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-cyan/10 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">{p.ign}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.discord_username}</td>
                    <td className="px-4 py-3">{p.minecraft_version}</td>
                    <td className="px-4 py-3">{p.timezone}</td>
                    <td className="px-4 py-3">{p.can_attend_all_days ? "Yes" : "No"}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLES[p.status]}`}>{p.status}</span></td>
                    <td className="px-4 py-3">{p.current_day || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.current_round ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="border-cyan">Actions</Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => setStatus(p, "REGISTERED")}>Approve / Mark Registered</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "CHECKED_IN")}>Check In</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "ALIVE", { current_day: Math.max(p.current_day, 1) })}>Mark Alive</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "QUALIFIED")}>Mark Qualified</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "SEMI_FINALIST")}>Mark Semi-Finalist</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "FINALIST")}>Mark Finalist</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "TOP_3")}>Mark Top 3</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "CHAMPION")} className="text-yellow-300">Mark Champion</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p, "SPECTATOR")}>Mark Spectator</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <EliminateAction onConfirm={() => setStatus(p, "ELIMINATED")} ign={p.ign} />
                          <DropdownMenuItem onClick={() => setStatus(p, "DISQUALIFIED")} className="text-rose-400">Reject / Disqualify</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => banPlayer(p)} className="text-rose-400">Ban Player</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-rose-400"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {p.ign}?</AlertDialogTitle>
                                <AlertDialogDescription>This permanently removes the player and their elimination history.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => delPlayer(p)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function EliminateAction({ onConfirm, ign }: { onConfirm: () => void; ign: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-rose-400">Eliminate</DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminate {ign}?</AlertDialogTitle>
          <AlertDialogDescription>This marks the player as eliminated and adds an entry to elimination history.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Eliminate</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
