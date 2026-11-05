import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceGame, beginStorm, createGame, getNearbyInteraction, getOutcome,
  interact, LOCATIONS, PREPARATION_SECONDS, safeItemPosition, STORM_SECONDS,
  throwItem, toVec3,
} from "../src/game/model.ts";

function deliver(state, id, target) {
  const item = state.items.find(item => item.id === id);
  state = interact(state, item.position);
  assert.equal(state.carried, id);
  return interact(state, toVec3(LOCATIONS[target].interact));
}

test("all three supplies, bridge and shelter battery produce the best ending", () => {
  let state = createGame("mira");
  for (const id of ["food", "water", "blankets"]) state = deliver(state, id, "shelter");
  state = deliver(state, "planks", "bridge");
  state = deliver(state, "battery", "shelter");
  state = advanceGame(beginStorm(state), STORM_SECONDS);
  assert.equal(state.phase, "finished");
  assert.equal(getOutcome(state).score, 3);
  assert.equal(getOutcome(state).personalComplete, true);
  assert.equal(state.items.filter(item => item.status === "ground").length, 0);
});

test("the single battery changes the ending and Ren's personal outcome", () => {
  let state = createGame("ren");
  for (const id of ["food", "water", "blankets"]) state = deliver(state, id, "shelter");
  state = deliver(state, "planks", "bridge");
  state = deliver(state, "battery", "shop");
  const outcome = getOutcome(state);
  assert.equal(outcome.score, 2);
  assert.equal(outcome.title, "Свет в витрине");
  assert.equal(outcome.personalComplete, true);
  assert.equal(state.power, "shop");
  assert.equal(interact(state, toVec3(LOCATIONS.shelter.interact)).power, "shop");
  assert.equal(state.items.filter(item => item.kind === "battery").length, 1);
});

test("cannot pick up a faraway object, carry two objects or count one delivery twice", () => {
  const initial = createGame();
  assert.equal(getNearbyInteraction(initial, { x: 27, y: 0, z: -27 }), null);
  assert.equal(interact(initial, { x: 27, y: 0, z: -27 }).carried, null);
  let state = interact(initial, initial.items[0].position);
  state = interact(state, initial.items[1].position);
  assert.equal(state.carried, "food");
  state = interact(state, toVec3(LOCATIONS.shelter.interact));
  state = interact(state, toVec3(LOCATIONS.shelter.interact));
  assert.deepEqual(state.delivered, ["food"]);
  assert.equal(initial.items[0].status, "ground", "the original snapshot must stay unchanged");
});

test("only boards repair the bridge and only supplies can be delivered as supplies", () => {
  let state = createGame();
  state = interact(state, state.items.find(item => item.id === "food").position);
  state = interact(state, toVec3(LOCATIONS.bridge.interact));
  assert.equal(state.bridge, false);
  assert.equal(state.carried, "food");
  state = throwItem(state, { x: 16, y: 0, z: 10 }, { x: -1, y: 0, z: 0 });
  state = deliver(state, "planks", "bridge");
  assert.equal(state.bridge, true);
  assert.deepEqual(state.delivered, []);
});

test("a thrown object remains recoverable at the river, building and world border", () => {
  const initial = createGame();
  const carried = interact(initial, initial.items[0].position);
  const released = throwItem(carried, { x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: 1 });
  const food = released.items.find(item => item.id === "food");
  assert.equal(food.status, "ground");
  assert.equal(released.carried, null);
  assert.ok(food.position.z < 11.5 || food.position.z > 16.5);
  assert.equal(interact(released, food.position).carried, "food");
  const wall = safeItemPosition({ x: -12, y: 0, z: -10 });
  assert.ok(Math.abs(wall.x + 12) >= 4.9 || Math.abs(wall.z + 10) >= 4);
  assert.ok(safeItemPosition({ x: 50, y: 0, z: -50 }).x < 28);
});

test("ten minute deadline enters the storm and freezes preparation actions", () => {
  const initial = createGame();
  const storm = advanceGame(initial, PREPARATION_SECONDS + 5);
  assert.equal(storm.phase, "storm");
  assert.equal(storm.elapsed, PREPARATION_SECONDS);
  assert.equal(storm.stormElapsed, 5);
  assert.equal(interact(storm, storm.items[0].position), storm);
  const finished = advanceGame(storm, STORM_SECONDS);
  assert.equal(finished.phase, "finished");
  assert.equal(getOutcome(finished).score, 0);
  assert.equal(advanceGame(finished, 100), finished);
  assert.equal(beginStorm(finished), finished);
});

test("fresh games reset all tasks and non-finite frame deltas cannot corrupt time", () => {
  const state = createGame("sasha");
  assert.equal(advanceGame(state, NaN), state);
  assert.equal(advanceGame(state, -1), state);
  assert.equal(advanceGame(state, Infinity), state);
  const completed = deliver(state, "planks", "bridge");
  assert.equal(getOutcome(completed).personalComplete, true);
  assert.equal(createGame("sasha").bridge, false);
});
