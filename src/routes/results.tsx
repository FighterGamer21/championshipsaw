import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Trophy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/csv";
import type { PlayerStatus } from "@/lib/event";

export const Route = createFileRoute("/results")({
  component: ResultsPage,
  head: () => ({
    meta: [
      { title: "Results — ARCTIXMC Championship" },
      { name: "description", content: "Results, survivors, finalists, and the champion." },
    ],
  }),
});

type Player = { id: string; ign: string; status: PlayerStatus; current_day: number };
type Elimination = { id: string; player_id: string; day: number; round_name: string; reason: string | null; created_at: string };

function ResultsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [elims, setElims] = useState<Elimination[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from("players").select("id,ign,status,current_day").order("ign"),
        supabase.from("eliminations").select("*").order("created_at", { ascending: false }),
      ]);
      setPlayers((p ?? []) as Player[]);
      setElims((e ?? []) as Elimination[]);
    };
    load();
    const ch = supabase
      .channel("results-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "eliminations" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const champion = players.find((p) => p.status === "CHAMPION");
  const top3 = players.filter((p) => p.status === "TOP_3");
  const day1Survivors = players.filter((p) => p.current_day >= 2 || ["QUALIFIED", "SEMI_FINALIST", "FINALIST", "TOP_3", "CHAMPION", "ALIVE"].includes(p.status));
  const day2Survivors = players.filter((p) => p.current_day >= 3 || ["SEMI_FINALIST", "FINALIST", "TOP_3", "CHAMPION"].includes(p.status));
  const finalists = players.filter((p) => ["FINALIST", "TOP_3", "CHAMPION"].includes(p.status));
  const ignFor = (id: string) => players.find((x) => x.id === id)?.ign ?? "Unknown";

  const exportResults = () => {
    downloadCSV("arctixmc-results.csv", players.map((p) => ({ ign: p.ign, status: p.status, current_day: p.current_day })));
  };

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl text-gradient-brand">Results</h1>
            <p className="text-muted-foreground mt-2">Survivors, finalists, and the champion.</p>
          </div>
          <Button onClick={exportResults} variant="outline" className="border-cyan"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
        </div>

        {champion && (
          <div className="mt-10 glass-strong rounded-2xl p-10 text-center glow-cyan-strong">
            <Crown className="h-16 w-16 mx-auto text-yellow-300" />
            <div className="text-xs tracking-[0.4em] text-[#00d4ff] mt-3">CHAMPION</div>
            <div className="font-display text-6xl mt-2 text-gradient-brand">{champion.ign}</div>
          </div>
        )}

        {top3.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl mb-4 flex items-center gap-2"><Trophy className="h-6 w-6 text-[#00d4ff]" /> Top 3</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {top3.map((p) => (
                <div key={p.id} className="glass rounded-xl p-6 text-center">
                  <div className="font-display text-2xl text-[#00d4ff]">{p.ign}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <SurvList title="Day 1 Survivors" list={day1Survivors} />
          <SurvList title="Day 2 Survivors" list={day2Survivors} />
          <SurvList title="Day 3 Finalists" list={finalists} />
        </div>

        <div className="mt-12 glass-strong rounded-2xl p-6">
          <h3 className="font-display tracking-widest text-sm text-[#00d4ff]">FULL ELIMINATION HISTORY</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground tracking-widest">
                <tr className="border-b border-cyan/20"><th className="text-left py-2">Player</th><th className="text-left">Day</th><th className="text-left">Round</th><th className="text-left">Reason</th><th className="text-left">When</th></tr>
              </thead>
              <tbody>
                {elims.length === 0 && <tr><td colSpan={5} className="py-4 text-muted-foreground">No eliminations yet.</td></tr>}
                {elims.map((e) => (
                  <tr key={e.id} className="border-b border-cyan/10">
                    <td className="py-2 font-medium">{ignFor(e.player_id)}</td>
                    <td>D{e.day}</td>
                    <td>{e.round_name}</td>
                    <td className="text-muted-foreground">{e.reason ?? "—"}</td>
                    <td className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function SurvList({ title, list }: { title: string; list: { id: string; ign: string }[] }) {
  return (
    <div className="glass-strong rounded-2xl p-6">
      <h3 className="font-display tracking-widest text-sm text-[#00d4ff]">{title.toUpperCase()} ({list.length})</h3>
      <ul className="mt-4 space-y-1.5 max-h-80 overflow-y-auto">
        {list.length === 0 && <li className="text-sm text-muted-foreground">TBD</li>}
        {list.map((p) => <li key={p.id} className="text-sm py-1 border-b border-cyan/10">{p.ign}</li>)}
      </ul>
    </div>
  );
}
