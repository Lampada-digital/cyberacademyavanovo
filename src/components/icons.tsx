import React from "react";

const P: Record<string, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2z" /><path d="M4 17a2 2 0 0 1 2-2h14" /></>,
  books: <><path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="m16.5 5 3.8 1-4 14.5-3.8-1z" /></>,
  play: <path d="M7 4.5 19 12 7 19.5z" />,
  playc: <><circle cx="12" cy="12" r="9" /><path d="m10 8.5 5.5 3.5-5.5 3.5z" /></>,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  checkc: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16.5 9" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  award: <><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="m7 14 3.5-4 3 2.5L18 7" /></>,
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h13v3" /><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H3" /><circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" /></>,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></>,
  users: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 19c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.7M17.5 14.7c2 .7 3.4 2 4 4.3" /></>,
  shield: <><path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6z" /><path d="m9 11.5 2.2 2.2L15.5 9" /></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="1.5" /><rect x="10" y="10" width="4" height="4" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>,
  code: <><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /><path d="m13.5 5-3 14" /></>,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
  download: <><path d="M12 3v11" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>,
  upload: <><path d="M12 14V3" /><path d="m7 7 5-5 5 5" /><path d="M4 20h16" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  edit: <><path d="M14.5 5.5 18.5 9.5 8 20H4v-4z" /><path d="m12.5 7.5 4 4" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  chevR: <path d="m9 5 7 7-7 7" />,
  chevD: <path d="m5 9 7 7 7-7" />,
  chevL: <path d="m15 5-7 7 7 7" />,
  out: <><path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" /><path d="m16 8 4 4-4 4M20 12H9" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  msg: <><path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10.5 5-3v9l-5-3z" /></>,
  link: <><path d="M10 14a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.1" /><path d="M14 10a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.1" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  eye: <><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  star: <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7z" />,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 18h3v3h-3z" /></>,
  print: <><path d="M7 8V3h10v5" /><rect x="4" y="8" width="16" height="9" rx="1.5" /><path d="M7 14h10v7H7z" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 9.5V14M12 17.2v.3" /></>,
  spark: <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />,
  arrowR: <><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>,
  term: <><rect x="2.5" y="4" width="19" height="16" rx="2" /><path d="m7 9 3.5 3L7 15M12.5 15H17" /></>,
  cap: <><path d="m12 4 10 5-10 5L2 9z" /><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" /><path d="M22 9v5" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /><path d="m3 17.5 9 5 9-5" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  git: <><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="9" r="2.5" /><path d="M6 8.5v7M8.5 7.5c4 .5 7 0 7.5 0M6 18c6 0 9-2 10.5-6.5" /></>,
  ext: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M19 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3v5h-5" /></>,
  dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
  grad: <><path d="M3 20h18M5 20V9l7-5 7 5v11" /><path d="M9 20v-6h6v6" /></>,
  send: <path d="m3 11 18-7-7 18-2.5-7.5z" />,
  db: <><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" /><path d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" /></>,
  zap: <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  cam: <><rect x="2.5" y="7" width="19" height="13" rx="2" /><path d="M8 7l1.5-2.5h5L16 7" /><circle cx="12" cy="13.5" r="3.4" /></>,
  flame: <path d="M12 2c.6 3.4-1.6 5-3.2 6.9C7.2 10.8 6 12.6 6 15a6 6 0 0 0 12 0c0-2.7-1.3-4.8-2.6-6.6C14 6.4 12.7 4.6 12 2z" />,
  pen: <><path d="M14.5 4.5 19.5 9.5 8 21H3v-5z" /><path d="M12.5 6.5 17.5 11.5" /></>,
  idcard: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><circle cx="8.5" cy="11" r="2.2" /><path d="M5 16.5c.7-1.6 2-2.4 3.5-2.4s2.8.8 3.5 2.4" /><path d="M14 9.5h5M14 12.5h5M14 15.5h3" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" /></>,
  csv: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="m9.5 12 5 5M14.5 12l-5 5" /></>,
  pix: <><path d="m12 3 9 9-9 9-9-9z" /><rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 11v5" /></>,
};

export function I({ n, s = 18, c = "" }: { n: string; s?: number; c?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={"shrink-0 " + c} aria-hidden>
      {P[n] || P.dot}
    </svg>
  );
}

export function Logo({ s = 34, txt = true }: { s?: number; txt?: boolean }) {
  return (
    <a href="#/" className="flex items-center gap-2.5 group">
      <svg width={s} height={s} viewBox="0 0 32 32" className="shrink-0 transition-transform duration-300 group-hover:rotate-[8deg]">
        <path d="M16 2 28 9v14L16 30 4 23V9z" fill="#01070D" stroke="#03A6A6" strokeWidth="2" />
        <path d="M12 11l-4 5 4 5M20 11l4 5-4 5" stroke="#5FE3D8" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {txt && (
        <span className="font-display font-bold tracking-wide text-[15px] leading-none">
          <span className="text-cy-300">CYBER</span>
          <span className="text-mist"> ACADEMY</span>
        </span>
      )}
    </a>
  );
}
