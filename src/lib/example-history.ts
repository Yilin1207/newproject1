import type { Result } from "./demo-store";

// Display examples only. Never merge these into the player's stored history.
export const EXAMPLE_HISTORY: (Result & { demo: true })[] = [
  {
    id: "example-6", demo: true, date: "2026-11-11T18:30:00+05:00",
    title: "Район готов к грозе", character: "mira", durationSeconds: 548,
    score: 3, power: "shelter", personalComplete: true, suppliesCount: 3, bridge: true,
  },
  {
    id: "example-5", demo: true, date: "2026-11-11T17:40:00+05:00",
    title: "Свет в витрине", character: "ren", durationSeconds: 602,
    score: 2, power: "shop", personalComplete: true, suppliesCount: 3, bridge: true,
  },
  {
    id: "example-4", demo: true, date: "2026-11-10T20:15:00+05:00",
    title: "Вместе справимся", character: "sasha", durationSeconds: 618,
    score: 1, power: null, personalComplete: true, suppliesCount: 2, bridge: true,
  },
  {
    id: "example-3", demo: true, date: "2026-11-10T19:25:00+05:00",
    title: "Район готов к грозе", character: "tim", durationSeconds: 496,
    score: 3, power: "shelter", personalComplete: true, suppliesCount: 3, bridge: true,
  },
  {
    id: "example-2", demo: true, date: "2026-11-09T16:45:00+05:00",
    title: "Вместе справимся", character: "mira", durationSeconds: 618,
    score: 1, power: "shelter", personalComplete: false, suppliesCount: 1, bridge: false,
  },
  {
    id: "example-1", demo: true, date: "2026-11-09T16:10:00+05:00",
    title: "Гроза застала врасплох", character: "ren", durationSeconds: 618,
    score: 0, power: null, personalComplete: false, suppliesCount: 0, bridge: false,
  },
];
