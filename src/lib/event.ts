export const EVENT_NAME = "ARCTIXMC CHAMPIONSHIP";
export const SEASON = "SEASON 1";
export const TAGLINE = "3 Days. 6 Rounds. 1 Champion.";

export type RoundDef = { day: number; name: string; key: string };

export const ROUNDS: RoundDef[] = [
  { day: 1, name: "Red Light Green Light", key: "red_light_green_light" },
  { day: 1, name: "Hole in the Wall", key: "hole_in_the_wall" },
  { day: 2, name: "Glass Bridge", key: "glass_bridge" },
  { day: 2, name: "TNT Run", key: "tnt_run" },
  { day: 3, name: "One Door Survives", key: "one_door_survives" },
  { day: 3, name: "Last To Survive", key: "last_to_survive" },
];

export const DAY_TITLES: Record<number, string> = {
  1: "DAY 1 — QUALIFIERS",
  2: "DAY 2 — SEMI FINALS",
  3: "DAY 3 — FINALS",
};

export const PLAYER_STATUSES = [
  "REGISTERED",
  "CHECKED_IN",
  "ALIVE",
  "QUALIFIED",
  "ELIMINATED",
  "SEMI_FINALIST",
  "FINALIST",
  "TOP_3",
  "CHAMPION",
  "DISQUALIFIED",
  "SPECTATOR",
  "BANNED",
] as const;

export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const STATUS_STYLES: Record<PlayerStatus, string> = {
  REGISTERED: "bg-slate-500/20 text-slate-200 border-slate-400/30",
  CHECKED_IN: "bg-blue-500/20 text-blue-200 border-blue-400/40",
  ALIVE: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
  QUALIFIED: "bg-cyan-500/20 text-cyan-200 border-cyan-400/40",
  ELIMINATED: "bg-rose-500/20 text-rose-200 border-rose-400/40",
  SEMI_FINALIST: "bg-indigo-500/20 text-indigo-200 border-indigo-400/40",
  FINALIST: "bg-violet-500/20 text-violet-200 border-violet-400/40",
  TOP_3: "bg-amber-500/20 text-amber-200 border-amber-400/40",
  CHAMPION: "bg-yellow-400/30 text-yellow-100 border-yellow-300/60",
  DISQUALIFIED: "bg-red-700/30 text-red-200 border-red-500/50",
  SPECTATOR: "bg-zinc-500/20 text-zinc-200 border-zinc-400/30",
  BANNED: "bg-red-900/40 text-red-200 border-red-600/60",
};
