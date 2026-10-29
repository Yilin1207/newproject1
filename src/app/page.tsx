import Link from "next/link";
import Neighborhood from "@/components/Neighborhood";
import { Icon, type IconName } from "@/components/ui";

export default function Home() {
  return (
    <>
      <div className="mb-7 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Место, где каждый важен</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            С возвращением в район
          </h1>
        </div>
        <span className="hidden rounded-full border border-line px-3 py-1.5 text-xs text-muted sm:inline">
          Сезон 01 · Перед грозой
        </span>
      </div>
      <section className="grid overflow-hidden rounded-3xl border border-[#dedfce] bg-[#eeeede] xl:grid-cols-[.9fr_1.1fr]">
        <div className="relative z-10 flex flex-col items-start px-7 py-10 md:px-10 xl:py-12">
          <span className="mb-6 flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-forest uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-forest" />
            Кооперативная история
          </span>
          <h2 className="text-[42px] leading-[1.12] font-semibold tracking-[-.055em] md:text-[52px]">
            Большая гроза.
            <br />
            Маленький район.
            <br />
            <span className="text-[#849878]">Всё зависит от вас.</span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[#7b8270]">
            Соберите припасы, помогите соседям и сохраните то, что вам дорого.
            Ведь дом — это не только стены.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/lobby" className="button-primary">
              Отправиться в район <Icon name="arrow" />
            </Link>
            <a
              href="#how-it-works"
              className="button-secondary border-white/40 bg-white/40"
            >
              Как всё устроено
            </a>
          </div>
          <p className="mt-7 flex items-center gap-2 text-xs text-[#7b8270]">
            <Icon name="people" className="h-4 w-4" />
            Будущая игра для 2–4 друзей<span className="mx-1">·</span>Сейчас —
            локальное демо
          </p>
        </div>
        <div className="relative min-h-64 overflow-hidden xl:min-h-full">
          <Neighborhood />
          <div className="absolute right-5 bottom-5 flex items-center gap-3 rounded-xl border border-white/70 bg-paper/90 px-4 py-3 shadow-sm">
            <Icon name="cloud" className="h-8 w-8 text-[#8c9a85]" />
            <div>
              <p className="text-xs font-semibold">По прогнозу — гроза</p>
              <p className="mt-1 text-[10px] text-muted">
                Самое время держаться вместе
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        className="mt-7 grid gap-4 md:grid-cols-3"
        aria-label="Особенности игры"
      >
        {(
          [
            [
              "people",
              "Одна команда",
              "В будущем — до четырёх соседей. В демо познакомьтесь с лобби и персонажами.",
            ],
            [
              "heart",
              "Ваш выбор важен",
              "Общий дом или магазин? Один аккумулятор и решение, которое меняет итог.",
            ],
            [
              "home",
              "История вашего района",
              "Завершите подготовку и сохраните маленькую победу в своём профиле.",
            ],
          ] as [IconName, string, string][]
        ).map(([icon, title, text]) => (
          <article key={title} className="card flex items-start gap-4 p-5">
            <span className="rounded-xl bg-[#edf0e4] p-3 text-[#72876a]">
              <Icon name={icon} />
            </span>
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-muted">{text}</p>
            </div>
          </article>
        ))}
      </section>
      <section id="how-it-works" className="mt-11 scroll-mt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Всего несколько шагов</p>
            <h2 className="mt-2 text-xl font-semibold">
              С чего начинается соседство
            </h2>
          </div>
          <Link
            href="/lobby"
            className="hidden items-center gap-2 text-xs font-medium text-forest sm:flex"
          >
            Попробовать демо <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            [
              "01",
              "Найдите своё место",
              "Выберите персонажа и создайте уютную комнату для команды.",
            ],
            [
              "02",
              "Подготовьте район",
              "Запаситесь необходимым и решите, что защитить в первую очередь.",
            ],
            [
              "03",
              "Встретьте грозу",
              "Посмотрите, к чему привели ваши решения. Попробуйте другой путь.",
            ],
          ].map(([n, title, text]) => (
            <div key={n} className="flex gap-4 border-t border-line pt-5">
              <span className="text-2xl font-light text-[#a6b39c]">{n}</span>
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
