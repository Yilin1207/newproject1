import test from "node:test";
import assert from "node:assert/strict";
import {
  changeRoom, clearHistory, createRoom, finishDemo,
  hasStorageError, saveProfile, selectCharacter,
} from "../src/lib/demo-store.ts";
import {
  advanceGame, createGame, getOutcome, PREPARATION_SECONDS, STORM_SECONDS,
  beginStorm, interact, LOCATIONS, toVec3,
} from "../src/game/model.ts";

const key = "nash-rayon.frontend.v1";
const legacy = {
  id: "previous-game", date: "2026-11-01T12:00:00Z",
  title: "Прошлая игра", score: 1, power: "shop",
};
let stored = JSON.stringify({ name: "Игрок", history: [legacy] });
let storageListener;
let failWrites = false;
globalThis.window = {
  addEventListener(type, listener) {
    if (type === "storage") storageListener = listener;
  },
};
globalThis.localStorage = {
  getItem(storageKey) {
    assert.equal(storageKey, key);
    return stored;
  },
  setItem(storageKey, value) {
    assert.equal(storageKey, key);
    if (failWrites) throw new Error("Storage blocked");
    stored = value;
  },
};
const read = () => JSON.parse(stored);

test("real game results survive reloads without demo fallbacks", async (t) => {
  await t.test("first action loads and preserves the existing profile", () => {
    selectCharacter("ren");
    assert.equal(read().name, "Игрок");
    assert.deepEqual(read().history, [legacy]);
    assert.equal(read().history[0].character, undefined);
    assert.equal(read().history[0].durationSeconds, undefined);
  });

  await t.test("a completed game saves its actual outcome and time once", () => {
    createRoom();
    changeRoom({ phase: "preparing" });
    const game = advanceGame(createGame("ren"), PREPARATION_SECONDS + STORM_SECONDS);
    assert.equal(game.phase, "finished");
    const outcome = getOutcome(game);
    const details = {
      title: outcome.title, personalComplete: outcome.personalComplete,
      character: game.character,
      durationSeconds: Math.round(game.elapsed + game.stormElapsed),
      suppliesCount: outcome.suppliesCount,
    };
    changeRoom({ supplies: game.delivered.length === 3, bridge: game.bridge, power: game.power });
    finishDemo(details);
    finishDemo(details);
    const result = read().history[0];
    assert.equal(read().history.length, 2);
    assert.equal(result.score, outcome.score);
    assert.equal(result.title, outcome.title);
    assert.equal(result.personalComplete, outcome.personalComplete);
    assert.equal(result.character, "ren");
    assert.equal(result.suppliesCount, 0);
    assert.equal(result.bridge, false);
    assert.equal(result.durationSeconds, PREPARATION_SECONDS + STORM_SECONDS);
    assert.ok(Math.abs(Date.now() - Date.parse(result.date)) < 5000);
    storageListener({ key, newValue: stored });
    selectCharacter("mira");
    assert.deepEqual(read().history[0], result);
  });

  await t.test("restoring mixed data rejects fixtures and sanitizes optional fields", () => {
    storageListener({ key, newValue: JSON.stringify({
      name: "Игрок", history: [
        null, "invalid", { ...legacy, id: "fixture", demo: true },
        { ...legacy, character: "unknown", durationSeconds: -1, personalComplete: "yes", suppliesCount: 4, bridge: "yes" },
      ],
    }) });
    selectCharacter("tim");
    assert.deepEqual(read().history, [legacy]);
  });

  await t.test("partial deliveries and a repaired bridge survive storage reload", () => {
    createRoom();
    let game = createGame("sasha");
    for (const [id, destination] of [["food", "shelter"], ["planks", "bridge"]]) {
      game = interact(game, game.items.find((item) => item.id === id).position);
      game = interact(game, toVec3(LOCATIONS[destination].interact));
    }
    game = advanceGame(beginStorm(advanceGame(game, 47)), STORM_SECONDS);
    const outcome = getOutcome(game);
    changeRoom({ phase: "preparing", supplies: game.delivered.length === 3, bridge: game.bridge, power: game.power });
    finishDemo({
      title: outcome.title, personalComplete: outcome.personalComplete,
      character: game.character, durationSeconds: game.elapsed + game.stormElapsed,
      suppliesCount: outcome.suppliesCount,
    });
    storageListener({ key, newValue: stored });
    selectCharacter("mira");
    const result = read().history[0];
    assert.equal(result.suppliesCount, 1);
    assert.equal(result.bridge, true);
    assert.equal(result.personalComplete, true);
    assert.equal(result.durationSeconds, 65);
  });

  await t.test("clearing history persists an empty history and preserves the profile", () => {
    clearHistory();
    storageListener({ key, newValue: stored });
    selectCharacter("sasha");
    assert.deepEqual(read().history, []);
    assert.equal(read().name, "Игрок");
  });

  await t.test("storage failures are reported and a later save can recover", () => {
    failWrites = true;
    selectCharacter("ren");
    assert.equal(hasStorageError(), true);
    failWrites = false;
    saveProfile({ name: "Сосед", character: "ren", notifications: true, reducedMotion: false });
    assert.equal(hasStorageError(), false);
    assert.equal(read().character, "ren");
    assert.deepEqual(read().history, []);
  });
});
