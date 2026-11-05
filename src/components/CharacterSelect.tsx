"use client";

import { characters, type CharacterId } from "@/lib/demo-store";
import { PERSONAL_GOALS } from "@/game/model";
import CharacterPortrait from "./CharacterPortrait";
import { Icon } from "./ui";

export default function CharacterSelect({
  value,
  onChange,
}: {
  value: CharacterId;
  onChange: (id: CharacterId) => void;
}) {
  const current = characters.find((character) => character.id === value)!;
  const goal = PERSONAL_GOALS[value];
  return (
    <section className="character-select" aria-labelledby="character-title">
      <div className="character-select-heading">
        <div>
          <p className="eyebrow">Познакомьтесь с соседями</p>
          <h2 id="character-title">Кем вы будете?</h2>
        </div>
        <span>01 — 04</span>
      </div>
      <div className="character-stage" data-character={value}>
        <div className="character-stage-art">
          <span className="character-stage-orbit" />
          <CharacterPortrait
            character={value}
            className="character-full-portrait"
          />
          <span className="character-stage-tag">Житель района</span>
        </div>
        <div className="character-stage-copy">
          <span className="eyebrow">Ваш персонаж</span>
          <h3>{current.name}</h3>
          <p className="character-role">{current.role}</p>
          <p className="character-description">{current.description}</p>
          <div className="character-goal" aria-live="polite" aria-atomic="true">
            <span>
              <Icon name="heart" className="h-4 w-4" /> Личная цель
            </span>
            <strong>{goal.title}</strong>
            <p>{goal.description}</p>
          </div>
        </div>
      </div>
      <div className="character-options" aria-label="Выбор персонажа">
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            aria-pressed={value === character.id}
            onClick={() => onChange(character.id)}
            className="character-option"
          >
            <CharacterPortrait character={character.id} />
            <span>{character.name}</span>
            {value === character.id && (
              <span className="character-selected">
                <Icon name="check" className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
