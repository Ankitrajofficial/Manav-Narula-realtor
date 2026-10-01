type Props = { name: string; className?: string; size?: number };

const paths: Record<string, React.ReactNode> = {
  check: <path d="M20 6 9 17l-5-5" />,
  grid: <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />,
  users: <path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm13 16v-2a4 4 0 0 0-3-3.9M15 3.1a4 4 0 0 1 0 7.8" />,
  userPlus: <path d="M15 19v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm12 5v6m-3-3h6" />,
  badge: <path d="M4 5h16v14H4V5Zm4 4h3M8 12h8M8 15h5M15 8h1" />,
  chart: <path d="M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3" />,
  settings: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 4-2 .5-.6 1.5 1 1.8-1.4 1.4-1.8-1-1.5.6L13 20h-2l-.5-2-1.5-.6-1.8 1-1.4-1.4 1-1.8L6.2 13 4 12l2-.5.6-1.5-1-1.8 1.4-1.4 1.8 1 1.5-.6L11 4h2l.5 2 1.5.6 1.8-1 1.4 1.4-1 1.8.6 1.5 2 .7Z" />,
  image: <path d="M4 5h16v14H4V5Zm4 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-4 9 5-6 4 4 3-3 4 5" />,
  edit: <path d="M4 20h4l11-11-4-4L4 16v4Zm10-13 4 4" />,
  bell: <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Zm4 4a2 2 0 0 0 4 0" />,
  plus: <path d="M12 5v14M5 12h14" />,
  logout: <path d="M10 4H5v16h5m4-4 5-4-5-4m5 4H9" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  trash: <path d="M4 7h16M9 7V4h6v3m-7 0 1 13h6l1-13" />,
  copy: <path d="M8 8h12v12H8V8Zm-4 8V4h12" />,
  eye: <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  upload: <path d="M12 16V5m-5 4 5-5 5 5M5 20h14" />,
  kanban: <path d="M4 4h4v16H4V4Zm6 0h4v10h-4V4Zm6 0h4v7h-4V4Z" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  info: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5m0-8h.01" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  send: <path d="m3 11 18-8-8 18-2-8-8-2Z" />,
  shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4" />,
  rupee: <path d="M6 4h12M6 9h12M6 4c6 0 8 2 8 5s-2 5-8 5l8 6" />,
  walk: <path d="M13 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-4 16 3-7-3-2 1-5 3 1 2 3 3 1M9 21l-3-4M14 12l2 9" />,
  chat: <path d="M4 5h16v11H8l-4 4V5Z" />,
  home: <path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6" />,
  tag: <path d="M3 12V4h8l10 10-8 8L3 12Zm5-4h.01" />,
  key: <path d="M15 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-4 8-8 8m3-3 2 2m1-5 2 2" />,
  file: <path d="M6 3h8l4 4v14H6V3Zm8 0v4h4M9 12h6M9 16h6" />,
  bank: <path d="M3 9 12 4l9 5H3Zm2 0v9m4-9v9m6-9v9m4-9v9M3 20h18" />,
  globe: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />,
  manage: <path d="M4 20V10l8-6 8 6v10H4Zm5 0v-5h6v5M9 9h6" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  whatsapp: <path d="M4 20l1.2-4A8 8 0 1 1 8 19.2L4 20Zm5-11c0 3 3 6 6 6l1-2-2-1-1 1a5 5 0 0 1-2-2l1-1-1-2-2 1Z" />,
  mail: <path d="M3 6h18v12H3V6Zm0 0 9 7 9-7" />,
  clock: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2" />,
  pin: <path d="M12 21s-6-6-6-11a6 6 0 1 1 12 0c0 5-6 11-6 11Zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z" />,
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  filter: <path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z" />,
  download: <path d="M12 4v11m-5-4 5 5 5-5M5 20h14" />,
  share: <path d="M16 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM4 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm12 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM8 11l8-4M8 13l8 4" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1m2 7.7a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  calendar: <path d="M4 6h16v14H4V6Zm0 4h16M8 3v4m8-4v4" />,
  google: <path d="M12 3a9 9 0 1 0 8.5 12H12v-3h9a9 9 0 0 0-9-9Z" />,
  bed: <path d="M3 18v-8h18v8M3 14h18M5 10V7h6v3m2 0V7h6v3" />,
  bath: <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Zm2 0V5a2 2 0 0 1 4 0M6 19l-1 2m13-2 1 2" />,
  area: <path d="M4 4h16v16H4V4Zm0 6h6V4m4 16v-6h6" />,
  layers: <path d="m12 4 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5" />,
  compass: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4-1-2 7-7 2 2-7 7-2Z" />,
  sofa: <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 11h18v6H3v-6Zm2 6v2m14-2v2" />,
  car: <path d="M5 16 7 9h10l2 7M3 16h18v4h-2m-14 0H3v-4Zm4 2h.01M17 18h.01" />,
  search: <path d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm5 11 5 5" />,
  instagram: <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5-1h.01" />,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" />,
  youtube: <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8Zm7 1v6l5-3-5-3Z" />,
};

export default function Icon({ name, className = "", size = 20 }: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name] ?? paths.check}
    </svg>
  );
}
