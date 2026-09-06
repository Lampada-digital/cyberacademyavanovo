import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { I } from "./icons";
import { statusBadge } from "../lib/db";

/* ---------- Toasts ---------- */
type Toast = { id: number; msg: string; tone: "ok" | "err" | "info" };
const ToastCtx = createContext<(msg: string, tone?: Toast["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const push = (msg: string, tone: Toast["tone"] = "info") => {
    const id = idRef.current++;
    setList((l) => [...l, { id, msg, tone }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4200);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2 max-w-[360px]">
        {list.map((t) => (
          <div key={t.id} className={`cy-toast flex items-start gap-2.5 px-4 py-3 rounded-lg border text-sm shadow-2xl ${
            t.tone === "ok" ? "bg-[#062E2A] border-cy-600 text-cy-200" :
            t.tone === "err" ? "bg-[#331512] border-coral/60 text-[#FBD3CB]" :
            "bg-[#062330] border-mp/50 text-[#CFEAF7]"}`}>
            <span className="mt-0.5"><I n={t.tone === "ok" ? "checkc" : t.tone === "err" ? "alert" : "bell"} s={16} /></span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Primitivos ---------- */
export function Btn({ v = "p", sm, children, className = "", ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { v?: "p" | "e" | "g" | "d" | "x"; sm?: boolean }) {
  return (
    <button className={`cy-btn cy-btn-${v} ${sm ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]"} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children, req }: { label: string; hint?: string; children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-left">
      <span className="block font-mono text-[10.5px] tracking-[.16em] uppercase text-fog mb-1.5">
        {label} {req && <span className="text-cy-400">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11.5px] text-dim mt-1">{hint}</span>}
    </label>
  );
}

export const TIn = ({ className = "", ...p }: React.InputHTMLAttributes<HTMLInputElement>) => <input className={`cy-in ${className}`} {...p} />;
export const TArea = ({ className = "", ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={`cy-in min-h-[90px] ${className}`} {...p} />;
export function TSel({ children, className = "", ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`cy-in ${className}`} {...p}>{children}</select>;
}

export function Badge({ s }: { s: string }) {
  const [label, cls] = statusBadge(s);
  return <span className={`cy-badge ${cls}`}>{label}</span>;
}

export function Tag({ children, tone = "teal" }: { children: React.ReactNode; tone?: "teal" | "amber" | "mist" }) {
  return <span className={`cy-badge ${tone === "amber" ? "b-amber" : tone === "mist" ? "b-mist" : "b-teal"}`}>{children}</span>;
}

export function Card({ children, className = "", hover, onClick }: { children: React.ReactNode; className?: string; hover?: boolean; onClick?: () => void }) {
  return <div className={`cy-card ${hover ? "cy-card-h" : ""} ${className}`} onClick={onClick}>{children}</div>;
}

export function Stat({ icon, label, value, sub, tone = "teal" }: { icon: string; label: string; value: React.ReactNode; sub?: string; tone?: "teal" | "amber" }) {
  return (
    <Card hover className="p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg grid place-items-center border ${tone === "amber" ? "bg-ember/10 border-ember/40 text-ember" : "bg-cy-500/10 border-cy-600/50 text-cy-400"}`}>
        <I n={icon} s={20} />
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[10px] tracking-[.16em] uppercase text-fog">{label}</div>
        <div className="font-display text-[22px] font-bold text-mist leading-tight tnum">{value}</div>
        {sub && <div className="text-[11.5px] text-dim truncate">{sub}</div>}
      </div>
    </Card>
  );
}

export function Bar({ v, h = 6, tone = "teal" }: { v: number; h?: number; tone?: "teal" | "amber" }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: h, background: "rgba(14,59,64,.6)" }}>
      <div className={`bar-anim h-full rounded-full ${tone === "amber" ? "bg-ember" : "bg-gradient-to-r from-cy-600 to-cy-400"}`}
        style={{ width: `${Math.min(100, Math.max(0, v))}%` }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, w = 560 }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; w?: number }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="cy-modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cy-modal anim-fade-up" style={{ maxWidth: w }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-[#07303C]/95 backdrop-blur z-10">
          <h3 className="font-display font-semibold text-cy-300 text-[15px] tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-fog hover:text-cy-300 transition-colors"><I n="x" s={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon = "db", title, desc, children }: { icon?: string; title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="cy-card p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-xl border border-dashed border-cy-700 grid place-items-center text-cy-600 mb-4">
        <I n={icon} s={26} />
      </div>
      <h3 className="font-display font-semibold text-mist text-[16px]">{title}</h3>
      {desc && <p className="text-[13.5px] text-fog mt-1.5 max-w-[440px] mx-auto leading-relaxed">{desc}</p>}
      {children && <div className="mt-5 flex flex-wrap gap-3 justify-center">{children}</div>}
    </div>
  );
}

export function Tabs({ items, cur, onChange }: { items: [string, string][]; cur: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-line overflow-x-auto">
      {items.map(([k, label]) => (
        <button key={k} onClick={() => onChange(k)}
          className={`px-4 py-2.5 font-display text-[12.5px] tracking-wide uppercase whitespace-nowrap border-b-2 -mb-px transition-colors ${
            cur === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent hover:text-mist"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Confirm({ open, onClose, onYes, title, desc }: { open: boolean; onClose: () => void; onYes: () => void; title: string; desc: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title} w={420}>
      <p className="text-[13.5px] text-fog leading-relaxed">{desc}</p>
      <div className="flex justify-end gap-2 mt-5">
        <Btn v="x" onClick={onClose}>Cancelar</Btn>
        <Btn v="d" onClick={() => { onYes(); onClose(); }}>Confirmar</Btn>
      </div>
    </Modal>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-line bg-abyss text-cy-300">{children}</span>;
}

/* ---------- Upload de imagem (com compressão canvas) ---------- */
export function FileDrop({ value, onChange, label = "Clique ou arraste uma imagem", max = 480 }: {
  value?: string; onChange: (dataUrl: string, fileName: string) => void; label?: string; max?: number;
}) {
  const [drag, setDrag] = useState(false);
  const read = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        onChange(c.toDataURL("image/jpeg", 0.82), file.name);
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  };
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); read(e.dataTransfer.files?.[0]); }}
        onClick={() => document.getElementById("fd-" + label.length)?.click()}
        className={`rounded-lg border border-dashed p-3 cursor-pointer transition-all flex items-center gap-3 ${drag ? "border-cy-400 bg-cy-500/10" : "border-cy-700 hover:border-cy-500 bg-[#041821]"}`}>
        {value ? (
          <img src={value} alt="preview" className="w-16 h-16 object-cover rounded-md border border-line" />
        ) : (
          <span className="w-16 h-16 rounded-md grid place-items-center border border-line text-cy-600 bg-abyss"><I n="cam" s={22} /></span>
        )}
        <div className="min-w-0">
          <div className="text-[13px] text-mist font-semibold">{value ? "Trocar imagem" : label}</div>
          <div className="font-mono text-[10.5px] text-dim mt-0.5">PNG/JPG · comprimida automaticamente · máx. {max}px</div>
        </div>
        <input id={"fd-" + label.length} type="file" accept="image/*" className="hidden" onChange={(e) => { read(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}

/* ---------- Força de senha ---------- */
export function Strength({ score, label, tone }: { score: number; label: string; tone: "coral" | "amber" | "green" }) {
  const color = tone === "green" ? "#7BE0A2" : tone === "amber" ? "#F5B84B" : "#F0705A";
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-[4px] flex-1 rounded-full transition-all duration-300" style={{ background: i < score ? color : "rgba(14,59,64,.7)" }} />
        ))}
      </div>
      <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color }}>{label}</span>
    </div>
  );
}

/* ---------- Autenticador TOTP (simulado) ---------- */
export function TotpCode({ code, remaining }: { code: string; remaining: number }) {
  const pct = (remaining / 30) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="relative w-9 h-9 shrink-0">
        <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(14,59,64,.7)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#03A6A6" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${pct} 100`} style={{ transition: "stroke-dasharray 1s linear" }} />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-[9px] text-cy-300">{remaining}</span>
      </span>
      <span className="font-mono text-[22px] font-bold tracking-[.3em] text-mist tnum">{code}</span>
    </div>
  );
}

export function PageHead({ kicker, title, desc, right }: { kicker: string; title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <div className="cy-chip text-cy-500 mb-2">{kicker}</div>
        <h1 className="display-xl text-[26px] md:text-[32px] text-mist">{title}</h1>
        {desc && <p className="text-[13.5px] text-fog mt-2 max-w-[640px] leading-relaxed">{desc}</p>}
      </div>
      {right && <div className="flex gap-2 flex-wrap">{right}</div>}
    </div>
  );
}

export function CoverImg({ src, title, className = "" }: { src?: string; title: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ background: "linear-gradient(135deg,#05202B,#0A3E41 60%,#0E5F5F)" }}>
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="cg" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0v28" fill="none" stroke="#03A6A6" strokeWidth=".7" /></pattern></defs>
          <rect width="400" height="225" fill="url(#cg)" />
          <circle cx="330" cy="60" r="70" fill="none" stroke="#5FE3D8" strokeWidth="1.4" opacity=".5" />
          <circle cx="330" cy="60" r="44" fill="none" stroke="#5FE3D8" strokeWidth="1" opacity=".35" />
          <path d="M60 160l30-40 24 26 34-52 28 34" fill="none" stroke="#03A6A6" strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
        </svg>
        <div className="absolute bottom-3 left-4 font-display font-bold text-cy-300/80 text-[13px] tracking-widest uppercase">{title.slice(0, 22)}</div>
      </div>
    );
  }
  return <img src={src} alt={title} onError={() => setErr(true)} className={`object-cover w-full h-full ${className}`} loading="lazy" />;
}
