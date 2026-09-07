import React, { useState } from "react";
import { I } from "../components/icons";
import { AppShell, type NavItem } from "../components/layout";
import { Btn, Card, Badge, Empty, Field, TIn, TArea, TSel, Modal, Stat, Tag, PageHead, useToast, Bar } from "../components/ui";
import { useApp } from "../state";
import {
  createInvoice, createExpense, payInvoice, createBudget,
  all, where, find, update, audit, notify,
  fmtBRL, fmtDate, type Row, effectivePrice,
} from "../lib/api";

const NAV_FIN: NavItem[] = [
  { to: "/financeiro", icon: "home", label: "Dashboard" },
  { to: "/financeiro/receber", icon: "wallet", label: "Contas a Receber" },
  { to: "/financeiro/pagar", icon: "wallet", label: "Contas a Pagar" },
  { to: "/financeiro/alunos", icon: "users", label: "Alunos" },
  { to: "/financeiro/professores", icon: "cap", label: "Professores" },
  { to: "/financeiro/comercial", icon: "chart", label: "Comercial" },
  { to: "/financeiro/parceiros", icon: "globe", label: "Escolas Parceiras" },
  { to: "/financeiro/fluxo", icon: "chart", label: "Fluxo de Caixa" },
  { to: "/financeiro/bancos", icon: "wallet", label: "Bancos" },
  { to: "/financeiro/mercadopago", icon: "wallet", label: "Mercado Pago" },
  { to: "/financeiro/orcamento", icon: "book", label: "Orçamento" },
  { to: "/financeiro/fiscal", icon: "file", label: "Fiscal" },
  { to: "/financeiro/relatorios", icon: "csv", label: "Relatórios" },
];

export function FinanceArea({ path }: { path: string }) {
  const segs = path.split("/").filter(Boolean);
  const sub = segs[1] || "";

  let page: React.ReactNode;
  switch (sub) {
    case "": page = <Dashboard />; break;
    case "receber": page = <ContasReceber />; break;
    case "pagar": page = <ContasPagar />; break;
    case "alunos": page = <FinanceiroAlunos />; break;
    case "professores": page = <FinanceiroProfessores />; break;
    case "comercial": page = <Comercial />; break;
    case "parceiros": page = <Parceiros />; break;
    case "fluxo": page = <FluxoCaixa />; break;
    case "bancos": page = <Bancos />; break;
    case "mercadopago": page = <MercadoPago />; break;
    case "orcamento": page = <Orcamento />; break;
    case "fiscal": page = <Fiscal />; break;
    case "relatorios": page = <Relatorios />; break;
    default: page = <Dashboard />;
  }

  return (
    <AppShell title="Financeiro · Cyber Academy" nav={NAV_FIN} path={path}>
      {page}
    </AppShell>
  );
}

