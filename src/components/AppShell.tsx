"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { characters, useDemo } from "@/lib/demo-store";
import { Avatar, Icon, type IconName } from "./ui";

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Главная", icon: "home" },
  { href: "/lobby", label: "Игровая комната", icon: "people" },
  { href: "/profile", label: "Мой профиль", icon: "user" },
];
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const demo = useDemo();
  const [rulesOpen, setRulesOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(demo.reducedMotion);
  }, [demo.reducedMotion]);
  useEffect(() => {
    if (rulesOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [rulesOpen]);
  const character = characters.find((c) => c.id === demo.character)!;
  return (
    <div className="min-h-screen lg:pl-60">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        К содержимому
      </a>
      <aside className="border-b border-line bg-paper lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-b-0">
        <Link
          href="/"
          className="flex items-center gap-3 px-6 pt-6 pb-5 lg:px-7 lg:pt-10 lg:pb-12"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-white">
            <Icon name="home" className="h-6 w-6" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            наш район
            <span className="mt-0.5 block text-[9px] font-medium tracking-[.24em] text-muted uppercase">
              вместе до рассвета
            </span>
          </span>
        </Link>
        <nav
          aria-label="Главная навигация"
          className="flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-col lg:gap-2 lg:px-4"
        >
          {navigation.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors ${pathname === n.href ? "bg-[#e7ecdf] text-forest" : "text-muted hover:bg-[#f0f1e9] hover:text-ink"}`}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {pathname === n.href && (
                <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-forest lg:block" />
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden px-6 pb-6 lg:block">
          <div className="mb-7 rounded-2xl border border-[#e5dfcd] bg-[#f4efdf] p-4">
            <span className="text-2xl">☁</span>
            <p className="mt-3 text-sm font-semibold">Вместе теплее</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Даже самая сильная гроза заканчивается. Главное — быть рядом.
            </p>
          </div>
          <button
            onClick={() => setRulesOpen(true)}
            className="flex items-center gap-3 text-sm text-muted hover:text-forest"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full border">
              ?
            </span>{" "}
            Как играть
          </button>
          <p className="mt-6 text-[10px] tracking-widest text-muted/60 uppercase">
            Учебный проект · 2026
          </p>
        </div>
      </aside>
      <header className="flex h-20 items-center justify-between border-b border-line px-5 md:px-10">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7d9d76]" />
          Фронтенд-демо
          <span className="hidden text-[#c4c9bf] sm:inline"> / </span>
          <span className="hidden sm:inline">Без подключения к серверу</span>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl p-1 hover:bg-white"
        >
          <span className="text-sm font-medium">{demo.name}</span>
          <span className="[&_svg]:h-9 [&_svg]:w-9">
            <Avatar color={character.color} />
          </span>
        </Link>
      </header>
      <main
        id="main"
        className="mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-10"
      >
        {children}
      </main>
      <footer className="mx-5 mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-xs text-muted md:mx-10">
        <span>Небольшой район. Одна большая команда.</span>
        <button
          onClick={() => setRulesOpen(true)}
          className="underline decoration-muted/30 underline-offset-4 hover:text-forest"
        >
          Правила демо
        </button>
      </footer>
      <dialog
        ref={dialog}
        onCancel={() => setRulesOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setRulesOpen(false);
        }}
        className="w-[min(92vw,520px)] rounded-3xl border border-line bg-paper p-7 text-ink shadow-2xl backdrop:bg-[#263c34]/40"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Добро пожаловать, сосед</h2>
          <button
            aria-label="Закрыть правила"
            onClick={() => setRulesOpen(false)}
            className="rounded-lg p-2 hover:bg-white"
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="mt-4 leading-7 text-muted">
          В районе скоро начнётся гроза. Ваша задача — помочь соседям
          подготовиться.
        </p>
        <ol className="my-6 space-y-4 text-sm leading-6">
          <li>
            <b>01.</b> Создайте комнату или введите демонстрационный код{" "}
            <b>DEMO26</b>.
          </li>
          <li>
            <b>02.</b> Выберите персонажа и подтвердите готовность.
          </li>
          <li>
            <b>03.</b> Соберите припасы, укрепите мост и решите, куда направить
            электричество.
          </li>
          <li>
            <b>04.</b> Завершите подготовку — результат появится в профиле.
          </li>
        </ol>
        <p className="mb-6 rounded-xl bg-[#edf0e8] p-4 text-xs leading-5 text-muted">
          Это локальная демонстрация интерфейса. Демо-соседи не являются
          реальными игроками. Профиль и результаты сохраняются только в этом
          браузере.
        </p>
        <button
          onClick={() => setRulesOpen(false)}
          className="button-primary w-full"
        >
          Всё понятно <Icon name="check" />
        </button>
      </dialog>
    </div>
  );
}
