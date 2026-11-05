"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui";
import { getOutcome, PERSONAL_GOALS, type GameState } from "./model";

export default function QuestPanel({ game }: { game: GameState }) {
  const [expanded, setExpanded] = useState(true);
  const panelId = useId();
  const done =
    game.delivered.length + Number(game.bridge) + Number(!!game.power);
  const outcome = getOutcome(game);
  const goal = PERSONAL_GOALS[game.character];
  return (
    <aside
      className="game-quests"
      data-expanded={expanded}
      aria-label="Задачи района"
    >
      <button
        className="quest-heading"
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded(!expanded)}
      >
        <span>
          <small>ДО ПЕРВОГО ДОЖДЯ</small>
          <strong>Помочь району</strong>
        </span>
        <span className="quest-count" aria-label={`${done} из 5 действий`}>
          {done}
          <span>/5</span>
          <span className="quest-chevron" aria-hidden="true">
            ⌄
          </span>
        </span>
      </button>
      <progress
        className="quest-progress"
        value={done}
        max={5}
        aria-label="Выполнено действий"
      />
      <div id={panelId} className="quest-details">
        <ul>
          <li data-done={game.delivered.length === 3}>
            <span className="quest-icon">
              <Icon
                name={game.delivered.length === 3 ? "check" : "box"}
                className="h-4 w-4"
              />
            </span>
            <div>
              <strong>Припасы в дом</strong>
              <small>Еда, вода, одеяла</small>
            </div>
            <b>{game.delivered.length}/3</b>
          </li>
          <li data-done={game.bridge}>
            <span className="quest-icon">
              <Icon
                name={game.bridge ? "check" : "bridge"}
                className="h-4 w-4"
              />
            </span>
            <div>
              <strong>Крепкий мост</strong>
              <small>
                {game.bridge ? "Переправа готова" : "Принесите доски"}
              </small>
            </div>
          </li>
          <li data-done={!!game.power}>
            <span className="quest-icon">
              <Icon name={game.power ? "check" : "bolt"} className="h-4 w-4" />
            </span>
            <div>
              <strong>Свет для соседей</strong>
              <small>
                {game.power === "shelter"
                  ? "Свет в общем доме"
                  : game.power === "shop"
                    ? "Свет в магазине"
                    : "Отнесите аккумулятор к зданию"}
              </small>
            </div>
          </li>
        </ul>
        <div className="quest-personal" data-done={outcome.personalComplete}>
          <span>
            <Icon name="heart" className="h-3 w-3" />{" "}
            {outcome.personalComplete
              ? "Личная цель выполнена"
              : "Ваша личная цель"}
          </span>
          <strong>{goal.title}</strong>
          <p>{goal.description}</p>
        </div>
      </div>
    </aside>
  );
}
