/** Pure, serializable rules for the «Перед грозой» scenario. */
export type Vec3 = { x: number; y: number; z: number };
export type Position = [number, number, number];
export type CharacterId = "mira" | "sasha" | "ren" | "tim";
export type Power = "shelter" | "shop" | null;
export type ItemKind = "food" | "water" | "blankets" | "planks" | "battery";
export type GamePhase = "preparing" | "storm" | "finished";

export const PREPARATION_SECONDS = 600;
export const STORM_SECONDS = 18;
export const INTERACTION_DISTANCE = 2.6;
export const WORLD_BOUNDS = 28;
export const SPAWN: Position = [-12, 0.3, -2];

export const LOCATIONS = {
  shelter: { label: "Общий дом", position: [-12, 0, -10] as Position, interact: [-12, 0, -4] as Position },
  shop: { label: "Магазин", position: [12, 0, -10] as Position, interact: [12, 0, -4] as Position },
  generator: { label: "Генератор", position: [-15, 0, 8] as Position, interact: [-15, 0, 6] as Position },
  square: { label: "Площадь", position: [0, 0, 0] as Position, interact: [0, 0, 0] as Position },
  bridge: { label: "Мост", position: [16, 0, 14] as Position, interact: [16, 0, 10] as Position },
};

export const COLLIDERS: { id: string; position: Position; halfExtents: Position }[] = [
  { id: "shelter", position: [-12, 3.2, -10], halfExtents: [4.4, 3.2, 3.5] },
  { id: "shop", position: [12, 2.7, -10], halfExtents: [4.4, 2.7, 3.5] },
];

export const PERSONAL_GOALS: Record<CharacterId, { title: string; description: string }> = {
  mira: { title: "Никого не оставить", description: "Доставьте в общий дом еду, воду и одеяла." },
  sasha: { title: "Дорога к соседям", description: "Принесите доски к мосту и укрепите его до грозы." },
  ren: { title: "Сохранить продукты", description: "Установите единственный аккумулятор у магазина. Общий дом останется без электричества." },
  tim: { title: "Вместе теплее", description: "Подключите аккумулятор к общему дому, чтобы соседи встретили грозу со светом." },
};

export type GameItem = {
  id: string;
  kind: ItemKind;
  label: string;
  position: Vec3;
  status: "ground" | "carried" | "delivered" | "installed";
};

export type GameState = {
  phase: GamePhase;
  elapsed: number;
  stormElapsed: number;
  character: CharacterId;
  items: GameItem[];
  carried: string | null;
  delivered: string[];
  bridge: boolean;
  power: Power;
  events: string[];
  lastMessage: string;
};

export type Interaction = {
  kind: "pickup" | "deliver" | "repair" | "install";
  label: string;
  target: string;
  position: Vec3;
};

export type GameOutcome = {
  score: number;
  title: string;
  description: string;
  personalComplete: boolean;
  personalText: string;
  suppliesCount: number;
  bridge: boolean;
  power: Power;
};

export function toVec3(position: Position): Vec3 {
  return { x: position[0], y: position[1], z: position[2] };
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

const SUPPLIES: ItemKind[] = ["food", "water", "blankets"];

export function createGame(character: CharacterId = "mira"): GameState {
  return {
    phase: "preparing", elapsed: 0, stormElapsed: 0, character,
    items: [
      { id: "food", kind: "food", label: "Ящик с продуктами", position: { x: 9, y: 0.45, z: -3 }, status: "ground" },
      { id: "water", kind: "water", label: "Питьевая вода", position: { x: 2, y: 0.45, z: 4 }, status: "ground" },
      { id: "blankets", kind: "blankets", label: "Тёплые одеяла", position: { x: -20, y: 0.45, z: -3 }, status: "ground" },
      { id: "planks", kind: "planks", label: "Доски для моста", position: { x: -19, y: 0.35, z: 6 }, status: "ground" },
      { id: "battery", kind: "battery", label: "Аккумулятор", position: { x: -15, y: 0.45, z: 6 }, status: "ground" },
    ],
    carried: null, delivered: [], bridge: false, power: null,
    events: ["Соседи ждут вашей помощи. До грозы десять минут."],
    lastMessage: "Исследуйте район. Подойдите к подсвеченному предмету и нажмите E.",
  };
}

function announce(state: GameState, message: string): GameState {
  return { ...state, lastMessage: message, events: [...state.events, message].slice(-8) };
}

function isWithinReach(position: Vec3, target: Vec3): boolean {
  return Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.z)
    && position.y < 3 && position.y > -2
    && distance(position, target) <= INTERACTION_DISTANCE;
}

