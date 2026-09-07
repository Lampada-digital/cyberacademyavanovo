import React, { useState } from "react";
import { I } from "../components/icons";
import { AppShell, type NavItem } from "../components/layout";
import { Btn, Card, Badge, Empty, Field, TIn, TArea, TSel, Modal, Stat, Tag, PageHead, useToast } from "../components/ui";
import { useApp } from "../state";
import {
  registerCall, createLead, updateLeadStatus, createCallCampaign,
  all, where, find, update, audit, notify,
  fmtDate, type Row,
} from "../lib/api";

const NAV_CC: NavItem[] = [
  { to: "/atendimento", icon: "home", label: "Dashboard" },
  { to: "/atendimento/fila", icon: "users", label: "Fila de Atendimento" },
  { to: "/atendimento/discador", icon: "term", label: "Discador" },
  { to: "/atendimento/crm", icon: "book", label: "CRM" },
  { to: "/atendimento/campanhas", icon: "chart", label: "Campanhas" },
  { to: "/atendimento/supervisor", icon: "shield", label: "Supervisor" },
];

export function AtendimentoArea({ path }: { path: string }) {
  const segs = path.split("/").filter(Boolean);
  const sub = segs[1] || "";

  let page: React.ReactNode;
  switch (sub) {
    case "": page = <Dashboard />; break;
    case "fila": page = <FilaAtendimento />; break;
    case "discador": page = <Discador />; break;
    case "crm": page = <CRM />; break;
    case "campanhas": page = <Campanhas />; break;
    case "supervisor": page = <Supervisor />; break;
    default: page = <Dashboard />;
  }

  return (
    <AppShell title="Call Center · Cyber Academy" nav={NAV_CC} path={path}>
      {page}
    </AppShell>
  );
}

function Dashboard() {
  const calls = all("call_records");
  const leads = all("leads");
  const campaigns = all("call_campaigns");
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((s, c) => s + (c.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  const convertedLeads = leads.filter((l) => l.status === "converted").length;
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

  return (
    <div>
      <PageHead kicker="Call Center · visão geral" title="Dashboard" desc="Chamadas, leads, conversões e indicadores de atendimento." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon="term" label="Chamadas realizadas" value={totalCalls} />
        <Stat icon="clock" label="Tempo médio" value={`${avgDuration}min`} />
        <Stat icon="users" label="Leads" value={leads.length} />
        <Stat icon="chart" label="Taxa de conversão" value={`${conversionRate}%`} tone="amber" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="term" s={16} c="text-cy-400" /> Últimas chamadas</h3>
          {calls.length === 0 ? <p className="text-[12.5px] text-dim">Nenhuma chamada registrada.</p> : calls.slice(-5).reverse().map((c) => {
            const lead = find("leads", c.leadId);
            return (
              <div key={c.id} className="flex justify-between items-center py-2 border-b border-line/50 last:border-0">
                <div>
                  <div className="text-[13px] text-mist font-semibold">{lead?.name || c.phone}</div>
                  <div className="font-mono text-[10.5px] text-dim">{fmtDate(c.calledAt)} · {c.duration}min</div>
                </div>
                <Badge s={c.outcome === "converted" ? "active" : c.outcome === "interested" ? "pending" : "inactive"} />
              </div>
            );
          })}
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="users" s={16} c="text-ember" /> Leads recentes</h3>
          {leads.length === 0 ? <p className="text-[12.5px] text-dim">Nenhum lead cadastrado.</p> : leads.slice(-5).reverse().map((l) => (
            <div key={l.id} className="flex justify-between items-center py-2 border-b border-line/50 last:border-0">
              <div>
                <div className="text-[13px] text-mist font-semibold">{l.name}</div>
                <div className="font-mono text-[10.5px] text-dim">{l.interest || "—"}</div>
              </div>
              <Badge s={l.status} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function FilaAtendimento() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ leadId: "", phone: "", direction: "outbound", duration: "", outcome: "", notes: "" });
  const calls = all("call_records").sort((a, b) => (b.calledAt || "").localeCompare(a.calledAt || ""));
  const leads = all("leads");

  const save = () => {
    if (!f.phone) { toast("Telefone obrigatório.", "err"); return; }
    registerCall(user!, { ...f, agentId: user!.id, duration: Number(f.duration) || 0 });
    setOpen(false); setF({ leadId: "", phone: "", direction: "outbound", duration: "", outcome: "", notes: "" });
    toast("Chamada registrada!", "ok"); refresh();
  };

  return (
    <div>
      <PageHead kicker="Call Center" title="Fila de Atendimento" desc="Histórico de chamadas, resultados e observações." right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Registrar chamada</Btn>} />
      {calls.length === 0 ? <Empty icon="term" title="Nenhuma chamada" desc="Registre a primeira chamada para acompanhar o histórico." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Lead/Telefone</th><th>Direção</th><th>Duração</th><th>Resultado</th><th>Data</th><th>Observações</th></tr></thead>
            <tbody>
              {calls.map((c) => {
                const lead = find("leads", c.leadId);
                return (
                  <tr key={c.id}>
                    <td className="text-mist font-semibold">{lead?.name || c.phone}</td>
                    <td><Tag tone={c.direction === "outbound" ? "teal" : "amber"}>{c.direction === "outbound" ? "Saída" : "Entrada"}</Tag></td>
                    <td className="font-mono">{c.duration}min</td>
                    <td><Badge s={c.outcome === "converted" ? "active" : c.outcome === "interested" ? "pending" : "inactive"} /></td>
                    <td className="font-mono text-[10.5px]">{fmtDate(c.calledAt)}</td>
                    <td className="text-[11.5px] text-fog max-w-[200px] truncate">{c.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar chamada" w={560}>
        <div className="space-y-3">
          <Field label="Lead">
            <TSel value={f.leadId} onChange={(e) => setF({ ...f, leadId: e.target.value })}>
              <option value="">Selecione…</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>)}
            </TSel>
          </Field>
          <Field label="Telefone" req><TIn value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="(11) 99999-9999" /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Direção">
              <TSel value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value })}>
                <option value="outbound">Saída</option>
                <option value="inbound">Entrada</option>
              </TSel>
            </Field>
            <Field label="Duração (min)"><TIn type="number" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></Field>
          </div>
          <Field label="Resultado">
            <TSel value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })}>
              <option value="">Selecione…</option>
              <option value="converted">Convertido (matrícula)</option>
              <option value="interested">Interessado</option>
              <option value="callback">Retorno agendado</option>
              <option value="not_interested">Não interessado</option>
              <option value="no_answer">Sem resposta</option>
            </TSel>
          </Field>
          <Field label="Observações"><TArea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={save}>Salvar chamada</Btn></div>
      </Modal>
    </div>
  );
}

function Discador() {
  return (
    <div>
      <PageHead kicker="Call Center" title="Discador" desc="Discagem manual, automática e campanhas de ligação." />
      <Empty icon="term" title="Discador" desc="Configure discagem automática, listas de contatos e campanhas de ligação." />
    </div>
  );
}

function CRM() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", source: "", interest: "" });
  const leads = all("leads").sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const save = () => {
    if (!f.name || !f.phone) { toast("Nome e telefone obrigatórios.", "err"); return; }
    createLead(user!, f);
    setOpen(false); setF({ name: "", email: "", phone: "", source: "", interest: "" });
    toast("Lead cadastrado!", "ok"); refresh();
  };

  const updateStatus = (id: string, status: string) => {
    updateLeadStatus(user!, id, status);
    toast("Status atualizado.", "ok"); refresh();
  };

  return (
    <div>
      <PageHead kicker="Call Center" title="CRM · Leads" desc="Gestão de leads, histórico de contatos e funil de vendas." right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Novo lead</Btn>} />
      {leads.length === 0 ? <Empty icon="users" title="Nenhum lead" desc="Cadastre o primeiro lead para iniciar o acompanhamento comercial." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Nome</th><th>Telefone</th><th>Origem</th><th>Interesse</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="text-mist font-semibold">{l.name}</td>
                  <td className="font-mono text-[11.5px]">{l.phone}</td>
                  <td>{l.source || "—"}</td>
                  <td>{l.interest || "—"}</td>
                  <td>
                    <TSel value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} className="!py-1 !text-[11px] !w-auto">
                      <option value="new">Novo</option>
                      <option value="contacted">Contatado</option>
                      <option value="qualified">Qualificado</option>
                      <option value="proposal">Proposta</option>
                      <option value="converted">Convertido</option>
                      <option value="lost">Perdido</option>
                    </TSel>
                  </td>
                  <td className="font-mono text-[10.5px] text-dim">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo lead" w={520}>
        <div className="space-y-3">
          <Field label="Nome" req><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="E-mail"><TIn type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Telefone" req><TIn value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="(11) 99999-9999" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Origem"><TIn value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} placeholder="Ex.: Site, Instagram" /></Field>
            <Field label="Interesse"><TIn value={f.interest} onChange={(e) => setF({ ...f, interest: e.target.value })} placeholder="Ex.: Cibersegurança" /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={save}>Cadastrar lead</Btn></div>
      </Modal>
    </div>
  );
}