function Dashboard() {
  const orders = all("orders").filter((o) => o.status === "paid");
  const payments = all("payments").filter((p) => p.status === "approved");
  const invoices = all("invoices");
  const expenses = all("accounts_payable");
  const totalReceita = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalDespesas = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const inadimplentes = invoices.filter((i) => i.status === "pending" && new Date(i.dueDate) < new Date());

  return (
    <div>
      <PageHead kicker="Financeiro · visão geral" title="Dashboard" desc="Contas a receber, pagar, fluxo de caixa e indicadores financeiros." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon="wallet" label="Receita total" value={fmtBRL(totalReceita)} />
        <Stat icon="wallet" label="Despesas" value={fmtBRL(totalDespesas)} tone="amber" />
        <Stat icon="chart" label="Saldo" value={fmtBRL(totalReceita - totalDespesas)} />
        <Stat icon="alert" label="Inadimplentes" value={inadimplentes.length} tone="amber" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="wallet" s={16} c="text-cy-400" /> Últimos recebimentos</h3>
          {payments.length === 0 ? <p className="text-[12.5px] text-dim">Nenhum pagamento recebido.</p> : payments.slice(-5).reverse().map((p) => {
            const u = find("users", p.userId);
            return (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-line/50 last:border-0">
                <span className="text-[13px] text-fog">{u?.name} · {p.method}</span>
                <span className="font-mono text-[12px] text-cy-300">{fmtBRL(p.amount)}</span>
              </div>
            );
          })}
        </Card>
        <Card className="p-5">
          <h3 className="font-display font-semibold text-[14px] text-mist mb-3 flex items-center gap-2"><I n="alert" s={16} c="text-ember" /> Contas a pagar</h3>
          {expenses.length === 0 ? <p className="text-[12.5px] text-dim">Nenhuma despesa pendente.</p> : expenses.slice(0, 5).map((e) => (
            <div key={e.id} className="flex justify-between items-center py-2 border-b border-line/50 last:border-0">
              <span className="text-[13px] text-fog">{e.description}</span>
              <span className="font-mono text-[12px] text-ember">{fmtBRL(e.amount)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ContasReceber() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ userId: "", courseId: "", amount: "", dueDate: "", type: "tuition" });
  const invoices = all("invoices").sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  const users = where("users", (u) => u.role === "student");
  const courses = all("courses");

  const save = () => {
    if (!f.userId || !f.amount || !f.dueDate) { toast("Preencha todos os campos.", "err"); return; }
    createInvoice(user!, f);
    setOpen(false); setF({ userId: "", courseId: "", amount: "", dueDate: "", type: "tuition" });
    toast("Fatura criada!", "ok"); refresh();
  };

  return (
    <div>
      <PageHead kicker="Financeiro" title="Contas a Receber" desc="Mensalidades, matrículas, parcelamentos e cobranças." right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Nova fatura</Btn>} />
      {invoices.length === 0 ? <Empty icon="wallet" title="Nenhuma fatura" desc="Crie a primeira fatura para controlar os recebimentos." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Aluno</th><th>Curso</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {invoices.map((i) => {
                const u = find("users", i.userId);
                const c = find("courses", i.courseId);
                const late = i.status === "pending" && new Date(i.dueDate) < new Date();
                return (
                  <tr key={i.id}>
                    <td className="text-mist font-semibold">{u?.name || "—"}</td>
                    <td>{c?.title.slice(0, 24) || "—"}</td>
                    <td className="font-mono text-cy-300">{fmtBRL(i.amount)}</td>
                    <td className="font-mono text-[11.5px]">{fmtDate(i.dueDate)}</td>
                    <td>{late ? <Badge s="overdue" /> : <Badge s={i.status} />}</td>
                    <td>{i.status === "pending" && <Btn v="p" sm onClick={() => { payInvoice(user!, i.id, "manual"); toast("Fatura marcada como paga.", "ok"); refresh(); }}><I n="check" s={13} /> Pagar</Btn>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova fatura" w={520}>
        <div className="space-y-3">
          <Field label="Aluno" req>
            <TSel value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}>
              <option value="">Selecione…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </TSel>
          </Field>
          <Field label="Curso">
            <TSel value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}>
              <option value="">Selecione…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </TSel>
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Valor (R$)" req><TIn type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Vencimento" req><TIn type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
          </div>
          <Field label="Tipo">
            <TSel value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              <option value="tuition">Mensalidade</option>
              <option value="enrollment">Matrícula</option>
              <option value="installment">Parcela</option>
              <option value="other">Outro</option>
            </TSel>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={save}>Criar fatura</Btn></div>
      </Modal>
    </div>
  );
}

function ContasPagar() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ description: "", category: "", amount: "", dueDate: "", supplier: "" });
  const expenses = all("accounts_payable").sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  const save = () => {
    if (!f.description || !f.amount || !f.dueDate) { toast("Preencha todos os campos.", "err"); return; }
    createExpense(user!, f);
    setOpen(false); setF({ description: "", category: "", amount: "", dueDate: "", supplier: "" });
    toast("Despesa registrada!", "ok"); refresh();
  };

  return (
    <div>
      <PageHead kicker="Financeiro" title="Contas a Pagar" desc="Fornecedores, professores, colaboradores PJ e despesas." right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Nova despesa</Btn>} />
      {expenses.length === 0 ? <Empty icon="wallet" title="Nenhuma despesa" desc="Registre a primeira despesa para controlar os pagamentos." /> : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="text-mist font-semibold">{e.description}</td>
                  <td><Tag tone="mist">{e.category || "—"}</Tag></td>
                  <td>{e.supplier || "—"}</td>
                  <td className="font-mono text-ember">{fmtBRL(e.amount)}</td>
                  <td className="font-mono text-[11.5px]">{fmtDate(e.dueDate)}</td>
                  <td><Badge s={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova despesa" w={520}>
        <div className="space-y-3">
          <Field label="Descrição" req><TIn value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Categoria"><TIn value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Ex.: Infraestrutura" /></Field>
            <Field label="Fornecedor"><TIn value={f.supplier} onChange={(e) => setF({ ...f, supplier: e.target.value })} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Valor (R$)" req><TIn type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Vencimento" req><TIn type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={save}>Registrar despesa</Btn></div>
      </Modal>
    </div>
  );
}

function FinanceiroAlunos() { return <div><PageHead kicker="Financeiro" title="Alunos" desc="Contratos, mensalidades, pagamentos e inadimplência." /><Empty icon="users" title="Financeiro de alunos" desc="Gerencie contratos, mensalidades, pagamentos e inadimplência dos alunos." /></div>; }
function FinanceiroProfessores() { return <div><PageHead kicker="Financeiro" title="Professores" desc="Horas publicadas, valores e pagamentos." /><Empty icon="cap" title="Financeiro de professores" desc="Controle horas publicadas, valores por hora e pagamentos aos professores." /></div>; }
function Comercial() { return <div><PageHead kicker="Financeiro" title="Comercial" desc="Vendas, matrículas, comissões e metas." /><Empty icon="chart" title="Comercial" desc="Acompanhe vendas, matrículas, comissões e metas comerciais." /></div>; }
function Parceiros() { return <div><PageHead kicker="Financeiro" title="Escolas Parceiras" desc="Contratos, repasses e comissões." /><Empty icon="globe" title="Escolas parceiras" desc="Gerencie contratos, repasses e comissões das escolas parceiras." /></div>; }
function FluxoCaixa() { return <div><PageHead kicker="Financeiro" title="Fluxo de Caixa" desc="Entradas, saídas, saldo e previsão." /><Empty icon="chart" title="Fluxo de caixa" desc="Visualize entradas, saídas, saldo atual e previsão financeira." /></div>; }
function Bancos() { return <div><PageHead kicker="Financeiro" title="Bancos" desc="Contas bancárias, Pix, cartões e conciliação." /><Empty icon="wallet" title="Bancos" desc="Gerencie contas bancárias, transações Pix, cartões e conciliação." /></div>; }
function MercadoPago() { return <div><PageHead kicker="Financeiro" title="Mercado Pago" desc="Transações, Pix, cartão e webhooks." /><Empty icon="wallet" title="Mercado Pago" desc="Acompanhe transações, Pix, pagamentos com cartão e webhooks." /></div>; }
function Orcamento() { return <div><PageHead kicker="Financeiro" title="Orçamento" desc="Planejado, realizado e centros de custo." /><Empty icon="book" title="Orçamento" desc="Compare orçamento planejado vs realizado por departamento e centro de custo." /></div>; }
function Fiscal() { return <div><PageHead kicker="Financeiro" title="Fiscal" desc="Notas fiscais, impostos e relatórios." /><Empty icon="file" title="Fiscal" desc="Gerencie notas fiscais, impostos e relatórios fiscais." /></div>; }
function Relatorios() { return <div><PageHead kicker="Financeiro" title="Relatórios" desc="Relatórios financeiros completos." /><Empty icon="csv" title="Relatórios" desc="Gere relatórios financeiros completos com filtros e exportação." /></div>; }
