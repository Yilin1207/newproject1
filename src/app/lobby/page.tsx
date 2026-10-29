"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
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
  const current = characters.find((c) => c.id === demo.character)!;
  function join(event: FormEvent) {
    event.preventDefault();
    if (code.trim().toUpperCase() !== "DEMO26") {
      setError(
        "Комната не найдена. Для проверки интерфейса используйте код DEMO26.",
      );
      return;
    }
    setError("");
    createRoom("DEMO26");
  }
  async function copyCode() {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setNotice(
        "Код скопирован. Подключение друзей появится после добавления сервера.",
      );
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
    <>
      <SectionTitle
        label="Здесь собираются соседи"
        title={
          room?.phase === "preparing"
            ? "Успеть до грозы"
            : room?.phase === "finished"
              ? "После дождя"
              : "Игровая комната"
        }
      >
        Выберите своего героя и подготовьте район к непогоде. Маленькие дела
        складываются в большую историю.
      </SectionTitle>
      {!room ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="card overflow-hidden">
            <div className="h-60 overflow-hidden">
              <Neighborhood compact />
            </div>
            <div className="p-7">
              <span className="eyebrow">Начните свою историю</span>
              <h2 className="mt-3 text-2xl font-semibold">
                В вашем районе ждут
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Создайте демо-комнату, познакомьтесь с персонажами и посмотрите,
                как решения меняют итог подготовки.
              </p>
              <button
                onClick={() => {
                  createRoom();
                  setNotice("");
                }}
                className="button-primary mt-6 w-full"
              >
                Создать комнату <Icon name="arrow" />
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                Без регистрации · Сохраняется в этом браузере
              </p>
            </div>
          </section>
          <div className="space-y-6">
            <section className="card p-7">
              <span className="inline-flex rounded-xl bg-[#e9eddf] p-3 text-forest">
                <Icon name="people" />
              </span>
              <h2 className="mt-5 text-xl font-semibold">
                Уже есть приглашение?
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Проверьте вход в демонстрационную комнату. Для неё приготовлен
                код{" "}
                <button
                  onClick={() => {
                    setCode("DEMO26");
                    setError("");
                  }}
                  className="font-semibold text-forest underline underline-offset-4"
                >
                  DEMO26
                </button>
                .
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
                  placeholder="Например, DEMO26"
                  maxLength={6}
                  required
                  minLength={6}
                  autoComplete="off"
                  aria-invalid={!!error}
                  aria-describedby={error ? "join-error" : "join-help"}
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
                  Войти по коду <Icon name="arrow" />
                </button>
              </form>
              <p id="join-help" className="mt-4 text-xs leading-6 text-muted">
                Сетевые комнаты пока недоступны. Демо показывает будущий
                сценарий подключения.
              </p>
            </section>
            <div className="rounded-2xl bg-[#e9eddf] p-6">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="heart" />
                Место найдётся каждому
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                В полной версии в одной комнате смогут играть до четырёх друзей.
                Сейчас все действия происходят локально.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4">
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
              onClick={() => setConfirmLeave(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-[#f4e9df]"
            >
              <Icon name="exit" className="h-4 w-4" />
              Выйти из комнаты
            </button>
          </div>
          {confirmLeave && (
            <div className="mb-5 rounded-xl border border-[#dfc9ad] bg-[#f8efdd] p-4">
              <p className="text-sm">
                Выйти из комнаты? Незавершённая подготовка будет сброшена.
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
                  onClick={() => setConfirmLeave(false)}
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
            <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
              <section className="card p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Кем вы будете сегодня?
                  </h2>
                  <span className="text-xs text-muted">4 персонажа</span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Разные характеры. Один общий дом.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {characters.map((character) => (
                    <button
                      key={character.id}
                      aria-pressed={demo.character === character.id}
                      onClick={() => {
                        selectCharacter(character.id);
                        changeRoom({ ready: false });
                      }}
                      className={`relative flex flex-col items-center rounded-2xl border-2 px-3 py-5 text-center transition-colors ${demo.character === character.id ? "border-[#7e9a72] bg-[#eef1e5]" : "border-transparent bg-[#f2f3ec] hover:border-line"}`}
                    >
                      <span className="[&_svg]:h-20 [&_svg]:w-20">
                        <Avatar color={character.color} />
                      </span>
                      <span className="mt-3 text-sm font-semibold">
                        {character.name}
                      </span>
                      <span className="mt-1 text-[10px] text-muted">
                        {character.role}
                      </span>
                      {demo.character === character.id && (
                        <span className="absolute top-3 right-3 rounded-full bg-forest p-1 text-white">
                          <Icon name="check" className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-5 rounded-xl bg-[#f0f1e9] p-4 text-xs leading-6 text-muted">
                  <b className="text-ink">{current.name}:</b>{" "}
                  {current.description}
                </p>
              </section>
              <div className="space-y-5">
                <section className="card p-6">
                  <h2 className="text-lg font-semibold">Ваша команда</h2>
                  <p className="mt-2 text-xs text-muted">
                    Вы и два демонстрационных соседа
                  </p>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar color={current.color} />
                      <div className="flex-1">
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
                        className={`text-xs ${room.ready ? "text-forest" : "text-muted"}`}
                      >
                        {room.ready ? "Готов" : "Выбирает"}
                      </span>
                    </div>
                    {[characters[1], characters[3]].map((c) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <Avatar color={c.color} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {c.name}{" "}
                            <span className="text-xs font-normal text-muted">
                              · демо
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Персонаж интерфейса
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
                        changeRoom({ phase: "preparing" });
                        setNotice("");
                      }}
                      className="button-primary mt-3 w-full"
                    >
                      Начать подготовку <Icon name="arrow" />
                    </button>
                    <p className="mt-3 text-center text-xs text-muted">
                      {room.ready
                        ? "Все готовы. Можно начинать!"
                        : "Подтвердите готовность, чтобы начать"}
                    </p>
                  </div>
                </section>
                <div className="rounded-2xl bg-[#eee9dc] p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Icon name="cloud" />
                    Сценарий «Перед грозой»
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted">
                    Три задачи, один непростой выбор и уютный район, которому
                    нужна ваша помощь.
                  </p>
                </div>
              </div>
            </div>
          )}
          {room.phase === "preparing" && (
            <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
              <section className="card p-6 md:p-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">План добрых дел</h2>
                  <span className="rounded-full bg-[#edf0e4] px-3 py-1.5 text-xs">
                    {Number(room.supplies) +
                      Number(room.bridge) +
                      Number(!!room.power)}{" "}
                    из 3
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Нажмите на задачи, чтобы подготовить район. В этом демо нет
                  таймера — можно спокойно всё обдумать.
                </p>
                <div className="mt-6 space-y-4">
                  {(
                    [
                      {
                        key: "supplies",
                        icon: "box",
                        title: "Собрать припасы",
                        detail: "Вода, еда и тёплые одеяла для общего дома.",
                      },
                      {
                        key: "bridge",
                        icon: "bridge",
                        title: "Укрепить мост",
                        detail: "Пусть дорога к соседям останется безопасной.",
                      },
                    ] as const
                  ).map((task) => (
                    <button
                      key={task.key}
                      aria-pressed={room[task.key]}
                      onClick={() =>
                        changeRoom({ [task.key]: !room[task.key] })
                      }
                      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left ${room[task.key] ? "border-[#a9b99c] bg-[#edf1e5]" : "border-line hover:bg-white"}`}
                    >
                      <span className="rounded-xl bg-white/70 p-3 text-forest">
                        <Icon name={task.icon} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">
                          {task.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted">
                          {task.detail}
                        </span>
                      </span>
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${room[task.key] ? "border-forest bg-forest text-white" : "border-[#bbc5b2]"}`}
                      >
                        {room[task.key] && (
                          <Icon name="check" className="h-4 w-4" />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <fieldset className="mt-6 rounded-xl border border-[#dfd3b8] bg-[#f4efdf] p-5">
                  <legend className="px-2 text-sm font-semibold">
                    Один аккумулятор. Два здания.
                  </legend>
                  <p className="mb-4 text-xs leading-6 text-muted">
                    Электричества хватит только на одно место. Ваш выбор изменит
                    результат.
                  </p>
                  {(
                    [
                      {
                        value: "shelter",
                        title: "Общий дом",
                        text: "Тепло и свет для всех соседей.",
                      },
                      {
                        value: "shop",
                        title: "Магазин",
                        text: "Сохраним продукты, но в доме погаснет свет.",
                      },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg bg-white/60 p-3"
                    >
                      <input
                        type="radio"
                        name="power"
                        value={option.value}
                        checked={room.power === option.value}
                        onChange={() => changeRoom({ power: option.value })}
                        className="mt-1 accent-[#42664e]"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {option.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted">
                          {option.text}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <button
                  onClick={() => {
                    finishDemo();
                    setNotice(
                      hasStorageError()
                        ? "Браузер запретил сохранение. Результат доступен до закрытия страницы."
                        : "",
                    );
                  }}
                  className="button-primary mt-6 w-full"
                >
                  Встретить грозу <Icon name="cloud" />
                </button>
              </section>
              <aside className="space-y-5">
                <div className="card overflow-hidden">
                  <div className="h-64">
                    <Neighborhood compact />
                  </div>
                  <div className="p-6">
                    <p className="eyebrow">Ваш район сегодня</p>
                    <h2 className="mt-3 text-xl font-semibold">
                      Даже маленькая помощь важна
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      Вы можете закончить подготовку в любой момент.
                      Невыполненные задачи повлияют на итог.
                    </p>
                  </div>
                </div>
                {demo.notifications && (
                  <Notice>
                    Совет соседа: припасы, крепкий мост и электричество в общем
                    доме помогут защитить весь район.
                  </Notice>
                )}
              </aside>
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
    </>
  );
}
