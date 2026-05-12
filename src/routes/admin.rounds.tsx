import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play, Square, Crown } from "lucide-react";
import { ROUNDS, DAY_TITLES } from "@/lib/event";
import { adminErrorMessage } from "@/lib/admin-db";
import { adminRpc } from "@/lib/admin-rpc";

export const Route = createFileRoute("/admin/rounds")({
  component: RoundsAdmin,
  head: () => ({ meta: [{ title: "Round Management — Admin" }, { name: "robots", content: "noindex" }] }),
});

type Round = { id: string; day: number; round_name: string; status: string; started_at: string | null; ended_at: string | null };

function RoundsAdmin() {
  const [rounds, setRounds] = useState<Round[]>([]);

  const load = async () => {
    const { data } = await supabase.from("rounds").select("*").order("created_at");
    setRounds((data ?? []) as Round[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-rounds").on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const findRound = (name: string) => rounds.find((r) => r.round_name === name);

  const startRound = async (day: number, name: string) => {
    try {
      await adminRpc<Round>("admin_start_round_v2", { day, round_name: name });
      toast.success(`Started: ${name}`);
      load();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  const endRound = async (name: string) => {
    try {
      await adminRpc<Round>("admin_end_round_v2", { round_name: name });
      toast.success(`Ended: ${name}`);
      load();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  const selectTop3 = async () => {
    try {
      const top3 = await adminRpc<{ ign: string }[]>("admin_select_top3_v2");
      toast.success(`Top 3 selected: ${top3.map((p) => p.ign).join(", ")}`);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  const declareChampion = async () => {
    try {
      const champ = await adminRpc<{ ign: string }>("admin_declare_champion_v2");
      toast.success(`${champ.ign} is the ARCTIXMC Champion!`);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl">Round Management</h1>
        <p className="text-muted-foreground mt-1">Start, end, and progress through the championship.</p>

        {[1, 2, 3].map((day) => (
          <div key={day} className="mt-8">
            <div className="text-xs tracking-[0.3em] text-[#00d4ff]">{DAY_TITLES[day]}</div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {ROUNDS.filter((r) => r.day === day).map((r) => {
                const cur = findRound(r.name);
                const active = cur?.status === "active";
                const completed = cur?.status === "completed";
                return (
                  <div key={r.key} className="glass-strong rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-display">{r.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {active ? "Live now" : completed ? "Completed" : "Pending"}
                        </div>
                      </div>
                      <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${active ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40" : completed ? "bg-slate-500/20 text-slate-200 border-slate-400/30" : "bg-cyan-400/10 text-cyan-200 border-cyan-400/30"}`}>
                        {active ? "ACTIVE" : completed ? "DONE" : "PENDING"}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" onClick={() => startRound(day, r.name)} className="bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90">
                        <Play className="h-3.5 w-3.5 mr-1" />Start
                      </Button>
                      <Button size="sm" variant="outline" className="border-cyan" onClick={() => endRound(r.name)}>
                        <Square className="h-3.5 w-3.5 mr-1" />End
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-12 glass-strong rounded-2xl p-6">
          <div className="text-xs tracking-[0.3em] text-[#00d4ff]">FINAL CONTROLS</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={selectTop3} variant="outline" className="border-cyan"><Crown className="h-4 w-4 mr-2" />Select Top 3 (first 3 alive)</Button>
            <Button onClick={declareChampion} className="bg-yellow-400 text-[#07111f] hover:bg-yellow-300 font-bold">
              <Crown className="h-4 w-4 mr-2" />Declare Champion (first of Top 3)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">For Top 3 and Champion selection, mark the precise winners on the Players page first, then use these to lock the result.</p>
        </div>
      </div>
    </AdminShell>
  );
}
