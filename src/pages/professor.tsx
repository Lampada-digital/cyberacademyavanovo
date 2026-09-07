import React, { useState } from "react";
import { I } from "../components/icons";
import { AppShell, type NavItem } from "../components/layout";
import { Btn, Card, Badge, Empty, Field, TIn, TArea, TSel, Modal, Stat, Tag, PageHead, useToast, Bar } from "../components/ui";
import { useApp } from "../state";
import {
  createTeacherWorkspace, createLessonPlan, createVirtualLab, createGradingRubric,
  registerTeacherHour, approveContent,
  all, where, find, update, audit, notify,
  fmtBRL, fmtDate, type Row,
} from "../lib/api";

const NAV_PROF: NavItem[] = [
  { to: "/professor", icon: "home", label: "Dashboard" },
  { to: "/professor/formacoes", icon: "award", label: "Minhas Formações" },
  { to: "/professor/conteudo", icon: "layers", label: "Conteúdo" },
  { to: "/professor/atividades", icon: "check", label: "Atividades" },
  { to: "/professor/avaliacoes", icon: "edit", label: "Avaliações" },
  { to: "/professor/alunos", icon: "users", label: "Alunos" },
  { to: "/professor/comunicacao", icon: "msg", label: "Comunicação" },
  { to: "/professor/projetos", icon: "target", label: "Projetos" },
  { to: "/professor/laboratorios", icon: "flask", label: "Laboratórios" },
  { to: "/professor/producao", icon: "video", label: "Produção" },
  { to: "/professor/financeiro", icon: "wallet", label: "Financeiro" },
  { to: "/professor/relatorios", icon: "chart", label: "Relatórios" },
  { to: "/professor/perfil", icon: "user", label: "Perfil" },
];

export function ProfessorArea({ path }: { path: string }) {
  const { user } = useApp();
  const segs = path.split("/").filter(Boolean);
  const sub = segs[1] || "";

  // Verifica se é professor
  if (user?.role !== "teacher" && user?.role !== "admin") {
    return <Empty icon="lock" title="Acesso restrito" desc="Esta área é exclusiva para professores." />;
  }

  let page: React.ReactNode;
  switch (sub) {
    case "": page = <Dashboard />; break;
    case "formacoes": page = <Formacoes />; break;
    case "conteudo": page = <Conteudo />; break;
    case "atividades": page = <Atividades />; break;
    case "avaliacoes": page = <Avaliacoes />; break;
    case "alunos": page = <Alunos />; break;
    case "comunicacao": page = <Comunicacao />; break;
    case "projetos": page = <Projetos />; break;
    case "laboratorios": page = <Laboratorios />; break;
    case "producao": page = <Producao />; break;
    case "financeiro": page = <Financeiro />; break;
    case "relatorios": page = <Relatorios />; break;
    case "perfil": page = <Perfil />; break;
    default: page = <Dashboard />;
  }

  return (
    <AppShell title="Área do Professor · Cyber Academy" nav={NAV_PROF} path={path}>
      {page}
    </AppShell>
  );
}

