"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent } from "react";
import CharacterSelect from "@/components/CharacterSelect";
import Neighborhood from "@/components/Neighborhood";
import { Avatar, Icon, Notice, SectionTitle } from "@/components/ui";
import {
  changeRoom,
  characters,
  createRoom,
  finishDemo,
  hasStorageError,
  leaveRoom,
  selectCharacter,
  useDemo,
} from "@/lib/demo-store";
import { getOutcome, type GameState } from "@/game/model";
import "./lobby.css";

const DistrictGame = dynamic(() => import("@/game/Game"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-[#263f38] text-[#eee9d1]"
    >
      <span className="h-10 w-10 animate-spin rounded-full border border-[#c9d2af]/30 border-t-[#e7d49b]" />
      <p className="text-xl">Открываем район…</p>
      <p className="text-xs text-[#bbc9ae]">Загружаем игровую сцену</p>
    </div>
  ),
});

export default function LobbyPage() {
  const demo = useDemo();
  const room = demo.room;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [room?.code, room?.phase]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const leaveButton = useRef<HTMLButtonElement>(null);
  const cancelLeaveButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmLeave) cancelLeaveButton.current?.focus();
  }, [confirmLeave]);
  const current = characters.find((c) => c.id === demo.character)!;
  function join(event: FormEvent) {
    event.preventDefault();
    if (code.trim().toUpperCase() !== "DEMO26") {
      setError("Комната не найдена. Попробуйте DEMO26.");
      return;
    }
    setError("");
    createRoom("DEMO26");
  }
  async function copyCode() {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setNotice("Код скопирован. Сетевая игра появится позже.");
    } catch {
      setNotice(
        `Не удалось скопировать автоматически. Код комнаты: ${room.code}`,
      );
    }
  }
  const score = room
    ? Number(room.supplies) +
      Number(room.bridge) +
      Number(room.power === "shelter")
    : 0;
  return (
    <div className="lobby-page">
      {room && (gameOpen || room.phase === "preparing") && (
        <DistrictGame
          character={demo.character}
          name={demo.name}
          reducedMotion={demo.reducedMotion}
          hints={demo.notifications}
          onExit={() => {
            setGameOpen(false);
            changeRoom({
              phase: "lobby",
              ready: false,
              supplies: false,
              bridge: false,
              power: null,
            });
          }}
          onComplete={(game: GameState) => {
            setGameOpen(true);
            changeRoom({
              phase: "preparing",
              supplies: game.delivered.length === 3,
              bridge: game.bridge,
              power: game.power,
            });
            const outcome = getOutcome(game);
            finishDemo({
              title: outcome.title,
              personalComplete: outcome.personalComplete,
            });
            return !hasStorageError();
          }}
        />
      )}
      <div className="lobby-heading">
      <SectionTitle
        label="Перед грозой"
        title={
          room?.phase === "preparing"
            ? "Успеть до грозы"
            : room?.phase === "finished"
              ? "После дождя"
              : "Ваша игра"
        }
      >
        Выберите героя. Остальное — в ваших руках.
      </SectionTitle>
      <span className="lobby-local-badge"><span /> Локальная игра</span>
      </div>
      <ol className="lobby-steps" aria-label="Подготовка к игре">
        {["Комната", "Ваш герой", "Начало истории"].map((label, index) => {
          const currentStep = !room ? 0 : room.phase === "lobby" ? 1 : 2;
          return (
            <li
              key={label}
              aria-current={index === currentStep ? "step" : undefined}
              data-complete={index < currentStep}
            >
              <span>
                {index < currentStep ? (
                  <Icon name="check" className="h-3 w-3" />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
      {!room ? (
        <div className="lobby-entry-grid">
          <section className="card lobby-scenario">
            <div className="lobby-scenario-art">
              <Neighborhood compact />
              <span className="lobby-story-number">История 01</span>
              <span className="lobby-story-weather"><Icon name="cloud" className="h-4 w-4" /> Скоро гроза</span>
            </div>
            <div className="lobby-scenario-copy">
              <span className="eyebrow">Маленькая история о большой помощи</span>
              <h2>
                Перед грозой
              </h2>
              <p className="lobby-scenario-description">
                Над районом собираются тучи. Помогите соседям собрать припасы,
                укрепить мост и зажечь свет до первого грома.
              </p>
              <div className="lobby-scenario-facts">
                <span><Icon name="clock" className="h-4 w-4" /> 10 минут</span>
                <span><Icon name="people" className="h-4 w-4" /> Вы и демо-команда</span>
              </div>
              <button
                onClick={() => {
                  createRoom();
                  setNotice("");
                }}
                className="button-primary lobby-create-button"
              >
                Создать комнату <Icon name="arrow" />
              </button>
              <p className="lobby-entry-help">
                Без регистрации · Прогресс в этом браузере
              </p>
            </div>
          </section>
          <section className="card lobby-join">
            <span className="lobby-join-icon">
              <Icon name="people" />
            </span>
            <p className="eyebrow mt-5">Уже есть приглашение?</p>
            <h2>Войти по коду</h2>
            <p className="lobby-join-description">
              Введите код демо-комнаты, чтобы познакомиться с лобби и выбрать героя.
            </p>
            <p className="lobby-demo-code">
              Попробуйте демо-комнату:{" "}
              <button
                onClick={() => {
                  setCode("DEMO26");
                  setError("");
                }}
                className="lobby-fill-code"
              >
                DEMO26
              </button>
            </p>
            <form onSubmit={join} className="mt-6">
              <label
                htmlFor="room-code"
                className="mb-2 block text-xs font-medium"
              >
                Код комнаты
              </label>
              <input
                id="room-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="DEMO26"
                maxLength={6}
                required
                minLength={6}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!!error}
                aria-describedby={error ? "join-error join-help" : "join-help"}
                className="field font-mono tracking-[.15em] uppercase"
              />
              {error && (
                <p
                  id="join-error"
                  role="alert"
                  className="mt-3 text-sm text-[#a44f3d]"
                >
                  {error}
                </p>
              )}
              <button className="button-secondary mt-4 w-full" type="submit">
                Войти <Icon name="arrow" />
              </button>
            </form>
            <p
              id="join-help"
              className="lobby-local-note"
            >
              Сейчас игра работает локально. Подключение друзей появится позже.
            </p>
          </section>
        </div>
      ) : (
        <>
          <div className="lobby-room-bar">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-[#edf0e5] p-2.5 text-forest">
                <Icon name="people" />
              </span>
              <div>
                <p className="text-[10px] tracking-widest text-muted uppercase">
                  Демо-комната
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-[.18em]">
                  {room.code}
                </p>
              </div>
              <button
                aria-label="Скопировать код комнаты"
                onClick={copyCode}
                className="rounded-lg p-3 text-muted hover:bg-[#edf0e5]"
              >
                <Icon name="copy" />
              </button>
            </div>
            <button
              ref={leaveButton}
              onClick={() => setConfirmLeave(true)}
              aria-expanded={confirmLeave}
              aria-controls="leave-confirmation"
              className="lobby-leave-button"
            >
              <Icon name="exit" className="h-4 w-4" />
              Выйти из комнаты
            </button>
          </div>
          {confirmLeave && (
            <div id="leave-confirmation" className="lobby-leave-confirmation" role="region" aria-labelledby="leave-title">
              <p id="leave-title" className="font-semibold">Покинуть эту историю?</p>
              <p className="mt-1 text-sm">
                Незавершённая подготовка будет сброшена.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => {
                    leaveRoom();
                    setConfirmLeave(false);
                    setNotice("");
                  }}
                  className="button-secondary"
                >
                  Да, выйти
                </button>
                <button
                  ref={cancelLeaveButton}
                  onClick={() => {
                    setConfirmLeave(false);
                    leaveButton.current?.focus();
                  }}
                  className="button-primary"
                >
                  Остаться
                </button>
              </div>
            </div>
          )}
          {notice && (
            <div className="mb-5">
              <Notice>{notice}</Notice>
            </div>
          )}
          {room.phase === "lobby" && (
            <div className="lobby-preparation-grid">
              <CharacterSelect
                value={demo.character}
                onChange={(id) => {
                  selectCharacter(id);
                  changeRoom({ ready: false });
                }}
              />
              <div className="space-y-5">
                <section className="card team-card lobby-team p-6">
                  <h2 className="text-lg font-semibold">Ваша команда</h2>
                  <p className="mt-2 text-xs text-muted">
                    Вы и два демо-персонажа
                  </p>
                  <div className="mt-5 space-y-4">
                    <div className="lobby-team-member">
                      <Avatar character={current.id} />
                      <div className="lobby-member-copy">
                        <p className="text-sm font-semibold">
                          {demo.name}{" "}
                          <span className="text-xs font-normal text-muted">
                            · вы
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {current.name}
                        </p>
                      </div>
                      <span
                        className="lobby-ready-status"
                        data-ready={room.ready}
                      >
                        <span />
                        {room.ready ? "Готов" : "Выбирает"}
                      </span>
                    </div>
                    {[characters[1], characters[3]].map((c) => (
                      <div key={c.id} className="lobby-team-member">
                        <Avatar character={c.id} />
                        <div className="lobby-member-copy">
                          <p className="text-sm font-medium">
                            {c.name}{" "}
                            <span className="text-xs font-normal text-muted">
                              · демо
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Демо-персонаж
                          </p>
                        </div>
                        <Icon name="check" className="h-4 w-4 text-forest" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-line pt-5">
                    <button
                      onClick={() => changeRoom({ ready: !room.ready })}
                      aria-pressed={room.ready}
                      className="button-secondary w-full"
                    >
                      {room.ready ? "Отменить готовность" : "Я готов"}
                      <Icon name="check" />
                    </button>
                    <button
                      disabled={!room.ready}
                      onClick={() => {
                        setGameOpen(true);
                        changeRoom({ phase: "preparing" });
                        setNotice("");
                      }}
                      className="button-primary mt-3 w-full"
                    >
                      Начать игру <Icon name="arrow" />
                    </button>
                    <p className="mt-3 text-center text-xs text-muted">
                      {room.ready
                        ? "Можно начинать"
                        : "Сначала нажмите «Я готов»"}
                    </p>
                  </div>
                </section>
                <div className="lobby-scenario-reminder">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Icon name="cloud" />
                    Сценарий «Перед грозой»
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted">
                    Припасы, мост и свет. На всё — 10 минут.
                  </p>
                </div>
              </div>
            </div>
          )}
          {room.phase === "preparing" && (
            <div className="card p-8 text-center" role="status">
              <p className="text-sm text-muted">Открываем район…</p>
              <button
                className="button-secondary mt-4"
                onClick={() => changeRoom({ phase: "lobby", ready: false })}
              >
                Вернуться к выбору героя
              </button>
            </div>
          )}
          {room.phase === "finished" && (
            <section className="card mx-auto max-w-3xl overflow-hidden">
              <div className="h-48">
                <Neighborhood compact />
              </div>
              <div className="p-7 text-center md:p-10">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e7eddf] text-forest">
                  <Icon
                    name={score === 3 ? "check" : "cloud"}
                    className="h-7 w-7"
                  />
                </span>
                <p className="eyebrow mt-5">Подготовка завершена</p>
                <h2 className="mt-3 text-3xl font-semibold">
                  {score === 3
                    ? "Район готов к грозе"
                    : score > 0
                      ? "Вместе справимся"
                      : "Гроза застала врасплох"}
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted">
                  {score === 3
                    ? "Припасы собраны, мост укреплён, а в общем доме горит свет. Соседи встретят непогоду вместе."
                    : "Не всё удалось подготовить. Но каждая помощь имеет значение — в следующей истории можно попробовать другой путь."}
                </p>
                <div className="my-7 grid gap-3 text-xs sm:grid-cols-3">
                  <div className="rounded-xl bg-[#f0f2e9] p-4">
                    Припасы: <b>{room.supplies ? "собраны" : "не собраны"}</b>
                  </div>
                  <div className="rounded-xl bg-[#f0f2e9] p-4">
                    Мост: <b>{room.bridge ? "укреплён" : "не укреплён"}</b>
                  </div>
                  <div className="rounded-xl bg-[#f0f2e9] p-4">
                    Свет:{" "}
                    <b>
                      {room.power === "shelter"
                        ? "в общем доме"
                        : room.power === "shop"
                          ? "в магазине"
                          : "не подключён"}
                    </b>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      changeRoom({
                        phase: "lobby",
                        ready: false,
                        supplies: false,
                        bridge: false,
                        power: null,
                      });
                      setNotice("");
                    }}
                    className="button-primary"
                  >
                    Сыграть ещё раз <Icon name="arrow" />
                  </button>
                  <Link href="/profile" className="button-secondary">
                    Посмотреть профиль
                  </Link>
                </div>
                <p className="mt-5 text-xs text-muted">
                  Результат добавлен в локальную историю профиля.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
