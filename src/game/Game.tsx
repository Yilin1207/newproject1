"use client";

import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import QuestPanel from "./QuestPanel";
import CharacterPortrait from "@/components/CharacterPortrait";
import Engine, { type Controls } from "./Engine";
import { Soundscape } from "./audio";
import {
  advanceGame,
  beginStorm,
  createGame,
  getNearbyInteraction,
  getOutcome,
  interact,
  throwItem,
  PERSONAL_GOALS,
  PREPARATION_SECONDS,
  STORM_SECONDS,
  SPAWN,
  type CharacterId,
  type GameState,
  type Vec3,
} from "./model";
import "./game.css";

type Props = {
  character: CharacterId;
  name: string;
  reducedMotion: boolean;
  hints: boolean;
  onExit: () => void;
  onComplete: (game: GameState) => boolean;
};
type Settings = {
  volume: number;
  sensitivity: number;
  quality: "high" | "low";
};
function readSettings(): Settings {
  try {
    const stored = JSON.parse(
      localStorage.getItem("nash-rayon.game-settings.v1") || "null",
    );
    if (
      stored &&
      Number.isFinite(stored.volume) &&
      Number.isFinite(stored.sensitivity)
    )
      return {
        volume: Math.max(0, Math.min(1, stored.volume)),
        sensitivity: Math.max(0.4, Math.min(2, stored.sensitivity)),
        quality: stored.quality === "low" ? "low" : "high",
      };
  } catch {}
  return { volume: 0.25, sensitivity: 1, quality: "high" };
}

