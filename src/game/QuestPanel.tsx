"use client";

import { memo, useId, useState } from "react";
import { Icon } from "@/components/ui";
import { PERSONAL_GOALS, type GameState } from "./model";

type QuestPanelProps = Pick<GameState, "bridge" | "power" | "character"> & {
  suppliesCount: number;
  personalComplete: boolean;
};

const QuestPanel = memo(function QuestPanel({
  suppliesCount,
  bridge,
  power,
  character,
  personalComplete,
}: QuestPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const panelId = useId();
  const done = suppliesCount + Number(bridge) + Number(!!power);
  const goal = PERSONAL_GOALS[character];
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
          <li data-done={suppliesCount === 3}>
            <span className="quest-icon">
              <Icon
                name={suppliesCount === 3 ? "check" : "box"}
                className="h-4 w-4"
              />
            </span>
            <div>
              <strong>Припасы в дом</strong>
              <small>Еда, вода, одеяла</small>
            </div>
            <b>{suppliesCount}/3</b>
          </li>
          <li data-done={bridge}>
            <span className="quest-icon">
              <Icon
                name={bridge ? "check" : "bridge"}
                className="h-4 w-4"
              />
            </span>
            <div>
              <strong>Крепкий мост</strong>
              <small>
                {bridge ? "Переправа готова" : "Принесите доски"}
              </small>
            </div>
          </li>
          <li data-done={!!power}>
            <span className="quest-icon">
              <Icon name={power ? "check" : "bolt"} className="h-4 w-4" />
            </span>
            <div>
              <strong>Свет для соседей</strong>
              <small>
                {power === "shelter"
                  ? "Свет в общем доме"
                  : power === "shop"
                    ? "Свет в магазине"
                    : "Отнесите аккумулятор к зданию"}
              </small>
            </div>
          </li>
        </ul>
        <div className="quest-personal" data-done={personalComplete}>
          <span>
            <Icon name="heart" className="h-3 w-3" />{" "}
            {personalComplete
              ? "Личная цель выполнена"
              : "Ваша личная цель"}
          </span>
          <strong>{goal.title}</strong>
          <p>{goal.description}</p>
        </div>
      </div>
    </aside>
  );
});

export default QuestPanel;
