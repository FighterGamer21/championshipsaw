import { supabase } from "@/integrations/supabase/client";
import type { PlayerStatus } from "@/lib/event";

type RpcClient = typeof supabase & {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const rpcClient = supabase as RpcClient;

export async function adminRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpcClient.rpc(fn, args);
  if (error) throw error;
  if (data == null) throw new Error(`${fn} returned no data.`);
  return data as T;
}

export function setPlayerStatusArgs(
  playerId: string,
  status: PlayerStatus,
  extra: { current_day?: number; current_round?: string | null } = {},
) {
  return {
    _player_id: playerId,
    _status: status,
    _current_day: extra.current_day ?? null,
    _current_round: extra.current_round ?? null,
  };
}
