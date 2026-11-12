import test from "node:test";
import assert from "node:assert/strict";
import { formatPlayTime, getPlayerStats } from "../src/lib/player-stats.ts";

const base = { id: "test", date: "2026-11-12T00:00:00Z", title: "Test", score: 0, power: null };

test("empty history has no fabricated percentages or durations", () => {
  const stats = getPlayerStats([]);
  assert.equal(stats.played, 0);
  assert.equal(stats.winRate, null);
  assert.equal(stats.seconds, null);
  assert.equal(stats.averageSeconds, null);
  assert.equal(stats.suppliesGames, 0);
  assert.equal(stats.bridgeGames, 0);
});

test("mixed generations count only known values for optional statistics", () => {
  const stats = getPlayerStats([
    { ...base, score: 3, power: "shelter", durationSeconds: 618, character: "mira", personalComplete: true, suppliesCount: 3, bridge: true },
    { ...base, score: 1, power: "shop", durationSeconds: 65, character: "sasha", personalComplete: false, suppliesCount: 1, bridge: false },
    base,
  ]);
  assert.equal(stats.winRate, 33);
  assert.equal(stats.seconds, 683);
  assert.equal(stats.averageSeconds, 342);
  assert.equal(stats.timedGames, 2);
  assert.equal(stats.personalGoals, 1);
  assert.equal(stats.personalGames, 2);
  assert.equal(stats.supplies, 4);
  assert.equal(stats.suppliesGames, 2);
  assert.equal(stats.bridges, 1);
  assert.equal(stats.bridgeGames, 2);
  assert.deepEqual(stats.characterCounts, { mira: 1, sasha: 1, ren: 0, tim: 0 });
  assert.equal(stats.characterGames, 2);
  assert.deepEqual(stats.power, { shelter: 1, shop: 1, none: 1 });
});

test("recorded zero values are known and old results remain unknown", () => {
  const recorded = getPlayerStats([{ ...base, durationSeconds: 0, suppliesCount: 0, bridge: false }]);
  assert.equal(recorded.seconds, 0);
  assert.equal(recorded.timedGames, 1);
  assert.equal(recorded.suppliesGames, 1);
  assert.equal(recorded.bridgeGames, 1);
  const old = getPlayerStats([base]);
  assert.equal(old.timedGames, 0);
  assert.equal(old.personalGames, 0);
  assert.equal(old.suppliesGames, 0);
  assert.equal(old.bridgeGames, 0);
  assert.equal(old.characterGames, 0);
});

test("play time retains seconds across minute and hour boundaries", () => {
  assert.equal(formatPlayTime(0), "0 мин 0 с");
  assert.equal(formatPlayTime(65), "1 мин 5 с");
  assert.equal(formatPlayTime(3665), "1 ч 1 мин 5 с");
});
