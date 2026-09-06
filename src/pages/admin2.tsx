import React, { useState } from "react";
import { I } from "../components/icons";
import { Btn, Card, Badge, Empty, Field, TIn, TArea, TSel, Modal, PageHead, useToast, Confirm, Tag, CoverImg } from "../components/ui";
import { useApp, navigate } from "../state";
import {
  replyTicket, downloadCSV, wipeDB, coursePricing, effectivePrice,
  all, where, find, insert, update, remove, audit, notify,
  fmtBRL, fmtDate, fmtDT, type Row, getSettings, setSettings,
} from "../lib/api";

/* ================= SUPORTE (console — admin e suporte) ================= */
export function TicketsConsole() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<Row | null>(null);
  const [reply, setReply] = useState("");
  const tickets = all("support_tickets").filter((t) => filter === "all" || t.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const msgs = sel ? where("ticket_messages", (m) => m.ticketId === sel.id) : [];
  const send = (close = false) => {
    if (!sel || (!reply && !close)) return;
    if (reply) replyTicket(user!, sel.id, reply, close);
    else { update("support_tickets", sel.id, { status: "closed" }); audit(user, "UPDATE", "support_tickets", sel.id, "Chamado encerrado"); }
    setReply(""); refresh();
    toast(close ? "Chamado encerrado." : "Resposta enviada ao aluno.", "ok");
  };
  return (
    <div>
      <PageHead kicker="SIA · atendimento" title="Central de suporte" desc="Chamados abertos por alunos e visitantes, com histórico completo." />
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "open", "answered", "closed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`cy-btn px-3.5 py-1.5 text-[11.5px] ${filter === s ? "cy-btn-p" : "cy-btn-g"}`}>{s === "all" ? `Todos (${all("support_tickets").length})` : s}</button>
        ))}
      </div>
      {tickets.length === 0 ? <Empty icon="msg" title="Nenhum chamado" desc="Chamados abertos no portal do aluno e no formulário do site chegam aqui." /> : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const last = where("ticket_messages", (m) => m.ticketId === t.id).sort((a, b) => b.at.localeCompare(a.at))[0];
            return (
              <Card key={t.id} hover className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setSel(t)}>
                <span className="w-10 h-10 rounded-lg grid place-items-center bg-cy-500/10 border border-cy-700 text-cy-400"><I n="msg" s={18} /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><span className="text-[13.5px] text-mist font-semibold">{t.subject}</span><Tag tone="mist">{t.category}</Tag></div>
                  <div className="font-mono text-[10.5px] text-dim mt-0.5">{t.userName} · {fmtDT(t.createdAt)}{last ? ` · última msg ${fmtDT(last.at)}` : ""}</div>
                </div>
                <Badge s={t.status} />
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.subject || ""} w={680}>
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {msgs.map((m) => (
            <div key={m.id} className={`cy-card p-4 ${m.authorRole === "student" || m.authorRole === "visitante" ? "" : "border-cy-700"}`}>
              <div className="flex justify-between font-mono text-[10.5px] text-dim">
                <span className={m.authorRole === "student" || m.authorRole === "visitante" ? "text-fog" : "text-cy-400"}>{m.authorName} · {m.authorRole}</span><span>{fmtDT(m.at)}</span>
              </div>
              <p className="text-[13px] text-fog mt-2 whitespace-pre-line">{m.text}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <input className="cy-in flex-1" placeholder="Escrever resposta…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(false)} />
          <Btn v="p" onClick={() => send(false)}><I n="send" s={15} /></Btn>
          <Btn v="d" onClick={() => send(true)}>Encerrar</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ================= DISPATCHER (evita conflito de hooks entre módulos) ================= */
export function AdminSystem({ kind }: { kind: string }) {
  if (kind === "relatorios") return <ReportsAdmin />;
  if (kind === "notificacoes") return <NotifyAdmin />;
  if (kind === "auditoria") return <AuditAdmin />;
  if (kind === "emails") return <EmailsAdmin />;
  return <ConfigAdmin />;
}

/* ================= RELATÓRIOS ================= */
function ReportsAdmin() {
  const toast = useToast();
  const [rep, setRep] = useState("matriculas");
  const reports: Record<string, { title: string; rows: () => Row[]; cols: [string, string][] }> = {
    alunos: { title: "Alunos", rows: () => all("users").filter((u) => u.role === "student"), cols: [["name", "Nome"], ["email", "E-mail"], ["cpf", "CPF"], ["status", "Status"], ["createdAt", "Cadastro"]] },
    matriculas: { title: "Matrículas", rows: () => all("enrollments").map((e) => ({ ...e, aluno: find("users", e.studentId)?.name, curso: find("courses", e.courseId)?.title })), cols: [["number", "Nº"], ["aluno", "Aluno"], ["curso", "Curso"], ["origin", "Origem"], ["startDate", "Início"], ["progress", "Progresso %"], ["status", "Situação"]] },
    cursos: { title: "Cursos", rows: () => all("courses").map((c) => ({ ...c, aulas: where("lessons", (l) => l.courseId === c.id).length, alunos: where("enrollments", (e) => e.courseId === c.id).length })), cols: [["title", "Título"], ["level", "Nível"], ["hours", "Horas"], ["price", "Preço"], ["aulas", "Aulas"], ["alunos", "Alunos"], ["published", "Publicado"]] },
    notas: { title: "Notas", rows: () => all("grades").map((g) => ({ ...g, aluno: find("users", g.studentId)?.name, pct: g.max ? Math.round((g.score / g.max) * 100) + "%" : "" })), cols: [["aluno", "Aluno"], ["refTitle", "Entrega"], ["kind", "Tipo"], ["score", "Nota"], ["max", "Máx"], ["pct", "%"], ["gradedBy", "Avaliador"]] },
    frequencia: { title: "Frequência", rows: () => all("attendance").map((a) => ({ ...a, aluno: find("users", a.studentId)?.name, aula: find("lessons", a.lessonId)?.title })), cols: [["aluno", "Aluno"], ["aula", "Aula"], ["date", "Data"], ["status", "Situação"], ["justification", "Justificativa"]] },
    progresso: { title: "Progresso", rows: () => all("enrollments").map((e) => ({ ...e, aluno: find("users", e.studentId)?.name, curso: find("courses", e.courseId)?.title })), cols: [["aluno", "Aluno"], ["curso", "Curso"], ["progress", "Progresso %"], ["status", "Situação"]] },
    certificados: { title: "Certificados", rows: () => all("certificates").map((c) => ({ ...c, validacoes: where("certificate_validations", (v) => v.code === c.code).length })), cols: [["code", "Código"], ["studentName", "Aluno"], ["courseTitle", "Curso"], ["hours", "Horas"], ["issuedAt", "Emissão"], ["validacoes", "Validações"]] },
    vendas: { title: "Vendas (pedidos)", rows: () => all("orders").map((o) => ({ ...o, aluno: find("users", o.userId)?.name, curso: find("courses", o.courseId)?.title })), cols: [["number", "Pedido"], ["aluno", "Aluno"], ["curso", "Curso"], ["amount", "Valor"], ["installments", "Parcelas"], ["status", "Status"]] },
    pagamentos: { title: "Pagamentos", rows: () => all("payments").map((p) => ({ ...p, aluno: find("users", p.userId)?.name })), cols: [["mpPaymentId", "MP ID"], ["aluno", "Aluno"], ["method", "Método"], ["amount", "Valor"], ["status", "Status"], ["paidAt", "Pago em"]] },
  };
  const r = reports[rep];
  const rows = r.rows();
  return (
    <div>
      <PageHead kicker="SIA · relatórios" title="Relatórios" desc="Dados consolidados do banco com exportação CSV." />
      <div className="flex gap-2 flex-wrap mb-5">
        {Object.entries(reports).map(([k, v]) => (
          <button key={k} onClick={() => setRep(k)} className={`cy-btn px-3.5 py-1.5 text-[11.5px] ${rep === k ? "cy-btn-p" : "cy-btn-g"}`}>{v.title}</button>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11.5px] text-dim">{rows.length} registro(s)</span>
        <Btn v="e" sm onClick={() => { downloadCSV(`sia-${rep}-${new Date().toISOString().slice(0, 10)}.csv`, rows, r.cols); toast("CSV exportado.", "ok"); }}><I n="csv" s={14} /> Exportar CSV</Btn>
      </div>
      {rows.length === 0 ? <Empty icon="chart" title="Sem registros" desc="Este relatório reflete o banco — ainda não há dados." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr>{r.cols.map(([, l]) => <th key={l}>{l}</th>)}</tr></thead>
            <tbody>{rows.map((row, i) => (
              <tr key={i}>{r.cols.map(([k]) => <td key={k} className={k === "amount" ? "font-mono tnum" : ""}>{k === "amount" ? fmtBRL(row[k]) : k === "published" ? (row[k] ? "sim" : "não") : String(row[k] ?? "—").slice(0, 60)}</td>)}</tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ================= NOTIFICAÇÕES ================= */
function NotifyAdmin() {
  const { user } = useApp();
  const toast = useToast();
  const [nf, setNf] = useState({ target: "all", title: "", body: "" });
  const courses = all("courses");
  const sent = all("notifications").sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15);
  const sendN = () => {
    if (!nf.title || !nf.body) { toast("Título e mensagem obrigatórios.", "err"); return; }
    const targets = nf.target === "all"
      ? all("users").filter((u) => u.role === "student" && u.status === "active")
      : where("enrollments", (e) => e.courseId === nf.target && e.status === "ACTIVE").map((e) => find("users", e.studentId)).filter((u): u is Row => !!u);
    if (!targets.length) { toast("Nenhum aluno no alvo selecionado.", "err"); return; }
    targets.forEach((u) => notify(u.id, nf.title, nf.body, "info"));
    audit(user, "CREATE", "notifications", "", `"${nf.title}" → ${targets.length} aluno(s)`);
    toast(`Notificação enviada a ${targets.length} aluno(s).`, "ok");
    setNf({ target: "all", title: "", body: "" });
  };
  return (
    <div>
      <PageHead kicker="SIA · comunicação" title="Notificações" desc="Comunique alunos no portal (nova aula, avisos, manutenção…)." />
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <Card className="p-5 space-y-4">
          <Field label="Destinatários">
            <TSel value={nf.target} onChange={(e) => setNf({ ...nf, target: e.target.value })}>
              <option value="all">Todos os alunos ativos</option>
              {courses.map((c) => <option key={c.id} value={c.id}>Matriculados em: {c.title.slice(0, 30)}</option>)}
            </TSel>
          </Field>
          {nf.target !== "all" && <p className="font-mono text-[11px] text-dim">Alvos: {where("enrollments", (e) => e.courseId === nf.target && e.status === "ACTIVE").length} matrícula(s) ativas</p>}
          <Field label="Título" req><TIn value={nf.title} onChange={(e) => setNf({ ...nf, title: e.target.value })} placeholder="Ex.: Nova aula publicada" /></Field>
          <Field label="Mensagem" req><TArea rows={4} value={nf.body} onChange={(e) => setNf({ ...nf, body: e.target.value })} /></Field>
          <Btn v="e" className="w-full" onClick={sendN}><I n="send" s={15} /> Enviar notificação</Btn>
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3">Últimas enviadas</h3>
          <div className="space-y-2.5">
            {sent.length === 0 && <p className="text-[12.5px] text-dim">Nenhuma notificação no sistema.</p>}
            {sent.map((n) => (
              <div key={n.id} className="cy-card p-3">
                <div className="flex justify-between"><span className="text-[12.5px] text-mist font-semibold">{n.title}</span><span className="font-mono text-[10px] text-dim">{fmtDT(n.at)}</span></div>
                <div className="text-[11.5px] text-dim mt-0.5">para {find("users", n.userId)?.name}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= AUDITORIA ================= */
function AuditAdmin() {
  const [ev, setEv] = useState("all");
  const events = [...new Set(all("audit_logs").map((a) => a.event))].sort();
  const logs = all("audit_logs").filter((a) => ev === "all" || a.event === ev).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 120);
  return (
    <div>
      <PageHead kicker="SIA · segurança" title="Auditoria" desc="Trilha completa de eventos: login, pagamentos, webhooks, notas, publicações, reembolsos…" />
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setEv("all")} className={`cy-btn px-3.5 py-1.5 text-[11.5px] ${ev === "all" ? "cy-btn-p" : "cy-btn-g"}`}>Todos</button>
        {events.map((e) => <button key={e} onClick={() => setEv(e)} className={`cy-btn px-3.5 py-1.5 text-[11.5px] ${ev === e ? "cy-btn-p" : "cy-btn-g"}`}>{e}</button>)}
      </div>
      {logs.length === 0 ? <Empty icon="shield" title="Sem eventos" /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Quando</th><th>Evento</th><th>Ator</th><th>Entidade</th><th>Detalhe</th></tr></thead>
            <tbody>{logs.map((a) => (
              <tr key={a.id}>
                <td className="font-mono text-[11px] whitespace-nowrap">{fmtDT(a.at)}</td>
                <td><span className={`cy-badge ${["WEBHOOK_RECEIVED", "WEBHOOK_PROCESSED", "PAYMENT", "REFUND"].includes(a.event) ? "b-mp" : ["GRADE_CHANGE", "CERTIFICATE_GENERATED"].includes(a.event) ? "b-amber" : ["DELETE", "UNPUBLISH"].includes(a.event) ? "b-coral" : "b-teal"}`}>{a.event}</span></td>
                <td className="text-mist">{a.actorName}</td>
                <td className="font-mono text-[11px]">{a.entity}</td>
                <td className="text-fog max-w-[340px] truncate">{a.detail || "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ================= EMAILS ================= */
function EmailsAdmin() {
  const mails = all("emails").sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div>
      <PageHead kicker="SIA · comunicação" title="Caixa de saída (e-mails)" desc="E-mails transacionais disparados pelo SIA: cadastro, pagamento, matrícula, notas e certificados." />
      {mails.length === 0 ? <Empty icon="mail" title="Nenhum e-mail" desc="Os e-mails transacionais aparecem aqui (em produção, via SMTP/SES)." /> : (
        <Card className="divide-y divide-line/60">
          {mails.map((m) => (
            <div key={m.id} className="px-5 py-4 flex items-start gap-4">
              <I n="mail" s={18} c="text-cy-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-3"><span className="text-[13px] text-mist font-semibold truncate">{m.subject}</span><span className="font-mono text-[10.5px] text-dim shrink-0">{fmtDT(m.at)}</span></div>
                <div className="font-mono text-[11px] text-cy-300 mt-0.5">para {m.to}</div>
                <p className="text-[12.5px] text-fog mt-1.5">{m.body}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ================= CONFIGURAÇÕES ================= */
function ConfigAdmin() {
  const { user } = useApp();
  const toast = useToast();
  const s = getSettings();
  const [cfg, setCfg] = useState<Row>({ ...s });
  const [resetOpen, setResetOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [faqF, setFaqF] = useState({ q: "", a: "" });
  const [postF, setPostF] = useState({ title: "", excerpt: "", body: "", tag: "Carreira", author: "" });
  const cats = all("course_categories");
  const faqs = all("faqs").sort((a, b) => a.order - b.order);
  const posts = all("posts");
  const saveCfg = () => { setSettings({ ...cfg, passScore: Number(cfg.passScore) || 70 }); audit(user, "UPDATE", "settings", "", "Configurações do SIA atualizadas"); toast("Configurações salvas.", "ok"); };
  return (
    <div className="space-y-6 max-w-[900px]">
      <PageHead kicker="SIA · administração" title="Configurações" desc="Parâmetros acadêmicos, gateway e conteúdo institucional do site." />

      <Card className="p-6">
        <h3 className="font-display font-semibold text-[15px] text-mist mb-4 flex items-center gap-2"><I n="gear" s={16} c="text-cy-400" /> Parâmetros acadêmicos & gateway</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome da instituição"><TIn value={cfg.schoolName} onChange={(e) => setCfg({ ...cfg, schoolName: e.target.value })} /></Field>
          <Field label="Média mínima de aprovação (%)"><TIn type="number" value={cfg.passScore} onChange={(e) => setCfg({ ...cfg, passScore: e.target.value })} /></Field>
          <Field label="Assinante do certificado"><TIn value={cfg.certSigner} onChange={(e) => setCfg({ ...cfg, certSigner: e.target.value })} /></Field>
          <Field label="MP Public Key (frontend)"><TIn value={cfg.mpPublicKey} onChange={(e) => setCfg({ ...cfg, mpPublicKey: e.target.value })} placeholder="APP_USR-…" /></Field>
          <Field label="Exigir projeto aprovado para concluir"><TSel value={String(!!cfg.completionRequireProject)} onChange={(e) => setCfg({ ...cfg, completionRequireProject: e.target.value === "true" })}><option value="true">Sim</option><option value="false">Não</option></TSel></Field>
        </div>
        <p className="font-mono text-[10.5px] text-dim mt-3 flex items-center gap-2"><I n="lock" s={12} /> {s.mpAccessTokenHint}</p>
        <Btn v="p" className="mt-4" onClick={saveCfg}>Salvar configurações</Btn>
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-[15px] text-mist mb-4 flex items-center gap-2"><I n="layers" s={16} c="text-cy-400" /> Categorias do catálogo</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {cats.map((c: Row) => (
            <span key={c.id} className="cy-badge b-teal">{c.name}
              <button className="ml-1 hover:text-coral" onClick={() => { remove("course_categories", c.id); toast("Categoria removida.", "ok"); }}><I n="x" s={11} /></button>
            </span>
          ))}
          {cats.length === 0 && <span className="text-[12px] text-dim">Nenhuma categoria.</span>}
        </div>
        <div className="flex gap-2 max-w-[420px]">
          <TIn placeholder="Nova categoria (ex.: Mobile)" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <Btn v="g" onClick={() => { if (!catName) return; insert("course_categories", { name: catName, order: cats.length + 1 }); setCatName(""); toast("Categoria criada.", "ok"); }}><I n="plus" s={14} /></Btn>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-[15px] text-mist mb-4 flex items-center gap-2"><I n="msg" s={16} c="text-cy-400" /> FAQ do site</h3>
        <div className="space-y-2 mb-4">
          {faqs.map((fq: Row) => (
            <div key={fq.id} className="cy-card p-3 flex items-start gap-3">
              <div className="flex-1"><div className="text-[12.5px] text-mist font-semibold">{fq.q}</div><div className="text-[11.5px] text-dim mt-0.5 line-clamp-1">{fq.a}</div></div>
              <Btn v="x" sm onClick={() => remove("faqs", fq.id)}><I n="trash" s={13} /></Btn>
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          <TIn placeholder="Pergunta" value={faqF.q} onChange={(e) => setFaqF({ ...faqF, q: e.target.value })} />
          <TArea rows={2} placeholder="Resposta" value={faqF.a} onChange={(e) => setFaqF({ ...faqF, a: e.target.value })} />
          <Btn v="g" className="self-start" onClick={() => { if (!faqF.q) return; insert("faqs", { ...faqF, order: faqs.length + 1 }); setFaqF({ q: "", a: "" }); toast("FAQ publicado.", "ok"); }}><I n="plus" s={14} /> Adicionar ao FAQ</Btn>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-[15px] text-mist mb-4 flex items-center gap-2"><I n="file" s={16} c="text-cy-400" /> Blog</h3>
        <div className="space-y-2 mb-4">
          {posts.map((p: Row) => (
            <div key={p.id} className="cy-card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0"><div className="text-[12.5px] text-mist font-semibold truncate">{p.title}</div><div className="font-mono text-[10px] text-dim">{p.tag} · {p.author}</div></div>
              <Btn v="x" sm onClick={() => remove("posts", p.id)}><I n="trash" s={13} /></Btn>
            </div>
          ))}
          {posts.length === 0 && <p className="text-[12px] text-dim">Nenhum artigo.</p>}
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <TIn placeholder="Título do artigo" value={postF.title} onChange={(e) => setPostF({ ...postF, title: e.target.value })} />
          <TIn placeholder="Tag (ex.: Carreira)" value={postF.tag} onChange={(e) => setPostF({ ...postF, tag: e.target.value })} />
          <TIn placeholder="Resumo" value={postF.excerpt} onChange={(e) => setPostF({ ...postF, excerpt: e.target.value })} className="sm:col-span-2" />
          <TArea rows={3} placeholder="Conteúdo do artigo" value={postF.body} onChange={(e) => setPostF({ ...postF, body: e.target.value })} className="sm:col-span-2" />
        </div>
        <Btn v="g" className="mt-3" onClick={() => {
          if (!postF.title || !postF.body) { toast("Título e conteúdo obrigatórios.", "err"); return; }
          insert("posts", { ...postF, slug: postF.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-"), author: postF.author || user!.name, published: true, at: new Date().toISOString() });
          audit(user, "PUBLISH", "posts", "", postF.title);
          setPostF({ title: "", excerpt: "", body: "", tag: "Carreira", author: "" }); toast("Artigo publicado no blog.", "ok");
        }}><I n="plus" s={14} /> Publicar artigo</Btn>
      </Card>

      <Card className="p-6 border-coral/30">
        <h3 className="font-display font-semibold text-[15px] text-coral mb-2 flex items-center gap-2"><I n="alert" s={16} /> Zona de perigo</h3>
        <p className="text-[12.5px] text-fog leading-relaxed">Restaura o estado de produção vazio: remove todos os dados (alunos, cursos, matrículas, pagamentos…) e volta à tela de configuração inicial.</p>
        <Btn v="d" className="mt-4" onClick={() => setResetOpen(true)}><I n="trash" s={14} /> Resetar banco para produção vazia</Btn>
      </Card>
      <Confirm open={resetOpen} onClose={() => setResetOpen(false)} title="Resetar todo o SIA?" desc="Todos os registros serão apagados e o sistema voltará ao estado de produção vazia (setup inicial). Esta ação não pode ser desfeita."
        onYes={() => { audit(user, "DELETE", "database", "", "Reset completo solicitado pelo admin"); wipeDB(); navigate("/setup"); }} />
    </div>
  );
}

/* ================= CONTEÚDO DO SITE (CMS) ================= */
export function SiteCMS() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState("cursos");
  const s = getSettings();
  const [site, setSite] = useState<Row>({ ...s });
  const [edit, setEdit] = useState<Row | null>(null);
  const [catName, setCatName] = useState("");
  const [faqF, setFaqF] = useState({ q: "", a: "" });
  const [postF, setPostF] = useState({ title: "", excerpt: "", body: "", tag: "Carreira", author: "" });
  const courses = all("courses");
  const cats = all("course_categories");
  const faqs = all("faqs").sort((a, b) => a.order - b.order);
  const posts = all("posts");
  const lines = (v: any) => String(v || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const saveCourse = () => {
    if (!edit) return;
    update("courses", edit.id, {
      ...edit, hours: Number(edit.hours), price: Number(edit.price), promoPrice: Number(edit.promoPrice) || 0,
      monthlyPrice: Number(edit.monthlyPrice) || 0, planMonths: Number(edit.planMonths) || 1,
      objectives: lines(edit.objectives), audience: lines(edit.audience), prerequisites: lines(edit.prerequisites), benefits: lines(edit.benefits),
    });
    audit(user, "UPDATE", "courses", edit.id, edit.title); toast("Curso atualizado — o site já reflete a mudança.", "ok");
    setEdit(null); refresh();
  };
  return (
    <div>
      <PageHead kicker="SIA · CMS" title="Conteúdo do site" desc="Alimente o site público em tempo real: cursos (grade, preço, modelo de cobrança), textos institucionais, FAQ, blog e categorias." />
      <div className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
        {[["cursos", `Cursos (${courses.length})`], ["institucional", "Institucional"], ["faq", `FAQ (${faqs.length})`], ["blog", `Blog (${posts.length})`], ["categorias", "Categorias"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-display text-[12.5px] uppercase whitespace-nowrap border-b-2 -mb-px ${tab === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent hover:text-mist"}`}>{l}</button>
        ))}
      </div>

      {tab === "cursos" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-[12.5px] text-fog">Edite aqui o que aparece na página comercial de cada curso. Para módulos e aulas, use “Gerenciar conteúdo”.</p>
            <a href="#/admin/cursos" className="cy-btn cy-btn-e px-4 py-2 text-[12px]"><I n="plus" s={14} /> Novo curso completo</a>
          </div>
          {courses.length === 0 ? <Empty icon="layers" title="Nenhum curso" desc="Crie o primeiro curso para montar o catálogo."><a href="#/admin/cursos" className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px]">Criar curso</a></Empty> : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((c) => {
                const p = coursePricing(c);
                const lessons = where("lessons", (l) => l.courseId === c.id && l.published).length;
                return (
                  <Card key={c.id} className="overflow-hidden">
                    <div className="h-[100px] overflow-hidden relative"><CoverImg src={c.image} title={c.title} className="h-full" />
                      <span className={`absolute top-2.5 right-2.5 cy-badge ${c.published ? "b-green" : "b-mist"}`}>{c.published ? "no site" : "oculto"}</span></div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-[14px] text-mist leading-snug">{c.title}</h3>
                      <div className="font-mono text-[10px] text-dim mt-1">{c.hours}h · {lessons} aulas · /{c.slug}</div>
                      <div className="mt-2 text-[13px]">{p.model === "subscription" ? <span className="font-display font-bold text-cy-300 tnum">{fmtBRL(p.monthly)}<span className="text-[10px] font-normal text-dim">/mês</span></span> : <span className="font-display font-bold text-ember tnum">{fmtBRL(effectivePrice(c))}</span>}</div>
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        <Btn v="g" sm onClick={() => setEdit({ ...c, objectives: (c.objectives || []).join("\n"), audience: (c.audience || []).join("\n"), prerequisites: (c.prerequisites || []).join("\n"), benefits: (c.benefits || []).join("\n") })}><I n="edit" s={12} /> Editar</Btn>
                        <a href={`#/admin/cursos/${c.id}`} className="cy-btn cy-btn-x px-2.5 py-1.5 text-[11px]"><I n="layers" s={12} /> Conteúdo</a>
                        <Btn v="x" sm onClick={() => { update("courses", c.id, { published: !c.published }); audit(user, c.published ? "UNPUBLISH" : "PUBLISH", "courses", c.id, c.title); toast(c.published ? "Retirado do site." : "Publicado no site!", "ok"); refresh(); }}><I n={c.published ? "eye" : "lock"} s={12} /></Btn>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "institucional" && (
        <Card className="p-6 max-w-[820px]">
          <h3 className="font-display font-semibold text-[15px] text-mist mb-4 flex items-center gap-2"><I n="globe" s={16} c="text-cy-400" /> Textos que alimentam o site</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome da instituição"><TIn value={site.schoolName} onChange={(e) => setSite({ ...site, schoolName: e.target.value })} /></Field>
            <Field label="Slogan (topo)"><TIn value={site.slogan} onChange={(e) => setSite({ ...site, slogan: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Título de destaque (home)"><TIn value={site.heroTitle} onChange={(e) => setSite({ ...site, heroTitle: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Subtítulo (home)"><TArea rows={2} value={site.heroSub} onChange={(e) => setSite({ ...site, heroSub: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Texto institucional (página Sobre)"><TArea rows={4} value={site.aboutText} onChange={(e) => setSite({ ...site, aboutText: e.target.value })} /></Field></div>
            <Field label="E-mail de contato"><TIn value={site.contactEmail} onChange={(e) => setSite({ ...site, contactEmail: e.target.value })} /></Field>
            <Field label="Telefone"><TIn value={site.contactPhone} onChange={(e) => setSite({ ...site, contactPhone: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Endereço"><TIn value={site.contactAddress} onChange={(e) => setSite({ ...site, contactAddress: e.target.value })} /></Field></div>
          </div>
          <Btn v="p" className="mt-5" onClick={() => { setSettings(site); audit(user, "UPDATE", "settings", "", "Conteúdo institucional do site atualizado"); toast("Site atualizado.", "ok"); refresh(); }}>Publicar no site</Btn>
        </Card>
      )}

      {tab === "faq" && (
        <Card className="p-6 max-w-[720px]">
          <div className="space-y-2 mb-4">
            {faqs.map((fq: Row) => (
              <div key={fq.id} className="cy-card p-3 flex items-start gap-3">
                <div className="flex-1"><div className="text-[12.5px] text-mist font-semibold">{fq.q}</div><div className="text-[11.5px] text-dim mt-0.5 line-clamp-1">{fq.a}</div></div>
                <Btn v="x" sm onClick={() => { remove("faqs", fq.id); toast("FAQ removido.", "ok"); }}><I n="trash" s={13} /></Btn>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <TIn placeholder="Pergunta" value={faqF.q} onChange={(e) => setFaqF({ ...faqF, q: e.target.value })} />
            <TArea rows={2} placeholder="Resposta" value={faqF.a} onChange={(e) => setFaqF({ ...faqF, a: e.target.value })} />
            <Btn v="g" className="self-start" onClick={() => { if (!faqF.q) return; insert("faqs", { ...faqF, order: faqs.length + 1 }); setFaqF({ q: "", a: "" }); toast("FAQ publicado no site.", "ok"); }}><I n="plus" s={14} /> Adicionar ao FAQ</Btn>
          </div>
        </Card>
      )}

      {tab === "blog" && (
        <Card className="p-6 max-w-[820px]">
          <div className="space-y-2 mb-4">
            {posts.map((p: Row) => (
              <div key={p.id} className="cy-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0"><div className="text-[12.5px] text-mist font-semibold truncate">{p.title}</div><div className="font-mono text-[10px] text-dim">{p.tag} · {p.author}</div></div>
                <Btn v="x" sm onClick={() => { remove("posts", p.id); toast("Artigo removido.", "ok"); }}><I n="trash" s={13} /></Btn>
              </div>
            ))}
            {posts.length === 0 && <p className="text-[12px] text-dim">Nenhum artigo.</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <TIn placeholder="Título do artigo" value={postF.title} onChange={(e) => setPostF({ ...postF, title: e.target.value })} />
            <TIn placeholder="Tag (ex.: Carreira)" value={postF.tag} onChange={(e) => setPostF({ ...postF, tag: e.target.value })} />
            <TIn placeholder="Resumo" value={postF.excerpt} onChange={(e) => setPostF({ ...postF, excerpt: e.target.value })} className="sm:col-span-2" />
            <TArea rows={3} placeholder="Conteúdo do artigo" value={postF.body} onChange={(e) => setPostF({ ...postF, body: e.target.value })} className="sm:col-span-2" />
          </div>
          <Btn v="g" className="mt-3" onClick={() => {
            if (!postF.title || !postF.body) { toast("Título e conteúdo obrigatórios.", "err"); return; }
            insert("posts", { ...postF, slug: postF.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-"), author: postF.author || user!.name, published: true, at: new Date().toISOString() });
            audit(user, "PUBLISH", "posts", "", postF.title);
            setPostF({ title: "", excerpt: "", body: "", tag: "Carreira", author: "" }); toast("Artigo publicado no blog.", "ok");
          }}><I n="plus" s={14} /> Publicar artigo</Btn>
        </Card>
      )}

      {tab === "categorias" && (
        <Card className="p-6 max-w-[620px]">
          <div className="flex flex-wrap gap-2 mb-4">
            {cats.map((c: Row) => (
              <span key={c.id} className="cy-badge b-teal">{c.name}
                <button className="ml-1 hover:text-coral" onClick={() => { remove("course_categories", c.id); toast("Categoria removida.", "ok"); }}><I n="x" s={11} /></button>
              </span>
            ))}
            {cats.length === 0 && <span className="text-[12px] text-dim">Nenhuma categoria.</span>}
          </div>
          <div className="flex gap-2 max-w-[420px]">
            <TIn placeholder="Nova categoria (ex.: Mobile)" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <Btn v="g" onClick={() => { if (!catName) return; insert("course_categories", { name: catName, order: cats.length + 1 }); setCatName(""); toast("Categoria criada.", "ok"); }}><I n="plus" s={14} /></Btn>
          </div>
        </Card>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Editar curso (conteúdo do site)" w={720}>
        {edit && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Título" req><TIn value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
              <Field label="Slug (URL)"><TIn value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></Field>
              <Field label="Subtítulo comercial"><TIn value={edit.subtitle} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} /></Field>
              <Field label="Imagem (URL)"><TIn value={edit.image} onChange={(e) => setEdit({ ...edit, image: e.target.value })} placeholder="vazio = capa gerada" /></Field>
              <Field label="Carga horária (h)"><TIn type="number" value={edit.hours} onChange={(e) => setEdit({ ...edit, hours: e.target.value })} /></Field>
              <Field label="Nível"><TSel value={edit.level} onChange={(e) => setEdit({ ...edit, level: e.target.value })}><option>Iniciante</option><option>Intermediário</option><option>Avançado</option><option>Iniciante ao Intermediário</option></TSel></Field>
              <Field label="Modelo de cobrança"><TSel value={edit.pricingModel} onChange={(e) => setEdit({ ...edit, pricingModel: e.target.value })}><option value="one_time">Pagamento único</option><option value="subscription">Mensalidade</option></TSel></Field>
              {edit.pricingModel === "subscription" ? (
                <>
                  <Field label="Mensalidade (R$)"><TIn type="number" value={edit.monthlyPrice} onChange={(e) => setEdit({ ...edit, monthlyPrice: e.target.value })} /></Field>
                  <Field label="Nº de mensalidades"><TIn type="number" value={edit.planMonths} onChange={(e) => setEdit({ ...edit, planMonths: e.target.value })} /></Field>
                </>
              ) : (
                <>
                  <Field label="Preço (R$)"><TIn type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></Field>
                  <Field label="Preço promo (0 = sem)"><TIn type="number" value={edit.promoPrice} onChange={(e) => setEdit({ ...edit, promoPrice: e.target.value })} /></Field>
                </>
              )}
              <Field label="Rematrícula grátis"><TSel value={String(!!edit.freeReenroll)} onChange={(e) => setEdit({ ...edit, freeReenroll: e.target.value === "true" })}><option value="false">Não</option><option value="true">Sim</option></TSel></Field>
            </div>
            <Field label="Descrição (página comercial)"><TArea rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setEdit(null)}>Cancelar</Btn><Btn v="e" onClick={saveCourse}>Salvar e publicar</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
