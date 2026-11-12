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
import "./profile.css";

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
    <form onSubmit={submit} className="profile-editor">
      <div className="profile-editor-heading">
        <div>
          <p className="eyebrow">Всё по-вашему</p>
          <h2>Настроить профиль</h2>
        </div>
        <Icon name="settings" className="h-5 w-5" />
      </div>
      <div className="profile-form-section">
        <div className="profile-section-label">
          <span aria-hidden="true">01</span>
          <label htmlFor="profile-name">Как вас называть?</label>
        </div>
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
        <p id="name-help" className="profile-field-hint">
          От 2 до 24 символов. Имя для вашего профиля в районе.
        </p>
        {error && <p id="name-error" role="alert" className="profile-field-error">{error}</p>}
      </div>
      <fieldset className="profile-form-section">
        <legend className="profile-section-label">
          <span aria-hidden="true">02</span>
          Любимый персонаж
        </legend>
        <div className="profile-character-grid">
          {characters.map((c) => (
            <label key={c.id} className="profile-character-choice" data-selected={character === c.id}>
              <input
                type="radio"
                name="character"
                value={c.id}
                checked={character === c.id}
                onChange={() => {
                  setCharacter(c.id);
                  onSaved("");
                }}
              />
              <Avatar character={c.id} />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="profile-form-section">
        <h3 className="profile-section-label"><span aria-hidden="true">03</span>Ваш комфорт</h3>
        <label className="profile-preference">
          <span>
            <strong>Советы соседей</strong>
            <span>Подсказки во время подготовки района</span>
          </span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => {
              setNotifications(e.target.checked);
              onSaved("");
            }}
            className="profile-preference-switch"
          />
        </label>
        <label className="profile-preference">
          <span>
            <strong>Меньше движения</strong>
            <span>Отключить плавные переходы интерфейса</span>
          </span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => {
              setReducedMotion(e.target.checked);
              onSaved("");
            }}
            className="profile-preference-switch"
          />
        </label>
      </div>
      <div className="profile-editor-footer">
        <span role="status" className="profile-save-status" data-dirty={dirty}>
          <span aria-hidden="true" />
          {dirty ? "Есть несохранённые изменения" : "Всё сохранено"}
        </span>
        <button type="submit" disabled={!dirty} className="button-primary">
          Сохранить <Icon name="check" />
        </button>
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
    <div className="profile-page">
      <div className="profile-intro">
        <SectionTitle label="Личное пространство" title="Мой профиль">
          Здесь начинается ваша история в районе.
        </SectionTitle>
        <div className="profile-local-note">
          <Icon name="user" className="h-4 w-4" />
          <span>Ваш профиль на этом устройстве</span>
        </div>
      </div>
      <div className="profile-overview">
        <div className="profile-sidebar">
        <aside className="profile-resident-card">
          <div className="profile-card-heading">
            <span className="eyebrow">Карточка жителя</span>
            <Icon name="home" className="h-4 w-4" />
          </div>
          <div className="profile-resident-identity">
            <div className="profile-resident-portrait"><Avatar character={character.id} size="large" /></div>
            <span className="profile-resident-tag">Свой человек</span>
            <h2>{demo.name}</h2>
            <p className="profile-resident-role">{character.name} · {character.role}</p>
            <p className="profile-resident-description">{character.description}</p>
          </div>
          <dl className="profile-resident-stats">
            <div><dt>Историй пройдено</dt><dd>{demo.history.length}</dd></div>
            <div><dt>Районов спасено</dt><dd>{saved}</dd></div>
          </dl>
          <Link href="/lobby" className="button-primary profile-return-link">
            Вернуться в район <Icon name="arrow" />
          </Link>
          <p className="profile-storage-note">Статистика по последним 30 играм.<br />Данные хранятся только в этом браузере.</p>
        </aside>
        <FriendsPanel />
        </div>
        <div className="profile-editor-column">
          <ProfileForm
            key={JSON.stringify([demo.name, demo.character, demo.notifications, demo.reducedMotion])}
            profile={demo}
            onSaved={setSavedMessage}
          />
          {savedMessage && <div className="profile-feedback"><Notice>{savedMessage}</Notice></div>}
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
          <div className="profile-history-filter-empty" role="status">
            <Icon name="clock" className="h-5 w-5" />
            <p>Таких историй пока нет. Всё впереди.</p>
          </div>
        ) : (
          <ul className="profile-history-list">
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
                <div className="profile-result-detail">
                  <time dateTime={result.date}>{new Date(result.date).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Qyzylorda" })}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
