export type IconName =
  | "sun" | "users" | "chart" | "list" | "message" | "briefcase" | "dumbbell" | "settings" | "search"
  | "check" | "close" | "plus" | "chevron" | "arrowUp" | "arrowDown" | "calendar" | "rupee" | "clock" | "camera" | "send" | "play"
  | "more" | "table" | "board" | "logout";

const PATHS: Record<IconName, string> = {
  sun: "M12 4v2m0 12v2m8-8h-2M6 12H4m13.7-5.7-1.4 1.4M7.7 16.3l-1.4 1.4m11.4 0-1.4-1.4M7.7 7.7 6.3 6.3M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 8v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  chart: "M4 20V10m5 10V4m5 16v-7m5 7V8",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  message: "M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z",
  briefcase: "M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm5 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3",
  dumbbell: "M6 7v10M3 9v6m15-8v10m3-6v2M6 12h12",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  search: "m21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  check: "m5 12.5 4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  chevron: "m9 6 6 6-6 6",
  arrowUp: "M12 19V5m-6 6 6-6 6 6",
  arrowDown: "M12 5v14m-6-6 6 6 6-6",
  calendar: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm0 3h16M8 3v4m8-4v4",
  rupee: "M7 5h10M7 9h10M9 5c3.5 0 5 1.6 5 4s-1.5 4-5 4H7l7 6",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  camera: "M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm11 4.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  send: "m4 12 16-8-6 16-2-6-8-2Z",
  play: "M8 5v14l11-7-11-7Z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  table: "M4 5h16v14H4V5Zm0 5h16M4 15h16M10 5v14",
  board: "M4 5h4v14H4V5Zm6 0h4v9h-4V5Zm6 0h4v11h-4V5Z",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10",
};

export function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
