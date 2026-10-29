import type { ReactNode } from "react";

export type IconName =
  | "home"
  | "people"
  | "user"
  | "arrow"
  | "cloud"
  | "check"
  | "box"
  | "bolt"
  | "bridge"
  | "copy"
  | "exit"
  | "clock"
  | "settings"
  | "heart"
  | "close";
export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    cloud: (
      <>
        <path d="M6 16a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5 5 0 0 1 0 11M8 20l1-2m4 4 1-3m4 1 1-2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    box: (
      <>
        <path d="m12 3 9 5v9l-9 5-9-5V8Zm0 9 9-4m-9 4L3 8m9 4v10M7 5l10 5" />
      </>
    ),
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8Z" />,
    bridge: (
      <>
        <path d="M3 21V3m18 18V3M3 6c5 10 13 10 18 0M1 18h22M7 12v6m5-4v4m5-6v6" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V3H3v13h5" />
      </>
    ),
    exit: (
      <>
        <path d="M9 3H3v18h6m0-9h12m-5-5 5 5-5 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" />
        <circle cx="16" cy="17" r="3" />
      </>
    ),
    heart: (
      <path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1s-1 7 8 14c9-7 11-11 8-14Z" />
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Avatar({
  color = "#90b7a0",
  size = "normal",
}: {
  color?: string;
  size?: "normal" | "large";
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={size === "large" ? "h-28 w-28" : "h-12 w-12"}
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="30" fill={color} fillOpacity=".28" />
      <path d="M17 100v-15c0-24 66-24 66 0v15" fill={color} />
      <rect x="43" y="57" width="14" height="17" rx="5" fill="#e6bd9d" />
      <ellipse cx="50" cy="42" rx="23" ry="25" fill="#f3d1b3" />
      <path
        d="M27 43C18 13 62 3 72 31l2 18-10-15c-11 7-23 2-27-3Z"
        fill="#40514d"
      />
      <circle cx="42" cy="44" r="2" fill="#40514d" />
      <circle cx="60" cy="44" r="2" fill="#40514d" />
      <path
        d="M46 55q5 4 10-1"
        fill="none"
        stroke="#a16f5e"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-emerald-900/10 bg-[#eaf0e7] px-4 py-3 text-sm leading-6 text-[#426451]"
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <p className="eyebrow">{label}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-[40px]">
        {title}
      </h1>
      {children && (
        <p className="mt-3 max-w-2xl leading-7 text-muted">{children}</p>
      )}
    </div>
  );
}
