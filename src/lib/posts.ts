export const POST_CATEGORIES = [
  "announcement",
  "event_update",
  "result",
  "rule_update",
  "prize_update",
  "maintenance",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  announcement: "Announcement",
  event_update: "Event Update",
  result: "Result",
  rule_update: "Rule Update",
  prize_update: "Prize Update",
  maintenance: "Maintenance",
};

export const CATEGORY_STYLES: Record<PostCategory, string> = {
  announcement: "bg-cyan-500/20 text-cyan-200 border-cyan-400/40",
  event_update: "bg-blue-500/20 text-blue-200 border-blue-400/40",
  result: "bg-amber-500/20 text-amber-200 border-amber-400/40",
  rule_update: "bg-violet-500/20 text-violet-200 border-violet-400/40",
  prize_update: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
  maintenance: "bg-rose-500/20 text-rose-200 border-rose-400/40",
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: PostCategory;
  banner_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
