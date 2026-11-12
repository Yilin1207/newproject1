"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { characters, useDemo } from "@/lib/demo-store";
import { Avatar, Icon, type IconName } from "./ui";

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Главная", icon: "home" },
  { href: "/lobby", label: "Играть", icon: "people" },
  { href: "/profile", label: "Профиль", icon: "user" },
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
    <div className="app-shell">
      <a href="#main" className="skip-link">
        К содержимому
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Наш район — главная">
            <span className="brand-mark">
              <Icon name="home" className="h-6 w-6" />
            </span>
            <span>
              наш район
              <span className="brand-caption">
                маленький мир, общая история
              </span>
            </span>
          </Link>
          <nav aria-label="Главная навигация" className="site-nav">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <Link
            href="/profile"
            className="header-profile"
            aria-label={`Профиль: ${demo.name}`}
          >
            <span className="header-profile-copy">
              {demo.name}
              <small>Ваш профиль</small>
            </span>
            <span className="[&_svg]:h-9 [&_svg]:w-9">
              <Avatar character={character.id} />
            </span>
          </Link>
        </div>
      </header>
      <main id="main" className="site-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <span>
          Наш район <span aria-hidden="true">·</span> Вместе до рассвета
        </span>
        <div>
          <span className="local-label">
            <span /> Локальное демо
          </span>
          <button onClick={() => setRulesOpen(true)}>
            Как играть <span aria-hidden="true">↗</span>
          </button>
        </div>
      </footer>
      <dialog
        ref={dialog}
        aria-labelledby="rules-title"
        onClose={() => setRulesOpen(false)}
        onCancel={() => setRulesOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setRulesOpen(false);
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setRulesOpen(false);
        }}
        className="rules-dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Перед грозой</p>
            <h2 id="rules-title" className="mt-2 text-2xl font-semibold">
              Как играть
            </h2>
          </div>
          <button
            aria-label="Закрыть правила"
            onClick={() => setRulesOpen(false)}
            className="rounded-xl p-3 hover:bg-white"
          >
            <Icon name="close" />
          </button>
        </div>
        <ol className="rules-list">
          <li>
            <span>01</span>
            <p>Создайте комнату и выберите героя.</p>
          </li>
          <li>
            <span>02</span>
            <p>Нажмите «Я готов», затем начните игру.</p>
          </li>
          <li>
            <span>03</span>
            <p>Соберите припасы, укрепите мост и решите, куда дать свет.</p>
          </li>
        </ol>
        <div className="rules-controls">
          <span>
            <kbd>WASD</kbd> ходить
          </span>
          <span>
            <kbd>E</kbd> действие
          </span>
          <span>
            <kbd>Esc</kbd> пауза
          </span>
        </div>
        <p className="my-5 text-xs leading-5 text-muted">
          На подготовку — 10 минут. Сетевая игра пока недоступна. Результаты
          сохраняются в этом браузере.
        </p>
        <button
          onClick={() => setRulesOpen(false)}
          className="button-primary w-full"
        >
          Понятно <Icon name="check" />
        </button>
      </dialog>
    </div>
  );
}