function receiver(state: GameState, carried: GameItem): Interaction[] {
  if (SUPPLIES.includes(carried.kind)) {
    return [{ kind: "deliver", label: "Оставить припасы в общем доме", target: "shelter", position: toVec3(LOCATIONS.shelter.interact) }];
  }
  if (carried.kind === "planks" && !state.bridge) {
    return [{ kind: "repair", label: "Укрепить мост досками", target: "bridge", position: toVec3(LOCATIONS.bridge.interact) }];
  }
  if (carried.kind === "battery" && !state.power) {
    return [
      { kind: "install", label: "Дать свет общему дому", target: "shelter", position: toVec3(LOCATIONS.shelter.interact) },
      { kind: "install", label: "Сохранить продукты в магазине", target: "shop", position: toVec3(LOCATIONS.shop.interact) },
    ];
  }
  return [];
}

export function getNearbyInteraction(state: GameState, position: Vec3): Interaction | null {
  if (state.phase !== "preparing") return null;
  const carried = state.items.find(item => item.id === state.carried);
  if (carried) return receiver(state, carried).find(target => isWithinReach(position, target.position)) ?? null;
  const item = state.items.filter(item => item.status === "ground" && isWithinReach(position, item.position))
    .sort((a, b) => distance(position, a.position) - distance(position, b.position))[0];
  return item ? { kind: "pickup", label: `Поднять: ${item.label.toLowerCase()}`, target: item.id, position: { ...item.position } } : null;
}

export function interact(state: GameState, position: Vec3): GameState {
  if (state.phase !== "preparing") return state;
  const action = getNearbyInteraction(state, position);
  if (!action) {
    const held = state.items.find(item => item.id === state.carried);
    const message = held
      ? held.kind === "battery" ? "Отнесите аккумулятор к общему дому или магазину. Заряда хватит только на одно здание."
        : held.kind === "planks" ? "Отнесите доски к северному входу на мост."
          : "Отнесите припасы к входу в общий дом."
      : "Подойдите ближе к предмету. Подсказка появится, когда его можно взять.";
    return { ...state, lastMessage: message };
  }
  if (action.kind === "pickup") {
    const item = state.items.find(item => item.id === action.target)!;
    return announce({ ...state, carried: item.id, items: state.items.map(current => current.id === item.id ? { ...current, status: "carried" } : current) }, `${item.label} у вас в руках. Q — бросить.`);
  }
  const carriedId = state.carried;
  const items = state.items.map(item => item.id === carriedId ? {
    ...item, status: action.kind === "deliver" ? "delivered" as const : "installed" as const,
    position: { ...action.position, y: 0.45 },
  } : item);
  const next = { ...state, carried: null, items };
  if (action.kind === "deliver") {
    const delivered = [...state.delivered, carriedId!];
    return announce({ ...next, delivered }, `Припасы в общем доме: ${delivered.length}/3.${delivered.length === 3 ? " Соседям хватит еды, воды и тепла." : " Найдите остальные."}`);
  }
  if (action.kind === "repair") return announce({ ...next, bridge: true }, "Мост укреплён. Дорога к соседям выдержит грозу.");
  const power = action.target as Exclude<Power, null>;
  return announce({ ...next, power }, power === "shelter"
    ? "В общем доме горит свет. Магазин останется без электричества."
    : "Магазин подключён: продукты спасены. Общий дом останется без света.");
}

