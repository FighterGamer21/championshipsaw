import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/lib/posts";
import { CATEGORY_LABELS, CATEGORY_STYLES } from "@/lib/posts";
import { Newspaper } from "lucide-react";

export const Route = createFileRoute("/news")({
  component: NewsList,
  head: () => ({
    meta: [
      { title: "News & Updates — ARCTIXMC Championship" },
      { name: "description", content: "Latest announcements, event updates, results, and news for ARCTIXMC Championship Season 1." },
    ],
  }),
});

function NewsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    const load = () => {
      supabase.from("posts").select("*").eq("is_published", true).order("created_at", { ascending: false })
        .then(({ data }) => setPosts((data ?? []) as Post[]));
    };
    load();
    const ch = supabase.channel("news-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs tracking-[0.3em] text-[#00d4ff]">
            <Newspaper className="h-3 w-3" /> NEWS
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Latest Updates</h1>
          <p className="text-muted-foreground mt-3">All announcements, event updates, and results.</p>
        </div>
        {posts.length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">No posts yet. Check back soon.</div>
        ) : (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((p) => (
              <Link key={p.id} to="/news/$slug" params={{ slug: p.slug }} className="glass rounded-2xl overflow-hidden group hover:glow-cyan transition">
                <div className="aspect-video bg-gradient-to-br from-[#00d4ff]/15 to-[#07111f] relative">
                  {p.banner_url ? <img src={p.banner_url} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><Newspaper className="h-10 w-10 text-[#00d4ff]/60" /></div>}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${CATEGORY_STYLES[p.category]}`}>{CATEGORY_LABELS[p.category]}</span>
                    <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg group-hover:text-[#00d4ff] transition line-clamp-2">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
