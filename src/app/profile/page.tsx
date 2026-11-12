"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Avatar, Icon, Notice, SectionTitle } from "@/components/ui";
import Achievements from "@/components/Achievements";
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
  const character = characters.find((c) => c.id === demo.character)!;
  const saved = demo.history.filter((r) => r.score === 3).length;
  const visibleHistory = demo.history.filter((result) =>
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
          <p className="profile-storage-note">Локальный демо-профиль.<br />Данные хранятся только в этом браузере.</p>
        </aside>
        <div className="profile-editor-column">
          <ProfileForm
            key={JSON.stringify([demo.name, demo.character, demo.notifications, demo.reducedMotion])}
            profile={demo}
            onSaved={setSavedMessage}
          />
          {savedMessage && <div className="profile-feedback"><Notice>{savedMessage}</Notice></div>}
        </div>
      </div>
      <Achievements history={demo.history} />
      <section className="profile-history" aria-labelledby="profile-history-title">
        <div className="profile-history-heading">
          <div>
            <p className="eyebrow">Дневник района</p>
            <h2 id="profile-history-title">Ваши истории</h2>
            <p>Маленькие решения, которые меняют многое.</p>
          </div>
          {demo.history.length > 0 && (
            <button onClick={() => setConfirmClear(true)} className="profile-clear-button">Очистить историю</button>
          )}
        </div>
        {demo.history.length > 0 && (
          <div className="profile-history-filters" role="group" aria-label="Фильтр истории">
            {([
              { id: "all", label: "Все истории" },
              { id: "best", label: "Район спасён" },
              { id: "personal", label: "Личная цель" },
            ] as const).map((item) => (
              <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>
            ))}
          </div>
        )}
        {confirmClear && (
          <div className="profile-clear-confirmation" role="alert">
            <p>Удалить все результаты из этого браузера?</p>
            <div>
              <button onClick={() => { clearHistory(); setConfirmClear(false); }} className="button-secondary">Удалить результаты</button>
              <button onClick={() => setConfirmClear(false)} className="button-primary">Сохранить историю</button>
            </div>
          </div>
        )}
        {demo.history.length === 0 ? (
          <div className="profile-history-empty">
            <span className="profile-empty-icon"><Icon name="clock" className="h-7 w-7" /></span>
            <p className="eyebrow">Первая глава</p>
            <h3>Хорошие истории начинаются вместе</h3>
            <p>Подготовьте район к грозе в демо-комнате.<br />Здесь появятся ваши решения и результат.</p>
            <Link href="/lobby" className="button-secondary">Начать историю <Icon name="arrow" className="h-4 w-4" /></Link>
          </div>
        ) : visibleHistory.length === 0 ? (
          <div className="profile-history-filter-empty" role="status">
            <Icon name="clock" className="h-5 w-5" />
            <p>Таких историй пока нет. Всё впереди.</p>
          </div>
        ) : (
          <ul className="profile-history-list">
            {visibleHistory.map((result) => (
              <li key={result.id} className="profile-history-entry">
                <span className="profile-result-icon" data-success={result.score === 3}><Icon name={result.score === 3 ? "check" : "cloud"} /></span>
                <div className="profile-result-copy">
                  <h3>{result.title}</h3>
                  <p>{result.power === "shelter" ? "Свет в общем доме" : result.power === "shop" ? "Свет в магазине" : "Аккумулятор не подключён"}</p>
                  {result.personalComplete === true && <span className="profile-personal-result"><Icon name="heart" className="h-3 w-3" />Личная цель выполнена</span>}
                </div>
                <div className="profile-result-detail">
                  <span className="profile-readiness" role="img" aria-label={"Готовность района " + result.score + " из 3"}>
                    {[0, 1, 2].map((index) => <span key={index} data-filled={index < result.score} aria-hidden="true" />)}
                    <span className="profile-readiness-value" aria-hidden="true">{result.score}/3</span>
                  </span>
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
