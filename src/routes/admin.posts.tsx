import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Star, Eye, EyeOff, Trash2, Pencil } from "lucide-react";
import type { Post } from "@/lib/posts";
import { CATEGORY_LABELS, CATEGORY_STYLES } from "@/lib/posts";
import { adminErrorMessage, requireRow } from "@/lib/admin-db";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/posts")({
  component: PostsList,
  head: () => ({ meta: [{ title: "Posts — Admin" }, { name: "robots", content: "noindex" }] }),
});

function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const load = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    setPosts((data ?? []) as Post[]);
  };
  useEffect(() => { load(); }, []);

  const togglePublish = async (p: Post) => {
    try {
      const { data, error } = await supabase.from("posts").update({ is_published: !p.is_published }).eq("id", p.id).select("*").maybeSingle();
      if (error) throw error;
      const updated = requireRow(data as Post | null, "Post publish update");
      setPosts((list) => list.map((row) => (row.id === updated.id ? updated : row)));
      toast.success(p.is_published ? "Unpublished" : "Published");
      load();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };
  const toggleFeatured = async (p: Post) => {
    try {
      const { data, error } = await supabase.from("posts").update({ is_featured: !p.is_featured }).eq("id", p.id).select("*").maybeSingle();
      if (error) throw error;
      const updated = requireRow(data as Post | null, "Post featured update");
      setPosts((list) => list.map((row) => (row.id === updated.id ? updated : row)));
      toast.success(p.is_featured ? "Unfeatured" : "Featured");
      load();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };
  const del = async (p: Post) => {
    try {
      const { data, error } = await supabase.from("posts").delete().eq("id", p.id).select("id").maybeSingle();
      if (error) throw error;
      requireRow(data, "Post delete");
      toast.success("Deleted");
      load();
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Posts</h1>
            <p className="text-muted-foreground mt-1">{posts.length} total</p>
          </div>
          <Button asChild className="bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90"><Link to="/admin/posts/$id" params={{ id: "new" }}><Plus className="h-4 w-4 mr-2" />New Post</Link></Button>
        </div>

        <div className="mt-6 glass-strong rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs tracking-widest text-muted-foreground bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Updated</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No posts yet.</td></tr>}
                {posts.map((p) => (
                  <tr key={p.id} className="border-t border-cyan/10 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {p.is_featured && <Star className="h-4 w-4 text-amber-300 fill-amber-300" />}
                        {p.title}
                      </div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${CATEGORY_STYLES[p.category]}`}>{CATEGORY_LABELS[p.category]}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${p.is_published ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40" : "bg-slate-500/20 text-slate-200 border-slate-400/30"}`}>
                        {p.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button onClick={() => toggleFeatured(p)} size="sm" variant="ghost" title={p.is_featured ? "Unfeature" : "Feature"}><Star className={`h-4 w-4 ${p.is_featured ? "text-amber-300 fill-amber-300" : ""}`} /></Button>
                      <Button onClick={() => togglePublish(p)} size="sm" variant="ghost" title="Publish toggle">{p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      <Button asChild size="sm" variant="ghost"><Link to="/admin/posts/$id" params={{ id: p.id }}><Pencil className="h-4 w-4" /></Link></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-rose-400"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete "{p.title}"?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del(p)}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
