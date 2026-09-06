import React, { useState } from "react";
import { I } from "../components/icons";
import { AppShell, type NavItem } from "../components/layout";
import { Btn, Card, Badge, Empty, Field, TIn, TArea, TSel, Modal, Stat, Tag, PageHead, useToast, Confirm, Bar } from "../components/ui";
import { useApp } from "../state";
import {
  createStaffUser, setStaffRole, STAFF_AREAS, AREA_ROLES,
  createPartnership, createNgo, assignNgoCourse,
  all, one, where, find, insert, update, remove, audit, notify,
  fmtBRL, fmtDate, fmtDT, timeAgo, type Row, effectivePrice,
} from "../lib/api";
import { TicketsConsole } from "./admin2";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administração (dono)", teacher: "Professor", support: "Suporte",
  rh: "RH", finance: "Financeiro", atendimento: "Atendimento / Call Center",
  partner: "Escola Parceira", ngo: "ONG Parceira", student: "Aluno",
};

/* ================= USUÁRIOS & ACESSOS (admin) ================= */
export function UsuariosAcessos() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Row | null>(null);
  const [f, setF] = useState({ name: "", email: "", pass: "", role: "atendimento", cargo: "", dept: "", phone: "", salary: "", linkId: "" });
  const users = all("users").sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const partnerships = all("partnerships");
  const ngos = all("ngos");
  const staff = users.filter((u) => u.role !== "student");
  const students = users.filter((u) => u.role === "student");

  const create = async () => {
    try {
      await createStaffUser(user!, { ...f, salary: Number(f.salary) || 0 });
      toast(`Usuário criado! ${f.name} já pode entrar pela Intranet na área ${STAFF_AREAS[f.role] || f.role}.`, "ok");
      setOpen(false); setF({ name: "", email: "", pass: "", role: "atendimento", cargo: "", dept: "", phone: "", salary: "", linkId: "" });
      refresh();
    } catch (e: any) { toast(e.message, "err"); }
  };
  const changeArea = (u: Row, role: string) => {
    try { setStaffRole(user!, u.id, role); toast(`${u.name} agora acessa: ${STAFF_AREAS[role] || role}.`, "ok"); refresh(); }
    catch (e: any) { toast(e.message, "err"); }
  };

  return (
    <div>
      <PageHead kicker="Administração · segurança" title="Usuários & Acessos"
        desc="Cadastre cada usuário da equipe e aloque-o na sua área de trabalho. O acesso é liberado no momento do cadastro — cada um entra pela Intranet e vê somente a própria área."
        right={<Btn v="e" onClick={() => setOpen(true)}><I n="plus" s={15} /> Novo usuário de equipe</Btn>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon="users" label="Equipe (staff)" value={staff.length} />
        <Stat icon="cap" label="Alunos" value={students.length} />
        <Stat icon="shield" label="Áreas ativas" value={Object.keys(STAFF_AREAS).length} tone="amber" />
        <Stat icon="checkc" label="Contas ativas" value={users.filter((u) => u.status === "active").length} />
      </div>

      <Card className="overflow-x-auto">
        <table className="cy-tbl">
          <thead><tr><th>Usuário</th><th>Área de trabalho</th><th>E-mail</th><th>Status</th><th>Criado</th><th>Ações</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg grid place-items-center font-display font-bold text-[11px] border border-line bg-panel text-cy-300">{u.name?.split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase()}</span>
                    <div><div className="text-mist font-semibold">{u.name}{u.role === "admin" && <Tag tone="amber">dono</Tag>}</div>
                      <div className="font-mono text-[10px] text-dim">{u.dept || "—"}</div></div>
                  </div>
                </td>
                <td>
                  {u.role === "admin" ? <Badge s="active" /> : (
                    <select className="cy-in !py-1.5 !text-[12px] !w-auto" value={u.role} onChange={(e) => changeArea(u, e.target.value)}>
                      {["teacher", "support", ...AREA_ROLES].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  )}
                </td>
                <td className="font-mono text-[11.5px]">{u.email}</td>
                <td><Badge s={u.status === "active" ? "active" : "inactive"} /></td>
                <td className="font-mono text-[10.5px] text-dim">{u.createdAt ? fmtDate(u.createdAt) : "—"}</td>
                <td>
                  {u.role !== "admin" && (
                    <div className="flex gap-1">
                      <Btn v="x" sm onClick={() => { update("users", u.id, { status: u.status === "active" ? "inactive" : "active" }); audit(user, "UPDATE", "users", u.id, `${u.name} → ${u.status === "active" ? "suspenso" : "reativado"}`); refresh(); }} title="Ativar/suspender">
                        <I n={u.status === "active" ? "lock" : "check"} s={13} />
                      </Btn>
                      <Btn v="x" sm onClick={() => setDel(u)} title="Remover"><I n="trash" s={13} /></Btn>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo usuário de equipe" w={520}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nome completo" req><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="E-mail (login)" req><TIn type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Senha inicial" req hint="mínimo 6 caracteres"><TIn type="password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} /></Field>
            <Field label="Área de trabalho" req>
              <TSel value={f.role} onChange={(e) => setF({ ...f, role: e.target.value, linkId: "" })}>
                {["atendimento", "rh", "finance", "teacher", "support", "partner", "ngo"].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </TSel>
            </Field>
            <Field label="Cargo" hint="ex.: Coordenador, Atendente, Gestor de Parcerias"><TIn value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} /></Field>
            <Field label="Telefone"><TIn value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Salário (R$)"><TIn type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} /></Field>
            {f.role === "partner" && (
              <Field label="Vincular à escola parceira" req hint="cadastre a escola em Parcerias primeiro">
                <TSel value={f.linkId} onChange={(e) => setF({ ...f, linkId: e.target.value })}>
                  <option value="">selecione…</option>
                  {partnerships.map((p) => <option key={p.id} value={p.id}>{p.schoolName} · {p.code}</option>)}
                </TSel>
              </Field>
            )}
            {f.role === "ngo" && (
              <Field label="Vincular à ONG" req hint="cadastre a ONG em Parcerias primeiro">
                <TSel value={f.linkId} onChange={(e) => setF({ ...f, linkId: e.target.value })}>
                  <option value="">selecione…</option>
                  {ngos.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </TSel>
              </Field>
            )}
          </div>
          <div className="cy-card p-3.5 border-cy-700 text-[12px] text-fog flex items-start gap-2.5">
            <I n="shield" s={16} c="text-cy-400 shrink-0 mt-0.5" />
            O usuário receberá acesso imediato à área escolhida e um e-mail de boas-vindas com as instruções da Intranet.
          </div>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setOpen(false)}>Cancelar</Btn><Btn v="e" onClick={create}>Criar e liberar acesso</Btn></div>
        </div>
      </Modal>

      <Confirm open={!!del} onClose={() => setDel(null)} title="Remover usuário?" desc={`"${del?.name}" perderá o acesso à plataforma. A ação é auditada.`}
        onYes={() => { if (del) { update("users", del.id, { status: "inactive" }); audit(user, "DELETE", "users", del.id, del.name); toast("Usuário suspenso.", "ok"); refresh(); } }} />
    </div>
  );
}

/* ================= SHELL DE GESTÃO ================= */
function MgmtShell({ area, title, nav, path, children }: { area: string; title: string; nav: NavItem[]; path: string; children: React.ReactNode }) {
  return (
    <AppShell title={title} nav={nav} path={path}>
      <div className="mb-5 cy-card p-4 flex items-center gap-3 border-cy-700">
        <span className="w-9 h-9 rounded-lg grid place-items-center bg-cy-500/12 border border-cy-600/50 text-cy-400"><I n="shield" s={17} /></span>
        <div className="flex-1">
          <div className="text-[13px] text-mist font-semibold">Área restrita — {STAFF_AREAS[area] || area}</div>
          <div className="font-mono text-[10.5px] text-dim">acesso controlado por perfil · todas as ações são auditadas</div>
        </div>
      </div>
      {children}
    </AppShell>
  );
}

/* ================= RH ================= */
const NAV_RH: NavItem[] = [
  { to: "/rh", icon: "home", label: "Visão geral" },
  { to: "/rh/equipe", icon: "users", label: "Funcionários" },
  { to: "/rh/departamentos", icon: "layers", label: "Departamentos" },
  { to: "/rh/acessos", icon: "shield", label: "Usuários & Acessos" },
];

function RHArea({ path, segs }: { path: string; segs: string[] }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const sub = segs[1] || "";
  const employees = all("employees");
  const depts = all("departments");
  const [empModal, setEmpModal] = useState<Row | null | "new">(null);
  const [deptModal, setDeptModal] = useState(false);
  const [ef, setEf] = useState<Row>({ name: "", role: "", dept: "", email: "", phone: "", salary: 0, hiredAt: "", status: "active" });
  const [df, setDf] = useState({ name: "", desc: "" });
  const [del, setDel] = useState<Row | null>(null);
  React.useEffect(() => {
    if (empModal && empModal !== "new") setEf({ ...empModal, hiredAt: (empModal.hiredAt || "").slice(0, 10) });
    else if (empModal === "new") setEf({ name: "", role: "", dept: depts[0]?.name || "", email: "", phone: "", salary: 0, hiredAt: new Date().toISOString().slice(0, 10), status: "active" });
  }, [empModal]);
  const saveEmp = () => {
    if (!ef.name || !ef.role) { toast("Nome e cargo obrigatórios.", "err"); return; }
    const payload = { ...ef, salary: Number(ef.salary) || 0 };
    if (empModal !== "new") { update("employees", (empModal as Row).id, payload); audit(user, "UPDATE", "employees", (empModal as Row).id, ef.name); }
    else { const e = insert("employees", payload); audit(user, "CREATE", "employees", e.id, ef.name); }
    toast("Funcionário salvo.", "ok"); setEmpModal(null); refresh();
  };

  let page: React.ReactNode;
  if (sub === "equipe") {
    page = (
      <div>
        <PageHead kicker="RH · pessoas" title="Funcionários" desc="Registro completo do quadro da escola." right={<Btn v="e" onClick={() => setEmpModal("new")}><I n="plus" s={15} /> Novo funcionário</Btn>} />
        {employees.length === 0 ? <Empty icon="users" title="Nenhum funcionário" desc="Cadastre o quadro da escola para o RH gerir." /> : (
          <Card className="overflow-x-auto">
            <table className="cy-tbl">
              <thead><tr><th>Nome</th><th>Cargo</th><th>Departamento</th><th>Salário</th><th>Admissão</th><th>Status</th><th></th></tr></thead>
              <tbody>{employees.map((e) => (
                <tr key={e.id}>
                  <td className="text-mist font-semibold">{e.name}<div className="font-mono text-[10px] text-dim">{e.email}</div></td>
                  <td>{e.role}</td><td><Tag>{e.dept}</Tag></td>
                  <td className="font-mono tnum text-ember">{fmtBRL(e.salary)}</td>
                  <td className="font-mono text-[11px]">{e.hiredAt ? fmtDate(e.hiredAt) : "—"}</td>
                  <td><Badge s={e.status === "active" ? "active" : "inactive"} /></td>
                  <td><div className="flex gap-1"><Btn v="x" sm onClick={() => setEmpModal(e)}><I n="edit" s={13} /></Btn><Btn v="x" sm onClick={() => setDel(e)}><I n="trash" s={13} /></Btn></div></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
      </div>
    );
  } else if (sub === "departamentos") {
    page = (
      <div>
        <PageHead kicker="RH · estrutura" title="Departamentos" desc="Áreas da escola para organizar o quadro." right={<Btn v="e" onClick={() => setDeptModal(true)}><I n="plus" s={15} /> Novo departamento</Btn>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.length === 0 && <div className="sm:col-span-3"><Empty icon="layers" title="Nenhum departamento" desc="Crie os departamentos da escola." /></div>}
          {depts.map((d) => (
            <Card key={d.id} hover className="p-5">
              <div className="flex items-center justify-between"><I n="layers" s={20} c="text-cy-400" /><Btn v="x" sm onClick={() => { remove("departments", d.id); refresh(); }}><I n="trash" s={13} /></Btn></div>
              <h3 className="font-display font-semibold text-[15px] text-mist mt-2.5">{d.name}</h3>
              <p className="text-[12px] text-fog mt-1">{d.desc || "—"}</p>
              <div className="font-mono text-[10.5px] text-dim mt-2.5">{employees.filter((e) => e.dept === d.name).length} funcionário(s)</div>
            </Card>
          ))}
        </div>
      </div>
    );
  } else if (sub === "acessos") {
    page = <UsuariosAcessos />;
  } else {
    const folha = employees.reduce((s, e) => s + (e.salary || 0), 0);
    page = (
      <div>
        <PageHead kicker="RH · Cyber Academy" title="Recursos Humanos" desc="Gestão de pessoas, quadro e acessos da escola." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat icon="users" label="Funcionários" value={employees.length} />
          <Stat icon="layers" label="Departamentos" value={depts.length} />
          <Stat icon="wallet" label="Folha mensal" value={fmtBRL(folha)} tone="amber" />
          <Stat icon="checkc" label="Ativos" value={employees.filter((e) => e.status === "active").length} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-display font-semibold text-[14px] text-mist mb-3">Últimos funcionários</h3>
            {employees.length === 0 ? <p className="text-[12.5px] text-dim">Nenhum cadastro ainda.</p> : employees.slice(-5).reverse().map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
                <div><div className="text-[13px] text-mist">{e.name}</div><div className="font-mono text-[10px] text-dim">{e.role} · {e.dept}</div></div>
                <Badge s={e.status === "active" ? "active" : "inactive"} />
              </div>
            ))}
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-semibold text-[14px] text-mist mb-3">Acesso da equipe</h3>
            <p className="text-[12.5px] text-fog leading-relaxed">Aloque cada usuário na sua área em <a href="#/rh/acessos" className="text-cy-300 underline">Usuários & Acessos</a>. O acesso é liberado no momento do cadastro.</p>
            <a href="#/rh/acessos" className="cy-btn cy-btn-g px-4 py-2 text-[12px] mt-3 inline-flex"><I n="shield" s={14} /> Gerenciar acessos</a>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <MgmtShell area="rh" title="RH · Cyber Academy" nav={NAV_RH} path={path}>
      {page}
      <Modal open={!!empModal} onClose={() => setEmpModal(null)} title={empModal === "new" ? "Novo funcionário" : "Editar funcionário"} w={560}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nome" req><TIn value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} /></Field>
          <Field label="Cargo" req><TIn value={ef.role} onChange={(e) => setEf({ ...ef, role: e.target.value })} /></Field>
          <Field label="Departamento"><TSel value={ef.dept} onChange={(e) => setEf({ ...ef, dept: e.target.value })}>{depts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}{depts.length === 0 && <option value="">—</option>}</TSel></Field>
          <Field label="E-mail"><TIn value={ef.email} onChange={(e) => setEf({ ...ef, email: e.target.value })} /></Field>
          <Field label="Telefone"><TIn value={ef.phone} onChange={(e) => setEf({ ...ef, phone: e.target.value })} /></Field>
          <Field label="Salário (R$)"><TIn type="number" value={ef.salary} onChange={(e) => setEf({ ...ef, salary: e.target.value })} /></Field>
          <Field label="Admissão"><TIn type="date" value={ef.hiredAt} onChange={(e) => setEf({ ...ef, hiredAt: e.target.value })} /></Field>
          <Field label="Status"><TSel value={ef.status} onChange={(e) => setEf({ ...ef, status: e.target.value })}><option value="active">Ativo</option><option value="inactive">Inativo</option></TSel></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setEmpModal(null)}>Cancelar</Btn><Btn v="e" onClick={saveEmp}>Salvar</Btn></div>
      </Modal>
      <Modal open={deptModal} onClose={() => setDeptModal(false)} title="Novo departamento" w={440}>
        <div className="space-y-3">
          <Field label="Nome" req><TIn value={df.name} onChange={(e) => setDf({ ...df, name: e.target.value })} /></Field>
          <Field label="Descrição"><TArea rows={2} value={df.desc} onChange={(e) => setDf({ ...df, desc: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setDeptModal(false)}>Cancelar</Btn><Btn v="e" onClick={() => { if (!df.name) return; insert("departments", df); audit(user, "CREATE", "departments", "", df.name); setDeptModal(false); setDf({ name: "", desc: "" }); toast("Departamento criado.", "ok"); refresh(); }}>Criar</Btn></div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} title="Remover funcionário?" desc={`"${del?.name}" será removido do quadro.`}
        onYes={() => { if (del) { remove("employees", del.id); audit(user, "DELETE", "employees", del.id, del.name); toast("Removido.", "ok"); refresh(); } }} />
    </MgmtShell>
  );
}

/* ================= FINANCEIRO ================= */
const NAV_FIN: NavItem[] = [
  { to: "/financeiro", icon: "home", label: "Visão geral" },
  { to: "/financeiro/receitas", icon: "wallet", label: "Receitas" },
  { to: "/financeiro/despesas", icon: "csv", label: "Despesas" },
  { to: "/financeiro/fluxo", icon: "book", label: "Fluxo de caixa" },
];

function FinanceArea({ path, segs }: { path: string; segs: string[] }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const sub = segs[1] || "";
  const pays = where("payments", (p) => p.status === "approved");
  const expenses = all("expenses").sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const receita = pays.reduce((s, p) => s + (p.amount || 0), 0);
  const despesa = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const [expModal, setExpModal] = useState<Row | null | "new">(null);
  const [xf, setXf] = useState<Row>({ desc: "", category: "Operacional", amount: 0, date: new Date().toISOString().slice(0, 10), paid: false });
  const [del, setDel] = useState<Row | null>(null);
  React.useEffect(() => {
    if (expModal && expModal !== "new") setXf({ ...expModal, date: (expModal.date || "").slice(0, 10) });
    else if (expModal === "new") setXf({ desc: "", category: "Operacional", amount: 0, date: new Date().toISOString().slice(0, 10), paid: false });
  }, [expModal]);
  const saveExp = () => {
    if (!xf.desc || !xf.amount) { toast("Descrição e valor obrigatórios.", "err"); return; }
    const payload = { ...xf, amount: Number(xf.amount) || 0 };
    if (expModal !== "new") { update("expenses", (expModal as Row).id, payload); audit(user, "UPDATE", "expenses", (expModal as Row).id, xf.desc); }
    else { const e = insert("expenses", payload); audit(user, "CREATE", "expenses", e.id, xf.desc); }
    toast("Despesa salva.", "ok"); setExpModal(null); refresh();
  };

  let page: React.ReactNode;
  if (sub === "receitas") {
    page = (
      <div>
        <PageHead kicker="Financeiro · entradas" title="Receitas" desc="Pagamentos aprovados via Mercado Pago." />
        {pays.length === 0 ? <Empty icon="wallet" title="Nenhuma receita" desc="As vendas aprovadas aparecem aqui." /> : (
          <Card className="overflow-x-auto">
            <table className="cy-tbl">
              <thead><tr><th>Cliente</th><th>Valor</th><th>Método</th><th>Pago em</th><th>Status</th></tr></thead>
              <tbody>{pays.map((p) => (
                <tr key={p.id}>
                  <td className="text-mist">{find("users", p.userId)?.name || "—"}</td>
                  <td className="font-mono tnum text-[#7BE0A2]">+ {fmtBRL(p.amount)}</td>
                  <td className="font-mono uppercase text-[11px]">{p.method}</td>
                  <td className="font-mono text-[11px]">{p.paidAt ? fmtDT(p.paidAt) : "—"}</td>
                  <td><Badge s={p.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
      </div>
    );
  } else if (sub === "despesas") {
    page = (
      <div>
        <PageHead kicker="Financeiro · saídas" title="Despesas" desc="Contas e custos operacionais da escola." right={<Btn v="e" onClick={() => setExpModal("new")}><I n="plus" s={15} /> Nova despesa</Btn>} />
        {expenses.length === 0 ? <Empty icon="csv" title="Nenhuma despesa" desc="Lance os custos da escola." /> : (
          <Card className="overflow-x-auto">
            <table className="cy-tbl">
              <thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th><th>Paga</th><th></th></tr></thead>
              <tbody>{expenses.map((e) => (
                <tr key={e.id}>
                  <td className="text-mist">{e.desc}</td>
                  <td><Tag tone="mist">{e.category}</Tag></td>
                  <td className="font-mono tnum text-coral">− {fmtBRL(e.amount)}</td>
                  <td className="font-mono text-[11px]">{fmtDate(e.date)}</td>
                  <td><Badge s={e.paid ? "paid" : "pending"} /></td>
                  <td><div className="flex gap-1"><Btn v="x" sm onClick={() => setExpModal(e)}><I n="edit" s={13} /></Btn><Btn v="x" sm onClick={() => setDel(e)}><I n="trash" s={13} /></Btn></div></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
      </div>
    );
  } else if (sub === "fluxo") {
    const meses: Record<string, { rec: number; desp: number }> = {};
    pays.forEach((p) => { const m = (p.paidAt || "").slice(0, 7); if (!m) return; meses[m] = meses[m] || { rec: 0, desp: 0 }; meses[m].rec += p.amount || 0; });
    expenses.forEach((e) => { const m = (e.date || "").slice(0, 7); if (!m) return; meses[m] = meses[m] || { rec: 0, desp: 0 }; meses[m].desp += e.amount || 0; });
    const keys = Object.keys(meses).sort();
    const max = Math.max(1, ...keys.map((k) => Math.max(meses[k].rec, meses[k].desp)));
    page = (
      <div>
        <PageHead kicker="Financeiro · análise" title="Fluxo de caixa" desc="Receitas × despesas por mês." />
        {keys.length === 0 ? <Empty icon="book" title="Sem movimentações" /> : (
          <Card className="p-6">
            <div className="space-y-5">
              {keys.map((k) => (
                <div key={k}>
                  <div className="flex justify-between font-mono text-[11px] text-dim mb-1.5"><span>{k}</span><span className="text-mist">{fmtBRL(meses[k].rec - meses[k].desp)}</span></div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2"><span className="w-14 font-mono text-[9px] text-[#7BE0A2]">RECEITA</span><div className="flex-1 bg-[#0E3B40]/40 rounded-full h-[10px] overflow-hidden"><div className="h-full rounded-full bg-[#03A6A6] bar-anim" style={{ width: `${(meses[k].rec / max) * 100}%` }} /></div></div>
                    <div className="flex items-center gap-2"><span className="w-14 font-mono text-[9px] text-coral">DESPESA</span><div className="flex-1 bg-[#0E3B40]/40 rounded-full h-[10px] overflow-hidden"><div className="h-full rounded-full bg-[#F0705A] bar-anim" style={{ width: `${(meses[k].desp / max) * 100}%` }} /></div></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  } else {
    page = (
      <div>
        <PageHead kicker="Financeiro · Cyber Academy" title="Gestão Financeira" desc="Receitas, despesas e fluxo de caixa da escola." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat icon="wallet" label="Receitas" value={fmtBRL(receita)} />
          <Stat icon="csv" label="Despesas" value={fmtBRL(despesa)} tone="amber" />
          <Stat icon="book" label="Saldo" value={fmtBRL(receita - despesa)} />
          <Stat icon="checkc" label="Pagamentos" value={pays.length} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5"><h3 className="font-display font-semibold text-[14px] text-mist mb-3">Últimas receitas</h3>
            {pays.length === 0 ? <p className="text-[12.5px] text-dim">Nenhuma ainda.</p> : pays.slice(-4).reverse().map((p) => (
              <div key={p.id} className="flex justify-between py-2 border-b border-line/50 last:border-0"><span className="text-[13px] text-fog">{find("users", p.userId)?.name}</span><span className="font-mono tnum text-[#7BE0A2]">+ {fmtBRL(p.amount)}</span></div>
            ))}
          </Card>
          <Card className="p-5"><h3 className="font-display font-semibold text-[14px] text-mist mb-3">Últimas despesas</h3>
            {expenses.length === 0 ? <p className="text-[12.5px] text-dim">Nenhuma ainda.</p> : expenses.slice(0, 4).map((e) => (
              <div key={e.id} className="flex justify-between py-2 border-b border-line/50 last:border-0"><span className="text-[13px] text-fog">{e.desc}</span><span className="font-mono tnum text-coral">− {fmtBRL(e.amount)}</span></div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <MgmtShell area="finance" title="Financeiro · Cyber Academy" nav={NAV_FIN} path={path}>
      {page}
      <Modal open={!!expModal} onClose={() => setExpModal(null)} title={expModal === "new" ? "Nova despesa" : "Editar despesa"} w={480}>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Field label="Descrição" req><TIn value={xf.desc} onChange={(e) => setXf({ ...xf, desc: e.target.value })} /></Field></div>
          <Field label="Categoria"><TSel value={xf.category} onChange={(e) => setXf({ ...xf, category: e.target.value })}>{["Operacional", "Pessoal", "Marketing", "Infraestrutura", "Impostos", "Outros"].map((c) => <option key={c}>{c}</option>)}</TSel></Field>
          <Field label="Valor (R$)" req><TIn type="number" value={xf.amount} onChange={(e) => setXf({ ...xf, amount: e.target.value })} /></Field>
          <Field label="Data"><TIn type="date" value={xf.date} onChange={(e) => setXf({ ...xf, date: e.target.value })} /></Field>
          <Field label="Paga"><TSel value={String(!!xf.paid)} onChange={(e) => setXf({ ...xf, paid: e.target.value === "true" })}><option value="false">Não</option><option value="true">Sim</option></TSel></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setExpModal(null)}>Cancelar</Btn><Btn v="e" onClick={saveExp}>Salvar</Btn></div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} title="Remover despesa?" desc={`"${del?.desc}" será removida.`}
        onYes={() => { if (del) { remove("expenses", del.id); audit(user, "DELETE", "expenses", del.id, del.desc); toast("Removida.", "ok"); refresh(); } }} />
    </MgmtShell>
  );
}

/* ================= ATENDIMENTO / CALL CENTER ================= */
const NAV_ATD: NavItem[] = [
  { to: "/atendimento", icon: "home", label: "Painel" },
  { to: "/atendimento/chamados", icon: "msg", label: "Chamados" },
  { to: "/atendimento/ligacoes", icon: "term", label: "Ligações" },
  { to: "/atendimento/respostas", icon: "file", label: "Respostas rápidas" },
];

function AtendimentoArea({ path, segs }: { path: string; segs: string[] }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const sub = segs[1] || "";
  const tickets = all("support_tickets");
  const calls = all("calls").sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  const quick = all("quick_replies");
  const [callModal, setCallModal] = useState<Row | null | "new">(null);
  const [cf, setCf] = useState<Row>({ client: "", phone: "", subject: "", status: "concluida", duration: 0, notes: "" });
  const [qrModal, setQrModal] = useState(false);
  const [qf, setQf] = useState({ title: "", body: "" });
  const [del, setDel] = useState<Row | null>(null);
  React.useEffect(() => {
    if (callModal && callModal !== "new") setCf({ ...callModal });
    else if (callModal === "new") setCf({ client: "", phone: "", subject: "", status: "concluida", duration: 0, notes: "" });
  }, [callModal]);
  const saveCall = () => {
    if (!cf.client) { toast("Informe o cliente.", "err"); return; }
    const payload = { ...cf, duration: Number(cf.duration) || 0, at: (callModal !== "new" ? cf.at : undefined) || new Date().toISOString() };
    if (callModal !== "new") { update("calls", (callModal as Row).id, payload); audit(user, "UPDATE", "calls", (callModal as Row).id, cf.client); }
    else { const c = insert("calls", payload); audit(user, "CREATE", "calls", c.id, cf.client); }
    toast("Ligação registrada.", "ok"); setCallModal(null); refresh();
  };

  let page: React.ReactNode;
  if (sub === "chamados") {
    page = <div><PageHead kicker="Call Center · suporte" title="Chamados" desc="Atenda os chamados abertos pelos alunos e visitantes." /><TicketsConsole /></div>;
  } else if (sub === "ligacoes") {
    page = (
      <div>
        <PageHead kicker="Call Center · telefonia" title="Ligações" desc="Registro de atendimento telefônico." right={<Btn v="e" onClick={() => setCallModal("new")}><I n="plus" s={15} /> Registrar ligação</Btn>} />
        {calls.length === 0 ? <Empty icon="term" title="Nenhuma ligação" desc="Registre os atendimentos telefônicos." /> : (
          <Card className="overflow-x-auto">
            <table className="cy-tbl">
              <thead><tr><th>Cliente</th><th>Telefone</th><th>Assunto</th><th>Duração</th><th>Data</th><th>Status</th><th></th></tr></thead>
              <tbody>{calls.map((c) => (
                <tr key={c.id}>
                  <td className="text-mist font-semibold">{c.client}</td>
                  <td className="font-mono text-[11.5px]">{c.phone}</td>
                  <td>{c.subject}</td>
                  <td className="font-mono text-[11px]">{c.duration}min</td>
                  <td className="font-mono text-[11px]">{fmtDT(c.at)}</td>
                  <td><Badge s={c.status === "concluida" ? "paid" : "pending"} /></td>
                  <td><div className="flex gap-1"><Btn v="x" sm onClick={() => setCallModal(c)}><I n="edit" s={13} /></Btn><Btn v="x" sm onClick={() => setDel(c)}><I n="trash" s={13} /></Btn></div></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )}
      </div>
    );
  } else if (sub === "respostas") {
    page = (
      <div>
        <PageHead kicker="Call Center · base" title="Respostas rápidas" desc="Modelos para agilizar o atendimento." right={<Btn v="e" onClick={() => setQrModal(true)}><I n="plus" s={15} /> Nova resposta</Btn>} />
        <div className="grid md:grid-cols-2 gap-4">
          {quick.length === 0 && <div className="md:col-span-2"><Empty icon="file" title="Nenhuma resposta rápida" desc="Crie modelos de resposta." /></div>}
          {quick.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-center justify-between"><h3 className="font-display font-semibold text-[14px] text-mist">{q.title}</h3><Btn v="x" sm onClick={() => { remove("quick_replies", q.id); refresh(); }}><I n="trash" s={13} /></Btn></div>
              <p className="text-[12.5px] text-fog mt-2 leading-relaxed">{q.body}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  } else {
    const abertos = tickets.filter((t) => t.status === "open").length;
    page = (
      <div>
        <PageHead kicker="Call Center · Cyber Academy" title="Central de Atendimento" desc="Chamados, ligações e base de respostas." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat icon="msg" label="Chamados abertos" value={abertos} tone="amber" />
          <Stat icon="term" label="Ligações" value={calls.length} />
          <Stat icon="file" label="Respostas rápidas" value={quick.length} />
          <Stat icon="checkc" label="Chamados totais" value={tickets.length} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5"><h3 className="font-display font-semibold text-[14px] text-mist mb-3">Chamados recentes</h3>
            {tickets.length === 0 ? <p className="text-[12.5px] text-dim">Nenhum chamado.</p> : tickets.slice(-4).reverse().map((t) => (
              <div key={t.id} className="flex justify-between items-center py-2 border-b border-line/50 last:border-0"><span className="text-[13px] text-fog truncate pr-2">{t.subject}</span><Badge s={t.status} /></div>
            ))}
          </Card>
          <Card className="p-5"><h3 className="font-display font-semibold text-[14px] text-mist mb-3">Últimas ligações</h3>
            {calls.length === 0 ? <p className="text-[12.5px] text-dim">Nenhuma ligação.</p> : calls.slice(0, 4).map((c) => (
              <div key={c.id} className="flex justify-between py-2 border-b border-line/50 last:border-0"><span className="text-[13px] text-fog">{c.client} · {c.subject}</span><span className="font-mono text-[10.5px] text-dim">{c.duration}min</span></div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <MgmtShell area="atendimento" title="Atendimento · Cyber Academy" nav={NAV_ATD} path={path}>
      {page}
      <Modal open={!!callModal} onClose={() => setCallModal(null)} title={callModal === "new" ? "Registrar ligação" : "Editar ligação"} w={520}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Cliente" req><TIn value={cf.client} onChange={(e) => setCf({ ...cf, client: e.target.value })} /></Field>
          <Field label="Telefone"><TIn value={cf.phone} onChange={(e) => setCf({ ...cf, phone: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Assunto"><TIn value={cf.subject} onChange={(e) => setCf({ ...cf, subject: e.target.value })} /></Field></div>
          <Field label="Duração (min)"><TIn type="number" value={cf.duration} onChange={(e) => setCf({ ...cf, duration: e.target.value })} /></Field>
          <Field label="Status"><TSel value={cf.status} onChange={(e) => setCf({ ...cf, status: e.target.value })}><option value="concluida">Concluída</option><option value="pendente">Retornar</option></TSel></Field>
          <div className="sm:col-span-2"><Field label="Anotações"><TArea rows={3} value={cf.notes} onChange={(e) => setCf({ ...cf, notes: e.target.value })} /></Field></div>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setCallModal(null)}>Cancelar</Btn><Btn v="e" onClick={saveCall}>Salvar</Btn></div>
      </Modal>
      <Modal open={qrModal} onClose={() => setQrModal(false)} title="Nova resposta rápida" w={480}>
        <div className="space-y-3">
          <Field label="Título" req><TIn value={qf.title} onChange={(e) => setQf({ ...qf, title: e.target.value })} /></Field>
          <Field label="Resposta" req><TArea rows={4} value={qf.body} onChange={(e) => setQf({ ...qf, body: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setQrModal(false)}>Cancelar</Btn><Btn v="e" onClick={() => { if (!qf.title || !qf.body) return; insert("quick_replies", qf); setQrModal(false); setQf({ title: "", body: "" }); toast("Resposta criada.", "ok"); refresh(); }}>Criar</Btn></div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} title="Remover ligação?" desc={`Registro de "${del?.client}" será removido.`}
        onYes={() => { if (del) { remove("calls", del.id); audit(user, "DELETE", "calls", del.id, del.client); toast("Removida.", "ok"); refresh(); } }} />
    </MgmtShell>
  );
}

/* ================= PARCERIAS (admin) — escolas + ONGs ================= */
export function Parcerias() {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState("escolas");
  const [psOpen, setPsOpen] = useState(false);
  const [ngoOpen, setNgoOpen] = useState(false);
  const [courseModal, setCourseModal] = useState<Row | null>(null);
  const [pf, setPf] = useState({ schoolName: "", contactName: "", contactEmail: "", contactPhone: "", discountPercent: "10", code: "" });
  const [nf, setNf] = useState({ name: "", contactName: "", contactEmail: "" });
  const [cf, setCf] = useState("");
  const partnerships = all("partnerships");
  const ngos = all("ngos");
  const courses = all("courses").filter((c) => c.published);

  const savePs = () => {
    if (!pf.schoolName) { toast("Nome da escola obrigatório.", "err"); return; }
    createPartnership(user!, { ...pf, discountPercent: Number(pf.discountPercent) || 10 });
    setPsOpen(false); setPf({ schoolName: "", contactName: "", contactEmail: "", contactPhone: "", discountPercent: "10", code: "" });
    toast("Escola parceira cadastrada! Agora crie o usuário de acesso em Usuários & Acessos (área Escola Parceira).", "ok"); refresh();
  };
  const saveNgo = () => {
    if (!nf.name) { toast("Nome da ONG obrigatório.", "err"); return; }
    createNgo(user!, nf);
    setNgoOpen(false); setNf({ name: "", contactName: "", contactEmail: "" });
    toast("ONG cadastrada! Libere cursos gratuitos e crie o usuário de acesso.", "ok"); refresh();
  };

  return (
    <div>
      <PageHead kicker="Administração · expansão" title="Parcerias"
        desc="Gerencie escolas parceiras (com desconto nas mensalidades) e ONGs (cursos gratuitos). Depois crie o usuário de acesso de cada uma em Usuários & Acessos." />
      <div className="flex gap-1 border-b border-line mb-6">
        {[["escolas", `Escolas parceiras (${partnerships.length})`], ["ongs", `ONGs (${ngos.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-display text-[12.5px] uppercase border-b-2 -mb-px ${tab === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent hover:text-mist"}`}>{l}</button>
        ))}
      </div>

      {tab === "escolas" && (
        <div className="anim-fade-in">
          <div className="flex justify-end mb-4"><Btn v="e" onClick={() => setPsOpen(true)}><I n="plus" s={15} /> Nova escola parceira</Btn></div>
          {partnerships.length === 0 ? <Empty icon="cap" title="Nenhuma escola parceira" desc="Cadastre a primeira escola para oferecer seus cursos com desconto." /> : (
            <Card className="overflow-x-auto">
              <table className="cy-tbl">
                <thead><tr><th>Escola</th><th>Código</th><th>Desconto</th><th>Contato</th><th>Alunos</th><th>Status</th></tr></thead>
                <tbody>
                  {partnerships.map((p) => (
                    <tr key={p.id}>
                      <td className="text-mist font-semibold">{p.schoolName}</td>
                      <td className="font-mono text-cy-300">{p.code}</td>
                      <td><Tag tone="amber">-{p.discountPercent}%</Tag></td>
                      <td><div className="text-[12px]">{p.contactName}</div><div className="font-mono text-[10.5px] text-dim">{p.contactEmail}</div></td>
                      <td className="font-mono">{where("partner_students", (ps) => ps.partnerId === p.id).length}</td>
                      <td><Badge s={p.status === "ACTIVE" ? "active" : "inactive"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {tab === "ongs" && (
        <div className="anim-fade-in">
          <div className="flex justify-end mb-4"><Btn v="e" onClick={() => setNgoOpen(true)}><I n="plus" s={15} /> Nova ONG</Btn></div>
          {ngos.length === 0 ? <Empty icon="globe" title="Nenhuma ONG cadastrada" desc="Cadastre uma ONG para liberar cursos gratuitos (bolsas sociais)." /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {ngos.map((n) => (
                <Card key={n.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-display font-semibold text-[15px] text-mist">{n.name}</h3>
                    <Badge s={n.status === "ACTIVE" ? "active" : "inactive"} />
                  </div>
                  <div className="font-mono text-[11px] text-dim mt-1">{n.contactName} · {n.contactEmail}</div>
                  <div className="mt-3">
                    <div className="font-mono text-[10.5px] text-fog uppercase tracking-wider mb-2">Cursos gratuitos liberados</div>
                    <div className="flex flex-wrap gap-1.5">
                      {where("ngo_courses", (nc) => nc.ngoId === n.id).map((nc) => (
                        <Tag key={nc.id} tone="teal">{find("courses", nc.courseId)?.title.slice(0, 28)}</Tag>
                      ))}
                      {where("ngo_courses", (nc) => nc.ngoId === n.id).length === 0 && <span className="text-[11.5px] text-dim">nenhum curso liberado</span>}
                    </div>
                  </div>
                  <Btn v="g" sm className="mt-4" onClick={() => { setCourseModal(n); setCf(""); }}><I n="plus" s={13} /> Liberar curso gratuito</Btn>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL escola */}
      <Modal open={psOpen} onClose={() => setPsOpen(false)} title="Nova escola parceira" w={520}>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Field label="Nome da escola" req><TIn value={pf.schoolName} onChange={(e) => setPf({ ...pf, schoolName: e.target.value })} /></Field></div>
          <Field label="Contato (nome)"><TIn value={pf.contactName} onChange={(e) => setPf({ ...pf, contactName: e.target.value })} /></Field>
          <Field label="E-mail"><TIn type="email" value={pf.contactEmail} onChange={(e) => setPf({ ...pf, contactEmail: e.target.value })} /></Field>
          <Field label="Telefone"><TIn value={pf.contactPhone} onChange={(e) => setPf({ ...pf, contactPhone: e.target.value })} /></Field>
          <Field label="Desconto (%)" hint="aplicado sobre as mensalidades"><TIn type="number" value={pf.discountPercent} onChange={(e) => setPf({ ...pf, discountPercent: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setPsOpen(false)}>Cancelar</Btn><Btn v="e" onClick={savePs}>Cadastrar escola</Btn></div>
      </Modal>

      {/* MODAL ONG */}
      <Modal open={ngoOpen} onClose={() => setNgoOpen(false)} title="Nova ONG" w={480}>
        <div className="space-y-3">
          <Field label="Nome da ONG" req><TIn value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} /></Field>
          <Field label="Contato (nome)"><TIn value={nf.contactName} onChange={(e) => setNf({ ...nf, contactName: e.target.value })} /></Field>
          <Field label="E-mail"><TIn type="email" value={nf.contactEmail} onChange={(e) => setNf({ ...nf, contactEmail: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4"><Btn v="x" onClick={() => setNgoOpen(false)}>Cancelar</Btn><Btn v="e" onClick={saveNgo}>Cadastrar ONG</Btn></div>
      </Modal>

      {/* MODAL liberar curso p/ ONG */}
      <Modal open={!!courseModal} onClose={() => setCourseModal(null)} title={`Liberar curso gratuito — ${courseModal?.name}`} w={460}>
        <Field label="Curso publicado" req>
          <TSel value={cf} onChange={(e) => setCf(e.target.value)}>
            <option value="">selecione…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </TSel>
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <Btn v="x" onClick={() => setCourseModal(null)}>Cancelar</Btn>
          <Btn v="e" onClick={() => { if (!cf) return; assignNgoCourse(user!, courseModal!.id, cf); toast("Curso gratuito liberado para a ONG.", "ok"); setCourseModal(null); refresh(); }}>Liberar</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ================= ROUTER DE GESTÃO ================= */
export function ManagementRouter({ area, path, segs }: { area: "rh" | "finance" | "atendimento"; path: string; segs: string[] }) {
  if (area === "rh") return <RHArea path={path} segs={segs} />;
  if (area === "finance") return <FinanceArea path={path} segs={segs} />;
  return <AtendimentoArea path={path} segs={segs} />;
}
