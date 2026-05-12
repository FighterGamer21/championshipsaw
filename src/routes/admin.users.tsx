import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, ShieldCheck } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
  head: () => ({ meta: [{ title: "Admin Users — Admin" }, { name: "robots", content: "noindex" }] }),
});

type Row = { id: string; user_id: string; role: "owner" | "admin" | "moderator" };

function UsersPage() {
  const { isOwner, loading } = useRole();
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const { data } = await supabase.from("user_roles").select("id,user_id,role").order("role");
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { if (isOwner) load(); }, [isOwner]);

  const setRole = async (r: Row, role: Row["role"]) => {
    const { error } = await supabase.from("user_roles").update({ role }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`Role updated → ${role}`);
    load();
  };
  const del = async (r: Row) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  if (loading) return <AdminShell><div className="p-10 text-muted-foreground">Loading…</div></AdminShell>;
  if (!isOwner) return <AdminShell><div className="p-10 text-rose-300">Owner access required.</div></AdminShell>;

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-[#00d4ff]" /> Admin Users</h1>
          <p className="text-muted-foreground mt-1">Manage admin roles. New admins should sign up at <code>/admin/login</code>; you can promote or demote them here.</p>
        </div>

        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-xs tracking-widest text-muted-foreground bg-white/5"><tr>
              <th className="text-left px-4 py-3">User ID</th><th className="text-left px-4 py-3">Role</th><th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No users.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-cyan/10">
                  <td className="px-4 py-3 font-mono text-xs">{r.user_id}</td>
                  <td className="px-4 py-3">
                    <Select value={r.role} onValueChange={(v) => setRole(r, v as Row["role"])}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-rose-400"><Trash2 className="h-4 w-4 mr-1" />Remove</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Remove role?</AlertDialogTitle><AlertDialogDescription>The user will lose admin access.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del(r)}>Remove</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </AdminShell>
  );
}
