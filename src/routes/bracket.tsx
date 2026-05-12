import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ChevronDown, Crown, ClipboardCheck, UserPlus, Trophy, Swords } from "lucide-react";

export const Route = createFileRoute("/bracket")({
  component: BracketPage,
  head: () => ({
    meta: [
      { title: "Bracket — ARCTIXMC Championship" },
      { name: "description", content: "Tournament structure and round routing for ARCTIXMC Championship Season 1." },
    ],
  }),
});

const stages = [
  { icon: UserPlus, title: "Registration", subtitle: "Open to all players", color: "from-slate-400 to-slate-600" },
  { icon: ClipboardCheck, title: "Check-In", subtitle: "Confirm attendance", color: "from-blue-400 to-blue-600" },
  {
    icon: Swords,
    title: "Day 1 — Qualifiers",
    subtitle: "Round 1: Red Light Green Light · Round 2: Hole in the Wall",
    color: "from-cyan-400 to-cyan-600",
  },
  {
    icon: Swords,
    title: "Day 2 — Semi Finals",
    subtitle: "Round 3: Glass Bridge · Round 4: TNT Run",
    color: "from-indigo-400 to-indigo-600",
  },
  {
    icon: Swords,
    title: "Day 3 — Finals",
    subtitle: "Round 5: One Door Survives",
    color: "from-violet-400 to-violet-600",
  },
  { icon: Trophy, title: "Top 3 Playoffs", subtitle: "Three remain", color: "from-amber-400 to-amber-600" },
  { icon: Swords, title: "Final Round — Last To Survive", subtitle: "One must remain", color: "from-rose-400 to-rose-600" },
  { icon: Crown, title: "ARCTIXMC Champion", subtitle: "Season 1 winner", color: "from-yellow-300 to-amber-500" },
];

function BracketPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-gradient-brand">Tournament Bracket</h1>
          <p className="text-muted-foreground mt-3">From registration to champion — the full path.</p>
        </div>
        <div className="mt-12 flex flex-col items-center gap-2">
          {stages.map((s, i) => (
            <div key={s.title} className="w-full flex flex-col items-center">
              <div className="w-full glass-strong rounded-xl p-5 flex items-center gap-4 hover:glow-cyan transition">
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                  <s.icon className="h-6 w-6 text-[#07111f]" />
                </div>
                <div className="min-w-0">
                  <div className="font-display tracking-wide">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.subtitle}</div>
                </div>
              </div>
              {i < stages.length - 1 && <ChevronDown className="h-6 w-6 my-1 text-[#00d4ff]" />}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
