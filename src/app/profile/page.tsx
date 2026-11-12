"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Avatar, Icon, Notice, SectionTitle } from "@/components/ui";
import Achievements from "@/components/Achievements";
import FriendsPanel from "@/components/FriendsPanel";
import PlayerStats from "@/components/PlayerStats";
import { EXAMPLE_HISTORY } from "@/lib/example-history";
import {
  characters,
  clearHistory,
  hasStorageError,
  saveProfile,
  useDemo,
  type DemoState,
} from "@/lib/demo-store";

function ProfileForm({
  profile,
  onSaved,
}: {
  profile: DemoState;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [character, setCharacter] = useState(profile.character);
  const [notifications, setNotifications] = useState(profile.notifications);
  const [reducedMotion, setReducedMotion] = useState(profile.reducedMotion);
  const [error, setError] = useState("");
  const dirty =
    name !== profile.name ||
    character !== profile.character ||
    notifications !== profile.notifications ||
    reducedMotion !== profile.reducedMotion;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Введите имя от 2 до 24 символов.");
      return;
    }
    saveProfile({ name: name.trim(), character, notifications, reducedMotion });
    setError("");
    onSaved(
      hasStorageError()
        ? "Изменения применены, но браузер запретил их сохранение на устройстве."
        : "Профиль сохранён.",
    );
  }
  return (
    <form onSubmit={submit} className="card profile-form p-6 md:p-7">
      <h2 className="text-lg font-semibold">Ваш персонаж</h2>
      <p className="mt-2 text-sm text-muted">Имя, герой и настройки.</p>
      <label
        htmlFor="profile-name"
        className="mt-6 mb-2 block text-xs font-medium"
      >
        Как вас называть?
      </label>
      <input
        id="profile-name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          onSaved("");
          setError("");
        }}
        minLength={2}
        maxLength={24}
        required
        className="field"
        autoComplete="nickname"
        aria-invalid={!!error}
        aria-describedby={error ? "name-error" : "name-help"}
      />
      <p id="name-help" className="mt-2 text-xs text-muted">
        От 2 до 24 символов.
      </p>
      {error && (
        <p id="name-error" role="alert" className="mt-2 text-sm text-[#a44f3d]">
          {error}
        </p>
      )}
      <fieldset className="mt-7">
        <legend className="text-xs font-medium">Любимый персонаж</legend>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {characters.map((c) => (
            <label
              key={c.id}
              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 ${character === c.id ? "border-[#92aa81] bg-[#edf1e5]" : "border-line"}`}
            >
              <input
                type="radio"
                name="character"
                value={c.id}
                checked={character === c.id}
                onChange={() => {
                  setCharacter(c.id);
                  onSaved("");
                }}
                className="absolute top-2 right-2 h-3 w-3 accent-[#42664e]"
              />
              <Avatar character={c.id} />
              <span className="text-xs font-medium">{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-7 border-t border-line pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="settings" className="h-4 w-4" />
          Настроить под себя
        </h3>
        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm">Советы соседей</span>
            <span className="mt-1 block text-xs text-muted">
              Подсказки во время подготовки района
            </span>
          </span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => {
              setNotifications(e.target.checked);
              onSaved("");
            }}
            className="profile-switch"
          />
        </label>
        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block text-sm">Меньше движения</span>
            <span className="mt-1 block text-xs text-muted">
              Отключить плавные переходы интерфейса
            </span>
          </span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => {
              setReducedMotion(e.target.checked);
              onSaved("");
            }}
            className="profile-switch"
          />
        </label>
      </div>
      <div className="profile-save-row">
        <button type="submit" disabled={!dirty} className="button-primary">
          Сохранить <Icon name="check" />
        </button>
        <span role="status">{dirty ? "Есть изменения" : "Всё сохранено"}</span>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const demo = useDemo();
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "best" | "personal">("all");
  const history = demo.history;
  const [historySource, setHistorySource] = useState<"personal" | "examples">("examples");
  const showingExamples = historySource === "examples";
  const displayedHistory = showingExamples ? EXAMPLE_HISTORY : history;
  const character = characters.find((c) => c.id === demo.character)!;
  const saved = history.filter((r) => r.score === 3).length;
  const visibleHistory = displayedHistory.filter((result) =>
    filter === "best"
      ? result.score === 3
      : filter === "personal"
        ? result.personalComplete === true
        : true,
  );
  return (
    <>
      <SectionTitle label="Житель района" title="Мой профиль">
        Ваш герой, настройки и результаты игр.
      </SectionTitle>
      <div className="grid items-start gap-6 xl:grid-cols-[.7fr_1.3fr]">
        <div className="profile-sidebar">
          <aside className="card profile-passport p-7 text-center">
            <div className="flex justify-center">
              <Avatar character={character.id} size="large" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">{demo.name}</h2>
            <span className="mt-3 inline-block rounded-full bg-[#edf0e4] px-3 py-1.5 text-[10px] font-medium tracking-wide text-forest">
              ЖИТЕЛЬ РАЙОНА
            </span>
            <p className="mt-5 text-sm leading-7 text-muted">
              {character.name} · {character.role}
              <br />
              {character.description}
            </p>
            <div className="mt-7 grid grid-cols-2 divide-x divide-line border-y border-line py-5">
              <div>
                <p className="text-3xl font-semibold">{history.length}</p>
                <p className="mt-2 text-[10px] text-muted">Историй пройдено</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{saved}</p>
                <p className="mt-2 text-[10px] text-muted">Районов спасено</p>
              </div>
            </div>
            <p className="mt-5 text-xs leading-6 text-muted">
              Статистика по последним 30 играм в этом браузере
            </p>
            <Link href="/lobby" className="button-secondary mt-6 w-full">
              Вернуться в район <Icon name="arrow" />
            </Link>
          </aside>
          <FriendsPanel />
        </div>
        <div>
          <ProfileForm
            key={JSON.stringify([
              demo.name,
              demo.character,
              demo.notifications,
              demo.reducedMotion,
            ])}
            profile={demo}
            onSaved={setSavedMessage}
          />
          {savedMessage && (
            <div className="mt-4">
              <Notice>{savedMessage}</Notice>
            </div>
          )}
        </div>
      </div>
      <Achievements history={history} />
      <PlayerStats history={history} />
      <section id="game-history" className="card mt-7 p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Истории игр
            </h2>
            <p className="mt-2 text-sm text-muted">
              {showingExamples
                ? "Демо-истории: примеры прохождений с разными героями и концовками."
                : "Ваши последние 30 завершённых игр в этом браузере."}
            </p>
          </div>
          {!showingExamples && history.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="rounded-lg px-3 py-2 text-xs text-muted hover:bg-[#f4e9df]"
            >
              Очистить историю
            </button>
          )}
        </div>
        <div className="profile-demo-toolbar mt-5">
          <div className="history-mode" role="group" aria-label="Источник историй">
            {([
              { id: "personal", label: "Мои игры", count: history.length },
              { id: "examples", label: "Демо-истории", count: EXAMPLE_HISTORY.length },
            ] as const).map((source) => (
              <button
                key={source.id}
                type="button"
                aria-pressed={historySource === source.id}
                onClick={() => {
                  setHistorySource(source.id);
                  setFilter("all");
                  setConfirmClear(false);
                }}
              >
                {source.label}<span>{source.count}</span>
              </button>
            ))}
          </div>
          <p>
            {showingExamples
              ? "Вымышленные примеры · не влияют на вашу статистику и достижения"
              : "Только ваши сохранённые прохождения"}
          </p>
        </div>
        {displayedHistory.length > 0 && (
          <div className="history-filters" aria-label="Фильтр истории">
            {(
              [
                { id: "all", label: "Все" },
                { id: "best", label: "Район спасён" },
                { id: "personal", label: "Личная цель" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
        {confirmClear && !showingExamples && (
          <div className="mt-5 rounded-xl bg-[#f4efdf] p-4">
            <p className="text-sm">Удалить все результаты из этого браузера?</p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  clearHistory();
                  setConfirmClear(false);
                  setFilter("all");
                  setSavedMessage(
                    hasStorageError()
                      ? "История очищена в этой вкладке, но браузер не сохранил изменение."
                      : "История очищена.",
                  );
                }}
                className="button-secondary"
              >
                Удалить результаты
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="button-primary"
              >
                Сохранить историю
              </button>
            </div>
          </div>
        )}
        {displayedHistory.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="rounded-2xl bg-[#eef0e6] p-4 text-[#8a9a7c]">
              <Icon name="clock" className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">
              Ваша первая история ещё впереди
            </h3>
            <p className="mt-2 max-w-sm text-xs leading-6 text-muted">
              Завершите игру «Перед грозой».
              <br />
              Здесь появятся результат и ваши решения.
            </p>
            <Link
              href="/lobby"
              className="mt-5 flex items-center gap-2 text-sm font-medium text-forest"
            >
              Начать историю <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        ) : visibleHistory.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted" role="status">
            Таких историй пока нет. Всё впереди.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-line">
            {visibleHistory.map((result) => (
              <li
                key={result.id}
                className="flex flex-wrap items-center gap-4 py-5"
              >
                <span
                  className={`rounded-xl p-3 ${result.score === 3 ? "bg-[#e8eedf] text-forest" : "bg-[#f2ead9] text-[#a38655]"}`}
                >
                  <Icon name={result.score === 3 ? "check" : "cloud"} />
                </span>
                <div className="min-w-40 flex-1">
                  <div className="history-result-title">
                    <h3 className="text-sm font-semibold">{result.title}</h3>
                    {showingExamples && <span className="demo-tag">Демо</span>}
                  </div>
                  {(result.character || result.durationSeconds !== undefined) && (
                    <div className="history-team">
                      {result.character && (
                        <span className="history-character">
                          <Avatar character={result.character} />
                          {characters.find((c) => c.id === result.character)?.name}
                        </span>
                      )}
                      <span>
                        <Icon name="people" className="h-3 w-3" />
                        Одиночная игра
                      </span>
                      {result.durationSeconds !== undefined && (
                        <span>
                          <Icon name="clock" className="h-3 w-3" />
                          {Math.floor(result.durationSeconds / 60)}:
                          {String(result.durationSeconds % 60).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  )}
                  {result.personalComplete === true && (
                    <span className="history-personal">
                      <Icon name="heart" className="h-3 w-3" /> Личная цель
                      выполнена
                    </span>
                  )}
                  <p className="mt-1 text-xs leading-6 text-muted">
                    {result.power === "shelter"
                      ? "Свет в общем доме"
                      : result.power === "shop"
                        ? "Свет в магазине"
                        : "Аккумулятор не подключён"}{" "}
                    · Готовность {result.score}/3
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted">
                    Припасы: {result.suppliesCount === undefined ? "нет данных" : `${result.suppliesCount}/3`}
                    {" · "}Мост: {result.bridge === undefined ? "нет данных" : result.bridge ? "укреплён" : "не укреплён"}
                    {" · "}Личная цель: {result.personalComplete === undefined ? "нет данных" : result.personalComplete ? "выполнена" : "не выполнена"}
                  </p>
                </div>
                <time dateTime={result.date} className="text-xs text-muted">
                  {new Date(result.date).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Qyzylorda",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
