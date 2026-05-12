import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import { POST_CATEGORIES, CATEGORY_LABELS, slugify, type PostCategory, type Post } from "@/lib/posts";
import { adminErrorMessage, requireRow } from "@/lib/admin-db";

export const Route = createFileRoute("/admin/posts/$id")({
  component: PostEditor,
  head: () => ({ meta: [{ title: "Edit Post — Admin" }, { name: "robots", content: "noindex" }] }),
});

function PostEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const nav = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Partial<Post>>({
    title: "", slug: "", excerpt: "", content: "", category: "announcement",
    banner_url: null, is_published: false, is_featured: false,
  });

  useEffect(() => {
    if (isNew) return;
    supabase.from("posts").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setPost(data as Post);
      setLoading(false);
    });
  }, [id, isNew]);

  const set = <K extends keyof Post>(k: K, v: Post[K]) => setPost((p) => ({ ...p, [k]: v }));

  const upload = async (file: File) => {
    const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error } = await supabase.storage.from("post-banners").upload(path, file, { upsert: false });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("post-banners").getPublicUrl(path);
    set("banner_url", data.publicUrl);
    toast.success("Banner uploaded");
  };

  const save = async () => {
    if (!post.title) return toast.error("Title required");
    setSaving(true);
    const slug = post.slug || slugify(post.title);
    const payload = {
      title: post.title, slug, excerpt: post.excerpt ?? "", content: post.content ?? "",
      category: post.category as PostCategory, banner_url: post.banner_url ?? null,
      is_published: !!post.is_published, is_featured: !!post.is_featured,
    };
    try {
      if (isNew) {
        const { data, error } = await supabase.from("posts").insert(payload).select("id").maybeSingle();
        if (error) throw error;
        const created = requireRow(data, "Post create");
        toast.success("Post created");
        nav({ to: "/admin/posts/$id", params: { id: created.id } });
      } else {
        const { data, error } = await supabase.from("posts").update(payload).eq("id", id).select("*").maybeSingle();
        if (error) throw error;
        const saved = requireRow(data as Post | null, "Post save");
        setPost(saved);
        toast.success("Saved");
      }
    } catch (error) {
      toast.error(adminErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminShell><div className="p-10 text-muted-foreground">Loading…</div></AdminShell>;

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-5">
        <Link to="/admin/posts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00d4ff]"><ArrowLeft className="h-4 w-4" />Back</Link>
        <h1 className="font-display text-3xl">{isNew ? "New Post" : "Edit Post"}</h1>

        <div className="glass-strong rounded-2xl p-6 space-y-4">
          <div><Label>Title</Label><Input className="mt-1" value={post.title ?? ""} onChange={(e) => { set("title", e.target.value); if (isNew) set("slug", slugify(e.target.value)); }} /></div>
          <div><Label>Slug</Label><Input className="mt-1 font-mono text-sm" value={post.slug ?? ""} onChange={(e) => set("slug", slugify(e.target.value))} /></div>
          <div><Label>Category</Label>
            <Select value={post.category} onValueChange={(v) => set("category", v as PostCategory)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{POST_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Short Description / Excerpt</Label><Textarea className="mt-1" rows={2} value={post.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} /></div>
          <div><Label>Content</Label><Textarea className="mt-1 font-mono text-sm" rows={10} value={post.content ?? ""} onChange={(e) => set("content", e.target.value)} placeholder="Plain text. Line breaks preserved." /></div>
          <div>
            <Label>Banner image</Label>
            <div className="mt-1 flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
              {post.banner_url && <img src={post.banner_url} alt="" className="h-12 rounded" />}
            </div>
          </div>
          <div className="flex items-center justify-between"><div><div className="font-medium">Published</div><div className="text-xs text-muted-foreground">Visible to public</div></div><Switch checked={!!post.is_published} onCheckedChange={(v) => set("is_published", v)} /></div>
          <div className="flex items-center justify-between"><div><div className="font-medium">Featured</div><div className="text-xs text-muted-foreground">Pinned to homepage</div></div><Switch checked={!!post.is_featured} onCheckedChange={(v) => set("is_featured", v)} /></div>
          <Button onClick={save} disabled={saving} className="w-full bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90"><Upload className="h-4 w-4 mr-2" />{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </AdminShell>
  );
}
