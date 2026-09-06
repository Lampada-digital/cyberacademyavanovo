import React, { useEffect, useMemo, useRef, useState } from "react";
import { I } from "../components/icons";
import { AppShell, Avatar, type NavItem } from "../components/layout";
import { Btn, Card, Badge, Bar, Empty, Field, TIn, TArea, TSel, Modal, Stat, Tag, PageHead, useToast, Confirm, CoverImg, FileDrop, Strength, TotpCode } from "../components/ui";
import { QRMatrix } from "../components/fx";
import { useApp, navigate } from "../state";
import {
  myEnrollments, courseTree, courseProgress, lessonState, markLesson, weightedAvg,
  submitAttempt, submitSubmission, createTicket, replyTicket, changePassword,
  autoScore, canTeacherAccess, levelInfo, streakDays, awardXp, resumeLesson, reenrollFree,
  myDocuments, uploadDocument, issueStudentCard, enable2FA, confirm2FA, disable2FA,
  mySessions, revokeSession, forumPosts, createForumPost, deleteForumPost,
  lessonNote, saveLessonNote, passwordScore, updateProfile, currentTotp,
  all, one, where, find, update, fmtBRL, fmtDate, fmtDT, timeAgo, type Row, audit, getSettings,
} from "../lib/api";
import { DOC_KINDS } from "../lib/db";

const NAV: NavItem[] = [
  { to: "/aluno", icon: "home", label: "Início" },
  { to: "/aluno/matriculas", icon: "cap", label: "Minhas matrículas" },
  { to: "/aluno/cursos", icon: "layers", label: "Meus cursos" },
  { to: "/aluno/ava", icon: "playc", label: "AVA" },
  { to: "/aluno/atividades", icon: "target", label: "Atividades" },
  { to: "/aluno/avaliacoes", icon: "file", label: "Avaliações" },
  { to: "/aluno/notas", icon: "chart", label: "Notas" },
  { to: "/aluno/projetos", icon: "git", label: "Projetos" },
  { to: "/aluno/historico", icon: "book", label: "Histórico" },
  { to: "/aluno/documentos", icon: "award", label: "Documentos" },
  { to: "/aluno/financeiro", icon: "wallet", label: "Financeiro" },
  { to: "/aluno/notificacoes", icon: "bell", label: "Notificações" },
  { to: "/aluno/suporte", icon: "msg", label: "Suporte" },
  { to: "/aluno/perfil", icon: "user", label: "Meu perfil" },
];

function enrolledCourseIds(studentId: string) {
  return myEnrollments(studentId).filter((e) => ["ACTIVE", "COMPLETED"].includes(e.status)).map((e) => e.courseId);
}
function guardEnrolled(studentId: string, courseId: string): boolean {
  return myEnrollments(studentId).some((e) => e.courseId === courseId && ["ACTIVE", "COMPLETED"].includes(e.status));
}

export default function StudentArea({ path, segs }: { path: string; segs: string[] }) {
  const { user } = useApp();
  if (!user) return null;
  const sub = segs[1] || "";
  let page: React.ReactNode;
  switch (sub) {
    case "": page = <Dashboard />; break;
    case "matriculas": page = <Matriculas />; break;
    case "cursos": case "ava": page = <MeusCursos />; break;
    case "aula": page = <LessonPlayer lessonId={segs[2]} />; break;
    case "avacurso": page = <AvaCourse courseId={segs[2]} />; break;
    case "atividades": page = <Atividades />; break;
    case "avaliacoes": page = <Avaliacoes />; break;
    case "runner": page = <Runner kind={segs[2] as any} itemId={segs[3]} />; break;
    case "notas": page = <Notas />; break;
    case "projetos": page = <Projetos />; break;
    case "historico": page = <Historico />; break;
    case "documentos": page = <Documentos />; break;
    case "certificados": page = <Certificados />; break;
    case "financeiro": page = <Financeiro />; break;
    case "notificacoes": page = <Notificacoes />; break;
    case "suporte": page = <Suporte />; break;
    case "perfil": page = <Perfil />; break;
    default: page = <Dashboard />;
  }
  return <AppShell title="Portal do Aluno" nav={NAV} path={path}>{page}</AppShell>;
}

