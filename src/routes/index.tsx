import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Snowflake, Trophy, Calendar, Shield, Zap, Users, Crown, Copy, Check, Newspaper, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ROUNDS, DAY_TITLES } from "@/lib/event";
import type { Post } from "@/lib/posts";
import { CATEGORY_LABELS, CATEGORY_STYLES } from "@/lib/posts";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "ARCTIXMC Championship — Season 1" },
      { name: "description", content: "Premier Minecraft tournament. 3 days, 6 rounds, 1 champion. Register now and join the championship at play.arctixmc.net." },
      { property: "og:title", content: "ARCTIXMC Championship — Season 1" },
      { property: "og:description", content: "3 days. 6 rounds. 1 champion. Join play.arctixmc.net." },
    ],
  }),
});

type Settings = {
  homepage_title: string; homepage_subtitle: string; server_ip: string;
  event_start_at: string | null; event_status: string;
  rules_text: string; prize_details: string;
  visible_sections: Record<string, boolean>;
};

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  if (!target) return null;
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function LandingPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [champion, setChampion] = useState<string | null>(null);
  const [top3, setTop3] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [featured, setFeatured] = useState<Post | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => data && setSettings(data as Settings));
    supabase.from("players").select("ign,status").in("status", ["CHAMPION", "TOP_3"]).then(({ data }) => {
      const c = data?.find((p) => p.status === "CHAMPION");
      setChampion(c?.ign ?? null);
      setTop3(data?.filter((p) => p.status === "TOP_3").map((p) => p.ign) ?? []);
    });
    supabase.from("posts").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => setPosts((data ?? []) as Post[]));
    supabase.from("posts").select("*").eq("is_published", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => data && setFeatured(data as Post));
  }, []);

  const cd = useCountdown(settings?.event_start_at ? new Date(settings.event_start_at) : null);
  const sec = settings?.visible_sections ?? { news: true, featured: true, event_details: true, schedule: true, rules: true, top3: true, champion: true };
  const serverIp = settings?.server_ip ?? "play.arctixmc.net";
  const title = settings?.homepage_title ?? "ARCTIXMC CHAMPIONSHIP — SEASON 1";
  const subtitle = settings?.homepage_subtitle ?? "3 Days. 6 Rounds. 1 Champion.";

  const copyIp = async () => {
    await navigator.clipboard.writeText(serverIp);
    setCopied(true); toast.success("Server IP copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(0,212,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.1)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs tracking-[0.3em] text-[#00d4ff] mb-6">
            <Snowflake className="h-3.5 w-3.5" /> {settings?.event_status?.replace(/_/g, " ") ?? "SEASON 1"}
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-8xl tracking-tight">
            <span className="text-gradient-brand">{title}</span>
          </h1>
          <p className="mt-6 text-lg sm:text-2xl text-muted-foreground font-display tracking-widest">{subtitle}</p>

          {/* Server IP */}
          <div className="mt-8 inline-flex items-center gap-3 glass-strong rounded-full pl-5 pr-2 py-2 glow-cyan">
            <span className="text-xs tracking-[0.3em] text-muted-foreground">SERVER</span>
            <span className="font-mono text-base sm:text-lg text-[#00d4ff]">{serverIp}</span>
            <button onClick={copyIp} className="rounded-full bg-[#00d4ff] text-[#07111f] p-2 hover:bg-[#00d4ff]/90 transition" aria-label="Copy IP">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {cd && (
            <div className="mt-10 grid grid-cols-4 gap-3 max-w-xl mx-auto">
              {[{ l: "DAYS", v: cd.d }, { l: "HOURS", v: cd.h }, { l: "MIN", v: cd.m }, { l: "SEC", v: cd.s }].map((x) => (
                <div key={x.l} className="glass rounded-xl p-4">
                  <div className="font-display text-3xl sm:text-4xl text-[#00d4ff]">{String(x.v).padStart(2, "0")}</div>
                  <div className="text-[10px] tracking-widest text-muted-foreground mt-1">{x.l}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90 font-bold tracking-wide glow-cyan">
              <Link to="/register">Register Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-cyan text-foreground hover:bg-cyan-400/10">
              <Link to="/bracket">View Bracket</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured banner */}
      {sec.featured && featured && (
        <section className="mx-auto max-w-7xl px-6 -mt-8 relative z-10">
          <Link to="/news/$slug" params={{ slug: featured.slug }} className="block glass-strong rounded-3xl overflow-hidden glow-cyan-strong group">
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-2 aspect-video md:aspect-auto bg-gradient-to-br from-[#00d4ff]/20 to-[#07111f] relative">
                {featured.banner_url ? (
                  <img src={featured.banner_url} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="h-16 w-16 text-[#00d4ff]" /></div>
                )}
              </div>
              <div className="md:col-span-3 p-6 sm:p-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs tracking-[0.3em] text-[#00d4ff] flex items-center gap-1"><Star className="h-3 w-3" /> FEATURED</span>
                  <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${CATEGORY_STYLES[featured.category]}`}>{CATEGORY_LABELS[featured.category]}</span>
                </div>
                <h3 className="mt-3 font-display text-2xl sm:text-4xl group-hover:text-[#00d4ff] transition">{featured.title}</h3>
                <p className="mt-3 text-muted-foreground line-clamp-3">{featured.excerpt}</p>
                <div className="mt-5 inline-flex items-center text-[#00d4ff] text-sm">Read more →</div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Latest news */}
      {sec.news && posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeader icon={<Newspaper className="h-5 w-5" />} eyebrow="Latest News" title="Updates & Announcements" />
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.slice(0, 6).map((p) => (
              <Link key={p.id} to="/news/$slug" params={{ slug: p.slug }} className="glass rounded-2xl overflow-hidden group hover:glow-cyan transition">
                <div className="aspect-video bg-gradient-to-br from-[#00d4ff]/15 to-[#07111f] relative">
                  {p.banner_url ? <img src={p.banner_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" /> : <div className="absolute inset-0 flex items-center justify-center"><Newspaper className="h-10 w-10 text-[#00d4ff]/60" /></div>}
                </div>
                <div className="p-5">
                  <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${CATEGORY_STYLES[p.category]}`}>{CATEGORY_LABELS[p.category]}</span>
                  <h3 className="mt-3 font-display text-lg group-hover:text-[#00d4ff] transition line-clamp-2">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="border-cyan"><Link to="/news">View all news</Link></Button>
          </div>
        </section>
      )}

      {/* Event details */}
      {sec.event_details && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeader icon={<Sparkles className="h-5 w-5" />} eyebrow="Event Details" title="What to Expect" />
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              { icon: Calendar, t: "3 Action Days", d: "Qualifiers, Semi Finals, and Finals across three intense days." },
              { icon: Trophy, t: "6 Brutal Rounds", d: "Survival mini-games inspired by the Squid Game format." },
              { icon: Crown, t: "1 Champion", d: "Only one player walks away as ARCTIXMC Season 1 Champion." },
            ].map((x) => (
              <div key={x.t} className="glass rounded-2xl p-6">
                <x.icon className="h-8 w-8 text-[#00d4ff]" />
                <div className="mt-4 font-display text-xl">{x.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schedule */}
      {sec.schedule && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeader icon={<Calendar className="h-5 w-5" />} eyebrow="Event Schedule" title="3 Days of Pure Survival" />
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((day) => (
              <div key={day} className="glass rounded-2xl p-6 hover:glow-cyan transition">
                <div className="text-xs tracking-[0.25em] text-[#00d4ff]">{DAY_TITLES[day]}</div>
                <ul className="mt-4 space-y-3">
                  {ROUNDS.filter((r) => r.day === day).map((r) => (
                    <li key={r.key} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full glass-strong flex items-center justify-center text-xs font-bold text-[#00d4ff] shrink-0">
                        {ROUNDS.findIndex((x) => x.key === r.key) + 1}
                      </div>
                      <span className="text-foreground">{r.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Champion showcase */}
      {sec.champion && champion && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="glass-strong rounded-3xl p-12 text-center relative overflow-hidden glow-cyan-strong">
            <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-brand)" }} />
            <div className="relative">
              <Crown className="h-16 w-16 mx-auto text-yellow-300" />
              <div className="text-xs tracking-[0.4em] text-[#00d4ff] mt-4">CHAMPION</div>
              <div className="font-display text-5xl sm:text-7xl mt-4 text-gradient-brand">{champion}</div>
              <div className="text-muted-foreground mt-3">ARCTIXMC Season 1 Winner</div>
            </div>
          </div>
        </section>
      )}

      {/* Top 3 */}
      {sec.top3 && top3.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12">
          <SectionHeader icon={<Trophy className="h-5 w-5" />} eyebrow="Final" title="Top 3 Finalists" />
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {top3.map((ign) => (
              <div key={ign} className="glass rounded-xl p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto text-[#00d4ff]" />
                <div className="mt-3 font-display text-2xl text-[#00d4ff]">{ign}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rules brief */}
      {sec.rules && (
        <section className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeader icon={<Shield className="h-5 w-5" />} eyebrow="Fair Play" title="The Rules" />
          {settings?.rules_text && (
            <div className="mt-8 max-w-3xl mx-auto glass rounded-2xl p-6 text-sm text-muted-foreground whitespace-pre-line line-clamp-6">{settings.rules_text}</div>
          )}
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { i: Shield, t: "No Hacks or Clients" },
              { i: Zap, t: "No Macros or Bug Abuse" },
              { i: Users, t: "No Teaming or Alts" },
              { i: Crown, t: "Staff Decision is Final" },
            ].map((r) => (
              <div key={r.t} className="glass rounded-xl p-5 flex items-center gap-3">
                <r.i className="h-5 w-5 text-[#00d4ff] shrink-0" />
                <span className="text-sm">{r.t}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="border-cyan"><Link to="/rules">Read Full Rules</Link></Button>
          </div>
        </section>
      )}
    </PageShell>
  );
}

function SectionHeader({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs tracking-[0.3em] text-[#00d4ff]">
        {icon} {eyebrow}
      </div>
      <h2 className="mt-4 font-display text-3xl sm:text-5xl">{title}</h2>
    </div>
  );
}