function Campanhas() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const campaigns = all("call_campaigns");

  const save = () => {
    if (!f.name) { toast("Nome obrigatório.", "err"); return; }
    createCallCampaign(user!, f);
    setOpen(false); setF({ name: "", description: "", startDate: "", endDate: "" });
    toast("Campanha criada!", "ok"); refresh();
  };

  return (
    <div>
      <PageHead kicker="Call Center" title="Campanhas" desc="Campanhas de ligação, matrícula e recuperação." right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Nova campanha</Btn>} />
      {campaigns.length === 0 ? <Empty icon="chart" title="Nenhuma campanha" desc="Crie campanhas de ligação para matrícula, recuperação de leads, etc." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-semibold text-[15px] text-mist">{c.name}</h3>
                <Badge s={c.status} />
              </div>
              <p className="text-[12.5px] text-fog line-clamp-2">{c.description}</p>
              <div className="font-mono text-[10.5px] text-dim mt-2">{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova campanha" w={520}>
        <div className="space-y-3">
          <Field label="Nome" req><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Descrição"><TArea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Início"><TIn type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
            <Field label="Término"><TIn type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={save}>Criar campanha</Btn></div>
      </Modal>
    </div>
  );
}

function Supervisor() {
  const calls = all("call_records");
  const leads = all("leads");
  const convertedLeads = leads.filter((l) => l.status === "converted").length;
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

  return (
    <div>
      <PageHead kicker="Call Center · supervisão" title="Supervisor" desc="Visão geral da equipe, produtividade e qualidade." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon="users" label="Leads convertidos" value={convertedLeads} />
        <Stat icon="chart" label="Taxa de conversão" value={`${conversionRate}%`} tone="amber" />
        <Stat icon="term" label="Chamadas totais" value={calls.length} />
        <Stat icon="clock" label="Tempo total" value={`${calls.reduce((s, c) => s + (c.duration || 0), 0)}min`} />
      </div>
      <Card className="p-5">
        <h3 className="font-display font-semibold text-[14px] text-mist mb-3">Indicadores da equipe</h3>
        <Empty icon="shield" title="Supervisão" desc="Acompanhe produtividade, qualidade e metas da equipe de atendimento." />
      </Card>
    </div>
  );
}
