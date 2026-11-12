import type { Result } from "@/lib/demo-store";
import { Icon, type IconName } from "./ui";

export default function Achievements({
  history,
}: {
  history: Result[];
}) {
  const achievements: {
    title: string;
    detail: string;
    icon: IconName;
    unlocked: boolean;
  }[] = [
    {
      title: "Первый дождь",
      detail: "Завершить первую игру",
      icon: "cloud",
      unlocked: history.length > 0,
    },
    {
      title: "Всё под защитой",
      detail: "Готовность района — 3 из 3",
      icon: "home",
      unlocked: history.some((result) => result.score === 3),
    },
    {
      title: "Своя история",
      detail: "Выполнить личную цель",
      icon: "heart",
      unlocked: history.some((result) => result.personalComplete === true),
    },
    {
      title: "Два пути",
      detail: "Дать свет дому и магазину в разных играх",
      icon: "bolt",
      unlocked:
        history.some((result) => result.power === "shelter") &&
        history.some((result) => result.power === "shop"),
    },
  ];
  return (
    <section
      className="achievements-section"
      aria-labelledby="achievements-title"
    >
      <div className="achievements-heading">
        <h2 id="achievements-title">
          Маленькие победы
        </h2>
        <span>{achievements.filter((item) => item.unlocked).length} из 4</span>
      </div>
      <div className="achievements-grid">
        {achievements.map((item) => (
          <article
            className="achievement"
            data-unlocked={item.unlocked}
            key={item.title}
          >
            <span className="achievement-icon">
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
            <span className="achievement-status">
              {item.unlocked ? "Получено" : "Впереди"}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
