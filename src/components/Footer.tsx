import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Store } from "lucide-react";

export function Footer() {
  const [s, setS] = useState<{ footer_text: string; discord_link: string | null; store_link: string | null } | null>(null);
  useEffect(() => {
    supabase.from("settings").select("footer_text,discord_link,store_link").eq("id", 1).maybeSingle()
      .then(({ data }) => data && setS(data));
  }, []);
  return (
    <footer className="border-t border-cyan/15 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-display tracking-widest text-[#00d4ff]">ARCTIXMC</span> &copy; {new Date().getFullYear()} — {s?.footer_text ?? "Season 1"}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/news" className="hover:text-[#00d4ff]">News</Link>
          <Link to="/rules" className="hover:text-[#00d4ff]">Rules</Link>
          {s?.discord_link && <a href={s.discord_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#00d4ff]"><MessageCircle className="h-3.5 w-3.5" /> Discord</a>}
          {s?.store_link && <a href={s.store_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#00d4ff]"><Store className="h-3.5 w-3.5" /> Store</a>}
        </div>
      </div>
    </footer>
  );
}
