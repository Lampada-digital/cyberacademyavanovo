import React, { useEffect, useState } from "react";
import { I, Logo } from "./icons";
import { useApp, navigate } from "../state";
import { logout, homeFor } from "../lib/api";
import { where, timeAgo, type Row } from "../lib/db";

export function SiteShell({ children, path }: { children: React.ReactNode; path: string }) {
  const { user, setUser } = useApp();
  const [mob, setMob] = useState(false);
  const [cookie, setCookie] = useState(() => !localStorage.getItem("ca_cookie_ok"));
  const links: [string, string][] = [["/cursos", "Cursos"], ["/sobre", "Sobre"], ["/professores", "Professores"], ["/blog", "Blog"], ["/faq", "FAQ"], ["/contato", "Contato"]];
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-ink/85 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-5 h-[66px] flex items-center justify-between gap-6">
          <Logo />
          <nav className="hidden lg:flex items-center gap-7">
            {links.map(([to, label]) => (
              <a key={to} href={`#${to}`} className={`cy-nav-link ${path === to || (to !== "/" && path.startsWith(to)) ? "on" : ""}`}>{label}</a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                {/* Acesso rápido baseado nas permissões */}
                {user.role === "student" && (
                  <a href="#/aluno" className="cy-btn cy-btn-g px-3.5 py-2 text-[12px]"><I n="cap" s={15} /> AVA</a>
                )}
                {user.role === "teacher" && (
                  <a href="#/professor" className="cy-btn cy-btn-g px-3.5 py-2 text-[12px]"><I n="book" s={15} /> Área do Professor</a>
                )}
                {(user.role !== "student" && user.role !== "teacher") && (
                  <a href="#/intranet" className="cy-btn cy-btn-e px-3.5 py-2 text-[12px]"><I n="lock" s={15} /> Intranet</a>
                )}
                <button onClick={() => { logout(); setUser(null); navigate("/"); }} className="cy-btn cy-btn-x px-2.5 py-2" title="Sair"><I n="out" s={16} /></button>
              </>
            ) : (
              <>
                <a href="#/login" className="cy-btn cy-btn-x px-3.5 py-2 text-[12px]"><I n="lock" s={14} /> Entrar</a>
                <a href="#/cursos" className="cy-btn cy-btn-p px-4 py-2 text-[12px]">Inscrever-se <I n="arrowR" s={15} /></a>
              </>
            )}
          </div>
          <button className="lg:hidden text-cy-300" onClick={() => setMob(!mob)}><I n={mob ? "x" : "menu"} s={22} /></button>
        </div>
        {mob && (
          <div className="lg:hidden border-t border-line bg-abyss px-5 py-4 flex flex-col gap-1 anim-fade-in">
            {links.map(([to, label]) => (
              <a key={to} href={`#${to}`} onClick={() => setMob(false)} className="py-2.5 font-display text-[13px] tracking-widest uppercase text-fog hover:text-cy-300">{label}</a>
            ))}
            <div className="flex gap-2 pt-3">
              {user ? (
                user.role === "student" ? (
                  <a href="#/aluno" className="cy-btn cy-btn-p px-4 py-2.5 text-[12px] flex-1"><I n="cap" s={15} /> Portal do Aluno</a>
                ) : (
                  <a href="#/intranet" className="cy-btn cy-btn-e px-4 py-2.5 text-[12px] flex-1"><I n="lock" s={15} /> Intranet</a>
                )
              ) : (
                <>
                  <a href="#/intranet" className="cy-btn cy-btn-g px-4 py-2.5 text-[12px] flex-1"><I n="lock" s={14} /> Intranet</a>
                  <a href="#/cadastro" className="cy-btn cy-btn-p px-4 py-2.5 text-[12px] flex-1">Inscrever-se</a>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-abyss/70 mt-24">
        <div className="max-w-[1200px] mx-auto px-5 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="text-[13px] text-fog leading-relaxed mt-4 max-w-[300px]">
              Escola de tecnologia com ecossistema acadêmico próprio: SIA para gestão, AVA para aprendizagem e certificados verificáveis publicamente.
            </p>
            <div className="flex items-center gap-2 mt-5 font-mono text-[11px] text-dim">
              <span className="w-2 h-2 rounded-full bg-[#7BE0A2] animate-pulse" /> SIA ONLINE · v2.6.0
            </div>
          </div>
          <div>
            <h4 className="font-mono text-[11px] tracking-[.18em] uppercase text-cy-500 mb-4">Institucional</h4>
            {[["/sobre", "Sobre a escola"], ["/professores", "Corpo docente"], ["/blog", "Blog"], ["/contato", "Contato"]].map(([to, l]) => (
              <a key={to} href={`#${to}`} className="block text-[13px] text-fog hover:text-cy-300 py-1.5 transition-colors">{l}</a>
            ))}
          </div>
          <div>
            <h4 className="font-mono text-[11px] tracking-[.18em] uppercase text-cy-500 mb-4">Plataforma</h4>
            {[["/cursos", "Catálogo de cursos"], ["/login", "Portal do Aluno"], ["/validar-certificado", "Validar certificado"], ["/faq", "Perguntas frequentes"]].map(([to, l]) => (
              <a key={to} href={`#${to}`} className="block text-[13px] text-fog hover:text-cy-300 py-1.5 transition-colors">{l}</a>
            ))}
            <a href="#/intranet" className="block text-[13px] text-ember hover:text-ember-600 py-1.5 transition-colors font-semibold flex items-center gap-1.5"><I n="lock" s={12} /> Intranet (equipe)</a>
          </div>
          <div>
            <h4 className="font-mono text-[11px] tracking-[.18em] uppercase text-cy-500 mb-4">LGPD</h4>
            {[["/termos", "Termos de Uso"], ["/privacidade", "Política de Privacidade"], ["/cookies", "Política de Cookies"]].map(([to, l]) => (
              <a key={to} href={`#${to}`} className="block text-[13px] text-fog hover:text-cy-300 py-1.5 transition-colors">{l}</a>
            ))}
            <p className="font-mono text-[10.5px] text-dim mt-4">contato@cyberacademy.com.br<br />(11) 4004-2026 · São Paulo/SP</p>
          </div>
        </div>
        <div className="border-t border-line/60">
          <div className="max-w-[1200px] mx-auto px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12px] text-dim">© {new Date().getFullYear()} Cyber Academy Ltda. · CNPJ 00.000.000/0001-26</span>
            <span className="font-mono text-[11px] text-dim flex items-center gap-2"><I n="shield" s={13} c="text-cy-600" /> Pagamentos processados pelo Mercado Pago</span>
          </div>
        </div>
      </footer>

      {cookie && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-[400px] z-[80] cy-card p-4 border-cy-700 shadow-2xl anim-fade-up">
          <div className="flex items-start gap-3">
            <I n="shield" s={20} c="text-cy-400 mt-0.5" />
            <div>
              <p className="text-[13px] text-mist leading-relaxed">Usamos cookies essenciais para autenticação e medição, conforme nossa <a href="#/cookies" className="text-cy-300 underline">Política de Cookies</a> (LGPD).</p>
              <div className="flex gap-2 mt-3">
                <button className="cy-btn cy-btn-p px-3.5 py-1.5 text-[12px]" onClick={() => { localStorage.setItem("ca_cookie_ok", "1"); setCookie(false); }}>Aceitar</button>
                <a href="#/cookies" className="cy-btn cy-btn-x px-3 py-1.5 text-[12px]">Saiba mais</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= APP SHELL (SIA) ================= */
export interface NavItem { to: string; icon: string; label: string }

export function AppShell({ title, nav, children, path }: { title: string; nav: NavItem[]; children: React.ReactNode; path: string }) {
  const { user, refresh, setUser } = useApp();
  const [mob, setMob] = useState(false);
  const [bell, setBell] = useState(false);
  if (!user) return null;
  const notes = where("notifications", (n) => n.userId === user.id).sort((a, b) => b.at.localeCompare(a.at));
  const unread = notes.filter((n) => !n.read).length;
  const markAll = () => { notes.forEach((n) => { if (!n.read) { n.read = true; } }); import("../lib/db").then((d) => d.save()); refresh(); };

  const side = (
    <div className="flex flex-col h-full">
      <div className="px-5 h-[62px] flex items-center border-b border-line">
        <Logo />
      </div>
      <div className="px-5 py-4">
        <div className="cy-chip text-cy-500">{title}</div>
        <div className="text-[12.5px] text-fog mt-1 truncate">{user.name}</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-0.5">
        {nav.map((n) => (
          <a key={n.to} href={`#${n.to}`} onClick={() => setMob(false)} className={`cy-side-link ${path === n.to || path.startsWith(n.to + "/") ? "on" : ""}`}>
            <I n={n.icon} s={16} /> {n.label}
          </a>
        ))}
      </nav>
      <div className="p-3 border-t border-line">
        <a href="#/" className="cy-side-link"><I n="globe" s={16} /> Site público</a>
        <button className="cy-side-link w-full" onClick={() => { logout(); setUser(null); navigate("/"); }}><I n="out" s={16} /> Sair da conta</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden lg:block sticky top-0 h-screen border-r border-line bg-abyss/60">{side}</aside>
      {mob && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink/80" onClick={() => setMob(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-abyss border-r border-line anim-fade-in">{side}</aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-40 h-[62px] border-b border-line bg-ink/85 backdrop-blur-md flex items-center justify-between px-5 gap-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-cy-300" onClick={() => setMob(true)}><I n="menu" s={20} /></button>
            <span className="font-display font-semibold text-[14px] tracking-widest uppercase text-cy-300">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button className="cy-btn cy-btn-x px-2.5 py-2 relative" onClick={() => setBell(!bell)}>
                <I n="bell" s={17} />
                {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-ember text-[10px] font-bold text-ink grid place-items-center">{unread}</span>}
              </button>
              {bell && (
                <div className="absolute right-0 top-11 w-[330px] cy-card shadow-2xl z-50 anim-fade-in overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                    <span className="font-mono text-[11px] tracking-[.16em] uppercase text-fog">Notificações</span>
                    <button className="text-[11.5px] text-cy-300 hover:underline" onClick={markAll}>marcar lidas</button>
                  </div>
                  <div className="max-h-[340px] overflow-y-auto">
                    {notes.length === 0 && <p className="p-5 text-[13px] text-dim text-center">Nenhuma notificação.</p>}
                    {notes.slice(0, 12).map((n: Row) => (
                      <div key={n.id} className={`px-4 py-3 border-b border-line/50 ${n.read ? "opacity-60" : ""}`}>
                        <div className="flex justify-between gap-2">
                          <span className="text-[12.5px] font-semibold text-mist">{n.title}</span>
                          <span className="font-mono text-[10px] text-dim shrink-0">{timeAgo(n.at)}</span>
                        </div>
                        <p className="text-[12px] text-fog mt-0.5 leading-relaxed">{n.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-line">
              <Avatar name={user.name} />
              <div className="leading-tight">
                <div className="text-[12.5px] font-semibold text-mist max-w-[140px] truncate">{user.name}</div>
                <div className="font-mono text-[10px] text-cy-500 uppercase tracking-wider">{user.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="p-5 md:p-7 max-w-[1240px]" onClick={() => bell && setBell(false)}>{children}</main>
      </div>
    </div>
  );
}

export function Avatar({ name, s = 34 }: { name: string; s?: number }) {
  const init = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hues = [["#0E5F5F", "#5FE3D8"], ["#5F4A0E", "#F5B84B"], ["#274A63", "#7AD4F7"], ["#4A2E55", "#C89BE0"]];
  const [bg, fg] = hues[h % hues.length];
  return (
    <span className="rounded-lg grid place-items-center font-display font-bold shrink-0 border border-line"
      style={{ width: s, height: s, background: bg, color: fg, fontSize: s * 0.36 }}>{init}</span>
  );
}
