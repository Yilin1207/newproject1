"use client";

import { useId, useState } from "react";
import Neighborhood from "./Neighborhood";
import { Icon, type IconName } from "./ui";

const places: {
  id: string;
  label: string;
  detail: string;
  icon: IconName;
  x: string;
  y: string;
}[] = [
  {
    id: "home",
    label: "Общий дом",
    detail: "Сюда нужно принести еду, воду и одеяла.",
    icon: "home",
    x: "24%",
    y: "58%",
  },
  {
    id: "shop",
    label: "Магазин",
    detail: "Дайте свет магазину, чтобы сохранить продукты.",
    icon: "box",
    x: "64%",
    y: "55%",
  },
  {
    id: "bridge",
    label: "Мост",
    detail: "Принесите доски и укрепите переправу.",
    icon: "bridge",
    x: "71%",
    y: "80%",
  },
];

export default function NeighborhoodMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const detailId = useId();
  const place = places.find((item) => item.id === selected);
  return (
    <div className="neighborhood-map">
      <div className="neighborhood-map-scene">
        <Neighborhood />
        <div className="map-hotspots" aria-label="Места района">
          {places.map((item) => (
            <button
              key={item.id}
              type="button"
              style={{ left: item.x, top: item.y }}
              aria-label={item.label}
              aria-pressed={selected === item.id}
              aria-describedby={selected === item.id ? detailId : undefined}
              onClick={() => setSelected(selected === item.id ? null : item.id)}
            >
              <Icon name={item.icon} className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div id={detailId} className="map-place-detail" aria-live="polite">
        {place ? (
          <>
            <Icon name={place.icon} className="h-5 w-5" />
            <div>
              <strong>{place.label}</strong>
              <p>{place.detail}</p>
            </div>
            <button
              type="button"
              aria-label="Закрыть описание места"
              onClick={() => setSelected(null)}
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Icon name="cloud" className="h-6 w-6" />
            <div>
              <strong>Скоро гроза</strong>
              <p>Нажмите на метку — узнайте район</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
