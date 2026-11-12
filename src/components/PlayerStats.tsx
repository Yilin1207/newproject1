import { characters, type Result } from "@/lib/demo-store";
import { formatPlayTime, getPlayerStats } from "@/lib/player-stats";
import { Avatar } from "./ui";

export default function PlayerStats({ history }: { history: Result[] }) {
  const stats = getPlayerStats(history);
  const coverage = (count: number) => count
    ? `Есть данные: ${count} из ${stats.played} игр`
    : "Пока нет данных";
  const cards = [
    { label: "Время в игре", value: stats.seconds === null ? "—" : formatPlayTime(stats.seconds), detail: `${coverage(stats.timedGames)} · без пауз` },
    { label: "Средняя длительность", value: stats.averageSeconds === null ? "—" : formatPlayTime(stats.averageSeconds), detail: coverage(stats.timedGames) },
    { label: "Район полностью спасён", value: stats.winRate === null ? "—" : `${stats.winRate}%`, detail: `${stats.wins} из ${stats.played} игр · готовность 3/3` },
    { label: "Личные цели выполнены", value: stats.personalGames ? stats.personalGoals : "—", detail: coverage(stats.personalGames) },
    { label: "Припасов доставлено", value: stats.suppliesGames ? stats.supplies : "—", detail: coverage(stats.suppliesGames) },
    { label: "Мостов укреплено", value: stats.bridgeGames ? stats.bridges : "—", detail: coverage(stats.bridgeGames) },
  ];
  return (
    <section className="card mt-7 p-6 md:p-7" aria-labelledby="player-stats-title">
      <h2 id="player-stats-title" className="text-lg font-semibold">Ваш вклад в район</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        По последним 30 завершённым играм в этом браузере.
        {history.length === 0
          ? " Завершите первую историю, чтобы увидеть статистику."
          : " Подробности старых игр могут быть недоступны."}
      </p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-[#f0f2e9] p-4">
            <dt className="text-xs text-muted">{card.label}</dt>
            <dd className="mt-2 text-xl font-semibold text-forest">{card.value}</dd>
            <dd className="mt-2 text-xs leading-5 text-muted">{card.detail}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">Ваши герои</h3>
          <p className="mt-1 text-xs text-muted">{coverage(stats.characterGames)}</p>
          <ul className="mt-3 space-y-3">
            {characters.map((character) => (
              <li key={character.id} className="flex items-center gap-3 text-sm">
                <Avatar character={character.id} />
                <span className="flex-1">{character.name}</span>
                <span className="text-muted">Игр: {stats.characterGames ? stats.characterCounts[character.id] : "—"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Кому вы дали свет</h3>
          <p className="mt-1 text-xs text-muted">Решения в завершённых играх</p>
          <dl className="mt-3 space-y-3 text-sm">
            {[
              ["Общему дому", stats.power.shelter],
              ["Магазину", stats.power.shop],
              ["Аккумулятор не подключён", stats.power.none],
            ].map(([label, count]) => (
              <div key={label} className="flex justify-between gap-3 rounded-xl bg-[#f6f3ea] p-3">
                <dt>{label}</dt>
                <dd>{stats.played ? count : "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
