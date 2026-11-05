import type { CharacterId } from "@/game/model";

const palettes = {
  mira: {
    coat: "#7caa91",
    dark: "#365d4d",
    hair: "#394d40",
    background: "#dce7d3",
    skin: "#edc5a4",
  },
  sasha: {
    coat: "#cf8c6c",
    dark: "#985d43",
    hair: "#704933",
    background: "#f0ddcb",
    skin: "#e8b78f",
  },
  ren: {
    coat: "#a39abc",
    dark: "#6c6587",
    hair: "#343c47",
    background: "#e4dfed",
    skin: "#f0ceb3",
  },
  tim: {
    coat: "#c8a75d",
    dark: "#8b733e",
    hair: "#66432c",
    background: "#eee6c8",
    skin: "#dca77c",
  },
};

export default function CharacterPortrait({
  character = "mira",
  className,
}: {
  character?: CharacterId;
  className?: string;
}) {
  const p = palettes[character];
  return (
    <svg
      viewBox="0 0 160 180"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect width="160" height="180" rx="28" fill={p.background} />
      <circle cx="125" cy="35" r="26" fill="#fffdf8" opacity=".35" />
      <path
        d="M0 140Q45 95 86 139T160 124V180H0Z"
        fill={p.coat}
        opacity=".18"
      />
      <path d="M23 180v-23c0-54 114-54 114 0v23" fill={p.coat} />
      <path d="m55 125 25 26 25-26" fill={p.dark} />
      <path d="M69 106h22v27q-11 13-22 0Z" fill={p.skin} />
      {character === "mira" && (
        <path d="M40 78c-7-73 90-74 81 0l10 52-29-7-44 4-25-7Z" fill={p.hair} />
      )}
      <ellipse cx="80" cy="78" rx="35" ry="41" fill={p.skin} />
      <ellipse cx="44" cy="80" rx="6" ry="10" fill={p.skin} />
      <ellipse cx="116" cy="80" rx="6" ry="10" fill={p.skin} />
      {character === "mira" && (
        <>
          <path
            d="M43 74c-7-49 63-69 76-14l-1 21-15-30c-10 18-32 16-45 12l-12 25Z"
            fill={p.hair}
          />
          <path d="m99 40 14 7-9 13-13-6Z" fill="#dbb077" />
        </>
      )}
      {character === "sasha" && (
        <>
          <path
            d="M43 75C24 31 69 11 94 26c29-5 30 27 23 51l-13-24-19 5-21-8-16 31Z"
            fill={p.hair}
          />
          <path
            d="m43 44 17 5m31-17 10 11"
            stroke="#98704d"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
      {character === "ren" && (
        <>
          <path
            d="M43 77C27 25 83 10 109 35l13 30-19-4-5-17c-5 16-30 16-44 19l-7 23Z"
            fill={p.hair}
          />
          <g stroke={p.hair} strokeWidth="3">
            <rect x="53" y="72" width="23" height="18" rx="7" />
            <rect x="85" y="72" width="23" height="18" rx="7" />
            <path d="M76 78h9m-38-3 6 3m55 0 6-3" />
          </g>
        </>
      )}
      {character === "tim" && (
        <>
          <path
            d="M42 73c-18-29 2-43 14-42 8-21 33-17 40-7 22-5 32 16 25 28 11 13-1 28-7 30l-11-28-20 3-20-7-14 30Z"
            fill={p.hair}
          />
          <path
            d="M60 39q10-12 20-6m16 5 9 7"
            stroke="#926444"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      <path
        d="M59 70q6-4 12-1m19 0q6-3 12 1"
        stroke={p.hair}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="65" cy="81" rx="2.6" ry="3.4" fill="#344439" />
      <ellipse cx="96" cy="81" rx="2.6" ry="3.4" fill="#344439" />
      <path
        d="m80 84-3 9h6"
        stroke="#c49377"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M72 102q9 7 18-1"
        stroke="#9d6b55"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="58" cy="94" rx="6" ry="3" fill="#cf8a76" opacity=".28" />
      <ellipse cx="103" cy="94" rx="6" ry="3" fill="#cf8a76" opacity=".28" />
      <path
        d="M45 153v27m70-27v27"
        stroke={p.dark}
        strokeWidth="2"
        opacity=".45"
      />
      {character === "mira" && (
        <path
          d="M104 145v15m-7-8h14"
          stroke="#fff3d6"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      {character === "sasha" && (
        <>
          <path d="m42 136 13 44" stroke={p.dark} strokeWidth="9" />
          <rect x="95" y="151" width="19" height="23" rx="3" fill={p.dark} />
          <path d="M101 147v12m7-10v10" stroke="#e5d7b6" strokeWidth="3" />
        </>
      )}
      {character === "ren" && (
        <>
          <path d="m61 127 19 17 19-17" stroke="#ece6f3" strokeWidth="4" />
          <rect x="98" y="146" width="11" height="16" rx="2" fill={p.dark} />
        </>
      )}
      {character === "tim" && (
        <>
          <path d="m55 126 25 21 25-21" stroke="#f3e6ba" strokeWidth="7" />
          <circle cx="80" cy="162" r="3" fill={p.dark} />
        </>
      )}
    </svg>
  );
}
