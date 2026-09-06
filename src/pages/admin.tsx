import React, { useMemo, useState } from "react";
import { I } from "../components/icons";
import { AppShell, type NavItem } from "../components/layout";
import { Btn, Card, Badge, Bar, Empty, Field, TIn, TArea, TSel, Modal, Stat, Tag, PageHead, useToast, Confirm, CoverImg } from "../components/ui";
import { useApp, navigate } from "../state";
import { CourseContent } from "./teacher";
import { TicketsConsole, AdminSystem, SiteCMS } from "./admin2";
import { seedDemo, hasData, IMG } from "../lib/seed";
import {
  refundPayment, all, one, where, find, insert, update, remove, audit, notify,
  fmtBRL, fmtDate, fmtDT, type Row, effectivePrice, nextEnrollmentNumber, reviewDocument,
  coursePricing, orderInstallments, reenrollFree,
} from "../lib/api";
import { DOC_KINDS } from "../lib/db";

/* ================= REVISÃO DE DOCUMENTOS (secretaria) ================= */
function DocumentReview() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [status, setStatus] = useState("PENDING_REVIEW");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<Row | null>(null);
  const docs = where("documents", (d) => d.status === status && d.kind !== "CARTEIRINHA").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = where("documents", (d) => d.status === "PENDING_REVIEW" && d.kind !== "CARTEIRINHA").length;
  const decide = (d: Row, approve: boolean) => {
    reviewDocument(user!, d.id, approve, note);
    setNote(""); setPreview(null);
    toast(approve ? "Documento aprovado." : "Documento rejeitado.", approve ? "ok" : "info");
    refresh();
  };
  return (
    <div>
      <PageHead kicker="SIA · secretaria" title="Documentos dos alunos" desc={`Fila de validação de documentos enviados pelos alunos. ${pending} aguardando análise.`} />
      <div className="flex gap-2 mb-4">
        {["PENDING_REVIEW", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`cy-btn px-4 py-2 text-[12px] ${status === s ? "cy-btn-p" : "cy-btn-g"}`}>
            {s === "PENDING_REVIEW" ? `Pendentes (${pending})` : s === "APPROVED" ? "Aprovados" : "Rejeitados"}
          </button>
        ))}
      </div>
      {docs.length === 0 ? (
        <Empty icon="file" title={status === "PENDING_REVIEW" ? "Nenhum documento pendente" : "Nada aqui"} desc="Quando um aluno enviar ou renovar um documento, ele aparece nesta fila para análise da secretaria." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => {
            const owner = find("users", d.userId);
            return (
              <Card key={d.id} hover className="p-4">
                <button onClick={() => setPreview(d)} className="w-full h-[130px] rounded-lg overflow-hidden border border-line hover:border-cy-500 transition-colors mb-3">
                  <img src={d.dataUrl} alt={d.fileName} className="w-full h-full object-cover" />
                </button>
                <div className="text-[13px] font-semibold text-mist">{DOC_KINDS[d.kind] || d.kind} <span className="font-mono text-[10px] text-dim">v{d.version}</span></div>
                <div className="font-mono text-[10.5px] text-dim mt-0.5">{owner?.name} · {fmtDate(d.createdAt)}</div>
                <div className="mt-2"><Badge s={d.status} />{d.status !== "PENDING_REVIEW" && d.reviewNote && <span className="block text-[11px] text-fog mt-1">{d.reviewNote}</span>}</div>
                {status === "PENDING_REVIEW" && (
                  <div className="flex gap-2 mt-3">
                    <Btn v="p" sm className="flex-1" onClick={() => decide(d, true)}><I n="check" s={13} /> Aprovar</Btn>
                    <Btn v="d" sm className="flex-1" onClick={() => setPreview(d)}><I n="x" s={13} /> Rejeitar</Btn>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={!!preview} onClose={() => { setPreview(null); setNote(""); }} title={DOC_KINDS[preview?.kind || ""] || "Documento"} w={640}>
        {preview && (
          <div>
            <img src={preview.dataUrl} alt={preview.fileName} className="w-full rounded-lg border border-line mb-4" />
            <div className="font-mono text-[11px] text-dim mb-3">{find("users", preview.userId)?.name} · {preview.fileName} · v{preview.version}</div>
            <Field label="Parecer da secretaria (opcional, exibido ao aluno)"><TArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: imagem ilegível, envie novamente em melhor resolução." /></Field>
            <div className="flex justify-end gap-2 mt-4">
              <Btn v="d" onClick={() => decide(preview, false)}><I n="x" s={14} /> Rejeitar</Btn>
              <Btn v="p" onClick={() => decide(preview, true)}><I n="check" s={14} /> Aprovar documento</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export const NAV_ADMIN: NavItem[] = [
  { to: "/admin", icon: "home", label: "Dashboard" },
  { to: "/admin/alunos", icon: "users", label: "Alunos" },
  { to: "/admin/professores", icon: "cap", label: "Professores" },
  { to: "/admin/cursos", icon: "layers", label: "Cursos" },
  { to: "/admin/site", icon: "globe", label: "Conteúdo do site" },
  { to: "/admin/turmas", icon: "cal", label: "Turmas" },
  { to: "/admin/matriculas", icon: "award", label: "Matrículas" },
  { to: "/admin/documentos", icon: "file", label: "Documentos" },
  { to: "/admin/financeiro", icon: "wallet", label: "Financeiro" },
  { to: "/admin/relatorios", icon: "chart", label: "Relatórios" },
  { to: "/admin/suporte", icon: "msg", label: "Suporte" },
  { to: "/admin/notificacoes", icon: "bell", label: "Notificações" },
  { to: "/admin/usuarios", icon: "user", label: "Usuários" },
  { to: "/admin/auditoria", icon: "shield", label: "Auditoria" },
  { to: "/admin/configuracoes", icon: "gear", label: "Configurações" },
];

export default function AdminArea({ path, segs }: { path: string; segs: string[] }) {
  const { user } = useApp();
  if (!user) return null;
  const sub = segs[1] || "";
  let page: React.ReactNode;
  switch (sub) {
    case "": page = <Dash />; break;
    case "alunos": page = <Alunos />; break;
    case "professores": page = <Professores />; break;
    case "cursos": page = segs[2] ? <CourseContent courseId={segs[2]} actor={user!} /> : <Cursos />; break;
    case "site": page = <SiteCMS />; break;
    case "turmas": page = <Turmas />; break;
    case "matriculas": page = <Matriculas />; break;
    case "documentos": page = <DocumentReview />; break;
    case "financeiro": page = <Financeiro />; break;
    case "relatorios": page = <AdminSystem kind="relatorios" />; break;
    case "suporte": page = <TicketsConsole />; break;
    case "notificacoes": page = <AdminSystem kind="notificacoes" />; break;
    case "usuarios": page = <Usuarios />; break;
    case "auditoria": page = <AdminSystem kind="auditoria" />; break;
    case "emails": page = <AdminSystem kind="emails" />; break;
    case "configuracoes": page = <AdminSystem kind="config" />; break;
    default: page = <Dash />;
  }
  return <AppShell title="Painel Administrativo" nav={NAV_ADMIN} path={path}>{page}</AppShell>;
}

/* ================= DASHBOARD ================= */
function Dash() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [seedRes, setSeedRes] = useState<{ admin: string; teacher: string } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const students = all("users").filter((u) => u.role === "student" && u.status === "active");
  const courses = all("courses");
  const published = courses.filter((c) => c.published);
  const ens = all("enrollments");
  const pays = all("payments").filter((p) => p.status === "approved");
  const revenue = pays.reduce((s, p) => s + (p.amount || 0), 0);
  const certs = all("certificates");
  const completed = ens.filter((e) => e.status === "COMPLETED").length;

  const days = useMemo(() => {
    const out: { label: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total = pays.filter((p) => (p.paidAt || "").slice(0, 10) === key).reduce((s, p) => s + p.amount, 0);
      out.push({ label: d.toLocaleDateString("pt-BR", { day: "2-digit" }), total });
    }
    return out;
  }, [pays.length]);
  const max = Math.max(1, ...days.map((d) => d.total));

  const runSeed = async () => {
    setSeeding(true);
    try { const r = await seedDemo(); setSeedRes(r); refresh(); toast("Dados de demonstração gerados.", "ok"); } catch { toast("Erro ao gerar seed.", "err"); }
    setSeeding(false);
  };

  return (
    <div className="space-y-6">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="cy-chip text-cy-500">SIA · ADMINISTRAÇÃO GLOBAL</div>
          <h1 className="display-xl text-[26px] md:text-[32px] text-mist mt-1">Centro de comando</h1>
          <p className="text-[13.5px] text-fog mt-1.5">Todos os indicadores abaixo vêm do banco — quando não há registros, exibem 0.</p>
        </div>
        {!hasData() && (
          <Btn v="e" disabled={seeding} onClick={runSeed}><I n="spark" s={15} /> {seeding ? "Gerando…" : "Gerar dados de demonstração (dev)"}</Btn>
        )}
      </div>

      {!hasData() && (
        <Card className="p-5 border-ember/40 flex flex-wrap items-center gap-4 anim-fade-up">
          <I n="alert" s={22} c="text-ember" />
          <div className="flex-1 min-w-[240px]">
            <div className="text-[13.5px] text-mist font-semibold">Ambiente de produção vazio</div>
            <p className="text-[12.5px] text-fog mt-0.5">Fluxo operacional: cadastre um professor → crie um curso → crie uma turma → publique → venda. Ou gere o seed de demonstração para testar o ecossistema completo.</p>
          </div>
          <a href="#/admin/professores" className="cy-btn cy-btn-p px-4 py-2.5 text-[12px]">Começar cadastro</a>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="users" label="Alunos ativos" value={students.length} />
        <Stat icon="cap" label="Professores" value={new Set(all("teachers").map((t) => t.email)).size} />
        <Stat icon="layers" label="Cursos publicados" value={published.length} sub={`${courses.length} no total`} />
        <Stat icon="award" label="Matrículas" value={ens.length} sub={`${ens.filter((e) => e.status === "ACTIVE").length} ativas`} tone="amber" />
        <Stat icon="wallet" label="Receita aprovada" value={fmtBRL(revenue)} sub={`${pays.length} pagamentos`} tone="amber" />
        <Stat icon="checkc" label="Cursos concluídos" value={completed} />
        <Stat icon="award" label="Certificados" value={certs.length} />
        <Stat icon="msg" label="Chamados abertos" value={all("support_tickets").filter((t) => t.status === "open").length} />
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[15px] text-mist flex items-center gap-2"><I n="chart" s={16} c="text-cy-400" /> Vendas — últimos 14 dias</h3>
            <span className="font-mono text-[11px] text-dim">pagamentos aprovados via Mercado Pago</span>
          </div>
          <div className="flex items-end gap-1.5 h-[150px]">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="font-mono text-[9px] text-cy-300 opacity-0 group-hover:opacity-100 transition-opacity tnum">{d.total ? fmtBRL(d.total) : ""}</span>
                <div className="w-full rounded-t-sm transition-all duration-500 group-hover:bg-cy-300"
                  style={{ height: `${Math.max(3, (d.total / max) * 100)}%`, background: d.total ? "linear-gradient(180deg,#5FE3D8,#0E5F5F)" : "rgba(14,59,64,.5)" }} />
                <span className="font-mono text-[9px] text-dim">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[15px] text-mist flex items-center gap-2 mb-4"><I n="shield" s={16} c="text-cy-400" /> Atividade recente (auditoria)</h3>
          <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
            {all("audit_logs").sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 text-[12px]">
                <span className="cy-badge b-teal shrink-0 !text-[9px]">{a.event}</span>
                <span className="text-fog flex-1 leading-snug">{a.detail || a.entity}</span>
              </div>
            ))}
            {all("audit_logs").length === 0 && <p className="text-[12.5px] text-dim">Nenhum evento ainda.</p>}
          </div>
        </Card>
      </div>

      {/* DESEMPENHO POR CURSO + RECEITA RECORRENTE */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[15px] text-mist flex items-center gap-2 mb-4"><I n="layers" s={16} c="text-cy-400" /> Desempenho por curso</h3>
          {courses.length === 0 ? <p className="text-[12.5px] text-dim">Nenhum curso cadastrado.</p> : (
            <div className="overflow-x-auto">
              <table className="cy-tbl">
                <thead><tr><th>Curso</th><th>Modelo</th><th>Alunos</th><th>Receita</th><th>Conclusão</th></tr></thead>
                <tbody>
                  {courses.map((c) => {
                    const ce = where("enrollments", (e) => e.courseId === c.id && e.status !== "CANCELLED");
                    const crev = where("payments", (p) => p.courseId === c.id && p.status === "approved").reduce((s, p) => s + Number(p.amount), 0);
                    const done = ce.filter((e) => e.status === "COMPLETED").length;
                    const p = coursePricing(c);
                    return (
                      <tr key={c.id}>
                        <td className="text-mist font-semibold">{c.title.slice(0, 30)}</td>
                        <td>{p.model === "subscription" ? <span className="cy-badge b-teal">mensalidade</span> : <span className="cy-badge b-mist">avulso</span>}</td>
                        <td className="font-mono">{ce.length}</td>
                        <td className="font-mono text-ember tnum">{fmtBRL(crev)}</td>
                        <td><div className="flex items-center gap-2"><div className="w-16"><Bar v={ce.length ? (done / ce.length) * 100 : 0} h={5} /></div><span className="font-mono text-[10.5px] text-dim">{done}/{ce.length}</span></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[15px] text-mist flex items-center gap-2 mb-4"><I n="wallet" s={16} c="text-cy-400" /> Assinaturas ativas</h3>
          {(() => {
            const subOrders = where("orders", (o) => o.model === "subscription" && o.status === "paid");
            const scheduled = where("installments", (i) => ["scheduled", "pending"].includes(i.status));
            const mrr = subOrders.reduce((s, o) => s + Number(o.amount), 0);
            return (
              <div className="space-y-3">
                <div className="cy-card p-4 border-cy-700">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-dim">Receita recorrente mensal (MRR)</div>
                  <div className="font-display font-bold text-[26px] text-cy-300 tnum mt-1">{fmtBRL(mrr)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="cy-card p-3.5"><div className="font-mono text-[10px] uppercase text-dim">Planos ativos</div><div className="font-display font-bold text-[20px] text-mist tnum">{subOrders.length}</div></div>
                  <div className="cy-card p-3.5"><div className="font-mono text-[10px] uppercase text-dim">Cobranças futuras</div><div className="font-display font-bold text-[20px] text-ember tnum">{fmtBRL(scheduled.reduce((s, i) => s + Number(i.amount), 0))}</div></div>
                </div>
                <p className="text-[11.5px] text-dim leading-relaxed">Mensalidades são cobradas via Mercado Pago a cada ciclo e liquidadas pelo webhook. Cronograma completo no módulo Financeiro.</p>
              </div>
            );
          })()}
        </Card>
      </div>

      {/* MATRÍCULAS RECENTES */}
      <Card className="p-5">
        <h3 className="font-display font-semibold text-[15px] text-mist flex items-center gap-2 mb-4"><I n="award" s={16} c="text-cy-400" /> Últimas matrículas</h3>
        {ens.length === 0 ? <p className="text-[12.5px] text-dim">Nenhuma matrícula ainda.</p> : (
          <div className="overflow-x-auto">
            <table className="cy-tbl">
              <thead><tr><th>Matrícula</th><th>Aluno</th><th>Curso</th><th>Origem</th><th>Data</th><th>Situação</th></tr></thead>
              <tbody>
                {ens.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 6).map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono text-cy-300 text-[12px]">{e.number}</td>
                    <td className="text-mist">{find("users", e.studentId)?.name || "—"}</td>
                    <td>{find("courses", e.courseId)?.title.slice(0, 28)}</td>
                    <td className="font-mono text-[10.5px] uppercase">{e.origin === "reenroll-free" ? "rematrícula" : e.origin}</td>
                    <td className="font-mono text-[11px]">{fmtDate(e.startDate)}</td>
                    <td><Badge s={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[["/admin/cursos", "layers", "Gerenciar catálogo"], ["/admin/matriculas", "award", "Matrículas"], ["/admin/financeiro", "wallet", "Pedidos & pagamentos"], ["/admin/configuracoes", "gear", "Configurações do SIA"]].map(([to, ic, l]) => (
          <a key={to} href={`#${to}`} className="cy-card cy-card-h p-4 flex items-center gap-3 text-[13px] text-mist font-display">
            <I n={ic} s={18} c="text-cy-400" /> {l} <I n="chevR" s={14} c="text-dim ml-auto" />
          </a>
        ))}
      </div>

      <Modal open={!!seedRes} onClose={() => setSeedRes(null)} title="Seed de demonstração criado" w={460}>
        <p className="text-[13px] text-fog leading-relaxed">Contas de teste (ambiente dev):</p>
        <div className="cy-card p-4 mt-3 space-y-2 font-mono text-[12.5px]">
          <div className="flex justify-between"><span className="text-dim">admin</span><span className="text-cy-300">{seedRes?.admin} · Cyber@2026</span></div>
          <div className="flex justify-between"><span className="text-dim">professor</span><span className="text-cy-300">{seedRes?.teacher} · Cyber@2026</span></div>
        </div>
        <p className="text-[12px] text-dim mt-3">Crie uma conta de aluno pelo site e compre um curso (sandbox) para percorrer o fluxo completo até o certificado.</p>
        <div className="flex justify-end mt-4"><Btn v="e" onClick={() => setSeedRes(null)}>Entendi</Btn></div>
      </Modal>
    </div>
  );
}

/* ================= ALUNOS ================= */
function Alunos() {
  const { user, refresh } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Row | null>(null);
  const students = all("users").filter((u) => u.role === "student" && (!q || (u.name + u.email).toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <PageHead kicker="SIA · alunos" title="Alunos" desc="Contas de alunos com matrículas e situação acadêmica." />
      <div className="relative max-w-[340px] mb-4">
        <I n="search" s={15} c="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
        <input className="cy-in pl-9" placeholder="Buscar por nome ou e-mail…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {students.length === 0 ? <Empty icon="users" title="Nenhum aluno" desc="Alunos se cadastram pelo site (/cadastro) ou via compra no checkout." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Aluno</th><th>E-mail</th><th>Matrículas</th><th>Certificados</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="text-mist font-semibold">{s.name}</td>
                  <td className="font-mono text-[12px]">{s.email}</td>
                  <td className="font-mono text-cy-300">{where("enrollments", (e) => e.studentId === s.id).length}</td>
                  <td className="font-mono">{where("certificates", (c) => c.studentId === s.id).length}</td>
                  <td><Badge s={s.status === "active" ? "active" : "inactive"} /></td>
                  <td><Btn v="x" sm onClick={() => setSel(s)}><I n="eye" s={14} /></Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name || ""} w={640}>
        {sel && (
          <div className="space-y-4">
            <div className="font-mono text-[12px] text-fog">{sel.email}{sel.cpf ? ` · CPF ${sel.cpf}` : ""}{sel.phone ? ` · ${sel.phone}` : ""}</div>
            <div>
              <h4 className="font-mono text-[11px] uppercase tracking-widest text-cy-500 mb-2">Matrículas</h4>
              {where("enrollments", (e) => e.studentId === sel.id).map((e) => (
                <div key={e.id} className="cy-card p-3 mb-2 flex items-center justify-between">
                  <div><span className="font-mono text-cy-300 text-[12px]">{e.number}</span> · <span className="text-[13px] text-mist">{find("courses", e.courseId)?.title}</span></div>
                  <Badge s={e.status} />
                </div>
              ))}
              {where("enrollments", (e) => e.studentId === sel.id).length === 0 && <p className="text-[12.5px] text-dim">Nenhuma matrícula.</p>}
            </div>
            <Btn v={sel.status === "active" ? "d" : "p"} onClick={() => { update("users", sel.id, { status: sel.status === "active" ? "inactive" : "active" }); audit(user, "ROLE_CHANGE", "users", sel.id, sel.status === "active" ? "Conta desativada" : "Conta reativada"); refresh(); }}>
              {sel.status === "active" ? "Desativar conta" : "Reativar conta"}
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================= PROFESSORES ================= */
function Professores() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [edit, setEdit] = useState<Row | null | "new">(null);
  const [f, setF] = useState<Row>({ name: "", email: "", cpf: "", phone: "", bio: "", specialty: "", status: "active", courseIds: [] });
  const courses = all("courses");
  const teachers = all("teachers");
  const uniq: Row[] = [];
  teachers.forEach((t) => { if (!uniq.some((u) => u.email === t.email)) uniq.push(t); });
  React.useEffect(() => {
    if (edit && edit !== "new") {
      const courseIds = teachers.filter((t) => t.email === edit.email).map((t) => t.courseId).filter(Boolean);
      setF({ ...edit, courseIds });
    } else if (edit === "new") setF({ name: "", email: "", cpf: "", phone: "", bio: "", specialty: "", status: "active", courseIds: [] });
  }, [edit]);
  const save = async () => {
    if (!f.name || !f.email.includes("@")) { toast("Nome e e-mail válidos são obrigatórios.", "err"); return; }
    let teacherUser = one("users", (u) => u.email === f.email.toLowerCase());
    if (!teacherUser) {
      const { hashPw } = await import("../lib/api");
      teacherUser = insert("users", { name: f.name, email: f.email.toLowerCase(), passHash: await hashPw("Cyber@2026"), role: "teacher", status: "active" });
      audit(user, "CREATE", "users", teacherUser.id, `Usuário professor criado (senha inicial Cyber@2026)`);
    }
    if (edit && edit !== "new") {
      teachers.filter((t) => t.email === edit.email).forEach((t) => remove("teachers", t.id));
      update("users", teacherUser.id, { name: f.name, status: f.status });
    }
    const cids: string[] = f.courseIds || [];
    if (cids.length === 0) insert("teachers", { userId: teacherUser.id, name: f.name, email: f.email.toLowerCase(), cpf: f.cpf, phone: f.phone, bio: f.bio, specialty: f.specialty, status: f.status, courseIds: [] });
    else cids.forEach((cid) => insert("teachers", { userId: teacherUser.id, name: f.name, email: f.email.toLowerCase(), cpf: f.cpf, phone: f.phone, bio: f.bio, specialty: f.specialty, status: f.status, courseIds: [cid] }));
    // mantém cursos de vínculo anterior (multi-professor por curso)
    audit(user, edit === "new" ? "CREATE" : "UPDATE", "teachers", teacherUser.id, f.name);
    toast("Professor salvo. Login: " + f.email.toLowerCase() + " · senha inicial Cyber@2026", "ok");
    setEdit(null); refresh();
  };
  const toggleCourse = (cid: string) => {
    const cur: string[] = f.courseIds || [];
    setF({ ...f, courseIds: cur.includes(cid) ? cur.filter((x) => x !== cid) : [...cur, cid] });
  };
  return (
    <div>
      <PageHead kicker="SIA · corpo docente" title="Professores" desc="Cadastro com usuário de acesso e permissões limitadas aos cursos vinculados (RBAC)."
        right={<Btn v="e" onClick={() => setEdit("new")}><I n="plus" s={15} /> Novo professor</Btn>} />
      {uniq.length === 0 ? <Empty icon="cap" title="Nenhum professor" desc="Cadastre o corpo docente para vincular a cursos e turmas." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {uniq.map((t) => {
            const linked = teachers.filter((x) => x.email === t.email).flatMap((x) => x.courseIds || []);
            const linkedDirect = where("courses", (c) => c.teacherId === t.id).map((c) => c.id);
            const allLinked = [...new Set([...linked, ...linkedDirect])];
            return (
              <Card key={t.id} className="p-5">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-xl grid place-items-center font-display font-bold border border-cy-700 bg-cy-500/10 text-cy-300">{t.name.split(" ").slice(0, 2).map((p: string) => p[0]).join("")}</span>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-[15px] text-mist">{t.name}</h3>
                    <div className="font-mono text-[11px] text-dim">{t.email} · {t.specialty || "docente"}</div>
                  </div>
                  <Badge s={t.status === "active" ? "active" : "inactive"} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {allLinked.map((cid) => <Tag key={cid}>{find("courses", cid)?.title.slice(0, 24) || "curso"}</Tag>)}
                  {allLinked.length === 0 && <span className="cy-badge b-mist">sem cursos vinculados</span>}
                </div>
                <div className="flex gap-2 mt-4"><Btn v="g" sm onClick={() => setEdit(t)}><I n="edit" s={13} /> Editar</Btn></div>
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Novo professor" : "Editar professor"} w={640}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nome" req><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="E-mail (login)" req><TIn value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="CPF"><TIn value={f.cpf} onChange={(e) => setF({ ...f, cpf: e.target.value })} /></Field>
            <Field label="Telefone"><TIn value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Especialidade"><TIn value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })} placeholder="Ex.: Cibersegurança" /></Field>
            <Field label="Status"><TSel value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="active">Ativo</option><option value="inactive">Inativo</option></TSel></Field>
          </div>
          <Field label="Perfil profissional (bio)"><TArea rows={3} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
          <Field label="Cursos autorizados (permissões)" hint="O professor só acessa conteúdo e alunos destes cursos.">
            <div className="space-y-2">
              {courses.length === 0 && <p className="text-[12px] text-dim">Cadastre cursos primeiro.</p>}
              {courses.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 cy-card p-3 cursor-pointer hover:border-cy-600 transition-colors">
                  <input type="checkbox" className="accent-[#03A6A6]" checked={(f.courseIds || []).includes(c.id)} onChange={() => toggleCourse(c.id)} />
                  <span className="text-[13px] text-mist">{c.title}</span>
                </label>
              ))}
            </div>
          </Field>
          {edit === "new" && <p className="font-mono text-[11px] text-ember flex items-center gap-2"><I n="alert" s={13} /> usuário criado com senha inicial Cyber@2026</p>}
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setEdit(null)}>Cancelar</Btn><Btn v="e" onClick={save}>Salvar professor</Btn></div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= CURSOS ================= */
function Cursos() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [edit, setEdit] = useState<Row | null | "new">(null);
  const [del, setDel] = useState<Row | null>(null);
  const empty = {
    slug: "", title: "", subtitle: "", image: "", categoryId: "", teacherId: "", hours: 60, level: "Iniciante",
    description: "", objectives: "", audience: "", prerequisites: "", benefits: "", methodology: "", finalProject: "",
    certificateText: "concluiu o programa", price: 499, promoPrice: 0, promoActive: false, installments: 6, published: false,
    pricingModel: "one_time", monthlyPrice: 89, planMonths: 6, freeReenroll: true,
  };
  const [f, setF] = useState<Row>(empty);
  const courses = all("courses");
  const cats = all("course_categories");
  const teachers = all("teachers");
  const uniqT: Row[] = [];
  teachers.forEach((t) => { if (!uniqT.some((u) => u.email === t.email)) uniqT.push(t); });
  React.useEffect(() => {
    if (edit && edit !== "new") setF({ ...edit, objectives: (edit.objectives || []).join("\n"), audience: (edit.audience || []).join("\n"), prerequisites: (edit.prerequisites || []).join("\n"), benefits: (edit.benefits || []).join("\n") });
    else if (edit === "new") setF({ ...empty, categoryId: cats[0]?.id || "", teacherId: uniqT[0]?.id || "" });
  }, [edit]);
  const lines = (s: any) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const save = () => {
    if (!f.title || !f.slug) { toast("Título e slug são obrigatórios.", "err"); return; }
    if (courses.some((c) => c.slug === f.slug && c.id !== (edit !== "new" && edit ? edit.id : ""))) { toast("Este slug já existe.", "err"); return; }
    const payload = {
      ...f, hours: Number(f.hours), price: Number(f.price), promoPrice: Number(f.promoPrice) || 0, installments: Number(f.installments) || 1,
      objectives: lines(f.objectives), audience: lines(f.audience), prerequisites: lines(f.prerequisites), benefits: lines(f.benefits),
      pricingModel: f.pricingModel || "one_time", monthlyPrice: Number(f.monthlyPrice) || 0, planMonths: Number(f.planMonths) || 1,
      freeReenroll: !!f.freeReenroll,
    };
    if (edit && edit !== "new") { update("courses", edit.id, payload); audit(user, "UPDATE", "courses", edit.id, f.title); toast("Curso atualizado.", "ok"); }
    else { const c = insert("courses", payload); audit(user, "CREATE", "courses", c.id, f.title); toast("Curso criado! Agora monte módulos e aulas.", "ok"); }
    setEdit(null); refresh();
  };
  const publish = (c: Row) => {
    update("courses", c.id, { published: !c.published });
    audit(user, c.published ? "UNPUBLISH" : "PUBLISH", "courses", c.id, c.title);
    toast(c.published ? "Curso retirado do catálogo." : "Curso publicado no site!", "ok");
  };
  return (
    <div>
      <PageHead kicker="SIA · catálogo" title="Cursos" desc="Tudo que o admin cadastra aqui alimenta o site público em tempo real."
        right={<Btn v="e" onClick={() => setEdit("new")}><I n="plus" s={15} /> Novo curso</Btn>} />
      {courses.length === 0 ? <Empty icon="layers" title="Nenhum curso cadastrado" desc="Crie o primeiro curso para montar o catálogo da escola." /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="h-[110px] overflow-hidden relative">
                <CoverImg src={c.image} title={c.title} className="h-full" />
                <span className={`absolute top-2.5 right-2.5 cy-badge ${c.published ? "b-green" : "b-mist"}`}>{c.published ? "no site" : "oculto"}</span>
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-[14px] text-mist leading-snug">{c.title}</h3>
                <div className="font-mono text-[10.5px] text-dim mt-1.5">/{c.slug}</div>
                <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                  <div>
                    {c.pricingModel === "subscription" ? (
                      <span className="font-display font-bold text-cy-300 tnum text-[15px]">{fmtBRL(coursePricing(c).monthly)}<span className="text-[10px] font-normal text-dim">/mês</span></span>
                    ) : (
                      <span className="font-display font-bold text-ember tnum text-[15px]">{fmtBRL(effectivePrice(c))}</span>
                    )}
                    {c.freeReenroll && <span className="cy-badge b-amber ml-2"><I n="refresh" s={10} /> remat. grátis</span>}
                  </div>
                  <span className="font-mono text-[10.5px] text-dim">{c.hours}h · {where("lessons", (l) => l.courseId === c.id).length} aulas</span>
                </div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <a href={`#/admin/cursos/${c.id}`} className="cy-btn cy-btn-p px-3 py-1.5 text-[11px]"><I n="edit" s={12} /> Conteúdo</a>
                  <Btn v="g" sm onClick={() => setEdit(c)}><I n="gear" s={12} /> Dados</Btn>
                  <Btn v="x" sm onClick={() => publish(c)} title="Publicar/retirar"><I n={c.published ? "eye" : "lock"} s={12} /></Btn>
                  <Btn v="x" sm onClick={() => setDel(c)}><I n="trash" s={12} /></Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Novo curso" : "Dados do curso"} w={780}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Título" req><TIn value={f.title} onChange={(e) => setF({ ...f, title: e.target.value, slug: f.slug || e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} /></Field>
            <Field label="Slug (URL)" req><TIn value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="meu-curso" /></Field>
            <Field label="Subtítulo comercial"><TIn value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></Field>
            <Field label="Imagem (URL)"><TIn value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} placeholder="https://… (vazio = capa gerada)" /></Field>
            <Field label="Categoria">
              <TSel value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                {cats.length === 0 && <option value="">crie em Configurações</option>}
              </TSel>
            </Field>
            <Field label="Professor">
              <TSel value={f.teacherId} onChange={(e) => setF({ ...f, teacherId: e.target.value })}>
                <option value="">a definir</option>
                {uniqT.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </TSel>
            </Field>
            <Field label="Carga horária"><TIn type="number" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></Field>
            <Field label="Nível"><TSel value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}><option>Iniciante</option><option>Intermediário</option><option>Avançado</option><option>Iniciante ao Intermediário</option></TSel></Field>
            <Field label="Preço (R$)"><TIn type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
            <Field label="Preço promocional (0 = sem oferta)"><TIn type="number" value={f.promoPrice} onChange={(e) => setF({ ...f, promoPrice: e.target.value })} /></Field>
            <Field label="Parcelas máx."><TIn type="number" value={f.installments} onChange={(e) => setF({ ...f, installments: e.target.value })} /></Field>
            <Field label="Oferta ativa"><TSel value={String(!!f.promoActive)} onChange={(e) => setF({ ...f, promoActive: e.target.value === "true" })}><option value="false">Não</option><option value="true">Sim</option></TSel></Field>
          </div>
          <div className="border border-cy-700/50 rounded-lg p-4 bg-cy-900/20">
            <div className="font-mono text-[11px] tracking-[.16em] uppercase text-cy-400 mb-3 flex items-center gap-2"><I n="wallet" s={14} /> Modelo de cobrança</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="Tipo de venda">
                <TSel value={f.pricingModel} onChange={(e) => setF({ ...f, pricingModel: e.target.value })}>
                  <option value="one_time">Pagamento único</option>
                  <option value="subscription">Mensalidade (assinatura)</option>
                </TSel>
              </Field>
              {f.pricingModel === "subscription" && (
                <>
                  <Field label="Valor da mensalidade (R$)" hint="cobrada a cada ciclo via Mercado Pago"><TIn type="number" value={f.monthlyPrice} onChange={(e) => setF({ ...f, monthlyPrice: e.target.value })} /></Field>
                  <Field label="Nº de mensalidades (plano)" hint="ex.: 6 = plano semestral"><TIn type="number" value={f.planMonths} onChange={(e) => setF({ ...f, planMonths: e.target.value })} /></Field>
                </>
              )}
              <Field label="Rematrícula grátis" hint="após concluir, o aluno reativa o acesso sem pagar">
                <TSel value={String(!!f.freeReenroll)} onChange={(e) => setF({ ...f, freeReenroll: e.target.value === "true" })}><option value="false">Não</option><option value="true">Sim</option></TSel>
              </Field>
            </div>
          </div>
          <Field label="Descrição (página comercial)"><TArea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Objetivos (um por linha)"><TArea rows={4} value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} /></Field>
            <Field label="Público-alvo (um por linha)"><TArea rows={4} value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} /></Field>
            <Field label="Pré-requisitos (um por linha)"><TArea rows={3} value={f.prerequisites} onChange={(e) => setF({ ...f, prerequisites: e.target.value })} /></Field>
            <Field label="Benefícios (um por linha)"><TArea rows={3} value={f.benefits} onChange={(e) => setF({ ...f, benefits: e.target.value })} /></Field>
            <Field label="Metodologia"><TArea rows={3} value={f.methodology} onChange={(e) => setF({ ...f, methodology: e.target.value })} /></Field>
            <Field label="Projeto final"><TArea rows={3} value={f.finalProject} onChange={(e) => setF({ ...f, finalProject: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setEdit(null)}>Cancelar</Btn><Btn v="e" onClick={save}>Salvar curso</Btn></div>
        </div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} title="Excluir curso?" desc={`"${del?.title}" e sua estrutura serão removidos. Matrículas existentes permanecem no histórico (integridade acadêmica).`}
        onYes={() => { if (del) { ["course_modules", "lessons", "lesson_materials", "activities", "assessments", "projects"].forEach((t) => where(t, (r) => r.courseId === del.id).forEach((r) => remove(t, r.id))); remove("courses", del.id); audit(user, "DELETE", "courses", del.id, del.title); toast("Curso removido.", "ok"); } }} />
    </div>
  );
}

/* ================= TURMAS ================= */
function Turmas() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [edit, setEdit] = useState<Row | null | "new">(null);
  const [f, setF] = useState<Row>({ name: "", code: "", courseId: "", teacherId: "", start: "", end: "", capacity: 30, status: "PLANNED" });
  const classes = all("classes");
  const courses = all("courses");
  const teachers = all("teachers");
  React.useEffect(() => {
    if (edit && edit !== "new") setF({ ...edit, start: (edit.start || "").slice(0, 10), end: (edit.end || "").slice(0, 10) });
    else if (edit === "new") setF({ name: "", code: "", courseId: courses[0]?.id || "", teacherId: teachers[0]?.id || "", start: new Date().toISOString().slice(0, 10), end: "", capacity: 30, status: "PLANNED" });
  }, [edit]);
  const save = () => {
    if (!f.name || !f.courseId) { toast("Nome e curso obrigatórios.", "err"); return; }
    const payload = { ...f, capacity: Number(f.capacity) || 30, code: f.code || f.name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 14) };
    if (edit && edit !== "new") { update("classes", edit.id, payload); audit(user, "UPDATE", "classes", edit.id, f.name); }
    else { const k = insert("classes", payload); audit(user, "CREATE", "classes", k.id, f.name); }
    toast("Turma salva.", "ok"); setEdit(null); refresh();
  };
  return (
    <div>
      <PageHead kicker="SIA · turmas" title="Turmas" desc="Um curso pode ter várias turmas, cada uma com professor, período e capacidade."
        right={<Btn v="e" onClick={() => setEdit("new")}><I n="plus" s={15} /> Nova turma</Btn>} />
      {classes.length === 0 ? <Empty icon="cal" title="Nenhuma turma" desc="Crie turmas para organizar períodos e capacidade." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Turma</th><th>Código</th><th>Curso</th><th>Professor</th><th>Período</th><th>Alunos</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {classes.map((k) => (
                <tr key={k.id}>
                  <td className="text-mist font-semibold">{k.name}</td>
                  <td className="font-mono text-cy-300 text-[12px]">{k.code}</td>
                  <td>{find("courses", k.courseId)?.title.slice(0, 26)}</td>
                  <td>{find("teachers", k.teacherId)?.name || "—"}</td>
                  <td className="font-mono text-[11.5px]">{fmtDate(k.start)} → {fmtDate(k.end)}</td>
                  <td className="font-mono">{where("enrollments", (e) => e.classId === k.id && e.status !== "CANCELLED").length}/{k.capacity}</td>
                  <td><Badge s={k.status} /></td>
                  <td><Btn v="x" sm onClick={() => setEdit(k)}><I n="edit" s={13} /></Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Nova turma" : "Editar turma"} w={560}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nome" req><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Full-Stack · Turma 2026.2" /></Field>
            <Field label="Código"><TIn value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="gerado se vazio" /></Field>
            <Field label="Curso" req><TSel value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</TSel></Field>
            <Field label="Professor"><TSel value={f.teacherId} onChange={(e) => setF({ ...f, teacherId: e.target.value })}><option value="">—</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</TSel></Field>
            <Field label="Início"><TIn type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
            <Field label="Término"><TIn type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
            <Field label="Capacidade"><TIn type="number" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
            <Field label="Status"><TSel value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option>PLANNED</option><option>ACTIVE</option><option>FINISHED</option><option>CANCELLED</option></TSel></Field>
          </div>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setEdit(null)}>Cancelar</Btn><Btn v="e" onClick={save}>Salvar turma</Btn></div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= MATRÍCULAS ================= */
function Matriculas() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [manual, setManual] = useState(false);
  const [f, setF] = useState({ studentId: "", courseId: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const ens = all("enrollments").filter((e) => statusFilter === "all" || e.status === statusFilter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const students = all("users").filter((u) => u.role === "student");
  const createManual = () => {
    if (!f.studentId || !f.courseId) { toast("Selecione aluno e curso.", "err"); return; }
    if (one("enrollments", (e) => e.studentId === f.studentId && e.courseId === f.courseId && ["ACTIVE", "PENDING"].includes(e.status))) { toast("Aluno já possui matrícula ativa neste curso.", "err"); return; }
    const c = find("courses", f.courseId)!;
    const s = find("users", f.studentId)!;
    const e = insert("enrollments", { number: nextEnrollmentNumber(), studentId: f.studentId, courseId: f.courseId, status: "ACTIVE", origin: "manual-admin", startDate: new Date().toISOString(), dueDate: new Date(Date.now() + (c.hours || 60) * 2 * 86400e3).toISOString(), progress: 0 });
    audit(user, "ENROLLMENT", "enrollments", e.id, `Matrícula manual ${e.number} para ${s.name} · ${c.title}`);
    notify(f.studentId, "Matrícula criada", `Você foi matriculado(a) em ${c.title} pela administração (${e.number}).`, "enrollment");
    toast(`Matrícula ${e.number} criada.`, "ok"); setManual(false); refresh();
  };
  return (
    <div>
      <PageHead kicker="SIA · matrículas" title="Matrículas" desc="Numeradas pelo backend (CA + ano + sequência). Criadas via webhook ou manualmente."
        right={<Btn v="e" onClick={() => setManual(true)}><I n="plus" s={15} /> Matrícula manual</Btn>} />
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "PENDING", "ACTIVE", "SUSPENDED", "CANCELLED", "COMPLETED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`cy-btn px-3.5 py-1.5 text-[11.5px] ${statusFilter === s ? "cy-btn-p" : "cy-btn-g"}`}>{s === "all" ? "Todas" : s}</button>
        ))}
      </div>
      {ens.length === 0 ? <Empty icon="award" title="Nenhuma matrícula" desc="Matrículas nascem do checkout (webhook) ou por cadastro manual." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Nº</th><th>Aluno</th><th>Curso</th><th>Origem</th><th>Início</th><th>Progresso</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              {ens.map((e) => (
                <tr key={e.id}>
                  <td className="font-mono text-cy-300">{e.number}</td>
                  <td className="text-mist font-semibold">{find("users", e.studentId)?.name}</td>
                  <td>{find("courses", e.courseId)?.title.slice(0, 26)}</td>
                  <td className="font-mono text-[10.5px] uppercase">{e.origin}</td>
                  <td>{fmtDate(e.startDate)}</td>
                  <td className="font-mono tnum">{e.progress || 0}%</td>
                  <td><Badge s={e.status} /></td>
                  <td>
                    <TSel className="!w-auto !py-1 !text-[11.5px]" value={e.status} onChange={(ev) => { update("enrollments", e.id, { status: ev.target.value }); audit(user, "UPDATE", "enrollments", e.id, `${e.number} → ${ev.target.value}`); refresh(); }}>
                      {["PENDING", "ACTIVE", "SUSPENDED", "CANCELLED", "COMPLETED"].map((s) => <option key={s}>{s}</option>)}
                    </TSel>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={manual} onClose={() => setManual(false)} title="Matrícula manual" w={520}>
        <div className="space-y-4">
          <Field label="Aluno" req><TSel value={f.studentId} onChange={(e) => setF({ ...f, studentId: e.target.value })}><option value="">selecione…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.email}</option>)}</TSel></Field>
          <Field label="Curso" req><TSel value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}><option value="">selecione…</option>{all("courses").map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</TSel></Field>
          <p className="font-mono text-[11px] text-dim">O número da matrícula é gerado automaticamente pelo SIA.</p>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setManual(false)}>Cancelar</Btn><Btn v="e" onClick={createManual}>Criar matrícula</Btn></div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= FINANCEIRO ================= */
function Financeiro() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState("pedidos");
  const [refunding, setRefunding] = useState<Row | null>(null);
  const orders = all("orders").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pays = all("payments").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHead kicker="SIA · financeiro" title="Financeiro" desc="Pedidos e pagamentos processados pelo Mercado Pago, com transações e reembolsos." />
      <div className="flex gap-1 border-b border-line mb-5">
        {[["pedidos", `Pedidos (${orders.length})`], ["pagamentos", `Pagamentos (${pays.length})`], ["mensalidades", `Mensalidades (${all("installments").length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-display text-[12.5px] uppercase border-b-2 -mb-px ${tab === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent"}`}>{l}</button>
        ))}
      </div>
      {tab === "mensalidades" && (
        all("installments").length === 0 ? <Empty icon="wallet" title="Nenhuma mensalidade" desc="Cursos com modelo de assinatura geram um cronograma de mensalidades cobradas via Mercado Pago." /> : (
          <Card className="overflow-x-auto">
            <table className="cy-tbl">
              <thead><tr><th>Aluno</th><th>Curso</th><th>Ciclo</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
              <tbody>
                {all("installments").sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")).map((i) => (
                  <tr key={i.id}>
                    <td className="text-mist">{find("users", i.userId)?.name}</td>
                    <td>{find("courses", i.courseId)?.title.slice(0, 24)}</td>
                    <td className="font-mono text-cy-300">#{i.n}</td>
                    <td className="font-mono tnum text-ember">{fmtBRL(i.amount)}</td>
                    <td className="font-mono text-[11.5px]">{fmtDate(i.dueDate)}</td>
                    <td><Badge s={i.status === "paid" ? "paid" : i.status === "pending" ? "pending" : "draft"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}
      {tab === "pedidos" ? (
        orders.length === 0 ? <Empty icon="wallet" title="Nenhum pedido" desc="Pedidos são criados no checkout do site." /> : (
          <Card className="overflow-x-auto">
            <table className="cy-tbl">
              <thead><tr><th>Pedido</th><th>Aluno</th><th>Curso</th><th>Valor</th><th>Parcelas</th><th>Data</th><th>Status</th></tr></thead>
              <tbody>{orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-cy-300">{o.number}</td>
                  <td className="text-mist">{find("users", o.userId)?.name}</td>
                  <td>{find("courses", o.courseId)?.title.slice(0, 24)}</td>
                  <td className="font-mono tnum text-ember">{fmtBRL(o.amount)}</td>
                  <td className="font-mono">{o.installments}x</td>
                  <td>{fmtDT(o.createdAt)}</td>
                  <td><Badge s={o.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )
      ) : pays.length === 0 ? <Empty icon="card" title="Nenhum pagamento" /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>MP ID</th><th>Aluno</th><th>Método</th><th>Valor</th><th>Gateway</th><th>Pago em</th><th>Status</th><th></th></tr></thead>
            <tbody>{pays.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-cy-300 text-[11.5px]">{p.mpPaymentId}</td>
                <td className="text-mist">{find("users", p.userId)?.name}</td>
                <td className="font-mono uppercase text-[11px]">{p.method}</td>
                <td className="font-mono tnum text-ember">{fmtBRL(p.amount)}</td>
                <td><span className="cy-badge b-mp">Mercado Pago</span></td>
                <td>{p.paidAt ? fmtDT(p.paidAt) : "—"}</td>
                <td><Badge s={p.status} /></td>
                <td>{p.status === "approved" && <Btn v="d" sm onClick={() => setRefunding(p)}>Reembolsar</Btn>}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
      <Confirm open={!!refunding} onClose={() => setRefunding(null)} title="Processar reembolso?"
        desc={`O valor de ${fmtBRL(refunding?.amount || 0)} será estornado via Mercado Pago e a matrícula vinculada será cancelada (ação auditada).`}
        onYes={() => { if (refunding) { try { refundPayment(user!, refunding.id); toast("Reembolso processado.", "ok"); } catch (e: any) { toast(e.message, "err"); } refresh(); } }} />
    </div>
  );
}

/* ================= USUÁRIOS ================= */
function Usuarios() {
  const { user, refresh } = useApp();
  const users = all("users");
  return (
    <div>
      <PageHead kicker="SIA · acesso" title="Usuários & permissões" desc="Papéis: ALUNO, PROFESSOR, ADMIN e SUPORTE — o login redireciona cada um ao seu ambiente." />
      <Card className="overflow-x-auto">
        <table className="cy-tbl">
          <thead><tr><th>Usuário</th><th>E-mail</th><th>Papel</th><th>Criado</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="text-mist font-semibold">{u.name}{u.id === user!.id && <span className="font-mono text-[10px] text-cy-400 ml-2">(você)</span>}</td>
                <td className="font-mono text-[12px]">{u.email}</td>
                <td>
                  <TSel className="!w-auto !py-1 !text-[11.5px]" value={u.role} disabled={u.id === user!.id}
                    onChange={(e) => { update("users", u.id, { role: e.target.value }); audit(user, "ROLE_CHANGE", "users", u.id, `${u.name} → ${e.target.value}`); refresh(); }}>
                    {["student", "teacher", "admin", "support"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </TSel>
                </td>
                <td>{fmtDate(u.createdAt)}</td>
                <td><Badge s={u.status === "active" ? "active" : "inactive"} /></td>
                <td>{u.id !== user!.id && (
                  <Btn v="x" sm onClick={() => { update("users", u.id, { status: u.status === "active" ? "inactive" : "active" }); audit(user, "ROLE_CHANGE", "users", u.id, `${u.name} ${u.status === "active" ? "desativado" : "ativado"}`); refresh(); }}>
                    <I n={u.status === "active" ? "lock" : "check"} s={13} />
                  </Btn>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