/** Keep a thrown object reachable; the river and solid facades cannot swallow supplies. */
export function safeItemPosition(position: Vec3): Vec3 {
  let x = Math.max(-WORLD_BOUNDS + 1, Math.min(WORLD_BOUNDS - 1, Number.isFinite(position.x) ? position.x : SPAWN[0]));
  let z = Math.max(-WORLD_BOUNDS + 1, Math.min(WORLD_BOUNDS - 1, Number.isFinite(position.z) ? position.z : SPAWN[2]));
  if (z > 11 && z < 17 && (x < 14 || x > 18)) z = z < 14 ? 10.8 : 17.2;
  for (const collider of COLLIDERS) {
    const [cx, , cz] = collider.position;
    const [hx, , hz] = collider.halfExtents;
    if (Math.abs(x - cx) < hx + 0.5 && Math.abs(z - cz) < hz + 0.5) {
      const dx = hx + 0.6 - Math.abs(x - cx);
      const dz = hz + 0.6 - Math.abs(z - cz);
      if (dx < dz) x = cx + (x >= cx ? hx + 0.6 : -hx - 0.6);
      else z = cz + (z >= cz ? hz + 0.6 : -hz - 0.6);
    }
  }
  return { x, y: 0.45, z };
}

export function throwItem(state: GameState, position: Vec3, direction: Vec3): GameState {
  if (state.phase !== "preparing" || !state.carried) return state;
  const length = Math.hypot(direction.x, direction.z);
  const valid = Number.isFinite(length) && length > 0;
  const landing = safeItemPosition({ x: position.x + (valid ? direction.x / length : 0) * 3.2, y: 0.45, z: position.z + (valid ? direction.z / length : 1) * 3.2 });
  return announce({ ...state, carried: null, items: state.items.map(item => item.id === state.carried ? { ...item, status: "ground", position: landing } : item) }, "Предмет на земле. Его можно поднять снова.");
}

export function beginStorm(state: GameState): GameState {
  if (state.phase !== "preparing") return state;
  return announce({ ...state, phase: "storm", stormElapsed: 0 }, "Гроза пришла. Возвращайтесь к общему дому — сейчас станет ясно, что удалось сохранить.");
}

export function advanceGame(state: GameState, deltaSeconds: number): GameState {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0 || state.phase === "finished") return state;
  if (state.phase === "preparing") {
    const elapsed = state.elapsed + deltaSeconds;
    if (elapsed < PREPARATION_SECONDS) return { ...state, elapsed };
    const storm = beginStorm({ ...state, elapsed: PREPARATION_SECONDS });
    return advanceGame(storm, elapsed - PREPARATION_SECONDS);
  }
  const stormElapsed = Math.min(STORM_SECONDS, state.stormElapsed + deltaSeconds);
  return stormElapsed >= STORM_SECONDS
    ? announce({ ...state, stormElapsed, phase: "finished" }, "Гроза закончилась. У каждой истории остаётся светлое утро.")
    : { ...state, stormElapsed };
}

export function getOutcome(state: GameState): GameOutcome {
  const suppliesCount = state.delivered.length;
  const supplies = suppliesCount === 3;
  const score = Number(supplies) + Number(state.bridge) + Number(state.power === "shelter");
  const personalComplete = state.character === "mira" ? supplies
    : state.character === "sasha" ? state.bridge
      : state.character === "ren" ? state.power === "shop" : state.power === "shelter";
  const title = score === 3 ? "Район готов к грозе"
    : supplies && state.bridge && state.power === "shop" ? "Свет в витрине"
      : score > 0 || state.power === "shop" ? "Вместе справимся" : "Гроза застала врасплох";
  const description = score === 3
    ? "Припасы собраны, мост выдержал ливень, а в общем доме горит свет. Соседи встретили непогоду вместе."
    : supplies && state.bridge && state.power === "shop"
      ? "Мост выдержал, припасы доставлены и продукты магазина спасены. Но соседи провели ночь в общем доме без света."
      : `${supplies ? "В доме есть все припасы." : `В общий дом доставлено припасов: ${suppliesCount}/3.`} ${state.bridge ? "Мост выдержал ливень." : "Неукреплённый мост пострадал от воды."} ${state.power === "shelter" ? "В общем доме тепло и светло." : state.power === "shop" ? "Продукты магазина спасены, но в общем доме темно." : "Электричество не удалось подключить."}`;
  return { score, title, description, personalComplete, personalText: PERSONAL_GOALS[state.character].description, suppliesCount, bridge: state.bridge, power: state.power };
}
