import Link from "next/link";
import NeighborhoodMap from "@/components/NeighborhoodMap";
import SessionCard from "@/components/SessionCard";
import { Icon, type IconName } from "@/components/ui";

const tasks: { icon: IconName; title: string; text: string; note: string }[] = [
  {
    icon: "box",
    title: "Позаботьтесь о соседях",
    text: "Соберите еду, воду и тёплые одеяла. Общий дом станет местом, где переждут непогоду.",
    note: "Припасы для общего дома",
  },
  {
    icon: "bridge",
    title: "Сохраните дорогу домой",
    text: "Найдите доски и укрепите мост, пока не начался ливень. По ту сторону тоже ждут помощи.",
    note: "Одна переправа связывает всех",
  },
  {
    icon: "bolt",
    title: "Решите, где будет свет",
    text: "Один аккумулятор — для дома или магазина. У каждого решения будут свои последствия.",
    note: "Простого ответа нет",
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-intro-line">
        <span>Маленький мир, общая история</span>
        <span><i aria-hidden="true" /> Уже можно играть в браузере</span>
      </div>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <span className="story-label">
            <Icon name="cloud" className="h-4 w-4" /> История 01 <span aria-hidden="true">·</span> Перед грозой
          </span>
          <h1 id="home-title">
            Маленький район.<br />
            <span>Большое дело.</span>
          </h1>
          <p className="hero-description">
            Гроза уже близко. Соберите припасы, помогите соседям и решите, что действительно важно.
          </p>
          <div className="hero-actions">
            <Link href="/lobby" className="button-primary">
              Начать свою историю <Icon name="arrow" />
            </Link>
            <a href="#how-it-works" className="hero-help">
              Как всё устроено <span aria-hidden="true">↘</span>
            </a>
          </div>
          <div className="hero-meta">
            <span><Icon name="clock" className="h-4 w-4" /> 10 минут на подготовку</span>
            <span><Icon name="check" className="h-4 w-4" /> Без регистрации</span>
          </div>
        </div>
        <div className="hero-map-panel">
          <div className="hero-map-heading">
            <span><span className="map-live-dot" /> Ваш будущий район</span>
            <span className="map-story-number">ГЛАВА / 01</span>
          </div>
          <div className="hero-art"><NeighborhoodMap /></div>
          <div className="hero-map-footer">
            <span className="hero-weather-icon"><Icon name="cloud" className="h-6 w-6" /></span>
            <div><strong>Здесь всё связано</strong><p>Один район. Много важных решений.</p></div>
            <span className="map-explore-arrow" aria-hidden="true">↗</span>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="home-tasks" aria-labelledby="tasks-title">
        <div className="tasks-heading">
          <div>
            <p className="eyebrow">Немного времени. Много смысла.</p>
            <h2 id="tasks-title">Большие перемены —<br className="sm:hidden" /> с маленьких дел.</h2>
          </div>
          <span className="tasks-aside">Три задачи. Ваш способ помочь.</span>
        </div>
        <div className="task-grid">
          {tasks.map(({ icon, title, text, note }, index) => (
            <article key={icon} className="task-card">
              <div className="task-card-top">
                <span className="task-icon"><Icon name={icon} className="h-6 w-6" /></span>
                <span className="task-number">0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="task-note"><span aria-hidden="true" />{note}</span>
            </article>
          ))}
        </div>
      </section>
      <SessionCard />
    </div>
  );
}
