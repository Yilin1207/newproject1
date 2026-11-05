"use client";

import Link from "next/link";
import { useDemo } from "@/lib/demo-store";
import { Icon } from "./ui";

export default function SessionCard() {
  const { room, history } = useDemo();
  const hasSession = room && room.phase !== "finished";
  const lastResult = history[0];
  return (
    <div className="session-card">
      <span className="session-card-icon">
        <Icon name={hasSession ? "people" : lastResult ? "check" : "heart"} />
      </span>
      <div>
        <strong>
          {hasSession
            ? "Ваш район уже ждёт"
            : lastResult
              ? lastResult.title
              : "У каждого — своя цель. У всех — один дом."}
        </strong>
        <p>
          {hasSession
            ? `Комната ${room.code} · ${room.phase === "preparing" ? "Игра начнётся заново" : "Продолжите выбор героя"}`
            : lastResult
              ? "Последняя история сохранена в профиле"
              : "Выберите соседа и проживите свою историю."}
        </p>
      </div>
      <Link href={hasSession ? "/lobby" : lastResult ? "/profile" : "/lobby"}>
        {hasSession
          ? "В комнату"
          : lastResult
            ? "Мои истории"
            : "Выбрать героя"}
        <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}
