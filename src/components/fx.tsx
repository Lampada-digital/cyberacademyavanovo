import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------- reveal on scroll ---------- */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    el.querySelectorAll(".rv").forEach((n) => io.observe(n));
    if (el.classList.contains("rv")) io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ---------- scramble / decode ---------- */
const GLYPHS = "!<>-_\\/[]{}—=+*^?#01";
export function Scramble({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [out, setOut] = useState(text.replace(/\S/g, " "));
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0, started = false, frame = 0;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting && !started) {
        started = true;
        const run = () => {
          frame++;
          const reveal = Math.floor((frame - delay) / 2.2);
          if (reveal < 0) { raf = requestAnimationFrame(run); return; }
          let s = "";
          for (let i = 0; i < text.length; i++) {
            if (text[i] === " " || text[i] === "\n") s += text[i];
            else if (i < reveal) s += text[i];
            else s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          setOut(s);
          if (reveal <= text.length) raf = requestAnimationFrame(run);
          else setOut(text);
        };
        raf = requestAnimationFrame(run);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [text, delay]);
  return <span ref={ref} className={className}>{out}</span>;
}

/* ---------- terminal typing ---------- */
export function Terminal({ lines, className = "" }: { lines: string[]; className?: string }) {
  const [shown, setShown] = useState<string[]>([]);
  const [typing, setTyping] = useState("");
  useEffect(() => {
    let li = 0, ci = 0, t: any;
    const tick = () => {
      if (li >= lines.length) { t = setTimeout(() => { setShown([]); setTyping(""); li = 0; ci = 0; t = setTimeout(tick, 600); }, 5200); return; }
      const line = lines[li];
      if (ci <= line.length) { setTyping(line.slice(0, ci)); ci++; t = setTimeout(tick, line.startsWith("$") ? 46 : 22); }
      else { setShown((s) => [...s, line]); setTyping(""); li++; ci = 0; t = setTimeout(tick, 340); }
    };
    t = setTimeout(tick, 700);
    return () => clearTimeout(t);
  }, [lines]);
  const color = (l: string) =>
    l.startsWith("$") ? "text-cy-300" : l.includes("✔") || l.includes("aprovado") || l.includes("emitido") || l.includes("100%") ? "text-[#7BE0A2]" : l.startsWith("!") ? "text-ember" : "text-fog";
  return (
    <div className={`rounded-xl border border-line bg-[#020C12]/90 shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-[#041821]">
        <span className="w-2.5 h-2.5 rounded-full bg-coral/70" /><span className="w-2.5 h-2.5 rounded-full bg-ember/70" /><span className="w-2.5 h-2.5 rounded-full bg-cy-500/70" />
        <span className="ml-2 font-mono text-[11px] text-dim">sia@cyberacademy — fluxo do aluno</span>
      </div>
      <div className="p-4 font-mono text-[12.5px] leading-[1.9] min-h-[220px]">
        {shown.map((l, i) => <div key={i} className={color(l)}>{l.startsWith("$") && <span className="text-cy-600 mr-2">➜</span>}{l.replace(/^\$ /, "")}</div>)}
        <div className={color(typing)}>{typing.startsWith("$") && <span className="text-cy-600 mr-2">➜</span>}{typing.replace(/^\$ /, "")}<span className="cursor-blink text-cy-400">▊</span></div>
      </div>
    </div>
  );
}

/* ---------- count-up ---------- */
export function CountUp({ to, className = "" }: { to: number; className?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) {
        const t0 = performance.now();
        const dur = 1100;
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref} className={`tnum ${className}`}>{v.toLocaleString("pt-BR")}</span>;
}

/* ---------- QR determinístico (matriz visual a partir do código) ---------- */
export function QRMatrix({ code, size = 116 }: { code: string; size?: number }) {
  const cells = useMemo(() => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const N = 21; const grid: boolean[] = [];
    let x = h || 12345;
    const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967295; };
    for (let i = 0; i < N * N; i++) grid.push(rnd() > 0.52);
    return { N, grid };
  }, [code]);
  const { N, grid } = cells;
  const c = 3, cell = (size - c * 2) / N;
  const finder = (fx: number, fy: number) => (
    <g key={`${fx}${fy}`}>
      <rect x={c + fx * cell} y={c + fy * cell} width={cell * 7} height={cell * 7} fill="#03A6A6" />
      <rect x={c + (fx + 1) * cell} y={c + (fy + 1) * cell} width={cell * 5} height={cell * 5} fill="#EAFBF8" />
      <rect x={c + (fx + 2) * cell} y={c + (fy + 2) * cell} width={cell * 3} height={cell * 3} fill="#03A6A6" />
    </g>
  );
  return (
    <svg width={size} height={size} className="rounded-md" style={{ background: "#EAFBF8" }}>
      {grid.map((on, i) => {
        const gx = i % N, gy = Math.floor(i / N);
        const inFinder = (gx < 8 && gy < 8) || (gx > N - 9 && gy < 8) || (gx < 8 && gy > N - 9);
        if (!on || inFinder) return null;
        return <rect key={i} x={c + gx * cell} y={c + gy * cell} width={cell * 0.92} height={cell * 0.92} fill="#052A30" />;
      })}
      {finder(0, 0)}{finder(N - 7, 0)}{finder(0, N - 7)}
    </svg>
  );
}

/* ---------- partículas flutuantes ---------- */
export function Particles({ n = 22 }: { n?: number }) {
  const pts = useMemo(() =>
    Array.from({ length: n }, (_, i) => ({
      left: Math.random() * 100, top: Math.random() * 100,
      s: 2 + Math.random() * 3, d: 5 + Math.random() * 7, delay: Math.random() * 6, o: 0.15 + Math.random() * 0.4, i,
    })), [n]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pts.map((p) => (
        <span key={p.i} className="absolute rounded-full floaty"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.s, height: p.s, background: "#5FE3D8", opacity: p.o, animationDuration: `${p.d}s`, animationDelay: `${p.delay}s`, boxShadow: "0 0 8px rgba(95,227,216,.8)" }} />
      ))}
    </div>
  );
}

/* ---------- título de seção ---------- */
export function SectionHead({ kicker, title, desc, right }: { kicker: string; title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div className="rv flex flex-wrap items-end justify-between gap-4 mb-9">
      <div>
        <div className="cy-chip text-cy-500 mb-2.5 flex items-center gap-2">
          <span className="inline-block w-6 h-px bg-cy-600" />{kicker}
        </div>
        <h2 className="display-xl text-[26px] md:text-[38px] text-mist"><Scramble text={title} /></h2>
        {desc && <p className="text-[14px] text-fog mt-2.5 max-w-[560px] leading-relaxed">{desc}</p>}
      </div>
      {right}
    </div>
  );
}