class SceneBoundary extends Component<
  { children: ReactNode; onExit: () => void; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.error ? (
      <div className="game-loading">
        <span className="game-eyebrow">Не удалось открыть 3D-сцену</span>
        <h2>Район пока не загрузился</h2>
        <p>Проверьте поддержку WebGL 2 и аппаратное ускорение браузера.</p>
        <button className="game-button" onClick={this.props.onExit}>
          Вернуться в лобби
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function MiniMap({ position, game }: { position: Vec3; game: GameState }) {
  return (
    <div className="game-map" aria-label="Карта района">
      <svg
        viewBox="-30 -24 60 50"
        role="img"
        aria-label="Вы, припасы и основные места района"
      >
        <rect x="-30" y="-24" width="60" height="50" rx="5" fill="#243e3b" />
        <path d="M-29 14H30" stroke="#688d8c" strokeWidth="5" />
        <path
          d="M-24 -2H24 M0 -17V10 M-15 7H16V20"
          stroke="#afba99"
          opacity=".28"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x="-16"
          y="-14"
          width="8"
          height="7"
          rx="1"
          fill={game.power === "shelter" ? "#e4c475" : "#bcb794"}
        />
        <rect
          x="8"
          y="-14"
          width="8"
          height="7"
          rx="1"
          fill={game.power === "shop" ? "#e4c475" : "#bcb794"}
        />
        <rect
          x="14.5"
          y="10.5"
          width="3"
          height="7"
          fill={game.bridge ? "#b5cb9a" : "#a18c65"}
        />
        <circle cx="-15" cy="8" r="1.5" fill="#9ca889" />
        {game.items
          .filter((i) => i.status === "ground")
          .map((i) => (
            <circle
              key={i.id}
              cx={i.position.x}
              cy={i.position.z}
              r=".9"
              fill={i.kind === "battery" ? "#ffe29b" : "#d2e8b6"}
            />
          ))}
        <circle
          cx={position.x}
          cy={position.z}
          r="2.5"
          fill="#fff4cb"
          opacity=".18"
        />
        <circle
          cx={position.x}
          cy={position.z}
          r="1.2"
          fill="#fff4cb"
          stroke="#203b33"
          strokeWidth=".5"
        />
        <text x="-12" y="-16" textAnchor="middle">
          ДОМ
        </text>
        <text x="12" y="-16" textAnchor="middle">
          МАГАЗИН
        </text>
      </svg>
      <span>
        РАЙОН · ВЫ <i />
      </span>
    </div>
  );
}

export default function Game(props: Props) {
  const [game, setGame] = useState(() => createGame(props.character));
  const gameRef = useRef(game);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [confirmStorm, setConfirmStorm] = useState(false);
  const [position, setPosition] = useState<Vec3>({
    x: SPAWN[0],
    y: 0,
    z: SPAWN[2],
  });
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [session, setSession] = useState(0);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [throwOrigin, setThrowOrigin] = useState<{
    id: string;
    position: Vec3;
  }>();
  const [controlsHelp, setControlsHelp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const sound = useRef<Soundscape | null>(null);
  const completed = useRef(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const controls = useRef<Controls>({
    keys: new Set(),
    yaw: -1.3,
    pitch: 0.47,
    zoom: 10,
    jump: false,
    moving: false,
    running: false,
    facing: { x: Math.sin(1.3), y: 0, z: -Math.cos(1.3) },
    position: { x: SPAWN[0], y: 0, z: SPAWN[2] },
  });
  const active =
    started &&
    ready &&
    !paused &&
    !confirmStorm &&
    !loadError &&
    game.phase !== "finished";
  const activeRef = useRef(active);
  const outcome = getOutcome(game);
  const nearby = getNearbyInteraction(game, position);
  const carried = game.items.find((i) => i.id === game.carried);
  const goal = PERSONAL_GOALS[game.character];

  const update = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setLoadError(true), []);
  const onPosition = useCallback((p: Vec3) => setPosition(p), []);
  const action = useCallback(() => {
    if (!activeRef.current) return;
    const before = gameRef.current;
    const next = interact(before, controls.current.position);
    if (
      next.carried !== before.carried ||
      next.bridge !== before.bridge ||
      next.power !== before.power
    )
      sound.current?.chime();
    update(next);
  }, [update]);
  const toss = useCallback(() => {
    if (activeRef.current && gameRef.current.carried) {
      setThrowOrigin({
        id: gameRef.current.carried,
        position: { ...controls.current.position, y: 1.1 },
      });
      update(
        throwItem(
          gameRef.current,
          controls.current.position,
          controls.current.facing,
        ),
      );
    }
  }, [update]);

  useEffect(() => {
    const original = document.body.style.overflow;
    const appShell = document.getElementById("main")?.parentElement;
    const previousInert = appShell?.inert ?? false;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (appShell) appShell.inert = true;
    const keys = controls.current.keys;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    sound.current = new Soundscape();
    return () => {
      document.body.style.overflow = original;
      if (appShell) appShell.inert = previousInert;
      sound.current?.dispose();
      keys.clear();
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    activeRef.current = active;
    if (!active) controls.current.keys.clear();
  }, [active]);
  useEffect(() => {
    sound.current?.set(settings.volume, game.phase === "storm", !active);
    try {
      localStorage.setItem(
        "nash-rayon.game-settings.v1",
        JSON.stringify(settings),
      );
    } catch {}
  }, [settings, active, game.phase]);
  useEffect(() => {
    let previous = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - previous) / 1000;
      previous = now;
      if (activeRef.current) update(advanceGame(gameRef.current, delta));
    }, 100);
    return () => clearInterval(interval);
  }, [update]);
  useEffect(() => {
    if (game.phase === "finished" && !completed.current) {
      completed.current = true;
      setSaved(props.onComplete(game));
      sound.current?.chime();
    }
  }, [game, props]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches("input,select")) return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
          "KeyE",
          "KeyQ",
          "Escape",
          "KeyH",
        ].includes(e.code)
      )
        e.preventDefault();
      if (e.code === "Escape" && !e.repeat) {
        setPaused((p) => !p);
        setConfirmStorm(false);
        controls.current.keys.clear();
        return;
      }
      if (e.code === "KeyH" && !e.repeat) setControlsHelp((v) => !v);
      if (!activeRef.current) return;
      controls.current.keys.add(e.code);
      if (e.code === "Space" && !e.repeat) controls.current.jump = true;
      if (e.code === "KeyE" && !e.repeat) action();
      if (e.code === "KeyQ" && !e.repeat) toss();
    };
    const up = (e: KeyboardEvent) => controls.current.keys.delete(e.code);
    const blur = () => {
      controls.current.keys.clear();
      controls.current.jump = false;
      drag.current = null;
      if (gameRef.current.phase !== "finished") setPaused(true);
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [action, toss]);

  function start() {
    sound.current?.start();
    sound.current?.set(settings.volume, false, false);
    setStarted(true);
    setPaused(false);
    root.current?.focus();
  }
  function restart() {
    const next = createGame(props.character);
    update(next);
    completed.current = false;
    setSaved(null);
    setStarted(false);
    setPaused(false);
    setConfirmStorm(false);
    setReady(false);
    setThrowOrigin(undefined);
    controls.current.position = { x: SPAWN[0], y: 0, z: SPAWN[2] };
    controls.current.yaw = -1.3;
    controls.current.pitch = 0.47;
    controls.current.zoom = 10;
    controls.current.jump = false;
    controls.current.keys.clear();
    setPosition(controls.current.position);
    setSession((n) => n + 1);
  }
  function touchKey(code: string, down: boolean) {
    if (down) controls.current.keys.add(code);
    else controls.current.keys.delete(code);
  }
  const remaining = Math.max(0, Math.ceil(PREPARATION_SECONDS - game.elapsed));
  const timer = `${Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;

  return createPortal(
    <div
      ref={root}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Игра Наш район"
      className="district-game"
      data-phase={game.phase}
      data-player-position={`${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`}
      data-carried={game.carried || ""}
      data-delivered={game.delivered.length}
    >
      <div
        className="game-viewport"
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (e.button === 0 || e.button === 2) {
            drag.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onPointerMove={(e) => {
          if (!drag.current || !active) return;
          const dx = e.clientX - drag.current.x,
            dy = e.clientY - drag.current.y;
          controls.current.yaw -= dx * 0.005 * settings.sensitivity;
          controls.current.pitch = Math.max(
            0.18,
            Math.min(
              1.2,
              controls.current.pitch + dy * 0.004 * settings.sensitivity,
            ),
          );
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onWheel={(e) => {
          controls.current.zoom = Math.max(
            4.5,
            Math.min(15, controls.current.zoom + e.deltaY * 0.008),
          );
        }}
      >
        <SceneBoundary key={session} onExit={props.onExit} onError={onError}>
          <Engine
            game={game}
            controls={controls}
            active={active}
            quality={settings.quality}
            reducedMotion={props.reducedMotion}
            playerPosition={position}
            throwOrigin={throwOrigin}
            onReady={onReady}
            onError={onError}
            onPosition={onPosition}
          />
        </SceneBoundary>
      </div>
      {!ready && (
        <div className="game-loading" role="status">
          <span className="game-loader" />
          <span className="game-eyebrow">НАШ РАЙОН</span>
          <h2>Собираем маленький мир</h2>
          <p>Подготавливаем окружение, освещение и физику…</p>
          <button className="game-text-button" onClick={props.onExit}>
            Вернуться в лобби
          </button>
        </div>
      )}
      {loadError && (
        <div className="game-loading" role="alert">
          <span className="game-eyebrow">НЕ УДАЛОСЬ ОТКРЫТЬ 3D-СЦЕНУ</span>
          <h2>Район пока не загрузился</h2>
          <p>Проверьте поддержку WebGL 2 и аппаратное ускорение браузера.</p>
          <button className="game-button" onClick={props.onExit}>
            Вернуться в лобби
          </button>
        </div>
      )}
      {ready && (
        <>
          <header className="game-topbar">
            <div className="game-story">
              <span className="game-mark">⌂</span>
              <div>
                <span className="game-eyebrow">НАШ РАЙОН · ИСТОРИЯ 01</span>
                <h1>Перед грозой</h1>
              </div>
            </div>
            <div className={`game-weather ${remaining < 60 ? "urgent" : ""}`}>
              <span>☁</span>
              <div>
                <small>
                  {game.phase === "preparing"
                    ? "ДО ГРОЗЫ"
                    : game.phase === "storm"
                      ? "ПЕРЕЖДИТЕ ЛИВЕНЬ"
                      : "ПОСЛЕ ДОЖДЯ"}
                </small>
                <strong>
                  {game.phase === "preparing"
                    ? timer
                    : game.phase === "storm"
                      ? `${Math.max(0, Math.ceil(STORM_SECONDS - game.stormElapsed))} сек`
                      : "Рассвет"}
                </strong>
              </div>
            </div>
            <button
              className="game-menu-button"
              aria-label="Пауза и настройки"
              onClick={() => setPaused(true)}
            >
              Ⅱ <span>Меню</span>
            </button>
          </header>
          {started && game.phase !== "finished" && (
            <>
              <QuestPanel game={game} />
              <MiniMap position={position} game={game} />
              <div className="game-event" role="status" aria-live="polite">
                {game.lastMessage}
              </div>
              {game.phase === "preparing" && (
                <div className="game-interaction">
                  {nearby ? (
                    <button onClick={action}>
                      <kbd>E</kbd>
                      <span>{nearby.label}</span>
                      <b>↗</b>
                    </button>
                  ) : carried ? (
                    <span className="game-holding">
                      В руках: {carried.label}{" "}
                      <button onClick={toss}>
                        <kbd>Q</kbd> Бросить
                      </button>
                    </span>
                  ) : props.hints ? (
                    <span className="game-holding">
                      Найдите припасы · светящиеся метки на карте
                    </span>
                  ) : null}
                </div>
              )}
              <footer className="game-bottom">
                <div className="game-control-summary">
                  <span>
                    <kbd>W A S D</kbd> Движение
                  </span>
                  <span>
                    <kbd>Shift</kbd> Бег
                  </span>
                  <span>
                    <kbd>Space</kbd> Прыжок
                  </span>
                  <span>Мышь с зажатием · Камера</span>
                  <button
                    aria-label="Показать управление"
                    aria-expanded={controlsHelp}
                    onClick={() => setControlsHelp((v) => !v)}
                  >
                    <kbd>H</kbd>
                  </button>
                </div>
                {game.phase === "preparing" && (
                  <button
                    className="game-storm-button"
                    onClick={() => setConfirmStorm(true)}
                  >
                    Встретить грозу <span>↗</span>
                  </button>
                )}
              </footer>
              <div className="game-touch-controls">
                <div className="game-dpad">
                  {[
                    ["KeyW", "↑"],
                    ["KeyA", "←"],
                    ["KeyS", "↓"],
                    ["KeyD", "→"],
                  ].map(([code, label]) => (
                    <button
                      key={code}
                      aria-label={`Движение ${label}`}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        touchKey(code, true);
                      }}
                      onPointerUp={() => touchKey(code, false)}
                      onPointerCancel={() => touchKey(code, false)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => (controls.current.jump = true)}>
                  Прыжок
                </button>
                <button onClick={action} aria-label="Взаимодействовать">
                  E
                </button>
                <button
                  onClick={toss}
                  aria-label="Бросить предмет"
                  disabled={!carried}
                >
                  Q
                </button>
              </div>
            </>
          )}
          {!started && (
            <div className="game-shade">
              <section className="game-intro game-panel">
                <CharacterPortrait
                  character={props.character}
                  className="game-intro-portrait"
                />
                <span className="game-eyebrow">ВАША ИСТОРИЯ НАЧИНАЕТСЯ</span>
                <h2>
                  Большая гроза.
                  <br />
                  <em>Маленький район.</em>
                </h2>
                <p>
                  У вас 10 минут. Соберите припасы, укрепите мост и выберите,
                  куда дать свет.
                </p>
                <div className="game-intro-goals">
                  <span>01 · Припасы</span>
                  <span>02 · Мост</span>
                  <span>03 · Электричество</span>
                </div>
                <div className="game-intro-personal">
                  <small>ВАША ЛИЧНАЯ ЦЕЛЬ · {props.name}</small>
                  <strong>{goal.title}</strong>
                  <p>{goal.description}</p>
                </div>
                <button className="game-button" onClick={start}>
                  Выйти на улицу <span>→</span>
                </button>
                <p className="game-intro-help">
                  WASD — движение · E — взаимодействие · Escape — пауза
                  <br />
                  Зажмите мышь для обзора. Ресурсы отмечены на карте.
                </p>
                <button className="game-text-button" onClick={props.onExit}>
                  Вернуться в лобби
                </button>
              </section>
            </div>
          )}
          {started && game.phase === "finished" && (
            <div className="game-shade">
              <section className="game-panel game-result">
                <span className="game-result-symbol">☀</span>
                <span className="game-eyebrow">
                  ИСТОРИЯ, КОТОРУЮ МЫ СОХРАНИЛИ
                </span>
                <h2>{outcome.title}</h2>
                <p>{outcome.description}</p>
                <div className="game-result-stats">
                  <span>
                    <b>{outcome.suppliesCount}/3</b>Припасы
                  </span>
                  <span>
                    <b>{game.bridge ? "✓" : "—"}</b>Мост
                  </span>
                  <span>
                    <b>
                      {game.power === "shelter"
                        ? "Дом"
                        : game.power === "shop"
                          ? "Магазин"
                          : "—"}
                    </b>
                    Свет
                  </span>
                </div>
                <div className="game-personal-result">
                  ✧{" "}
                  {outcome.personalComplete
                    ? "Личная цель выполнена"
                    : "Личная цель осталась на следующий раз"}
                  <p>{goal.title}</p>
                </div>
                <div className="game-result-actions">
                  <button className="game-button" onClick={restart}>
                    Новая история ↻
                  </button>
                  <button
                    className="game-button secondary"
                    onClick={props.onExit}
                  >
                    Вернуться в лобби
                  </button>
                </div>
                <small>
                  {saved === null
                    ? "Сохраняем результат…"
                    : saved
                      ? "Результат добавлен в историю профиля."
                      : "Браузер запретил сохранение: результат доступен только в этой вкладке."}
                </small>
              </section>
            </div>
          )}
          {paused && started && game.phase !== "finished" && (
            <div className="game-shade">
              <section className="game-panel game-pause">
                <span className="game-eyebrow">МОЖНО НЕМНОГО ВЫДОХНУТЬ</span>
                <h2>Район подождёт</h2>
                <p>Игра на паузе. Таймер остановлен.</p>
                <button
                  className="game-button"
                  onClick={() => {
                    setPaused(false);
                    root.current?.focus();
                  }}
                >
                  Продолжить <span>→</span>
                </button>
                <button
                  className="game-button secondary"
                  onClick={() => setShowSettings((v) => !v)}
                >
                  Настройки
                </button>
                {showSettings && (
                  <div className="game-settings">
                    <label>
                      Громкость{" "}
                      <span>{Math.round(settings.volume * 100)}%</span>
                      <input
                        aria-label="Громкость"
                        type="range"
                        min="0"
                        max="1"
                        step=".05"
                        value={settings.volume}
                        onChange={(e) =>
                          setSettings({ ...settings, volume: +e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Чувствительность мыши{" "}
                      <span>{settings.sensitivity.toFixed(1)}</span>
                      <input
                        aria-label="Чувствительность мыши"
                        type="range"
                        min=".4"
                        max="2"
                        step=".1"
                        value={settings.sensitivity}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            sensitivity: +e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Качество графики
                      <select
                        value={settings.quality}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            quality: e.target.value as Settings["quality"],
                          })
                        }
                      >
                        <option value="high">Высокое · тени и свечение</option>
                        <option value="low">
                          Экономное · для слабых устройств
                        </option>
                      </select>
                    </label>
                  </div>
                )}
                <button className="game-text-button" onClick={props.onExit}>
                  Выйти в лобби
                </button>
                <small>Незавершённая подготовка будет сброшена.</small>
              </section>
            </div>
          )}
          {confirmStorm && (
            <div className="game-shade">
              <section className="game-panel game-pause">
                <span className="game-eyebrow">ПОРА СОБРАТЬСЯ ВМЕСТЕ</span>
                <h2>Встретим грозу?</h2>
                <p>
                  {game.delivered.length === 3 && game.bridge && game.power
                    ? "Все дела закончены. Посмотрим, что принесёт ночь."
                    : "Не все задачи выполнены. Гроза покажет последствия ваших решений."}
                </p>
                <button
                  className="game-button"
                  onClick={() => {
                    update(beginStorm(gameRef.current));
                    setConfirmStorm(false);
                  }}
                >
                  Да, встретить грозу
                </button>
                <button
                  className="game-button secondary"
                  onClick={() => setConfirmStorm(false)}
                >
                  Ещё немного подготовиться
                </button>
              </section>
            </div>
          )}
          {controlsHelp && (
            <div className="game-help">
              <button
                aria-label="Закрыть управление"
                onClick={() => setControlsHelp(false)}
              >
                ×
              </button>
              <b>Управление</b>
              <p>
                WASD / стрелки — ходьба
                <br />
                Shift — бег · Space — прыжок
                <br />E — поднять, доставить, установить
                <br />Q — бросить предмет
                <br />
                Зажатая мышь — обзор · Колесо — дистанция
                <br />
                Escape — пауза и настройки
              </p>
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
