import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/lib/posts";
import { CATEGORY_LABELS, CATEGORY_STYLES } from "@/lib/posts";
import { Newspaper, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/news/$slug")({
  component: NewsItem,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — ARCTIXMC News` },
      { name: "description", content: "ARCTIXMC Championship news article." },
    ],
  }),
});

function NewsItem() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<Post | null | "missing">(null);
  useEffect(() => {
    supabase.from("posts").select("*").eq("slug", slug).eq("is_published", true).maybeSingle()
      .then(({ data }) => setPost((data as Post) ?? "missing"));
  }, [slug]);

  if (post === null) return <PageShell><div className="px-6 py-20 text-center text-muted-foreground">Loading…</div></PageShell>;
  if (post === "missing") {
    return <PageShell>
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl">Post not found</h1>
        <Link to="/news" className="mt-4 inline-flex items-center gap-2 text-[#00d4ff]"><ArrowLeft className="h-4 w-4" /> Back to news</Link>
      </div>
    </PageShell>;
  }

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/news" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00d4ff]"><ArrowLeft className="h-4 w-4" /> All news</Link>
        <div className="mt-6 flex items-center gap-3">
          <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${CATEGORY_STYLES[post.category]}`}>{CATEGORY_LABELS[post.category]}</span>
          <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</span>
        </div>
        <h1 className="mt-3 font-display text-3xl sm:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>}
        {post.banner_url && (
          <div className="mt-8 rounded-2xl overflow-hidden glass-strong">
            <img src={post.banner_url} alt={post.title} className="w-full" />
          </div>
        )}
        <div className="mt-8 prose prose-invert max-w-none whitespace-pre-line text-foreground/90 leading-relaxed">
          {post.content || <span className="text-muted-foreground italic"><Newspaper className="inline h-4 w-4 mr-1" />No content.</span>}
        </div>
      </article>
    </PageShell>
  );
}
