import React, { useState } from "react";
import { I } from "../components/icons";
import { AppShell, type NavItem } from "../components/layout";
import { Btn, Card, Badge, Empty, Field, TIn, TArea, TSel, Modal, Stat, Tag, PageHead, useToast, Bar } from "../components/ui";
import { useApp } from "../state";
import {
  createJobOpening, createCandidate, scheduleInterview, createEmployeeContract,
  createPerformanceReview, requestVacation,
  all, where, find, update, audit, notify,
  fmtBRL, fmtDate, type Row,
} from "../lib/api";

const NAV_RH: NavItem[] = [
  { to: "/rh", icon: "home", label: "Dashboard" },
  { to: "/rh/pessoas", icon: "users", label: "Gestão de Pessoas" },
  { to: "/rh/estrutura", icon: "layers", label: "Estrutura" },
  { to: "/rh/recrutamento", icon: "search", label: "Recrutamento" },
  { to: "/rh/contratos", icon: "file", label: "Contratos" },
  { to: "/rh/documentos", icon: "folder", label: "Documentos" },
  { to: "/rh/professores", icon: "cap", label: "Professores" },
  { to: "/rh/jornada", icon: "clock", label: "Jornada" },
  { to: "/rh/desempenho", icon: "chart", label: "Desempenho" },
  { to: "/rh/desenvolvimento", icon: "book", label: "Desenvolvimento" },
  { to: "/rh/beneficios", icon: "wallet", label: "Benefícios" },
  { to: "/rh/ferias", icon: "cal", label: "Férias" },
  { to: "/rh/comunicacao", icon: "msg", label: "Comunicação" },
  { to: "/rh/solicitacoes", icon: "term", label: "Solicitações" },
  { to: "/rh/relatorios", icon: "csv", label: "Relatórios" },
];

export function RHArea({ path }: { path: string }) {
  const segs = path.split("/").filter(Boolean);
  const sub = segs[1] || "";

  let page: React.ReactNode;
  switch (sub) {
    case "": page = <Dashboard />; break;
    case "pessoas": page = <GestaoPessoas />; break;
    case "estrutura": page = <Estrutura />; break;
    case "recrutamento": page = <Recrutamento />; break;
    case "contratos": page = <Contratos />; break;
    case "documentos": page = <Documentos />; break;
    case "professores": page = <ProfessoresRH />; break;
    case "jornada": page = <Jornada />; break;
    case "desempenho": page = <Desempenho />; break;
    case "desenvolvimento": page = <Desenvolvimento />; break;
    case "beneficios": page = <Beneficios />; break;
    case "ferias": page = <Ferias />; break;
    case "comunicacao": page = <Comunicacao />; break;
    case "solicitacoes": page = <Solicitacoes />; break;
    case "relatorios": page = <Relatorios />; break;
    default: page = <Dashboard />;
  }

  return (
    <AppShell title="RH · Cyber Academy" nav={NAV_RH} path={path}>
      {page}
    </AppShell>
  );
}

