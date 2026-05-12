import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/rules")({
  component: RulesPage,
  head: () => ({
    meta: [
      { title: "Rules — ARCTIXMC Championship" },
      { name: "description", content: "Official tournament rules for ARCTIXMC Championship Season 1." },
    ],
  }),
});

const rules = [
  "No hacks or modified clients of any kind.",
  "No ghost clients, X-ray, or unauthorized modifications.",
  "No macros or auto-clickers.",
  "No bug abuse or game exploits.",
  "No teaming unless the round explicitly allows it.",
  "No alt accounts. One player, one account.",
  "Staff decisions are final and binding.",
  "Disconnecting during an active round counts as elimination unless caused by a server-side issue.",
];

function RulesPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs tracking-[0.3em] text-[#00d4ff]">
            <Shield className="h-3 w-3" /> FAIR PLAY
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Tournament Rules</h1>
        </div>
        <ol className="mt-12 space-y-3">
          {rules.map((r, i) => (
            <li key={i} className="glass rounded-xl p-5 flex gap-4">
              <div className="h-8 w-8 rounded-lg glass-strong flex items-center justify-center text-sm font-bold text-[#00d4ff] shrink-0">
                {i + 1}
              </div>
              <p className="text-foreground/90 pt-1">{r}</p>
            </li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}
