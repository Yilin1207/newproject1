"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Avatar, Icon, Notice, SectionTitle } from "@/components/ui";
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
        : "Профиль сохранён. Соседи будут знать вас по этому имени.",
    );
  }
  return (
    <form onSubmit={submit} className="card p-6 md:p-7">
      <h2 className="text-lg font-semibold">Знакомство с соседями</h2>
      <p className="mt-2 text-sm text-muted">
        Немного о вас и вашем персонаже.
      </p>
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
        От 2 до 24 символов. Имя будет видно в демо-комнате.
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
              <Avatar color={c.color} />
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
            className="h-5 w-5 accent-[#42664e]"
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
            className="h-5 w-5 accent-[#42664e]"
          />
        </label>
      </div>
      <button type="submit" className="button-primary mt-7 w-full sm:w-auto">
        Сохранить изменения <Icon name="check" />
      </button>
    </form>
  );
}

export default function ProfilePage() {
  const demo = useDemo();
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const character = characters.find((c) => c.id === demo.character)!;
  const saved = demo.history.filter((r) => r.score === 3).length;
  return (
    <>
      <SectionTitle label="Ваше место в истории" title="Мой профиль">
        Знакомьтесь с соседями, выбирайте персонажа и собирайте воспоминания о
        вашем районе.
      </SectionTitle>
      <div className="grid items-start gap-6 xl:grid-cols-[.7fr_1.3fr]">
        <aside className="card p-7 text-center">
          <div className="flex justify-center">
            <Avatar color={character.color} size="large" />
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
              <p className="text-3xl font-semibold">{demo.history.length}</p>
              <p className="mt-2 text-[10px] text-muted">Завершено демо</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">{saved}</p>
              <p className="mt-2 text-[10px] text-muted">Районов спасено</p>
            </div>
          </div>
          <p className="mt-5 text-xs leading-6 text-muted">
            Это локальный демо-профиль.
            <br />
            Данные хранятся только в этом браузере.
          </p>
          <Link href="/lobby" className="button-secondary mt-6 w-full">
            Вернуться в район <Icon name="arrow" />
          </Link>
        </aside>
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
      <section className="card mt-7 p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Истории вашего района</h2>
            <p className="mt-2 text-sm text-muted">
              Каждый выбор оставляет след.
            </p>
          </div>
          {demo.history.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="rounded-lg px-3 py-2 text-xs text-muted hover:bg-[#f4e9df]"
            >
              Очистить историю
            </button>
          )}
        </div>
        {confirmClear && (
          <div className="mt-5 rounded-xl bg-[#f4efdf] p-4">
            <p className="text-sm">Удалить все результаты из этого браузера?</p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  clearHistory();
                  setConfirmClear(false);
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
        {demo.history.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="rounded-2xl bg-[#eef0e6] p-4 text-[#8a9a7c]">
              <Icon name="clock" className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">
              Ваша первая история ещё впереди
            </h3>
            <p className="mt-2 max-w-sm text-xs leading-6 text-muted">
              Завершите подготовку к грозе в демо-комнате.
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
        ) : (
          <ul className="mt-6 divide-y divide-line">
            {demo.history.map((result) => (
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
                  <h3 className="text-sm font-semibold">{result.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-muted">
                    {result.power === "shelter"
                      ? "Свет в общем доме"
                      : result.power === "shop"
                        ? "Свет в магазине"
                        : "Аккумулятор не подключён"}{" "}
                    · Готовность {result.score}/3
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