function Dashboard() {
  const employees = where("users", (u) => ["rh", "finance", "atendimento", "teacher", "support"].includes(u.role) && u.status === "active");
  const teachers = where("teachers", (t) => t.status === "active");
  const openings = where("job_openings", (o) => o.status === "open");
  const candidates = all("candidates");
  const vacations = where("vacations", (v) => v.status === "pending");
  const reviews = all("performance_reviews");

  return (
    <div>
      <PageHead kicker="RH · visão geral" title="Dashboard" desc="Gestão completa de pessoas, estrutura organizacional e desenvolvimento." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon="users" label="Colaboradores" value={employees.length} />
        <Stat icon="cap" label="Professores" value={teachers.length} />
        <Stat icon="search" label="Vagas abertas" value={openings.length} tone="amber" />
        <Stat icon="file" label="Candidatos" value={candidates.length} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="cal" s={16} c="text-cy-400" /> Férias pendentes</h3>
          {vacations.length === 0 ? <p className="text-[12.5px] text-dim">Nenhuma solicitação pendente.</p> : vacations.slice(0, 5).map((v) => {
            const u = find("users", v.userId);
            return (
              <div key={v.id} className="flex justify-between items-center py-2 border-b border-line/50 last:border-0">
                <span className="text-[13px] text-fog">{u?.name} · {v.days} dias</span>
                <Badge s="pending" />
              </div>
            );
          })}
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="chart" s={16} c="text-ember" /> Avaliações recentes</h3>
          {reviews.length === 0 ? <p className="text-[12.5px] text-dim">Nenhuma avaliação registrada.</p> : reviews.slice(-5).reverse().map((r) => {
            const u = find("users", r.userId);
            return (
              <div key={r.id} className="flex justify-between items-center py-2 border-b border-line/50 last:border-0">
                <span className="text-[13px] text-fog">{u?.name} · {r.period}</span>
                <span className="font-mono text-[12px] text-ember">{r.score}/10</span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function GestaoPessoas() {
  const { user } = useApp();
  const [tab, setTab] = useState("colaboradores");
  const employees = where("users", (u) => ["rh", "finance", "atendimento", "support"].includes(u.role));
  const teachers = all("teachers");
  const exEmployees = where("users", (u) => u.status === "inactive" && ["rh", "finance", "atendimento", "support", "teacher"].includes(u.role));

  return (
    <div>
      <PageHead kicker="RH · pessoas" title="Gestão de Pessoas" desc="Colaboradores, professores, gestores e prestadores." />
      <div className="flex gap-1 border-b border-line mb-6">
        {[["colaboradores", `Colaboradores (${employees.length})`], ["professores", `Professores (${teachers.length})`], ["ex", `Ex-colaboradores (${exEmployees.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-display text-[12.5px] uppercase border-b-2 -mb-px ${tab === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent"}`}>{l}</button>
        ))}
      </div>
      {tab === "colaboradores" && (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Nome</th><th>Cargo</th><th>Área</th><th>E-mail</th><th>Status</th></tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td className="text-mist font-semibold">{e.name}</td>
                  <td>{e.cargo || "—"}</td>
                  <td><Tag>{e.role.toUpperCase()}</Tag></td>
                  <td className="font-mono text-[11.5px]">{e.email}</td>
                  <td><Badge s={e.status === "active" ? "active" : "inactive"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {tab === "professores" && (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Nome</th><th>Especialidade</th><th>E-mail</th><th>Status</th></tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td className="text-mist font-semibold">{t.name}</td>
                  <td>{t.specialty || "—"}</td>
                  <td className="font-mono text-[11.5px]">{t.email}</td>
                  <td><Badge s={t.status === "active" ? "active" : "inactive"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {tab === "ex" && (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Nome</th><th>Última área</th><th>E-mail</th></tr></thead>
            <tbody>
              {exEmployees.map((e) => (
                <tr key={e.id}>
                  <td className="text-mist font-semibold">{e.name}</td>
                  <td><Tag tone="mist">{e.role.toUpperCase()}</Tag></td>
                  <td className="font-mono text-[11.5px]">{e.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Estrutura() {
  return (
    <div>
      <PageHead kicker="RH · organização" title="Estrutura Organizacional" desc="Organograma, departamentos, cargos e centros de custo." />
      <Empty icon="layers" title="Estrutura organizacional" desc="Configure departamentos, cargos, níveis hierárquicos e centros de custo para organizar a equipe." />
    </div>
  );
}

function Recrutamento() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState("vagas");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", department: "", level: "", description: "", requirements: "", salary: "" });
  const openings = all("job_openings");
  const candidates = all("candidates");

  const save = () => {
    if (!f.title) { toast("Título obrigatório.", "err"); return; }
    createJobOpening(user!, f);
    setOpen(false); setF({ title: "", department: "", level: "", description: "", requirements: "", salary: "" });
    toast("Vaga criada!", "ok"); refresh();
  };

  return (
    <div>
      <PageHead kicker="RH · talentos" title="Recrutamento e Seleção" desc="Vagas, candidatos, entrevistas e processos seletivos." right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Nova vaga</Btn>} />
      <div className="flex gap-1 border-b border-line mb-6">
        {[["vagas", `Vagas (${openings.length})`], ["candidatos", `Candidatos (${candidates.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-display text-[12.5px] uppercase border-b-2 -mb-px ${tab === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent"}`}>{l}</button>
        ))}
      </div>
      {tab === "vagas" && (
        openings.length === 0 ? <Empty icon="search" title="Nenhuma vaga" desc="Crie a primeira vaga para iniciar o recrutamento." /> : (
          <div className="grid md:grid-cols-2 gap-4">
            {openings.map((o) => (
              <Card key={o.id} className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-display font-semibold text-[15px] text-mist">{o.title}</h3>
                  <Badge s={o.status === "open" ? "active" : "inactive"} />
                </div>
                <div className="font-mono text-[11px] text-dim mb-2">{o.department} · {o.level}</div>
                <p className="text-[12.5px] text-fog line-clamp-2">{o.description}</p>
                {o.salary > 0 && <div className="mt-2 font-mono text-[12px] text-ember">{fmtBRL(o.salary)}</div>}
              </Card>
            ))}
          </div>
        )
      )}
      {tab === "candidatos" && (
        candidates.length === 0 ? <Empty icon="users" title="Nenhum candidato" desc="Os candidatos aparecerão aqui após se candidatarem às vagas." /> : (
          <Card className="overflow-x-auto">
            <table className="cy-tbl">
              <thead><tr><th>Nome</th><th>Vaga</th><th>E-mail</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td className="text-mist font-semibold">{c.name}</td>
                    <td>{find("job_openings", c.openingId)?.title || "—"}</td>
                    <td className="font-mono text-[11.5px]">{c.email}</td>
                    <td><Badge s={c.status} /></td>
                    <td className="font-mono text-[10.5px]">{fmtDate(c.appliedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova vaga" w={560}>
        <div className="space-y-3">
          <Field label="Título" req><TIn value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Departamento"><TIn value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></Field>
            <Field label="Nível"><TSel value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}><option value="">Selecione</option><option>Júnior</option><option>Pleno</option><option>Sênior</option><option>Especialista</option></TSel></Field>
          </div>
          <Field label="Descrição"><TArea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Requisitos"><TArea rows={3} value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })} /></Field>
          <Field label="Salário (R$)"><TIn type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={save}>Criar vaga</Btn></div>
      </Modal>
    </div>
  );
}

function Contratos() { return <div><PageHead kicker="RH" title="Contratos" desc="Contratos ativos, aditivos e renovações." /><Empty icon="file" title="Gestão de contratos" desc="Gerencie contratos de colaboradores, aditivos e renovações." /></div>; }
function Documentos() { return <div><PageHead kicker="RH" title="Documentos" desc="Documentos dos colaboradores e pendências." /><Empty icon="folder" title="Documentos" desc="Gerencie documentos de colaboradores, contratos e certificados." /></div>; }
function ProfessoresRH() { return <div><PageHead kicker="RH" title="Professores" desc="Cadastro, especialidades, formações e pagamentos." /><Empty icon="cap" title="Gestão de professores" desc="Cadastre especialidades, formações e gerencie pagamentos por hora." /></div>; }
function Jornada() { return <div><PageHead kicker="RH" title="Jornada e Atividades" desc="Controle de horas, entregas e aprovações." /><Empty icon="clock" title="Jornada" desc="Registre atividades, horas trabalhadas e aprovações." /></div>; }
function Desempenho() { return <div><PageHead kicker="RH" title="Desempenho" desc="Avaliações, metas, feedbacks e PDI." /><Empty icon="chart" title="Desempenho" desc="Realize avaliações de desempenho, defina metas e acompanhe indicadores." /></div>; }
function Desenvolvimento() { return <div><PageHead kicker="RH" title="Desenvolvimento" desc="Treinamentos, certificações e plano de carreira." /><Empty icon="book" title="Desenvolvimento" desc="Ofereça treinamentos, cursos internos e gerencie planos de carreira." /></div>; }
function Beneficios() { return <div><PageHead kicker="RH" title="Benefícios e Pagamentos" desc="Remuneração, comissões e benefícios." /><Empty icon="wallet" title="Benefícios" desc="Gerencie remuneração, comissões e benefícios dos colaboradores." /></div>; }
function Ferias() { return <div><PageHead kicker="RH" title="Férias e Ausências" desc="Calendário, solicitações e aprovações." /><Empty icon="cal" title="Férias" desc="Gerencie calendário de férias, solicitações e aprovações." /></div>; }
function Comunicacao() { return <div><PageHead kicker="RH" title="Comunicação" desc="Comunicados, avisos e mural." /><Empty icon="msg" title="Comunicação" desc="Envie comunicados, avisos e gerencie o mural interno." /></div>; }
function Solicitacoes() { return <div><PageHead kicker="RH" title="Solicitações" desc="Solicitações ao RH e alterações cadastrais." /><Empty icon="term" title="Solicitações" desc="Gerencie solicitações de documentos, alterações cadastrais e outros." /></div>; }
function Relatorios() { return <div><PageHead kicker="RH" title="Relatórios" desc="Pessoas, custos, desempenho e analytics." /><Empty icon="csv" title="Relatórios" desc="Gere relatórios de pessoas, custos, desempenho e analytics." /></div>; }
