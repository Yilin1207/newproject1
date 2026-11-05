import Link from "next/link";
import NeighborhoodMap from "@/components/NeighborhoodMap";
import SessionCard from "@/components/SessionCard";
import { Icon, type IconName } from "@/components/ui";

const tasks: { icon: IconName; title: string; text: string; number: string }[] =
  [
    {
      icon: "box",
      title: "Соберите припасы",
      text: "Еда, вода и одеяла — в общий дом.",
      number: "01",
    },
    {
      icon: "bridge",
      title: "Укрепите мост",
      text: "Отнесите доски к переправе.",
      number: "02",
    },
    {
      icon: "bolt",
      title: "Сохраните свет",
      text: "Один аккумулятор. Решение за вами.",
      number: "03",
    },
  ];

export default function Home() {
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <span className="story-label">
            <span /> История 01 · Перед грозой
          </span>
          <h1 id="home-title">
            Маленький район.
            <br />
            <span>Большое дело.</span>
          </h1>
          <p className="hero-description">
            Гроза близко. Помогите соседям
            <br className="hidden sm:block" /> и подготовьте ваш общий дом.
          </p>
          <div className="hero-actions">
            <Link href="/lobby" className="button-primary">
              Войти в игру <Icon name="arrow" />
            </Link>
            <a href="#how-it-works" className="hero-help">
              Что нужно делать <span aria-hidden="true">↘</span>
            </a>
          </div>
          <div className="hero-meta">
            <Icon name="clock" className="h-4 w-4" />
            <span>10 минут на подготовку</span>
            <span className="meta-divider" />
            <span>Локальная игра</span>
          </div>
        </div>
        <div className="hero-art">
          <NeighborhoodMap />
          <span className="map-caption">
            <span /> Здесь начинается ваша история
          </span>
        </div>
      </section>
      <section
        id="how-it-works"
        className="home-tasks"
        aria-labelledby="tasks-title"
      >
        <div className="tasks-heading">
          <div>
            <p className="eyebrow">До первого дождя</p>
            <h2 id="tasks-title">Три дела для всего района</h2>
          </div>
          <span className="tasks-aside">
            <Icon name="heart" className="h-4 w-4" /> Каждый выбор важен
          </span>
        </div>
        <div className="task-grid">
          {tasks.map(({ icon, title, text, number }) => (
            <article key={number} className="task-card">
              <div className="task-card-top">
                <span className="task-icon">
                  <Icon name={icon} className="h-6 w-6" />
                </span>
                <span className="task-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <SessionCard />
    </>
  );
}