function Dashboard() {
  const { user } = useApp();
  const teacher = find("teachers", user!.id);
  const courses = where("courses", (c) => c.teacherId === teacher?.id);
  const totalAulas = courses.reduce((sum, c) => sum + where("lessons", (l) => l.courseId === c.id).length, 0);
  const totalAlunos = courses.reduce((sum, c) => sum + where("enrollments", (e) => e.courseId === c.id && e.status === "ACTIVE").length, 0);
  const horasProduzidas = where("teacher_hours", (h) => h.teacherId === teacher?.id).reduce((sum, h) => sum + (h.hours || 0), 0);
  const valoresReceber = where("teacher_payments", (p) => p.teacherId === teacher?.id && p.status === "pending").reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div>
      <PageHead kicker="Professor · visão geral" title="Dashboard" desc={`Olá, ${user!.name}! Acompanhe suas turmas, produção e pagamentos.`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon="layers" label="Disciplinas" value={courses.length} />
        <Stat icon="book" label="Aulas" value={totalAulas} />
        <Stat icon="users" label="Alunos" value={totalAlunos} />
        <Stat icon="clock" label="Horas produzidas" value={`${horasProduzidas}h`} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="target" s={16} c="text-cy-400" /> Próximas atividades</h3>
          <Empty icon="target" title="Nenhuma atividade pendente" desc="Você está em dia com todas as atividades." />
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="wallet" s={16} c="text-ember" /> Financeiro</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-fog">Valores a receber</span>
              <span className="font-display font-bold text-[18px] text-ember">{fmtBRL(valoresReceber)}</span>
            </div>
            <Bar v={valoresReceber > 0 ? 50 : 0} tone="amber" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Formacoes() {
  return (
    <div>
      <PageHead kicker="Professor" title="Minhas Formações" desc="Formações vinculadas, disciplinas, turmas e calendário." />
      <Empty icon="award" title="Formações" desc="Visualize suas formações acadêmicas, disciplinas atribuídas e calendário de turmas." />
    </div>
  );
}

function Conteudo() {
  const { user } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", objectives: "", methodology: "", resources: "", evaluation: "", duration: "" });
  const teacher = find("teachers", user!.id);
  const plans = where("lesson_plans", (lp) => lp.teacherId === teacher?.id);

  const save = () => {
    if (!f.title) { toast("Título obrigatório.", "err"); return; }
    createLessonPlan(user!, { ...f, teacherId: teacher?.id });
    setOpen(false); setF({ title: "", objectives: "", methodology: "", resources: "", evaluation: "", duration: "" });
    toast("Plano de aula criado!", "ok");
  };

  return (
    <div>
      <PageHead kicker="Professor" title="Conteúdo" desc="Minhas aulas, upload de vídeo, materiais, PDFs, slides e links." right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Novo plano de aula</Btn>} />
      {plans.length === 0 ? <Empty icon="layers" title="Nenhum plano de aula" desc="Crie seu primeiro plano de aula para organizar o conteúdo." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((p) => (
            <Card key={p.id} className="p-5">
              <h3 className="font-display font-semibold text-[15px] text-mist mb-2">{p.title}</h3>
              <p className="text-[12.5px] text-fog line-clamp-2">{p.objectives}</p>
              <div className="flex gap-2 mt-3">
                <Badge s={p.status} />
                {p.duration && <Tag tone="mist">{p.duration}</Tag>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo plano de aula" w={640}>
        <div className="space-y-3">
          <Field label="Título" req><TIn value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Objetivos"><TArea rows={3} value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} /></Field>
          <Field label="Metodologia"><TArea rows={3} value={f.methodology} onChange={(e) => setF({ ...f, methodology: e.target.value })} /></Field>
          <Field label="Recursos"><TArea rows={2} value={f.resources} onChange={(e) => setF({ ...f, resources: e.target.value })} /></Field>
          <Field label="Avaliação"><TArea rows={2} value={f.evaluation} onChange={(e) => setF({ ...f, evaluation: e.target.value })} /></Field>
          <Field label="Duração"><TIn value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} placeholder="Ex.: 2h30" /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={save}>Criar plano</Btn></div>
      </Modal>
    </div>
  );
}

function Atividades() {
  return (
    <div>
      <PageHead kicker="Professor" title="Atividades" desc="Exercícios, trabalhos, projetos, desafios práticos e laboratórios." />
      <Empty icon="check" title="Atividades" desc="Crie exercícios, trabalhos, projetos e desafios práticos para seus alunos." />
    </div>
  );
}

function Avaliacoes() {
  return (
    <div>
      <PageHead kicker="Professor" title="Avaliações" desc="Criar avaliação, banco de questões, provas, questionários, correções e notas." />
      <Empty icon="edit" title="Avaliações" desc="Crie avaliações com banco de questões reutilizável, corrija e lance notas." />
    </div>
  );
}

function Alunos() {
  const { user } = useApp();
  const teacher = find("teachers", user!.id);
  const courses = where("courses", (c) => c.teacherId === teacher?.id);
  const enrollments = courses.flatMap((c) => where("enrollments", (e) => e.courseId === c.id && e.status === "ACTIVE"));

  return (
    <div>
      <PageHead kicker="Professor" title="Alunos" desc="Minhas turmas, lista de alunos, desempenho, frequência, notas e projetos." />
      {enrollments.length === 0 ? <Empty icon="users" title="Nenhum aluno" desc="Você ainda não tem alunos matriculados em suas disciplinas." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Aluno</th><th>Curso</th><th>Matrícula</th><th>Progresso</th><th>Status</th></tr></thead>
            <tbody>
              {enrollments.map((e) => {
                const student = find("users", e.studentId);
                const course = find("courses", e.courseId);
                return (
                  <tr key={e.id}>
                    <td className="text-mist font-semibold">{student?.name}</td>
                    <td>{course?.title.slice(0, 24)}</td>
                    <td className="font-mono text-[11px]">{e.number}</td>
                    <td><Bar v={e.progress || 0} /></td>
                    <td><Badge s={e.status} /></td>
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

function Comunicacao() {
  return (
    <div>
      <PageHead kicker="Professor" title="Comunicação" desc="Mensagens, avisos, comunicados e fórum de discussões." />
      <Empty icon="msg" title="Comunicação" desc="Envie mensagens, avisos e comunicados para suas turmas e alunos." />
    </div>
  );
}

function Projetos() {
  return (
    <div>
      <PageHead kicker="Professor" title="Projetos" desc="Projetos em andamento, entregas, correções e avaliação." />
      <Empty icon="target" title="Projetos" desc="Gerencie projetos em andamento, receba entregas, corrija e avalie." />
    </div>
  );
}

function Laboratorios() {
  const { user } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", description: "", instructions: "", environment: "", duration: "", maxAttempts: "3" });
  const teacher = find("teachers", user!.id);
  const courses = where("courses", (c) => c.teacherId === teacher?.id);
  const labs = courses.flatMap((c) => where("virtual_labs", (l) => l.courseId === c.id));

  const save = () => {
    if (!f.title) { toast("Título obrigatório.", "err"); return; }
    createVirtualLab(user!, { ...f, courseId: courses[0]?.id, moduleId: "" });
    setOpen(false); setF({ title: "", description: "", instructions: "", environment: "", duration: "", maxAttempts: "3" });
    toast("Laboratório virtual criado!", "ok");
  };

  return (
    <div>
      <PageHead kicker="Professor" title="Laboratórios Virtuais" desc="Crie laboratórios práticos para seus alunos executarem em ambiente controlado." right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Novo laboratório</Btn>} />
      {labs.length === 0 ? <Empty icon="flask" title="Nenhum laboratório" desc="Crie seu primeiro laboratório virtual para práticas hands-on." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {labs.map((l) => (
            <Card key={l.id} className="p-5">
              <h3 className="font-display font-semibold text-[15px] text-mist mb-2">{l.title}</h3>
              <p className="text-[12.5px] text-fog line-clamp-2">{l.description}</p>
              <div className="flex gap-2 mt-3">
                <Badge s={l.status} />
                {l.duration && <Tag tone="mist">{l.duration}</Tag>}
                {l.maxAttempts && <Tag tone="amber">{l.maxAttempts} tentativas</Tag>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo laboratório virtual" w={640}>
        <div className="space-y-3">
          <Field label="Título" req><TIn value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Descrição"><TArea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Instruções"><TArea rows={4} value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></Field>
          <Field label="Ambiente"><TIn value={f.environment} onChange={(e) => setF({ ...f, environment: e.target.value })} placeholder="Ex.: Linux, Python, Docker" /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Duração"><TIn value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} placeholder="Ex.: 2h" /></Field>
            <Field label="Máx. tentativas"><TIn type="number" value={f.maxAttempts} onChange={(e) => setF({ ...f, maxAttempts: e.target.value })} /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={save}>Criar laboratório</Btn></div>
      </Modal>
    </div>
  );
}

function Producao() {
  const { user } = useApp();
  const teacher = find("teachers", user!.id);
  const production = where("content_production", (cp) => cp.teacherId === teacher?.id);
  const approved = production.filter((p) => p.status === "approved").length;
  const pending = production.filter((p) => p.status === "pending").length;

  return (
    <div>
      <PageHead kicker="Professor" title="Produção de Conteúdo" desc="Horas produzidas, vídeos enviados, em revisão, aprovados, publicados e pendências." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon="video" label="Vídeos enviados" value={production.length} />
        <Stat icon="check" label="Aprovados" value={approved} />
        <Stat icon="clock" label="Em revisão" value={pending} />
        <Stat icon="book" label="Publicados" value={approved} />
      </div>
      {production.length === 0 ? <Empty icon="video" title="Nenhuma produção" desc="Envie vídeos e materiais para começar sua produção de conteúdo." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Título</th><th>Tipo</th><th>Duração</th><th>Status</th><th>Data</th></tr></thead>
            <tbody>
              {production.map((p) => (
                <tr key={p.id}>
                  <td className="text-mist font-semibold">{p.title}</td>
                  <td><Tag tone="mist">{p.type || "vídeo"}</Tag></td>
                  <td className="font-mono">{p.duration || "—"}</td>
                  <td><Badge s={p.status} /></td>
                  <td className="font-mono text-[10.5px]">{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Financeiro() {
  const { user } = useApp();
  const teacher = find("teachers", user!.id);
  const payments = where("teacher_payments", (p) => p.teacherId === teacher?.id);
  const pending = payments.filter((p) => p.status === "pending");
  const paid = payments.filter((p) => p.status === "paid");
  const totalPending = pending.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalPaid = paid.reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <div>
      <PageHead kicker="Professor" title="Financeiro" desc="Produção aprovada, horas publicadas, valor por hora, valores a receber, pagamentos e histórico." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Stat icon="wallet" label="A receber" value={fmtBRL(totalPending)} tone="amber" />
        <Stat icon="check" label="Recebido" value={fmtBRL(totalPaid)} />
        <Stat icon="clock" label="Horas publicadas" value={`${payments.reduce((sum, p) => sum + (p.hours || 0), 0)}h`} />
      </div>
      {payments.length === 0 ? <Empty icon="wallet" title="Nenhum pagamento" desc="Seus pagamentos aparecerão aqui conforme a produção for aprovada." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Período</th><th>Horas</th><th>Valor/hora</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="text-mist font-semibold">{p.period}</td>
                  <td className="font-mono">{p.hours}h</td>
                  <td className="font-mono">{fmtBRL(p.rate)}</td>
                  <td className="font-mono text-ember font-semibold">{fmtBRL(p.total)}</td>
                  <td><Badge s={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Relatorios() {
  return (
    <div>
      <PageHead kicker="Professor" title="Relatórios" desc="Desempenho das turmas, desempenho dos alunos, notas, frequência e produção." />
      <Empty icon="chart" title="Relatórios" desc="Gere relatórios de desempenho das turmas, alunos, notas, frequência e produção." />
    </div>
  );
}

function Perfil() {
  const { user } = useApp();
  return (
    <div>
      <PageHead kicker="Professor" title="Perfil" desc="Seus dados pessoais e profissionais." />
      <Card className="p-6 max-w-[600px]">
        <div className="space-y-4">
          <div>
            <div className="font-mono text-[10.5px] text-fog uppercase tracking-wider">Nome</div>
            <div className="text-[15px] text-mist font-semibold">{user!.name}</div>
          </div>
          <div>
            <div className="font-mono text-[10.5px] text-fog uppercase tracking-wider">E-mail</div>
            <div className="text-[15px] text-mist">{user!.email}</div>
          </div>
          <div>
            <div className="font-mono text-[10.5px] text-fog uppercase tracking-wider">Área</div>
            <div className="text-[15px] text-mist">Professor</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