/* ================= DASHBOARD ================= */
function Dashboard() {
  const { user } = useApp();
  const ens = myEnrollments(user!.id);
  const active = ens.filter((e) => e.status === "ACTIVE");
  const notes = where("notifications", (n) => n.userId === user!.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  const pendFin = where("orders", (o) => o.userId === user!.id && o.status === "created").length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const pendingActs: Row[] = [];
  enrolledCourseIds(user!.id).forEach((cid) => {
    where("activities", (a) => a.courseId === cid && a.published).forEach((a) => {
      const at = where("attempts", (t) => t.itemId === a.id && t.studentId === user!.id && t.status !== "abandoned");
      if (!at.some((t) => t.status === "graded" || t.status === "auto_graded" || t.status === "review")) pendingActs.push({ ...a, kind: "activity" });
    });
    where("assessments", (a) => a.courseId === cid && a.published).forEach((a) => {
      const at = where("attempts", (t) => t.itemId === a.id && t.studentId === user!.id);
      if (!at.some((t) => ["graded", "auto_graded", "review"].includes(t.status))) pendingActs.push({ ...a, kind: "assessment" });
    });
  });
  return (
    <div className="space-y-6">
      <div className="anim-fade-up">
        <div className="cy-chip text-cy-500">SIA · PORTAL DO ALUNO</div>
        <h1 className="display-xl text-[26px] md:text-[32px] text-mist mt-1">{greet}, {user!.name.split(" ")[0]} <span className="text-cy-400">_</span></h1>
        <p className="text-[13.5px] text-fog mt-1.5">Sua vida acadêmica em tempo real — matrículas, progresso, notas e certificados.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="cap" label="Matrículas ativas" value={active.length} sub={`${ens.length} no total`} />
        <Stat icon="chart" label="Progresso médio" value={`${ens.length ? Math.round(ens.reduce((s, e) => s + (courseProgress(user!.id, e.courseId).percent), 0) / ens.length) : 0}%`} tone="amber" />
        <Stat icon="target" label="Pendências" value={pendingActs.length} sub="atividades e avaliações" />
        <Stat icon="award" label="Certificados" value={where("certificates", (c) => c.studentId === user!.id).length} />
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        {(() => {
          const lv = levelInfo(user!.xp || 0);
          return (
            <Card className="p-5 flex flex-wrap items-center gap-5">
              <span className="w-12 h-12 rounded-xl grid place-items-center bg-ember/10 border border-ember/40 text-ember"><I n="zap" s={22} /></span>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display font-semibold text-[14.5px] text-mist">Nível: <span className="text-ember">{lv.name}</span></span>
                  <span className="font-mono text-[11.5px] text-cy-300 tnum">{lv.xp} XP</span>
                </div>
                <div className="mt-2"><Bar v={lv.pct} tone="amber" /></div>
                <div className="font-mono text-[10.5px] text-dim mt-1.5">{lv.nextName ? `${lv.nextMin - lv.xp} XP para ${lv.nextName}` : "nível máximo alcançado"} · aulas +15 · atividades +25 · avaliações +40 · fórum +5</div>
              </div>
              <div className="flex items-center gap-2 cy-card px-4 py-2.5 border-ember/30">
                <I n="flame" s={20} c={streakDays(user!.id) > 0 ? "text-ember" : "text-dim"} />
                <div>
                  <div className="font-display font-bold text-[17px] text-mist leading-none tnum">{streakDays(user!.id)}</div>
                  <div className="font-mono text-[9.5px] text-dim uppercase tracking-wider mt-0.5">dias seguidos</div>
                </div>
              </div>
            </Card>
          );
        })()}
        {(() => {
          const en = active[0];
          const rl = en && resumeLesson(user!.id, en.courseId);
          const c = en && find("courses", en.courseId);
          return rl && c ? (
            <a href={`#/aluno/aula/${rl.id}`} className="cy-card cy-card-h p-5 flex items-center gap-4 group">
              <span className="w-12 h-12 rounded-xl grid place-items-center bg-cy-500/12 border border-cy-600/50 text-cy-300 group-hover:scale-105 transition-transform"><I n="playc" s={22} /></span>
              <div className="min-w-0">
                <div className="cy-chip text-cy-500">CONTINUE DE ONDE PAROU</div>
                <div className="text-[13.5px] font-semibold text-mist mt-1 truncate">{rl.title}</div>
                <div className="font-mono text-[10.5px] text-dim mt-0.5 truncate">{c.title}</div>
              </div>
              <I n="arrowR" s={18} c="text-cy-400 ml-auto shrink-0" />
            </a>
          ) : (
            <Card className="p-5 grid place-items-center text-center">
              <p className="text-[12.5px] text-dim">Matricule-se em um curso para começar sua trilha de estudos.</p>
            </Card>
          );
        })()}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-[15px] text-cy-300 flex items-center gap-2"><I n="layers" s={16} /> Meus cursos</h2>
          {ens.length === 0 ? (
            <Empty icon="layers" title="Nenhuma matrícula ainda" desc="Escolha um curso no catálogo — após o pagamento, a matrícula aparece aqui automaticamente.">
              <a href="#/cursos" className="cy-btn cy-btn-e px-5 py-2.5 text-[12.5px]">Explorar catálogo</a>
            </Empty>
          ) : (
            ens.map((e) => {
              const c = find("courses", e.courseId);
              if (!c) return null;
              const p = courseProgress(user!.id, e.courseId);
              return (
                <Card key={e.id} hover className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-[92px] h-[58px] rounded-lg overflow-hidden shrink-0 hidden sm:block"><CoverImg src={c.image} title={c.title} className="h-full" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <a href={`#/aluno/avacurso/${c.id}`} className="font-display font-semibold text-[14.5px] text-mist hover:text-cy-300 transition-colors">{c.title}</a>
                        <Badge s={e.status} />
                      </div>
                      <div className="font-mono text-[10.5px] text-dim mt-1">matrícula {e.number} · desde {fmtDate(e.startDate)}</div>
                      <div className="flex items-center gap-3 mt-3">
                        <Bar v={p.percent} />
                        <span className="font-mono text-[12px] text-cy-300 tnum w-11 text-right">{p.percent}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href={`#/aluno/avacurso/${c.id}`} className="cy-btn cy-btn-p px-3.5 py-2 text-[11.5px]"><I n="playc" s={14} /> {p.percent > 0 ? "Continuar" : "Começar"} no AVA</a>
                    <a href="#/aluno/notas" className="cy-btn cy-btn-x px-3 py-2 text-[11.5px]">Notas</a>
                  </div>
                </Card>
              );
            })
          )}
        </div>
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-[15px] text-cy-300 flex items-center gap-2"><I n="target" s={16} /> Próximas entregas</h2>
          <Card className="p-4 divide-y divide-line/60">
            {pendingActs.length === 0 && <p className="py-3 text-[13px] text-dim text-center">Nenhuma pendência. 🎯</p>}
            {pendingActs.slice(0, 5).map((a) => (
              <a key={a.id} href={`#/aluno/runner/${a.kind}/${a.id}`} className="flex items-center gap-3 py-2.5 hover:bg-cy-500/5 px-2 -mx-2 rounded transition-colors">
                <I n={a.kind === "activity" ? "target" : "file"} s={16} c={a.kind === "activity" ? "text-ember" : "text-cy-400"} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-mist truncate">{a.title}</div>
                  <div className="font-mono text-[10px] text-dim uppercase">{a.kind === "activity" ? "atividade" : "avaliação"} · {find("courses", a.courseId)?.title.slice(0, 26)}</div>
                </div>
                <I n="chevR" s={14} c="text-dim" />
              </a>
            ))}
          </Card>
          <h2 className="font-display font-semibold text-[15px] text-cy-300 flex items-center gap-2 pt-2"><I n="bell" s={16} /> Notificações</h2>
          <Card className="p-4 divide-y divide-line/60">
            {notes.length === 0 && <p className="py-3 text-[13px] text-dim text-center">Sem notificações.</p>}
            {notes.map((n) => (
              <div key={n.id} className="py-2.5">
                <div className="flex justify-between gap-2"><span className="text-[12.5px] font-semibold text-mist">{n.title}</span><span className="font-mono text-[10px] text-dim">{timeAgo(n.at)}</span></div>
                <p className="text-[12px] text-fog mt-0.5">{n.body}</p>
              </div>
            ))}
            {notes.length > 0 && <a href="#/aluno/notificacoes" className="block text-center text-[12px] text-cy-300 hover:underline pt-3">ver todas</a>}
          </Card>
          {pendFin > 0 && (
            <Card className="p-4 border-ember/40 flex items-center gap-3">
              <I n="alert" s={20} c="text-ember" />
              <div className="text-[12.5px] text-fog">Você tem {pendFin} pedido aguardando pagamento. <a href="#/aluno/financeiro" className="text-ember underline">Ver financeiro</a></div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= MATRÍCULAS ================= */
function Matriculas() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const ens = myEnrollments(user!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reenroll = (courseId: string) => {
    try { const en = reenrollFree(user!.id, courseId); toast(`Rematrícula grátis ativa! Matrícula ${en.number}.`, "ok"); refresh(); }
    catch (e: any) { toast(e.message, "err"); }
  };
  return (
    <div>
      <PageHead kicker="SIA · matrículas" title="Minhas matrículas" desc="Cada matrícula possui número único gerado pelo backend e vínculo com pedido e pagamento. Cursos com rematrícula grátis podem ser reativados após a conclusão." />
      {ens.length === 0 ? <Empty icon="cap" title="Nenhuma matrícula" desc="Compre um curso no catálogo para gerar sua primeira matrícula."><a href="#/cursos" className="cy-btn cy-btn-e px-5 py-2.5 text-[12.5px]">Ver cursos</a></Empty> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Nº Matrícula</th><th>Curso</th><th>Início</th><th>Previsão</th><th>Origem</th><th>Situação</th><th></th></tr></thead>
            <tbody>
              {ens.map((e) => {
                const c = find("courses", e.courseId);
                const canReenroll = e.status === "COMPLETED" && c?.freeReenroll &&
                  !ens.some((x) => x.courseId === e.courseId && x.status === "ACTIVE");
                return (
                  <tr key={e.id}>
                    <td className="font-mono text-cy-300">{e.number}</td>
                    <td className="text-mist font-semibold">{c?.title || "—"}</td>
                    <td>{fmtDate(e.startDate)}</td>
                    <td>{fmtDate(e.dueDate)}</td>
                    <td className="font-mono text-[11px] uppercase">{e.origin === "reenroll-free" ? "rematrícula" : e.origin}</td>
                    <td><Badge s={e.status} /></td>
                    <td>{canReenroll && <Btn v="e" sm onClick={() => reenroll(e.courseId)}><I n="refresh" s={13} /> Rematricular grátis</Btn>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ================= MEUS CURSOS / AVA LISTA ================= */
function MeusCursos() {
  const { user } = useApp();
  const ens = myEnrollments(user!.id).filter((e) => ["ACTIVE", "COMPLETED"].includes(e.status));
  return (
    <div>
      <PageHead kicker="AVA · ambiente virtual de aprendizagem" title="Meus cursos" desc="Estrutura completa: curso → módulo → aula → materiais → atividades → avaliações → projeto." />
      {ens.length === 0 ? <Empty icon="playc" title="Nenhum curso liberado" desc="Após a compra aprovada, o curso aparece aqui."><a href="#/cursos" className="cy-btn cy-btn-e px-5 py-2.5 text-[12.5px]">Catálogo</a></Empty> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {ens.map((e) => {
            const c = find("courses", e.courseId)!;
            const p = courseProgress(user!.id, e.courseId);
            return (
              <a key={e.id} href={`#/aluno/avacurso/${c.id}`} className="cy-card cy-card-h overflow-hidden group block">
                <div className="h-[130px] overflow-hidden"><CoverImg src={c.image} title={c.title} className="h-full transition-transform duration-500 group-hover:scale-105" /></div>
                <div className="p-5">
                  <div className="flex justify-between items-start gap-2"><h3 className="font-display font-semibold text-[14.5px] text-mist group-hover:text-cy-300 transition-colors">{c.title}</h3><Badge s={e.status} /></div>
                  <div className="font-mono text-[10.5px] text-dim mt-1.5">{p.done}/{p.total} aulas concluídas</div>
                  <div className="flex items-center gap-3 mt-3"><Bar v={p.percent} /><span className="font-mono text-[12px] text-cy-300 tnum">{p.percent}%</span></div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================= AVA — CURSO ================= */
function AvaCourse({ courseId }: { courseId: string }) {
  const { user } = useApp();
  const toast = useToast();
  const tree = courseTree(courseId);
  if (!tree) return <Empty icon="search" title="Curso não encontrado" />;
  if (!guardEnrolled(user!.id, courseId)) {
    return <Empty icon="lock" title="Acesso restrito" desc="Somente alunos com matrícula ativa neste curso podem acessar o AVA. O SIA bloqueou esta rota.">
      <a href="#/cursos" className="cy-btn cy-btn-e px-5 py-2.5 text-[12.5px]">Ver página do curso</a></Empty>;
  }
  const { course: c, modules, teacher } = tree;
  const p = courseProgress(user!.id, courseId);
  const en = one("enrollments", (e) => e.studentId === user!.id && e.courseId === courseId)!;
  const activities = where("activities", (a) => a.courseId === courseId && a.published);
  const assessments = where("assessments", (a) => a.courseId === courseId && a.published);
  const projects = where("projects", (pr) => pr.courseId === courseId);
  const nextLesson = modules.flatMap((m) => m.lessons).find((l: Row) => l.published && !lessonState(user!.id, l.id)?.completed);
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="#/aluno/cursos" className="text-fog hover:text-cy-300"><I n="chevL" s={20} /></a>
        <div className="flex-1">
          <div className="cy-chip text-cy-500">AVA · {c.level}</div>
          <h1 className="display-xl text-[22px] md:text-[28px] text-mist mt-0.5">{c.title}</h1>
          <div className="font-mono text-[11px] text-dim mt-1">matrícula {en.number} · professor(a) {teacher?.name || "a definir"}</div>
        </div>
        {nextLesson && <a href={`#/aluno/aula/${nextLesson.id}`} className="cy-btn cy-btn-e px-4 py-2.5 text-[12px] hidden sm:inline-flex"><I n="play" s={14} /> {p.percent > 0 ? "Continuar" : "Iniciar"}</a>}
      </div>
      {(() => {
        const totalMin = modules.reduce((s, m) => s + m.lessons.reduce((a: number, l: Row) => a + (l.durationMin || 0), 0), 0);
        const avg = weightedAvg(user!.id, courseId);
        const doneMin = modules.reduce((s, m) => s + m.lessons.filter((l: Row) => lessonState(user!.id, l.id)?.completed).reduce((a: number, l: Row) => a + (l.durationMin || 0), 0), 0);
        return (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Stat icon="clock" label="Carga do curso" value={`${Math.floor(totalMin / 60)}h${totalMin % 60 ? ` ${totalMin % 60}min` : ""}`} sub={`${p.total} aulas · ${modules.length} módulos`} />
            <Stat icon="playc" label="Horas assistidas" value={`${Math.floor(doneMin / 60)}h${doneMin % 60 ? ` ${doneMin % 60}m` : ""}`} tone="amber" sub={`${p.done}/${p.total} aulas concluídas`} />
            <Stat icon="chart" label="Progresso" value={`${p.percent}%`} sub="registrado no SIA" />
            <Stat icon="target" label="Média geral" value={avg.count ? `${avg.avg}` : "—"} sub={avg.count ? `${avg.count} nota(s) lançada(s)` : "sem notas ainda"} tone="amber" />
          </div>
        );
      })()}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1"><Bar v={p.percent} h={9} /></div>
          <span className="font-display font-bold text-[18px] text-cy-300 tnum">{p.percent}%</span>
        </div>
        <div className="font-mono text-[10.5px] text-dim mt-2">{p.done} de {p.total} aulas concluídas · progresso registrado automaticamente no SIA</div>
      </Card>
      <div className="space-y-5">
        {modules.map((m, mi) => (
          <Card key={m.id} className="overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-line bg-cy-900/30">
              <div className="flex items-center gap-3.5">
                <span className="font-display font-bold text-[18px] text-cy-600">{String(mi + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display font-semibold text-[15px] text-mist">{m.title}</h3>
                  <div className="font-mono text-[10px] text-dim">{m.done}/{m.total} aulas · {(() => { const mm = m.lessons.reduce((a: number, l: Row) => a + (l.durationMin || 0), 0); return `${Math.floor(mm / 60)}h${mm % 60 ? ` ${mm % 60}m` : ""}`; })()} · {m.percent}%</div>
                </div>
              </div>
              <div className="w-24 hidden sm:block"><Bar v={m.percent} /></div>
            </div>
            {m.lessons.map((l: Row, li: number) => {
              const st = lessonState(user!.id, l.id);
              const done = st?.completed;
              if (!l.published) return (
                <div key={l.id} className="flex items-center gap-3.5 px-5 py-3 border-b border-line/40 opacity-45">
                  <I n="lock" s={15} c="text-dim" /><span className="text-[13px] text-dim flex-1">{l.title} <span className="font-mono text-[10px]">(não publicada)</span></span>
                </div>
              );
              return (
                <a key={l.id} href={`#/aluno/aula/${l.id}`} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-line/40 last:border-0 hover:bg-cy-500/5 transition-colors group">
                  <span className={`w-7 h-7 rounded-full grid place-items-center border shrink-0 transition-all ${done ? "bg-cy-500/15 border-cy-500 text-cy-300" : "border-line text-dim group-hover:border-cy-600"}`}>
                    {done ? <I n="check" s={13} /> : <span className="font-mono text-[10px]">{li + 1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13.5px] ${done ? "text-fog" : "text-mist"}`}>{l.title}</div>
                    <div className="font-mono text-[10px] text-dim mt-0.5">{l.durationMin} min · {where("lesson_materials", (mt) => mt.lessonId === l.id).length} materiais {st && !done ? `· ${st.percent}% assistido` : ""}</div>
                  </div>
                  <I n="playc" s={18} c={done ? "text-cy-600" : "text-cy-400"} />
                </a>
              );
            })}
          </Card>
        ))}
        {(activities.length > 0 || assessments.length > 0 || projects.length > 0) && (
          <Card className="p-5">
            <h3 className="font-display font-semibold text-[15px] text-cy-300 mb-4 flex items-center gap-2"><I n="target" s={16} /> Avaliações e entregas deste curso</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {activities.map((a) => <DeliverableRow key={a.id} item={a} kind="activity" studentId={user!.id} />)}
              {assessments.map((a) => <DeliverableRow key={a.id} item={a} kind="assessment" studentId={user!.id} />)}
              {projects.map((pr) => {
                const s = one("submissions", (x) => x.projectId === pr.id && x.studentId === user!.id);
                return (
                  <a key={pr.id} href="#/aluno/projetos" className="cy-card p-4 hover:border-ember/60 transition-colors">
                    <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-ember">projeto</span>{s ? <Badge s={s.status} /> : <Badge s="draft" />}</div>
                    <div className="text-[13.5px] text-mist font-semibold mt-2">{pr.title}</div>
                    <div className="text-[11.5px] text-dim mt-1">{s ? `enviado em ${fmtDate(s.submittedAt)}` : "entrega pendente"}</div>
                  </a>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function DeliverableRow({ item, kind, studentId }: { item: Row; kind: string; studentId: string }) {
  const at = where("attempts", (t) => t.itemId === item.id && t.studentId === studentId).sort((a, b) => b.submittedAt?.localeCompare(a.submittedAt) || 0)[0];
  return (
    <a href={`#/aluno/runner/${kind}/${item.id}`} className="cy-card p-4 hover:border-cy-500 transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-cy-500">{kind === "activity" ? "atividade" : item.type || "avaliação"}</span>
        {at ? <Badge s={at.status} /> : <Badge s="draft" />}
      </div>
      <div className="text-[13.5px] text-mist font-semibold mt-2">{item.title}</div>
      <div className="text-[11.5px] text-dim mt-1">{at && at.score != null ? `nota ${at.score}/${at.max}` : at ? "aguardando correção" : `${item.questions?.length || 0} questões · não realizada`}</div>
    </a>
  );
}

/* ================= LESSON PLAYER ================= */
function LessonPlayer({ lessonId }: { lessonId: string }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const lesson = find("lessons", lessonId);
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const raf = useRef<any>(null);
  useEffect(() => {
    if (!lesson) return;
    const st = lessonState(user!.id, lesson.id);
    setPct(st?.percent || 0);
    return () => clearInterval(raf.current);
  }, [lessonId]);
  if (!lesson) return <Empty icon="search" title="Aula não encontrada" />;
  if (!guardEnrolled(user!.id, lesson.courseId)) return <Empty icon="lock" title="Acesso negado pelo SIA" desc="Você não possui matrícula ativa neste curso." />;
  const tree = courseTree(lesson.courseId)!;
  const flat = tree.modules.flatMap((m) => m.lessons).filter((l: Row) => l.published);
  const idx = flat.findIndex((l: Row) => l.id === lesson.id);
  const prev = flat[idx - 1], next = flat[idx + 1];
  const materials = where("lesson_materials", (m) => m.lessonId === lesson.id);
  const isYT = lesson.videoUrl && /(youtube|youtu\.be|vimeo)/.test(lesson.videoUrl);
  const isMP4 = lesson.videoUrl && /\.mp4($|\?)/.test(lesson.videoUrl);
  const isUploaded = lesson.videoUrl && lesson.videoUrl.startsWith("data:video");

  const startSim = () => {
    if (playing) return;
    setPlaying(true);
    markLesson(user!.id, lesson, Math.max(pct, 5));
    const SIM_SECONDS = 16;
    const t0 = Date.now() - (pct / 100) * SIM_SECONDS * 1000;
    raf.current = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / (SIM_SECONDS * 1000)) * 100));
      setPct(p);
      markLesson(user!.id, lesson, p);
      if (p >= 100) { clearInterval(raf.current); setPlaying(false); toast("Aula concluída! Progresso registrado no SIA.", "ok"); refresh(); }
    }, 400);
  };
  const complete = () => { setPct(100); markLesson(user!.id, lesson, 100, true); toast("Aula concluída! Progresso registrado no SIA.", "ok"); refresh(); };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <a href={`#/aluno/avacurso/${lesson.courseId}`} className="text-fog hover:text-cy-300"><I n="chevL" s={20} /></a>
        <div className="flex-1 min-w-0">
          <div className="cy-chip text-cy-500">MÓDULO {tree.modules.findIndex((m) => m.id === lesson.moduleId) + 1} · AULA {idx + 1}/{flat.length}</div>
          <h1 className="display-xl text-[20px] md:text-[26px] text-mist mt-0.5 truncate">{lesson.title}</h1>
        </div>
        <Badge s={pct >= 100 ? "COMPLETED" : "ACTIVE"} />
      </div>
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <div>
          <div className="rounded-xl overflow-hidden border border-line bg-[#020C12] aspect-video relative group">
            {isYT ? (
              <iframe title={lesson.title} className="w-full h-full" src={lesson.videoUrl.replace("watch?v=", "embed/")} allowFullScreen />
            ) : (isMP4 || isUploaded) ? (
              <video className="w-full h-full" src={lesson.videoUrl} controls onTimeUpdate={(e) => {
                const v = e.target as HTMLVideoElement;
                if (v.duration) { const p = Math.round((v.currentTime / v.duration) * 100); setPct(p); markLesson(user!.id, lesson, p); }
              }} onEnded={() => { setPct(100); markLesson(user!.id, lesson, 100, true); toast("Aula concluída!", "ok"); }} />
            ) : (
              <div className="w-full h-full grid place-items-center relative">
                <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(600px 300px at 50% 120%, rgba(3,166,166,.25), transparent)" }} />
                {playing ? (
                  <div className="text-center w-full px-10">
                    <div className="font-mono text-[12px] text-cy-300 mb-3 flex items-center justify-center gap-2"><span className="w-2 h-2 rounded-full bg-ember animate-pulse" /> transmitindo videoaula…</div>
                    <Bar v={pct} h={8} />
                    <div className="font-display font-bold text-[22px] text-mist mt-3 tnum">{pct}%</div>
                  </div>
                ) : (
                  <button onClick={startSim} className="relative text-center group/play">
                    <span className="w-20 h-20 rounded-full border-2 border-cy-500 bg-cy-500/10 grid place-items-center text-cy-300 mx-auto transition-all group-hover/play:scale-110 group-hover/play:bg-cy-500/25 group-hover/play:shadow-[0_0_50px_rgba(3,166,166,.4)]">
                      <I n="play" s={30} />
                    </span>
                    <span className="block font-display text-[14px] text-mist mt-4">{pct > 0 ? `Retomar de ${pct}%` : "Assistir videoaula"}</span>
                    <span className="block font-mono text-[11px] text-dim mt-1">{lesson.durationMin} min · player integrado ao progresso do SIA</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Btn v={pct >= 100 ? "g" : "e"} onClick={complete} disabled={pct >= 100}>{pct >= 100 ? <><I n="checkc" s={15} /> Concluída</> : "Marcar como concluída"}</Btn>
            {prev && <a href={`#/aluno/aula/${prev.id}`} className="cy-btn cy-btn-x px-3.5 py-2 text-[12px]"><I n="chevL" s={14} /> Anterior</a>}
            {next && <a href={`#/aluno/aula/${next.id}`} className="cy-btn cy-btn-g px-3.5 py-2 text-[12px]">Próxima aula <I n="chevR" s={14} /></a>}
            {!next && <a href={`#/aluno/avacurso/${lesson.courseId}`} className="cy-btn cy-btn-g px-3.5 py-2 text-[12px]">Voltar ao curso</a>}
          </div>
          <LessonTabs lesson={lesson} user={user!} />
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="file" s={16} c="text-cy-400" /> Materiais da aula</h3>
            {materials.length === 0 && <p className="text-[12.5px] text-dim">Sem materiais anexados.</p>}
            <div className="space-y-2">
              {materials.map((m) => (
                m.kind === "link" ? (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 cy-card p-3 hover:border-cy-500 transition-colors">
                    <I n="ext" s={16} c="text-cy-400" />
                    <div className="flex-1 min-w-0"><div className="text-[12.5px] text-mist truncate">{m.name}</div><div className="font-mono text-[10px] text-dim uppercase">{m.fileType} · link externo</div></div>
                  </a>
                ) : (
                  <a key={m.id} href={m.dataUrl || "#"} download={m.name} className="flex items-center gap-3 cy-card p-3 hover:border-cy-500 transition-colors">
                    <I n="download" s={16} c="text-ember" />
                    <div className="flex-1 min-w-0"><div className="text-[12.5px] text-mist truncate">{m.name}</div><div className="font-mono text-[10px] text-dim uppercase">{m.fileType} · {m.size}</div></div>
                  </a>
                )
              ))}
            </div>
            <p className="font-mono text-[10px] text-dim mt-3 flex items-center gap-1.5"><I n="lock" s={11} /> Acesso controlado pelo SIA (matrícula ativa)</p>
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-semibold text-[14px] text-mist mb-3">Trilha do curso</h3>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
              {flat.map((l: Row, i: number) => {
                const st = lessonState(user!.id, l.id);
                return (
                  <a key={l.id} href={`#/aluno/aula/${l.id}`} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] transition-colors ${l.id === lesson.id ? "bg-cy-500/15 text-cy-300" : st?.completed ? "text-fog" : "text-mist hover:bg-cy-500/5"}`}>
                    {st?.completed ? <I n="checkc" s={14} c="text-cy-400" /> : <span className="font-mono text-[10px] text-dim w-[14px]">{i + 1}</span>}
                    <span className="truncate">{l.title}</span>
                  </a>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= ABAS DA AULA (sobre · anotações · fórum) ================= */
function LessonTabs({ lesson, user }: { lesson: Row; user: Row }) {
  const { refresh } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<"sobre" | "notas" | "forum">("sobre");
  const note = lessonNote(user.id, lesson.id);
  const [text, setText] = useState(note?.text || "");
  const [savedAt, setSavedAt] = useState(note?.updatedAt || "");
  const [newPost, setNewPost] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  useEffect(() => { const n = lessonNote(user.id, lesson.id); setText(n?.text || ""); setSavedAt(n?.updatedAt || ""); }, [lesson.id]);
  const posts = forumPosts(lesson.courseId);

  const saveNote = () => {
    saveLessonNote(user.id, lesson.id, lesson.courseId, text);
    setSavedAt(new Date().toISOString());
    toast("Anotação salva — ela é pessoal e sincronizada com o SIA.", "ok");
    refresh();
  };
  const post = (parentId: string | null, body: string, clear: () => void) => {
    try { createForumPost(user, lesson.courseId, parentId, body); clear(); refresh(); }
    catch (e: any) { toast(e.message, "err"); }
  };
  const del = (id: string) => { try { deleteForumPost(user, id); refresh(); } catch (e: any) { toast(e.message, "err"); } };

  return (
    <Card className="mt-5 overflow-hidden">
      <div className="flex border-b border-line">
        {([["sobre", "Sobre a aula", "book"], ["notas", "Minhas anotações", "pen"], ["forum", "Fórum da turma", "msg"]] as [string, string, string][]).map(([k, l, ic]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-3 font-display text-[12px] tracking-wider uppercase flex items-center gap-2 border-b-2 -mb-px transition-colors ${tab === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent hover:text-mist"}`}>
            <I n={ic} s={14} /> {l}
          </button>
        ))}
      </div>
      <div className="p-5">
        {tab === "sobre" && <p className="text-[13.5px] text-fog leading-relaxed">{lesson.description}</p>}
        {tab === "notas" && (
          <div>
            <TArea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Suas anotações pessoais desta aula… (visíveis apenas para você)" />
            <div className="flex items-center justify-between mt-3">
              <span className="font-mono text-[10.5px] text-dim">{savedAt ? `salvo ${timeAgo(savedAt)}` : "nenhuma anotação ainda"} · +2 XP ao salvar pela primeira vez</span>
              <Btn v="p" sm onClick={saveNote}><I n="check" s={13} /> Salvar anotação</Btn>
            </div>
          </div>
        )}
        {tab === "forum" && (
          <div className="space-y-4">
            <div className="flex gap-2.5">
              <TIn value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Pergunte ou comente com a turma e o professor… (+5 XP)" onKeyDown={(e) => e.key === "Enter" && post(null, newPost, () => setNewPost(""))} />
              <Btn v="e" sm className="shrink-0 px-4" onClick={() => post(null, newPost, () => setNewPost(""))}>Postar</Btn>
            </div>
            {posts.length === 0 && <p className="text-[12.5px] text-dim text-center py-4">Seja o primeiro a abrir um tópico neste curso.</p>}
            {posts.map((p) => (
              <div key={p.id} className="cy-card p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={p.authorName} s={30} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-mist">{p.authorName}</span>
                    {p.authorRole === "teacher" && <span className="cy-badge b-amber ml-2">professor</span>}
                  </div>
                  <span className="font-mono text-[10px] text-dim">{timeAgo(p.at)}</span>
                  {p.authorId === user.id && <button className="text-dim hover:text-coral transition-colors" onClick={() => del(p.id)} title="Excluir"><I n="x" s={14} /></button>}
                </div>
                <p className="text-[13px] text-fog leading-relaxed mt-2.5 whitespace-pre-wrap">{p.body}</p>
                <div className="mt-3 space-y-2">
                  {p.replies.map((r: Row) => (
                    <div key={r.id} className="ml-6 pl-3 border-l-2 border-line py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-mist">{r.authorName}</span>
                        {r.authorRole === "teacher" && <span className="cy-badge b-amber">professor</span>}
                        <span className="font-mono text-[10px] text-dim">{timeAgo(r.at)}</span>
                        {r.authorId === user.id && <button className="text-dim hover:text-coral" onClick={() => del(r.id)}><I n="x" s={12} /></button>}
                      </div>
                      <p className="text-[12.5px] text-fog mt-1 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))}
                  {replyTo === p.id ? (
                    <div className="ml-6 flex gap-2">
                      <TIn autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Sua resposta…" onKeyDown={(e) => { if (e.key === "Enter") post(p.id, replyText, () => { setReplyText(""); setReplyTo(null); }); }} />
                      <Btn v="g" sm onClick={() => post(p.id, replyText, () => { setReplyText(""); setReplyTo(null); })}>Responder</Btn>
                    </div>
                  ) : (
                    <button className="ml-6 text-[11.5px] text-cy-300 hover:underline" onClick={() => setReplyTo(p.id)}>↩ responder</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ================= ATIVIDADES / AVALIAÇÕES (listas) ================= */
function Atividades() {
  const { user } = useApp();
  const cids = enrolledCourseIds(user!.id);
  const items = where("activities", (a) => cids.includes(a.courseId) && a.published);
  return (
    <div>
      <PageHead kicker="AVA · atividades" title="Atividades" desc="Exercícios e questionários com correção automática ou avaliação do professor." />
      <ListItems items={items} kind="activity" studentId={user!.id} emptyMsg="Nenhuma atividade publicada nos seus cursos." />
    </div>
  );
}
function Avaliacoes() {
  const { user } = useApp();
  const cids = enrolledCourseIds(user!.id);
  const items = where("assessments", (a) => cids.includes(a.courseId) && a.published);
  return (
    <div>
      <PageHead kicker="AVA · avaliações" title="Avaliações" desc="Provas, questionários e simulados. Objetivas corrigidas na hora; dissertativas pelo professor." />
      <ListItems items={items} kind="assessment" studentId={user!.id} emptyMsg="Nenhuma avaliação publicada nos seus cursos." />
    </div>
  );
}
function ListItems({ items, kind, studentId, emptyMsg }: { items: Row[]; kind: string; studentId: string; emptyMsg: string }) {
  return items.length === 0 ? <Empty icon="target" title="Nada por aqui" desc={emptyMsg} /> : (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((it) => {
        const at = where("attempts", (t) => t.itemId === it.id && t.studentId === studentId).sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))[0];
        const c = find("courses", it.courseId);
        return (
          <Card key={it.id} hover className="p-5">
            <div className="flex items-center justify-between">
              <Tag tone={kind === "activity" ? "amber" : "teal"}>{kind === "activity" ? it.kind : it.type}</Tag>
              {at ? <Badge s={at.status} /> : <span className="cy-badge b-mist">pendente</span>}
            </div>
            <h3 className="font-display font-semibold text-[15.5px] text-mist mt-3">{it.title}</h3>
            <p className="text-[12.5px] text-fog mt-1.5 leading-relaxed line-clamp-2">{it.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 font-mono text-[10.5px] text-dim">
              <span>{c?.title.slice(0, 30)}</span>
              <span>{it.questions?.length || 0} questões</span>
              <span>{it.durationMin ? `${it.durationMin} min` : "sem tempo limite"}</span>
              {it.attempts ? <span>{it.attempts} tentativa(s)</span> : null}
              {at?.score != null && <span className="text-cy-300">nota {at.score}/{at.max}</span>}
            </div>
            <a href={`#/aluno/runner/${kind}/${it.id}`} className="cy-btn cy-btn-p px-4 py-2 text-[12px] mt-4 inline-flex">
              {at ? (at.status === "review" ? "Ver envio" : "Refazer / revisar") : "Realizar agora"} <I n="arrowR" s={14} />
            </a>
          </Card>
        );
      })}
    </div>
  );
}

/* ================= RUNNER (realizar atividade/avaliação) ================= */
function Runner({ kind, itemId }: { kind: "activity" | "assessment"; itemId: string }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const tbl = kind === "activity" ? "activities" : "assessments";
  const item = find(tbl, itemId);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState<Row | null>(null);
  useEffect(() => {
    if (!started || !item?.durationMin) return;
    setLeft(item.durationMin * 60);
    const t = setInterval(() => setLeft((l) => {
      if (l <= 1) { clearInterval(t); submit(true); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [started]);
  if (!item) return <Empty icon="search" title="Item não encontrado" />;
  const attempts = where("attempts", (t) => t.itemId === itemId && t.studentId === user!.id);
  const last = attempts.sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))[0];

  const submit = (auto = false) => {
    try {
      const at = submitAttempt(kind, itemId, user!, answers);
      setDone(at); refresh();
      toast(auto ? "Tempo esgotado — envio registrado automaticamente." : at.status === "review" ? "Enviado! Questões dissertativas aguardam o professor." : "Corrigida automaticamente!", "ok");
    } catch (e: any) { toast(e.message, "err"); }
  };
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");

  if (done || (last && !started)) {
    const view = done || last;
    return (
      <div className="max-w-[800px]">
        <PageHead kicker={kind === "activity" ? "atividade" : "avaliação"} title={item.title} />
        <Card className="p-6 mb-5 flex flex-wrap items-center gap-5">
          <div className="w-14 h-14 rounded-xl grid place-items-center border border-cy-600 bg-cy-500/10 text-cy-300 font-display font-bold text-[16px] tnum">{view!.score != null ? `${Math.round((view!.score / view!.max) * 10)}/10` : "…"}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3"><h3 className="font-display font-semibold text-[16px] text-mist">Tentativa #{view!.n}</h3><Badge s={view!.status} /></div>
            <p className="text-[12.5px] text-fog mt-1">{view!.score != null ? `${view!.score} de ${view!.max} pontos · enviada em ${fmtDT(view!.submittedAt)}` : `Enviada em ${fmtDT(view!.submittedAt)} — aguardando correção das dissertativas`}{view!.gradedBy ? ` · corrigida por ${view!.gradedBy}` : ""}</p>
            {view!.feedback && <p className="text-[12.5px] text-cy-200 mt-2 cy-card p-3 border-cy-700">Feedback: {view!.feedback}</p>}
          </div>
          <div className="flex gap-2">
            {(!item.attempts || attempts.length < item.attempts) && <Btn v="g" onClick={() => { setDone(null); setStarted(true); setAnswers({}); }}>Nova tentativa</Btn>}
            <a href={kind === "activity" ? "#/aluno/atividades" : "#/aluno/avaliacoes"} className="cy-btn cy-btn-x px-4 py-2 text-[12px]">Voltar</a>
          </div>
        </Card>
        <div className="space-y-4">
          {(item.questions || []).map((q: Row, i: number) => {
            const a = view!.answers[q.qid];
            const ok = view!.detail?.[q.qid];
            return (
              <Card key={q.qid} className={`p-5 border-l-2 ${q.type === "essay" || q.type === "open" ? "border-l-ember" : ok ? "border-l-[#5ECF8B]" : "border-l-coral"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13.5px] text-mist font-semibold">{i + 1}. {q.prompt}</span>
                  {q.type !== "essay" && q.type !== "open" && <I n={ok ? "checkc" : "x"} s={17} c={ok ? "text-[#7BE0A2]" : "text-coral"} />}
                </div>
                {(q.type === "essay" || q.type === "open") ? (
                  <p className="text-[13px] text-fog mt-3 cy-card p-3 whitespace-pre-line">{a || "—"}</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    {q.options.map((op: string, oi: number) => {
                      const chosen = q.type === "multi" ? (a || []).includes(oi) : a === oi || (q.type === "tf" && String(a) === String(oi));
                      const correct = q.type === "multi" ? (q.correct || []).includes(oi) : q.correct === oi;
                      return <div key={oi} className={`text-[12.5px] px-3 py-2 rounded-lg border ${correct ? "border-[#5ECF8B]/50 text-[#BDEBC9]" : chosen ? "border-coral/50 text-[#F5C4BB]" : "border-line text-dim"}`}>{op}</div>;
                    })}
                  </div>
                )}
                {q.explanation && (q.type !== "essay" && q.type !== "open") && <p className="text-[11.5px] text-dim mt-2.5">Explicação: {q.explanation}</p>}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-[640px]">
        <PageHead kicker={kind === "activity" ? "atividade" : "avaliação"} title={item.title} desc={item.description} />
        <Card className="p-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[["file", `${item.questions?.length || 0} questões`], ["clock", item.durationMin ? `${item.durationMin} min` : "livre"], ["star", `${item.maxScore || item.questions?.reduce((s: number, q: Row) => s + (q.points || 1), 0)} pts`], ["refresh", `${item.attempts || "∞"} tentativa(s)`]].map(([ic, t]) => (
              <div key={t} className="cy-card p-3.5"><I n={ic} s={18} c="text-cy-400 mx-auto" /><div className="font-mono text-[11px] text-fog mt-2">{t}</div></div>
            ))}
          </div>
          <p className="text-[12.5px] text-fog mt-5 leading-relaxed">Objetivas são corrigidas automaticamente ao enviar. Questões dissertativas são corrigidas pelo professor e a nota é atualizada no seu boletim.</p>
          <div className="flex gap-3 mt-6">
            <Btn v="e" className="flex-1 py-3" onClick={() => setStarted(true)}>Iniciar agora</Btn>
            <a href={kind === "activity" ? "#/aluno/atividades" : "#/aluno/avaliacoes"} className="cy-btn cy-btn-x px-4 py-2.5 text-[12.5px]">Voltar</a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[800px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="cy-chip text-cy-500">{kind === "activity" ? "ATIVIDADE EM ANDAMENTO" : "AVALIAÇÃO EM ANDAMENTO"}</div>
          <h1 className="display-xl text-[20px] text-mist mt-1">{item.title}</h1>
        </div>
        {item.durationMin ? <span className="font-mono text-[16px] text-ember tnum cy-card px-4 py-2 border-ember/40">{mm}:{ss}</span> : null}
      </div>
      <div className="space-y-4">
        {(item.questions || []).map((q: Row, i: number) => (
          <Card key={q.qid} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13.5px] text-mist font-semibold">{i + 1}. {q.prompt} <span className="font-mono text-[10.5px] text-dim">({q.points} pt{q.points > 1 ? "s" : ""})</span></span>
              <Tag tone="mist">{q.type === "single" ? "múltipla escolha" : q.type === "multi" ? "múltiplas respostas" : q.type === "tf" ? "V ou F" : "dissertativa"}</Tag>
            </div>
            <div className="mt-4 space-y-2">
              {(q.type === "essay" || q.type === "open") ? (
                <TArea rows={6} placeholder="Desenvolva sua resposta…" value={answers[q.qid] || ""} onChange={(e) => setAnswers({ ...answers, [q.qid]: e.target.value })} />
              ) : q.options.map((op: string, oi: number) => {
                const multi = q.type === "multi";
                const sel = multi ? (answers[q.qid] || []).includes(oi) : answers[q.qid] === oi;
                return (
                  <button key={oi} onClick={() => {
                    if (multi) {
                      const cur = answers[q.qid] || [];
                      setAnswers({ ...answers, [q.qid]: sel ? cur.filter((x: number) => x !== oi) : [...cur, oi] });
                    } else setAnswers({ ...answers, [q.qid]: oi });
                  }} className={`w-full text-left px-4 py-3 rounded-lg border text-[13px] transition-all flex items-center gap-3 ${sel ? "border-cy-500 bg-cy-500/10 text-cy-200" : "border-line text-fog hover:border-cy-700"}`}>
                    <span className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-${multi ? "md" : "full"} border grid place-items-center shrink-0 ${sel ? "border-cy-400 bg-cy-500" : "border-dim"}`}>{sel && <I n="check" s={11} c="text-ink" />}</span>
                    {op}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      <div className="sticky bottom-4 mt-6 cy-card p-4 flex items-center justify-between gap-4 shadow-2xl">
        <span className="text-[12.5px] text-fog">{Object.keys(answers).filter((k) => answers[k] !== "" && answers[k] != null && (!Array.isArray(answers[k]) || answers[k].length)).length}/{item.questions?.length || 0} respondidas</span>
        <Btn v="e" onClick={() => submit()}>Enviar respostas <I n="send" s={15} /></Btn>
      </div>
    </div>
  );
}

/* ================= NOTAS (boletim) ================= */
function Notas() {
  const { user } = useApp();
  const cids = enrolledCourseIds(user!.id);
  const pass = getSettings().passScore || 70;
  return (
    <div>
      <PageHead kicker="SIA · boletim" title="Notas e médias" desc={`Médias ponderadas por tipo de entrega. Média mínima para conclusão: ${pass}%.`} />
      <div className="space-y-6">
        {cids.length === 0 && <Empty icon="chart" title="Sem cursos ativos" desc="Suas notas aparecem aqui após as avaliações." />}
        {cids.map((cid) => {
          const c = find("courses", cid)!;
          const gs = where("grades", (g) => g.studentId === user!.id && g.courseId === cid);
          const { avg, count } = weightedAvg(user!.id, cid);
          return (
            <Card key={cid} className="overflow-hidden">
              <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cy-900/30">
                <h3 className="font-display font-semibold text-[15px] text-mist">{c.title}</h3>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-dim">média ponderada</span>
                  <span className={`font-display font-bold text-[20px] tnum ${avg >= pass ? "text-[#7BE0A2]" : count ? "text-ember" : "text-dim"}`}>{count ? (avg / 10).toFixed(1) : "—"}</span>
                  <Badge s={avg >= pass ? "approved" : count ? "pending" : "draft"} />
                </div>
              </div>
              {gs.length === 0 ? <p className="p-5 text-[13px] text-dim">Nenhuma nota lançada ainda.</p> : (
                <div className="overflow-x-auto">
                  <table className="cy-tbl">
                    <thead><tr><th>Entrega</th><th>Tipo</th><th>Nota</th><th>Peso</th><th>%</th><th>Situação</th><th>Feedback</th></tr></thead>
                    <tbody>
                      {gs.map((g) => (
                        <tr key={g.id}>
                          <td className="text-mist font-semibold">{g.refTitle}</td>
                          <td><Tag tone={g.kind === "project" ? "amber" : g.kind === "assessment" ? "teal" : "mist"}>{g.kind === "activity" ? "atividade" : g.kind === "assessment" ? "avaliação" : "projeto"}</Tag></td>
                          <td className="font-mono tnum text-cy-300">{g.score}/{g.max}</td>
                          <td className="font-mono">{g.weight}</td>
                          <td className="font-mono tnum">{g.max ? Math.round((g.score / g.max) * 100) : 0}%</td>
                          <td><Badge s={g.status} /></td>
                          <td className="max-w-[220px] truncate text-dim">{g.feedback || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ================= PROJETOS ================= */
function Projetos() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const cids = enrolledCourseIds(user!.id);
  const projects = where("projects", (p) => cids.includes(p.courseId));
  const [sel, setSel] = useState<Row | null>(null);
  const [f, setF] = useState({ url: "", github: "", description: "" });
  const submit = () => {
    if (!sel) return;
    if (!f.url && !f.github && !f.description) { toast("Informe ao menos uma URL ou a descrição da entrega.", "err"); return; }
    submitSubmission(user!, sel, f);
    setSel(null); setF({ url: "", github: "", description: "" });
    refresh();
    toast("Projeto enviado ao professor!", "ok");
  };
  return (
    <div>
      <PageHead kicker="AVA · projetos práticos" title="Projetos" desc="Entregue repositório, URL publicada e documentação. O professor avalia, comenta e aprova." />
      {projects.length === 0 ? <Empty icon="git" title="Nenhum projeto" desc="Os cursos publicam projetos práticos ao longo da trilha." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const s = one("submissions", (x) => x.projectId === p.id && x.studentId === user!.id);
            const c = find("courses", p.courseId);
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-center justify-between"><Tag tone="amber">PROJETO</Tag>{s ? <Badge s={s.status} /> : <span className="cy-badge b-mist">não enviado</span>}</div>
                <h3 className="font-display font-semibold text-[15.5px] text-mist mt-3">{p.title}</h3>
                <p className="text-[12.5px] text-fog mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>
                <div className="font-mono text-[10.5px] text-dim mt-2">{c?.title.slice(0, 34)} · nota máxima {p.maxScore}</div>
                {s && (
                  <div className="mt-3 space-y-2">
                    {s.url && <div className="text-[12px] text-fog flex items-center gap-2"><I n="ext" s={13} c="text-cy-400" />{s.url}</div>}
                    {s.github && <div className="text-[12px] text-fog flex items-center gap-2"><I n="git" s={13} c="text-cy-400" />{s.github}</div>}
                    {s.score != null && <div className="font-mono text-[12px] text-cy-300">nota {s.score}/{p.maxScore} · avaliador: {s.reviewedBy}</div>}
                    {(s.feedback || []).slice(-2).map((fb: Row, i: number) => (
                      <div key={i} className="cy-card p-3 border-cy-700 text-[12px] text-fog"><strong className="text-cy-300">{fb.by}:</strong> {fb.text}</div>
                    ))}
                  </div>
                )}
                <Btn v={s ? "g" : "e"} className="mt-4" onClick={() => { setSel(p); if (s) setF({ url: s.url || "", github: s.github || "", description: s.description || "" }); }}>
                  {s ? (s.status === "changes_requested" ? "Reenviar com ajustes" : "Ver / editar entrega") : "Enviar entrega"} <I n="arrowR" s={14} />
                </Btn>
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={`Entrega — ${sel?.title || ""}`} w={620}>
        <div className="space-y-4">
          <Field label="URL publicada"><TIn value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://meu-projeto.vercel.app" /></Field>
          <Field label="Repositório (GitHub)"><TIn value={f.github} onChange={(e) => setF({ ...f, github: e.target.value })} placeholder="https://github.com/usuario/repo" /></Field>
          <Field label="Descrição da entrega" req><TArea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Decisões técnicas, como rodar, o que foi implementado…" /></Field>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setSel(null)}>Cancelar</Btn><Btn v="e" onClick={submit}><I n="upload" s={15} /> Enviar ao professor</Btn></div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= HISTÓRICO ================= */
function Historico() {
  const { user } = useApp();
  const ens = myEnrollments(user!.id);
  const pass = getSettings().passScore || 70;
  return (
    <div>
      <PageHead kicker="SIA · histórico acadêmico" title="Histórico" desc="Registro oficial baseado nos dados reais do SIA — imprimível."
        right={<Btn v="g" onClick={() => window.print()}><I n="print" s={15} /> Imprimir</Btn>} />
      <div className="print-area space-y-6">
        <Card className="p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <div className="font-display font-bold text-[17px] text-mist">{user!.name}</div>
              <div className="font-mono text-[11.5px] text-dim mt-1">{user!.email}{user!.cpf ? ` · CPF ${user!.cpf}` : ""}</div>
            </div>
            <div className="text-right font-mono text-[11px] text-dim">emitido pelo SIA em {fmtDT(new Date().toISOString())}</div>
          </div>
        </Card>
        {ens.length === 0 && <Empty icon="book" title="Histórico vazio" desc="As conclusões e notas registradas no SIA compõem seu histórico." />}
        {ens.map((e) => {
          const c = find("courses", e.courseId);
          const p = courseProgress(user!.id, e.courseId);
          const { avg, count } = weightedAvg(user!.id, e.courseId);
          const gs = where("grades", (g) => g.studentId === user!.id && g.courseId === e.courseId);
          const cert = one("certificates", (x) => x.enrollmentId === e.id);
          return (
            <Card key={e.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-[16px] text-mist">{c?.title}</h3>
                  <div className="font-mono text-[11px] text-dim mt-1">matrícula {e.number} · {c?.hours}h · {c?.level} · início {fmtDate(e.startDate)}{e.completedAt ? ` · conclusão ${fmtDate(e.completedAt)}` : ""}</div>
                </div>
                <div className="flex items-center gap-3"><Badge s={e.status} />{cert && <span className="cy-badge b-amber">{cert.code}</span>}</div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-5">
                <div className="cy-card p-3.5"><div className="font-mono text-[10px] uppercase text-dim">progresso</div><div className="font-display font-bold text-[19px] text-cy-300 tnum mt-1">{p.percent}%</div><Bar v={p.percent} /></div>
                <div className="cy-card p-3.5"><div className="font-mono text-[10px] uppercase text-dim">média final</div><div className={`font-display font-bold text-[19px] tnum mt-1 ${avg >= pass ? "text-[#7BE0A2]" : "text-ember"}`}>{count ? (avg / 10).toFixed(1) : "—"}</div><div className="font-mono text-[10px] text-dim">mínimo {pass / 10}</div></div>
                <div className="cy-card p-3.5"><div className="font-mono text-[10px] uppercase text-dim">entregas avaliadas</div><div className="font-display font-bold text-[19px] text-mist tnum mt-1">{gs.length}</div><div className="font-mono text-[10px] text-dim">notas no boletim</div></div>
              </div>
              {p.modules.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="cy-tbl">
                    <thead><tr><th>Módulo</th><th>Aulas</th><th>Status</th></tr></thead>
                    <tbody>{p.modules.map((m: Row) => (
                      <tr key={m.id}><td className="text-mist">{m.title}</td><td className="font-mono">{m.done}/{m.total}</td><td><Badge s={m.percent >= 100 ? "COMPLETED" : m.percent > 0 ? "ACTIVE" : "PLANNED"} /></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ================= DOCUMENTOS ================= */
function Documentos() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const accepts = where("terms_acceptances", (t) => t.userId === user!.id);
  const consents = where("consents", (t) => t.userId === user!.id);
  const ens = myEnrollments(user!.id).filter((e) => ["ACTIVE", "COMPLETED"].includes(e.status));
  const docs = myDocuments(user!.id).filter((d) => d.kind !== "CARTEIRINHA");
  const cards = myDocuments(user!.id).filter((d) => d.kind === "CARTEIRINHA");
  const [decl, setDecl] = useState<Row | null>(null);
  const [up, setUp] = useState(false);
  const [nf, setNf] = useState({ kind: "id_doc", enrollmentId: ens[0]?.id || "", dataUrl: "", fileName: "" });
  const [viewDoc, setViewDoc] = useState<Row | null>(null);
  const [flip, setFlip] = useState(false);

  const submitDoc = () => {
    try {
      const d = uploadDocument(user!, nf);
      setUp(false);
      setNf({ kind: "id_doc", enrollmentId: ens[0]?.id || "", dataUrl: "", fileName: "" });
      toast(`Documento enviado (v${d.version}) — aguardando validação da secretaria.`, "ok");
      refresh();
    } catch (e: any) { toast(e.message, "err"); }
  };
  const renew = (d: Row) => { setNf({ kind: d.kind, enrollmentId: d.enrollmentId || ens[0]?.id || "", dataUrl: "", fileName: "" }); setUp(true); };
  const issueCard = (enId: string) => {
    try { const c = issueStudentCard(user!, enId); toast(`Carteirinha ${c.cardNumber} emitida!`, "ok"); refresh(); }
    catch (e: any) { toast(e.message, "err"); }
  };

  return (
    <div>
      <PageHead kicker="SIA · documentos" title="Central de documentos" desc="Foto de matrícula, carteirinha digital, envio/renovação de documentos com validação da secretaria, declarações e registros LGPD."
        right={<Btn v="e" onClick={() => setUp(true)}><I n="cam" s={15} /> Enviar / renovar documento</Btn>} />

      {/* CARTEIRINHA */}
      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-6 items-start mb-8">
        <div>
          <h2 className="font-display font-semibold text-[15px] text-cy-300 flex items-center gap-2 mb-3"><I n="idcard" s={17} /> Carteirinha de estudante</h2>
          {cards.length === 0 ? (
            <Card className="p-6">
              <p className="text-[13px] text-fog leading-relaxed">Emita sua carteirinha digital com foto, QR Code de validação e validade de 12 meses. Necessário: <strong className="text-mist">foto 3x4 enviada</strong> (no perfil) e matrícula ativa.</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {ens.filter((e) => e.status === "ACTIVE").map((e) => (
                  <Btn key={e.id} v="p" sm onClick={() => issueCard(e.id)}><I n="idcard" s={14} /> Emitir para {find("courses", e.courseId)?.title.slice(0, 24)}</Btn>
                ))}
                {ens.filter((e) => e.status === "ACTIVE").length === 0 && <span className="text-[12px] text-dim">Nenhuma matrícula ativa disponível.</span>}
              </div>
              {!user!.photo && <p className="font-mono text-[10.5px] text-ember mt-3">⚠ Envie sua foto 3x4 em “Meu perfil” antes de emitir.</p>}
            </Card>
          ) : (
            <div>
              <div className="relative h-[220px] max-w-[430px] cursor-pointer" style={{ perspective: "1200px" }} onClick={() => setFlip(!flip)} title="Clique para virar">
                <div className="absolute inset-0 transition-transform duration-700" style={{ transformStyle: "preserve-3d", transform: flip ? "rotateY(180deg)" : "none" }}>
                  {/* frente */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden border border-cy-600/60 p-5 flex gap-4" style={{ backfaceVisibility: "hidden", background: "linear-gradient(135deg,#05202B,#0A3E41 55%,#0E5F5F)" }}>
                    <div className="absolute -right-10 -top-16 w-48 h-48 rounded-full border border-cy-500/20" />
                    <div className="absolute -right-2 -top-8 w-28 h-28 rounded-full border border-cy-500/30" />
                    <div className="flex flex-col">
                      <div className="cy-chip text-cy-300">CYBER ACADEMY · {new Date().getFullYear()}</div>
                      <div className="font-display font-bold text-[13px] text-mist mt-0.5">CARTEIRA DE ESTUDANTE</div>
                      <div className="mt-auto">
                        <div className="text-[15px] font-display font-bold text-mist leading-tight">{user!.name}</div>
                        <div className="font-mono text-[10px] text-cy-300 mt-1">{find("courses", cards[0].enrollmentId && find("enrollments", cards[0].enrollmentId)?.courseId)?.title}</div>
                        <div className="font-mono text-[9.5px] text-dim mt-1">matrícula {find("enrollments", cards[0].enrollmentId)?.number}</div>
                      </div>
                    </div>
                    <div className="ml-auto flex flex-col items-end justify-between">
                      {user!.photo ? <img src={user!.photo} alt="foto" className="w-[86px] h-[104px] object-cover rounded-lg border border-cy-500/50" /> : <span className="w-[86px] h-[104px] rounded-lg border border-line grid place-items-center text-dim"><I n="cam" s={22} /></span>}
                      <div className="text-right">
                        <div className="font-mono text-[10px] text-cy-300">{cards[0].cardNumber}</div>
                        <div className="font-mono text-[9px] text-dim">válida até {fmtDate(cards[0].validUntil)}</div>
                      </div>
                    </div>
                  </div>
                  {/* verso */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden border border-cy-600/60 p-5 flex items-center justify-between gap-5" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg,#0A3E41,#05202B 60%,#031019)" }}>
                    <div>
                      <div className="cy-chip text-cy-400 mb-2">VALIDAÇÃO DIGITAL</div>
                      <p className="text-[11px] text-fog leading-relaxed max-w-[210px]">Documento digital emitido pelo SIA. Autenticidade verificável por QR Code ou código único.</p>
                      <div className="font-mono text-[10px] text-dim mt-3">emissão {fmtDate(cards[0].createdAt)}</div>
                      <div className="font-mono text-[10px] text-dim">assinado digitalmente · SIA v2.6</div>
                    </div>
                    <div className="bg-[#EAFBF8] p-2.5 rounded-lg"><QRMatrix code={cards[0].cardNumber} size={110} /></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Btn v="g" sm onClick={() => setViewDoc(cards[0])}><I n="eye" s={14} /> Ampliar</Btn>
                <Btn v="x" sm onClick={() => { setFlip(false); setTimeout(() => window.print(), 150); }}><I n="print" s={14} /> Imprimir</Btn>
                <span className="font-mono text-[10.5px] text-dim self-center ml-1">clique no cartão para virar · versão {cards.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* FOTO 3x4 */}
        <div>
          <h2 className="font-display font-semibold text-[15px] text-cy-300 flex items-center gap-2 mb-3"><I n="cam" s={17} /> Foto de matrícula (3x4)</h2>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              {user!.photo ? <img src={user!.photo} alt="foto" className="w-[76px] h-[92px] object-cover rounded-lg border border-cy-600" /> : <span className="w-[76px] h-[92px] rounded-lg border border-dashed border-cy-700 grid place-items-center text-dim"><I n="cam" s={24} /></span>}
              <div className="flex-1">
                <p className="text-[12.5px] text-fog leading-relaxed">{user!.photo ? "Foto cadastrada — usada na carteirinha e nas declarações." : "Sem foto. Envie uma foto 3x4 para emitir sua carteirinha."}</p>
                <div className="mt-3 max-w-[260px]"><FileDrop max={420} value={user!.photo} label="Enviar foto 3x4" onChange={(d) => { updateProfile(user!, { photo: d }); toast("Foto atualizada no SIA.", "ok"); refresh(); }} /></div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* DOCUMENTOS ENVIADOS */}
      <h2 className="font-display font-semibold text-[15px] text-cy-300 flex items-center gap-2 mb-3"><I n="file" s={16} /> Meus documentos ({docs.length})</h2>
      {docs.length === 0 ? (
        <Empty icon="file" title="Nenhum documento enviado" desc="Envie identidade, comprovante de residência ou outros documentos — a secretaria valida cada versão e você é notificado.">
          <Btn v="e" onClick={() => setUp(true)}><I n="cam" s={14} /> Enviar documento</Btn>
        </Empty>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {docs.map((d) => (
            <Card key={d.id} className="p-4 flex items-center gap-3.5">
              <button onClick={() => setViewDoc(d)} className="w-[54px] h-[54px] rounded-lg overflow-hidden border border-line shrink-0 hover:border-cy-500 transition-colors">
                <img src={d.dataUrl} alt={d.fileName} className="w-full h-full object-cover" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-mist truncate">{DOC_KINDS[d.kind] || d.kind} <span className="font-mono text-[10px] text-dim">v{d.version}</span></div>
                <div className="font-mono text-[10px] text-dim truncate mt-0.5">{d.fileName} · {fmtDate(d.createdAt)}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge s={d.status} />
                  {d.status === "REJECTED" && d.reviewNote && <span className="text-[11px] text-coral truncate">{d.reviewNote}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Btn v="x" sm onClick={() => renew(d)} title="Enviar nova versão"><I n="refresh" s={13} /> Renovar</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* DECLARAÇÕES + LGPD + CERTIFICADOS */}
      <h2 className="font-display font-semibold text-[15px] text-cy-300 flex items-center gap-2 mb-3 mt-8"><I n="book" s={16} /> Declarações e registros</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {ens.map((e) => (
          <Card key={e.id} className="p-5 flex items-center gap-4">
            <span className="w-11 h-11 rounded-lg grid place-items-center bg-cy-500/10 border border-cy-700 text-cy-400"><I n="file" s={20} /></span>
            <div className="flex-1">
              <div className="text-[13.5px] text-mist font-semibold">Declaração de matrícula</div>
              <div className="font-mono text-[10.5px] text-dim">{e.number} · {find("courses", e.courseId)?.title.slice(0, 30)}</div>
            </div>
            <Btn v="g" sm onClick={() => setDecl(e)}><I n="eye" s={14} /> Ver</Btn>
          </Card>
        ))}
        <Card className="p-5 flex items-center gap-4">
          <span className="w-11 h-11 rounded-lg grid place-items-center bg-ember/10 border border-ember/40 text-ember"><I n="shield" s={20} /></span>
          <div className="flex-1">
            <div className="text-[13.5px] text-mist font-semibold">Aceites LGPD</div>
            <div className="font-mono text-[10.5px] text-dim">{accepts.length} termos · {consents.length} consentimento(s)</div>
          </div>
        </Card>
        <a href="#/aluno/certificados" className="cy-card cy-card-h p-5 flex items-center gap-4">
          <span className="w-11 h-11 rounded-lg grid place-items-center bg-cy-500/10 border border-cy-700 text-cy-400"><I n="award" s={20} /></span>
          <div className="flex-1">
            <div className="text-[13.5px] text-mist font-semibold">Certificados</div>
            <div className="font-mono text-[10.5px] text-dim">{where("certificates", (c) => c.studentId === user!.id).length} emitido(s)</div>
          </div>
          <I n="chevR" s={16} c="text-dim" />
        </a>
      </div>

      {/* MODAL ENVIO */}
      <Modal open={up} onClose={() => setUp(false)} title="Enviar / renovar documento" w={520}>
        <div className="space-y-4">
          <Field label="Tipo de documento" req>
            <TSel value={nf.kind} onChange={(e) => setNf({ ...nf, kind: e.target.value })}>
              {Object.entries(DOC_KINDS).filter(([k]) => k !== "CARTEIRINHA").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </TSel>
          </Field>
          <Field label="Matrícula vinculada">
            <TSel value={nf.enrollmentId} onChange={(e) => setNf({ ...nf, enrollmentId: e.target.value })}>
              {ens.map((e) => <option key={e.id} value={e.id}>{e.number} — {find("courses", e.courseId)?.title.slice(0, 32)}</option>)}
            </TSel>
          </Field>
          <Field label="Imagem do documento" req hint="A imagem é comprimida localmente antes de ser registrada no storage do SIA.">
            <FileDrop max={900} value={nf.dataUrl} label="Anexar arquivo (PNG/JPG)" onChange={(d, n) => setNf({ ...nf, dataUrl: d, fileName: n })} />
          </Field>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setUp(false)}>Cancelar</Btn><Btn v="e" disabled={!nf.dataUrl} onClick={submitDoc}><I n="check" s={14} /> Enviar para análise</Btn></div>
        </div>
      </Modal>

      {/* MODAL DECLARAÇÃO */}
      {decl && (
        <Modal open onClose={() => setDecl(null)} title="Declaração de matrícula" w={640}>
          <div className="print-area cy-card p-7 border-cy-700">
            <div className="font-mono text-[10px] tracking-[.2em] uppercase text-cy-500 text-center">Declaração de Matrícula</div>
            <div className="flex gap-5 mt-5">
              {user!.photo && <img src={user!.photo} alt="foto" className="w-[84px] h-[102px] object-cover rounded-lg border border-cy-700 shrink-0" />}
              <p className="text-[13.5px] text-fog leading-[1.9]">
                Declaramos, para os devidos fins, que <strong className="text-mist">{user!.name}</strong>, portador(a) do e-mail {user!.email}{user!.cpf ? `, CPF ${user!.cpf}` : ""},
                encontra-se matriculado(a) no curso <strong className="text-cy-300">{find("courses", decl.courseId)?.title}</strong> desta instituição,
                sob a matrícula nº <strong className="font-mono text-cy-300">{decl.number}</strong>, com situação <strong className="text-mist">{decl.status === "ACTIVE" ? "ATIVA" : "CONCLUÍDA"}</strong>,
                com início em {fmtDate(decl.startDate)}.
              </p>
            </div>
            <div className="text-right font-mono text-[11px] text-dim mt-6">{fmtDate(new Date().toISOString())} · SIA Cyber Academy</div>
          </div>
          <div className="flex justify-end gap-2 mt-4"><Btn v="g" onClick={() => window.print()}><I n="print" s={14} /> Imprimir</Btn><Btn v="x" onClick={() => setDecl(null)}>Fechar</Btn></div>
        </Modal>
      )}

      {/* MODAL VISUALIZAÇÃO */}
      {viewDoc && (
        <Modal open onClose={() => setViewDoc(null)} title={viewDoc.kind === "CARTEIRINHA" ? `Carteirinha ${viewDoc.cardNumber}` : (DOC_KINDS[viewDoc.kind] || viewDoc.fileName)} w={viewDoc.kind === "CARTEIRINHA" ? 720 : 620}>
          {viewDoc.kind === "CARTEIRINHA" ? (
            <div className="print-area grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-cy-600/60 p-5 flex flex-col gap-4" style={{ background: "linear-gradient(135deg,#05202B,#0A3E41 55%,#0E5F5F)" }}>
                <div className="cy-chip text-cy-300">CYBER ACADEMY · FRENTE</div>
                <div className="flex gap-4 items-start">
                  {user!.photo && <img src={user!.photo} alt="foto" className="w-[92px] h-[112px] object-cover rounded-lg border border-cy-500/50" />}
                  <div>
                    <div className="font-display font-bold text-[16px] text-mist">{user!.name}</div>
                    <div className="font-mono text-[10.5px] text-cy-300 mt-1.5">{viewDoc.cardNumber}</div>
                    <div className="font-mono text-[10px] text-dim mt-0.5">válida até {fmtDate(viewDoc.validUntil)}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-cy-600/60 p-5 flex flex-col items-center justify-center gap-3" style={{ background: "linear-gradient(135deg,#0A3E41,#05202B 60%,#031019)" }}>
                <div className="bg-[#EAFBF8] p-3 rounded-lg"><QRMatrix code={viewDoc.cardNumber} size={150} /></div>
                <div className="font-mono text-[10.5px] text-fog">validação: /#/validar-carteirinha/{viewDoc.cardNumber}</div>
              </div>
            </div>
          ) : (
            <img src={viewDoc.dataUrl} alt={viewDoc.fileName} className="w-full rounded-lg border border-line" />
          )}
          <div className="flex justify-end gap-2 mt-4">
            {viewDoc.kind !== "CARTEIRINHA" && <Btn v="g" onClick={() => renew(viewDoc)}><I n="refresh" s={14} /> Renovar</Btn>}
            <Btn v="x" onClick={() => setViewDoc(null)}>Fechar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= CERTIFICADOS ================= */
function Certificados() {
  const { user } = useApp();
  const certs = where("certificates", (c) => c.studentId === user!.id);
  const [sel, setSel] = useState<Row | null>(null);
  return (
    <div>
      <PageHead kicker="SIA · certificados" title="Certificados" desc="Emitidos automaticamente quando os critérios acadêmicos são cumpridos. Valide publicamente pelo código." />
      {certs.length === 0 ? <Empty icon="award" title="Nenhum certificado ainda" desc="Conclua as aulas, atinja a média mínima e tenha o projeto aprovado — o certificado é gerado automaticamente." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {certs.map((ct) => (
            <Card key={ct.id} hover className="p-5 cursor-pointer" onClick={() => setSel(ct)}>
              <div className="flex items-center gap-4">
                <QRMatrix code={ct.code} size={74} />
                <div>
                  <div className="font-mono text-[12px] text-cy-300">{ct.code}</div>
                  <div className="font-display font-semibold text-[14.5px] text-mist mt-1">{ct.courseTitle}</div>
                  <div className="font-mono text-[10.5px] text-dim mt-1">{ct.hours}h · emitido {fmtDate(ct.issuedAt)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {sel && (
        <Modal open onClose={() => setSel(null)} title={`Certificado ${sel.code}`} w={760}>
          <div className="print-area relative overflow-hidden rounded-xl border border-cy-600 bg-gradient-to-br from-[#05202B] via-[#062A2E] to-[#0A3E41] p-8">
            <div className="absolute inset-3 border border-cy-700/50 rounded-lg pointer-events-none" />
            <div className="text-center">
              <div className="cy-chip text-cy-400">CERTIFICADO DE CONCLUSÃO · CYBER ACADEMY</div>
              <h3 className="display-xl text-[28px] text-mist mt-4">{sel.studentName}</h3>
              <p className="text-[13.5px] text-fog mt-3 max-w-[460px] mx-auto leading-relaxed">{find("courses", sel.courseId)?.certificateText || "concluiu o programa"} <strong className="text-cy-300">{sel.courseTitle}</strong>, com carga horária de <strong className="text-mist">{sel.hours} horas</strong>, nível {sel.level}.</p>
              <div className="flex items-center justify-center gap-8 mt-6">
                <div className="text-left font-mono text-[11px] text-dim"><div className="text-fog">{fmtDate(sel.issuedAt)}</div>data de emissão</div>
                <QRMatrix code={sel.code} size={96} />
                <div className="text-left font-mono text-[11px] text-dim"><div className="text-cy-300">{sel.code}</div>código de validação</div>
              </div>
              <div className="font-mono text-[10.5px] text-dim mt-5">{getSettings().certSigner} · valide em cyberacademy.com.br/#/validar-certificado/{sel.code}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <a href={`#/validar-certificado/${sel.code}`} className="cy-btn cy-btn-g px-4 py-2 text-[12px]"><I n="qr" s={14} /> Página de validação</a>
            <Btn v="e" onClick={() => window.print()}><I n="print" s={14} /> Imprimir / PDF</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= FINANCEIRO ================= */
function Financeiro() {
  const { user } = useApp();
  const orders = where("orders", (o) => o.userId === user!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHead kicker="SIA · financeiro" title="Situação financeira" desc="Pedidos, pagamentos e parcelas processados pelo Mercado Pago." />
      {orders.length === 0 ? <Empty icon="wallet" title="Nenhuma compra" desc="Suas compras e pagamentos aparecem aqui."><a href="#/cursos" className="cy-btn cy-btn-e px-5 py-2.5 text-[12.5px]">Ver cursos</a></Empty> : (
        <div className="space-y-4">
          {orders.map((o) => {
            const c = find("courses", o.courseId);
            const pays = where("payments", (p) => p.orderId === o.id);
            return (
              <Card key={o.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3"><span className="font-display font-semibold text-[14.5px] text-mist">{c?.title}</span><Badge s={o.status} /></div>
                    <div className="font-mono text-[10.5px] text-dim mt-1">{o.number} · {fmtDT(o.createdAt)} · gateway: Mercado Pago</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-[19px] text-ember tnum">{fmtBRL(o.amount)}</div>
                    <div className="font-mono text-[10.5px] text-dim">{o.installments}x de {fmtBRL(o.amount / o.installments)}</div>
                  </div>
                </div>
                {pays.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="cy-tbl">
                      <thead><tr><th>Pagamento</th><th>Método</th><th>Status</th><th>Data</th></tr></thead>
                      <tbody>{pays.map((p) => (
                        <tr key={p.id}><td className="font-mono text-cy-300">{p.mpPaymentId}</td><td className="uppercase font-mono text-[11px]">{p.method}</td><td><Badge s={p.status} /></td><td>{p.paidAt ? fmtDT(p.paidAt) : "—"}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================= NOTIFICAÇÕES ================= */
function Notificacoes() {
  const { user, refresh } = useApp();
  const notes = where("notifications", (n) => n.userId === user!.id).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div>
      <PageHead kicker="SIA · comunicação" title="Notificações" desc="Aulas novas, resultados, feedbacks, certificados e avisos financeiros."
        right={<Btn v="g" sm onClick={() => { notes.forEach((n) => { if (!n.read) update("notifications", n.id, { read: true }); }); refresh(); }}>Marcar todas como lidas</Btn>} />
      {notes.length === 0 ? <Empty icon="bell" title="Sem notificações" /> : (
        <Card className="divide-y divide-line/60">
          {notes.map((n) => (
            <div key={n.id} className={`px-5 py-4 flex items-start gap-4 ${n.read ? "opacity-55" : ""}`}>
              <span className={`w-9 h-9 rounded-lg grid place-items-center border shrink-0 ${n.type === "grade" ? "border-ember/40 text-ember bg-ember/5" : n.type === "finance" ? "border-mp/40 text-mp bg-mp/5" : n.type === "certificate" ? "border-cy-500 text-cy-300 bg-cy-500/10" : "border-line text-fog"}`}>
                <I n={n.type === "grade" ? "star" : n.type === "finance" ? "wallet" : n.type === "certificate" ? "award" : n.type === "project" ? "git" : "bell"} s={16} />
              </span>
              <div className="flex-1">
                <div className="flex justify-between gap-3"><span className="text-[13.5px] font-semibold text-mist">{n.title}</span><span className="font-mono text-[10.5px] text-dim shrink-0">{timeAgo(n.at)}</span></div>
                <p className="text-[12.5px] text-fog mt-0.5">{n.body}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-cy-400 mt-2 shrink-0" />}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ================= SUPORTE ================= */
function Suporte() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const tickets = where("support_tickets", (t) => t.userId === user!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Row | null>(null);
  const [f, setF] = useState({ subject: "", category: "academico", message: "" });
  const [reply, setReply] = useState("");
  const create = () => {
    if (!f.subject || !f.message) { toast("Preencha assunto e mensagem.", "err"); return; }
    createTicket(user!, f.subject, f.category, f.message);
    setF({ subject: "", category: "academico", message: "" }); setOpen(false); refresh();
    toast("Chamado aberto! O suporte foi notificado.", "ok");
  };
  const send = () => {
    if (!sel || !reply) return;
    replyTicket(user!, sel.id, reply);
    setReply(""); refresh();
  };
  const msgs = sel ? where("ticket_messages", (m) => m.ticketId === sel.id) : [];
  return (
    <div>
      <PageHead kicker="SIA · atendimento" title="Suporte" desc="Abra chamados e acompanhe o histórico de respostas."
        right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Novo chamado</Btn>} />
      {tickets.length === 0 ? <Empty icon="msg" title="Nenhum chamado" desc="Precisa de ajuda com matrícula, acesso ou conteúdo? Abra um chamado." /> : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} hover className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setSel(t)}>
              <I n="msg" s={19} c="text-cy-400" />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] text-mist font-semibold truncate">{t.subject}</div>
                <div className="font-mono text-[10.5px] text-dim mt-0.5">{t.category} · {timeAgo(t.createdAt)}</div>
              </div>
              <Badge s={t.status} />
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo chamado" w={560}>
        <div className="space-y-4">
          <Field label="Assunto" req><TIn value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Ex.: não consigo acessar o AVA" /></Field>
          <Field label="Categoria">
            <TSel value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              <option value="academico">Acadêmico</option><option value="financeiro">Financeiro</option><option value="acesso">Acesso / login</option><option value="certificado">Certificado</option><option value="outro">Outro</option>
            </TSel>
          </Field>
          <Field label="Mensagem" req><TArea rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={create}>Abrir chamado</Btn></div>
        </div>
      </Modal>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.subject || ""} w={620}>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {msgs.map((m) => (
            <div key={m.id} className={`cy-card p-4 ${m.authorRole === "student" ? "" : "border-cy-700"}`}>
              <div className="flex justify-between font-mono text-[10.5px] text-dim"><span className={m.authorRole === "student" ? "text-fog" : "text-cy-400"}>{m.authorName} · {m.authorRole === "student" ? "aluno" : "suporte"}</span><span>{fmtDT(m.at)}</span></div>
              <p className="text-[13px] text-fog mt-2 whitespace-pre-line">{m.text}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <input className="cy-in flex-1" placeholder="Responder…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Btn v="p" onClick={send}><I n="send" s={15} /></Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ================= PERFIL ================= */
function Perfil() {
  const { user, refresh, setUser } = useApp();
  const toast = useToast();
  const [f, setF] = useState({ name: user!.name, email: user!.email, phone: user!.phone || "", cpf: user!.cpf || "", rg: user!.rg || "", birthDate: user!.birthDate || "", address: user!.address || "" });
  const [pw, setPw] = useState({ cur: "", next: "" });
  const [del, setDel] = useState(false);
  const [tfa, setTfa] = useState<null | { secret: string; step: "scan" | "confirm" }>(null);
  const [tfaCode, setTfaCode] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const pwScore = passwordScore(pw.next);
  const saveProfile = () => {
    try { updateProfile(user!, f); refresh(); toast("Perfil atualizado no SIA.", "ok"); }
    catch (e: any) { toast(e.message, "err"); }
  };
  const savePw = async () => {
    try { await changePassword(user!.id, pw.cur, pw.next); setPw({ cur: "", next: "" }); toast("Senha alterada com sucesso.", "ok"); }
    catch (e: any) { toast(e.message, "err"); }
  };
  const start2FA = () => { const s = enable2FA(user!); refresh(); setTfa({ secret: s, step: "scan" }); setTfaCode(""); };
  const ok2FA = () => { try { confirm2FA(user!, tfaCode); refresh(); setTfa(null); toast("Verificação em duas etapas ativada!", "ok"); } catch (e: any) { toast(e.message, "err"); } };
  const off2FA = () => { try { disable2FA(user!, tfaCode); refresh(); setTfa(null); setTfaCode(""); toast("2FA desativado.", "info"); } catch (e: any) { toast(e.message, "err"); } };
  const erase = () => {
    update("users", user!.id, { name: "Usuário removido (LGPD)", email: `anon-${user!.id.slice(0, 8)}@removed.local`, passHash: "x", status: "inactive", cpf: "", phone: "" });
    audit(null, "DELETE", "users", user!.id, "Conta anonimizada a pedido do titular (LGPD)");
    setUser(null);
    navigate("/");
    toast("Conta anonimizada conforme a LGPD.", "info");
  };
  return (
    <div className="max-w-[760px]">
      <PageHead kicker="SIA · conta" title="Meu perfil" desc="Dados cadastrais, segurança e consentimentos LGPD." />
      <div className="space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-5">
            {user!.photo ? <img src={user!.photo} alt="foto" className="w-[52px] h-[52px] object-cover rounded-xl border border-cy-600" /> : <Avatar name={user!.name} s={52} />}
            <div>
              <div className="font-display font-semibold text-[16px] text-mist">{user!.name}</div>
              <div className="font-mono text-[11.5px] text-dim">{user!.email} · papel: {user!.role}</div>
            </div>
            <div className="ml-auto hidden sm:block"><span className={`cy-badge ${user!.twoFactor === "on" ? "b-green" : "b-mist"}`}><I n="shield" s={11} /> 2FA {user!.twoFactor === "on" ? "ativo" : "inativo"}</span></div>
          </div>
          <div className="mb-5 max-w-[340px]">
            <Field label="Foto 3x4 (usada na carteirinha e declarações)">
              <FileDrop max={420} value={user!.photo} label="Enviar / trocar foto" onChange={(d) => { updateProfile(user!, { photo: d }); toast("Foto atualizada.", "ok"); refresh(); }} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome completo"><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="E-mail" hint="Alterar o e-mail exige que ele esteja disponível"><TIn value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Telefone"><TIn value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="CPF"><TIn value={f.cpf} onChange={(e) => setF({ ...f, cpf: e.target.value })} /></Field>
            <Field label="RG"><TIn value={f.rg} onChange={(e) => setF({ ...f, rg: e.target.value })} /></Field>
            <Field label="Data de nascimento"><TIn type="date" value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Endereço"><TIn value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Rua, número, bairro, cidade/UF" /></Field></div>
          </div>
          <Btn v="p" className="mt-5" onClick={saveProfile}><I n="check" s={15} /> Salvar alterações</Btn>
        </Card>

        {/* SEGURANÇA */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-[15px] text-mist mb-4 flex items-center gap-2"><I n="shield" s={16} c="text-ember" /> Segurança da conta</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Field label="Senha atual"><TIn type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} /></Field>
            </div>
            <div>
              <Field label="Nova senha" hint="10+ caracteres, maiúsculas, números e símbolos = excelente">
                <TIn type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                {pw.next && <Strength {...pwScore} />}
              </Field>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-line">
            <div>
              <div className="text-[13.5px] font-semibold text-mist flex items-center gap-2"><I n="lock" s={15} c="text-cy-400" /> Verificação em duas etapas (TOTP)</div>
              <p className="text-[12px] text-fog mt-0.5">{user!.twoFactor === "on" ? "Ativada — códigos de 6 dígitos a cada login." : "Proteja sua conta com um autenticador (30s)."}</p>
            </div>
            {user!.twoFactor === "on" ? (
              <Btn v="d" sm onClick={() => { setTfa({ secret: "", step: "confirm" }); setTfaCode(""); }}>Desativar 2FA</Btn>
            ) : (
              <Btn v="e" sm onClick={start2FA}><I n="shield" s={13} /> Ativar 2FA</Btn>
            )}
          </div>
        </Card>

        {/* SESSÕES */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-[15px] text-mist mb-1 flex items-center gap-2"><I n="term" s={16} c="text-cy-400" /> Sessões ativas</h3>
          <p className="text-[12px] text-fog mb-4">Tokens JWT com expiração de 8h. Revogue dispositivos que não reconhece.</p>
          <div className="space-y-2">
            {mySessions(user!.id).map((s) => (
              <div key={s.id} className="cy-card p-3.5 flex items-center gap-3">
                <span className={`w-9 h-9 rounded-lg grid place-items-center border ${s.current ? "border-cy-500 text-cy-300 bg-cy-500/10" : "border-line text-dim"}`}><I n="globe" s={16} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-mist font-semibold flex items-center gap-2">{s.device ? String(s.device).slice(0, 42) : "Navegador"} {s.current && <span className="cy-badge b-teal">este dispositivo</span>}</div>
                  <div className="font-mono text-[10px] text-dim">criada {s.createdAt ? fmtDT(s.createdAt) : "—"} · expira {new Date(s.exp).toLocaleString("pt-BR")}</div>
                </div>
                {!s.current && <Btn v="d" sm onClick={() => { try { revokeSession(user!, s.id); refresh(); toast("Sessão revogada.", "ok"); } catch (e: any) { toast(e.message, "err"); } }}>Revogar</Btn>}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-display font-semibold text-[15px] text-mist mb-3 flex items-center gap-2"><I n="shield" s={16} c="text-ember" /> Registros LGPD</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {where("terms_acceptances", (t) => t.userId === user!.id).map((t) => (
              <div key={t.id} className="cy-card p-3.5 text-[12.5px] text-fog">Aceite <span className="font-mono text-cy-300">{t.doc}</span> v{t.version} · {fmtDT(t.at)}</div>
            ))}
            {where("consents", (t) => t.userId === user!.id).map((t) => (
              <div key={t.id} className="cy-card p-3.5 text-[12.5px] text-fog">Consentimento <span className="font-mono text-cy-300">{t.kind}</span>: {t.granted ? "concedido" : "não concedido"}</div>
            ))}
          </div>
        </Card>
        <Card className="p-6 border-coral/30">
          <h3 className="font-display font-semibold text-[15px] text-coral mb-2">Exclusão da conta (LGPD)</h3>
          <p className="text-[12.5px] text-fog leading-relaxed">Seus dados pessoais são anonimizados. Registros acadêmicos são retidos pelo prazo legal.</p>
          <Btn v="d" className="mt-4" onClick={() => setDel(true)}>Solicitar anonimização</Btn>
        </Card>
      </div>
      <Confirm open={del} onClose={() => setDel(false)} onYes={erase} title="Anonimizar conta?" desc="Esta ação remove seus dados pessoais (nome, e-mail, CPF) e desativa a conta. Não é possível desfazer." />
      <Modal open={!!tfa} onClose={() => setTfa(null)} title={user!.twoFactor === "on" ? "Desativar 2FA" : "Ativar verificação em duas etapas"} w={480}>
        {tfa && user!.twoFactor !== "on" && (
          <div className="space-y-4">
            <p className="text-[13px] text-fog leading-relaxed">Cadastre o segredo abaixo em um app autenticador (Google Authenticator, 1Password etc.). <strong className="text-mist">Nesta build, o autenticador é simulado ao vivo:</strong></p>
            <div className="cy-card p-4 border-cy-700 space-y-3">
              <div className="font-mono text-[11px] text-dim uppercase tracking-widest">segredo (base32)</div>
              <div className="font-mono text-[15px] text-cy-300 tracking-[.2em]">{tfa.secret}</div>
              <div className="border-t border-line pt-3">
                <div className="font-mono text-[11px] text-dim uppercase tracking-widest mb-2">autenticador simulado · código atual</div>
                <TotpCode {...currentTotp(tfa.secret)} />
              </div>
            </div>
            <Field label="Digite o código de 6 dígitos" req><TIn value={tfaCode} onChange={(e) => setTfaCode(e.target.value)} placeholder="000000" maxLength={6} /></Field>
            <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setTfa(null)}>Cancelar</Btn><Btn v="e" onClick={ok2FA}>Confirmar e ativar</Btn></div>
          </div>
        )}
        {tfa && user!.twoFactor === "on" && (
          <div className="space-y-4">
            <p className="text-[13px] text-fog">Digite o código atual do seu autenticador para confirmar a desativação.</p>
            <Field label="Código atual" req><TIn value={tfaCode} onChange={(e) => setTfaCode(e.target.value)} placeholder="000000" maxLength={6} /></Field>
            <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setTfa(null)}>Cancelar</Btn><Btn v="d" onClick={off2FA}>Desativar 2FA</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
