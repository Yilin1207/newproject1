import type { CharacterId, Result } from "./demo-store";

// Missing fields in older results are unknown, not zero or failed attempts.
export function getPlayerStats(history: Result[]) {
  const timed = history.filter((r) => r.durationSeconds !== undefined);
  const personal = history.filter((r) => r.personalComplete !== undefined);
  const supplies = history.filter((r) => r.suppliesCount !== undefined);
  const bridges = history.filter((r) => r.bridge !== undefined);
  const heroes = history.filter((r) => r.character !== undefined);
  const wins = history.filter((r) => r.score === 3).length;
  const seconds = timed.reduce((sum, r) => sum + r.durationSeconds!, 0);
  const characterCounts: Record<CharacterId, number> = { mira: 0, sasha: 0, ren: 0, tim: 0 };
  for (const result of heroes) characterCounts[result.character!] += 1;
  return {
    played: history.length,
    wins,
    winRate: history.length ? Math.round(wins / history.length * 100) : null,
    seconds: timed.length ? seconds : null,
    averageSeconds: timed.length ? Math.round(seconds / timed.length) : null,
    timedGames: timed.length,
    personalGoals: personal.filter((r) => r.personalComplete).length,
    personalGames: personal.length,
    supplies: supplies.reduce((sum, r) => sum + r.suppliesCount!, 0),
    suppliesGames: supplies.length,
    bridges: bridges.filter((r) => r.bridge).length,
    bridgeGames: bridges.length,
    characterCounts,
    characterGames: heroes.length,
    power: {
      shelter: history.filter((r) => r.power === "shelter").length,
      shop: history.filter((r) => r.power === "shop").length,
      none: history.filter((r) => r.power === null).length,
    },
  };
}

export function formatPlayTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const remaining = seconds % 60;
  return hours > 0
    ? `${hours} ч ${minutes} мин ${remaining} с`
    : `${minutes} мин ${remaining} с`;
}
