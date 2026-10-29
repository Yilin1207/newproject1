"use client";

import { useSyncExternalStore } from "react";

export const characters = [
  {
    id: "mira",
    name: "Мира",
    role: "Забота о соседях",
    color: "#90b7a0",
    description: "Знает всех в районе и всегда готова помочь.",
  },
  {
    id: "sasha",
    name: "Саша",
    role: "Мастер на все руки",
    color: "#dfa084",
    description: "Починит мост и найдёт выход из любой ситуации.",
  },
  {
    id: "ren",
    name: "Рен",
    role: "Светлая голова",
    color: "#a7a0c4",
    description: "Разбирается в технике и продумывает всё наперёд.",
  },
  {
    id: "tim",
    name: "Тим",
    role: "Душа команды",
    color: "#d7b56e",
    description: "Умеет договариваться и объединять соседей.",
  },
] as const;
export type CharacterId = (typeof characters)[number]["id"];
export type Power = "shelter" | "shop" | null;
export type DemoRoom = {
  code: string;
  ready: boolean;
  phase: "lobby" | "preparing" | "finished";
  supplies: boolean;
  bridge: boolean;
  power: Power;
};
export type Result = {
  id: string;
  date: string;
  title: string;
  score: number;
  power: Power;
};
export type DemoState = {
  name: string;
  character: CharacterId;
  notifications: boolean;
  reducedMotion: boolean;
  room: DemoRoom | null;
  history: Result[];
};
const KEY = "nash-rayon.frontend.v1";
const initial: DemoState = {
  name: "Сосед",
  character: "mira",
  notifications: true,
  reducedMotion: false,
  room: null,
  history: [],
};
let state = initial;
let initialized = false;
let storageError = false;
const listeners = new Set<() => void>();
const isPower = (value: unknown): value is Power =>
  value === null || value === "shelter" || value === "shop";

function parse(raw: string | null): DemoState {
  if (!raw) return initial;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return initial;
    const room = data.room;
    const validRoom =
      room &&
      /^[A-Z0-9]{6}$/.test(room.code) &&
      ["lobby", "preparing", "finished"].includes(room.phase) &&
      typeof room.ready === "boolean" &&
      typeof room.supplies === "boolean" &&
      typeof room.bridge === "boolean" &&
      isPower(room.power);
    return {
      name:
        typeof data.name === "string" && data.name.trim().length >= 2
          ? data.name.trim().slice(0, 24)
          : initial.name,
      character: characters.some((c) => c.id === data.character)
        ? data.character
        : initial.character,
      notifications:
        typeof data.notifications === "boolean" ? data.notifications : true,
      reducedMotion:
        typeof data.reducedMotion === "boolean" ? data.reducedMotion : false,
      room: validRoom ? room : null,
      history: Array.isArray(data.history)
        ? data.history
            .filter(
              (r: Result) =>
                r &&
                typeof r.id === "string" &&
                typeof r.title === "string" &&
                typeof r.date === "string" &&
                Number.isFinite(Date.parse(r.date)) &&
                Number.isInteger(r.score) &&
                r.score >= 0 &&
                r.score <= 3 &&
                isPower(r.power),
            )
            .slice(0, 30)
        : [],
    };
  } catch {
    return initial;
  }
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    state = parse(localStorage.getItem(KEY));
  } catch {
    storageError = true;
  }
  window.addEventListener("storage", (event) => {
    if (event.key === KEY || event.key === null) {
      state = parse(event.newValue);
      listeners.forEach((fn) => fn());
    }
  });
}
function subscribe(listener: () => void) {
  initialize();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useDemo() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
}
export function hasStorageError() {
  return storageError;
}
function update(next: DemoState) {
  initialize();
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    storageError = false;
  } catch {
    storageError = true;
  }
  listeners.forEach((fn) => fn());
}
export function saveProfile(
  values: Pick<
    DemoState,
    "name" | "character" | "notifications" | "reducedMotion"
  >,
) {
  update({ ...state, ...values });
}
export function selectCharacter(character: CharacterId) {
  update({ ...state, character });
}
export function createRoom(code?: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const generated = Array.from(
    crypto.getRandomValues(new Uint8Array(6)),
    (value) => alphabet[value % alphabet.length],
  ).join("");
  update({
    ...state,
    room: {
      code: code || generated,
      ready: false,
      phase: "lobby",
      supplies: false,
      bridge: false,
      power: null,
    },
  });
}
export function changeRoom(values: Partial<DemoRoom>) {
  if (state.room) update({ ...state, room: { ...state.room, ...values } });
}
export function leaveRoom() {
  update({ ...state, room: null });
}
export function finishDemo() {
  if (!state.room || state.room.phase !== "preparing") return;
  const score =
    Number(state.room.supplies) +
    Number(state.room.bridge) +
    Number(state.room.power === "shelter");
  const result: Result = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    score,
    power: state.room.power,
    title:
      score === 3
        ? "Район готов к грозе"
        : score >= 1
          ? "Вместе справимся"
          : "Гроза застала врасплох",
  };
  update({
    ...state,
    room: { ...state.room, phase: "finished" },
    history: [result, ...state.history].slice(0, 30),
  });
}
export function clearHistory() {
  update({ ...state, history: [] });
}
