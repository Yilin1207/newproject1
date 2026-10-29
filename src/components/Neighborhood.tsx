export default function Neighborhood({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 760 500"
      role="img"
      aria-label="Иллюстрация района: уютные дома, деревья, мост и надвигающаяся гроза"
      className={`h-full w-full bg-[#e9eee3] ${compact ? "" : "min-h-64"}`}
    >
      <defs>
        <pattern
          id="rain"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(20)"
        >
          <path d="M2 0v8" stroke="#b4c9c3" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="760" height="500" fill="#e9eee3" />
      <circle cx="590" cy="90" r="47" fill="#edcb8b" />
      <path d="M0 230Q170 70 340 218T760 180V500H0" fill="#d4dfca" />
      <path d="M0 315Q180 200 380 300T760 255V500H0" fill="#c5d5bb" />
      <path
        d="M590 300q-100 30-80 90t-80 110h160q70-50 30-110t140-70v-35Z"
        fill="#adc9cb"
      />
      <path
        d="M-10 427Q190 355 370 405t380 0"
        stroke="#f2ecd7"
        strokeWidth="43"
        fill="none"
      />
      <path d="M330 500V270" stroke="#f2ecd7" strokeWidth="33" />
      <g transform="translate(74 200)">
        <rect x="15" y="45" width="174" height="132" rx="4" fill="#e5bd94" />
        <path d="m0 51 99-64 106 64Z" fill="#557970" />
        <rect x="40" y="79" width="34" height="40" rx="2" fill="#f7e7ba" />
        <rect x="130" y="79" width="34" height="40" rx="2" fill="#f7e7ba" />
        <path
          d="M57 79v40m-17-20h34m73-20v40m-17-20h34"
          stroke="#b88e70"
          strokeWidth="3"
        />
        <rect x="85" y="119" width="35" height="58" rx="3" fill="#6f8e79" />
        <circle cx="112" cy="149" r="2" fill="#f5e9c9" />
        <rect x="62" y="45" width="81" height="20" rx="4" fill="#fcf3da" />
        <text
          x="102"
          y="59"
          textAnchor="middle"
          fontSize="10"
          fontFamily="Arial"
          fill="#536658"
        >
          ОБЩИЙ ДОМ
        </text>
      </g>
      <g transform="translate(419 205)">
        <rect y="36" width="132" height="120" rx="4" fill="#e9d7ad" />
        <path d="m-13 39 79-49 81 49Z" fill="#b77963" />
        <rect x="15" y="65" width="53" height="55" fill="#9fb8ad" />
        <path d="M41 65v55m-26-28h53" stroke="#f5e6c8" strokeWidth="3" />
        <rect x="83" y="71" width="33" height="85" fill="#648579" />
        <rect x="5" y="52" width="122" height="16" fill="#c48871" />
        <path
          d="M15 52v16m20-16v16m20-16v16m20-16v16m20-16v16m20-16v16"
          stroke="#f4ddba"
          strokeWidth="10"
        />
      </g>
      <g transform="translate(296 147)">
        <rect x="5" y="40" width="94" height="98" fill="#e3ba9f" />
        <path d="m-5 43 57-43 57 43Z" fill="#7a8b83" />
        <rect x="22" y="65" width="22" height="29" fill="#f7dfaa" />
        <rect x="62" y="65" width="22" height="29" fill="#f7dfaa" />
        <rect x="44" y="105" width="21" height="33" fill="#8e9d82" />
      </g>
      {[
        [42, 297, 1],
        [264, 284, 0.8],
        [611, 249, 1],
        [693, 290, 0.85],
        [130, 422, 0.7],
        [387, 362, 0.65],
        [652, 433, 0.75],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M0 0v65" stroke="#8e9070" strokeWidth="8" />
          <ellipse
            cy="-10"
            rx="30"
            ry="44"
            fill={i % 2 ? "#86a689" : "#70977d"}
          />
          <path
            d="M0-30v48m0-20 15-12M0 2-13-10"
            stroke="#a1b69a"
            strokeWidth="2"
            fill="none"
          />
        </g>
      ))}
      <g transform="translate(475 399) rotate(7)">
        <rect width="115" height="27" fill="#b39672" />
        <path
          d="M0-6h115M0 35h115M6-14v58m26-58v58m26-58v58m26-58v58m25-58v58"
          fill="none"
          stroke="#927b5e"
          strokeWidth="5"
        />
      </g>
      <g transform="translate(322 352)">
        <circle cy="-12" r="9" fill="#edc8a6" />
        <path d="M-10 3q10-9 20 0v23h-20" fill="#ca8b70" />
        <path d="M-5 26v13m10-13v13" stroke="#526c65" strokeWidth="5" />
        <rect x="8" y="8" width="15" height="14" rx="2" fill="#d9b77b" />
      </g>
      <g transform="translate(360 414)">
        <circle cy="-12" r="8" fill="#edc8a6" />
        <path d="M-9 3q9-8 18 0v20h-18" fill="#789b88" />
        <path d="M-4 23v12m9-12v12" stroke="#526c65" strokeWidth="5" />
      </g>
      <g fill="#b7c9c7">
        <rect x="62" y="79" width="176" height="39" rx="20" />
        <ellipse cx="130" cy="78" rx="40" ry="30" />
        <ellipse cx="183" cy="85" rx="35" ry="24" />
        <rect x="390" y="62" width="118" height="28" rx="15" />
        <ellipse cx="442" cy="60" rx="28" ry="22" />
      </g>
      <path d="m160 119-15 24h15l-9 22 31-34h-19l13-12Z" fill="#e3b96e" />
      <rect x="62" y="124" width="164" height="58" fill="url(#rain)" />
      <g fill="#748e7a" opacity=".55">
        {[60, 210, 450, 670, 720].map((x, i) => (
          <path
            key={x}
            d={`M${x} ${466 - i * 7}l-3-8m3 8 4-6`}
            stroke="#748e7a"
            strokeWidth="2"
          />
        ))}
      </g>
    </svg>
  );
}
