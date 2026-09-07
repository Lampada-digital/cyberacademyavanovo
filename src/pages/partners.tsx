import { useState } from "react";
import { I, Logo } from "../components/icons";
import { Btn, Card, Badge, Empty, Field, TIn, TSel, Modal, Stat, PageHead, useToast, Tag } from "../components/ui";
import { useApp, navigate } from "../state";
import {
  studentPartner, userNgo, partnerEnrollStudent, ngoFreeEnroll, coursePricing,
  logout, one, update as updUser, insert as insUser, hashPw, now as nowTs,
  all, where, find, fmtBRL, fmtDate, timeAgo, type Row,
} from "../lib/api";

export default function PartnerArea() {
  const { user, refresh, setUser } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState("visao");
  const [enroll, setEnroll] = useState(false);
  const [ef, setEf] = useState({ name: "", email: "", courseId: "" });

  if (!user) return null;
  const isNgo = user.role === "ngo";
  const org = isNgo ? userNgo(user.id) : studentPartner(user.id) || (user.partnerId ? find("partnerships", user.partnerId) : undefined);
  const courses = all("courses").filter((c) => c.published);
  const discount = isNgo ? 100 : Number((org as Row | undefined)?.discountPercent || 0);

  // alunos vinculados
  const linked = isNgo
    ? where("users", (u) => u.role === "student" && u.ngoId === user.ngoId)
    : where("partner_students", (ps) => ps.partnerId === (org as Row | undefined)?.id).map((ps) => find("users", ps.studentId)).filter(Boolean) as Row[];
  const enrollments = where("enrollments", (e) => linked.some((s) => s.id === e.studentId));
  const revenue = enrollments.reduce((s, e) => {
    const o = e.orderId ? find("orders", e.orderId) : undefined;
    return s + Number(o?.amount || 0);
  }, 0);

  const doEnroll = async () => {
    if (!ef.name || !ef.email.includes("@") || !ef.courseId) { toast("Preencha nome, e-mail e curso.", "err"); return; }
    try {
      if (isNgo) {
        if (!user.ngoId) throw new Error("Usuário sem ONG vinculada.");
        const res = await enrollNgoStudent(user, ef);
        toast(`Beneficiário matriculado gratuitamente! Matrícula ${res.enrollment.number}.`, "ok");
      } else {
        const res = await partnerEnrollStudent(user, ef);
        toast(`Aluno matriculado com ${discount}% de desconto! Matrícula ${res.enrollment.number}.`, "ok");
      }
      setEnroll(false); setEf({ name: "", email: "", courseId: "" });
      refresh();
    } catch (e: any) { toast(e.message, "err"); }
  };

  const nav: [string, string, string][] = [
    ["visao", "Visão geral", "home"],
    ["cursos", isNgo ? "Cursos gratuitos" : "Catálogo com desconto", "layers"],
    ["alunos", isNgo ? "Beneficiários" : "Alunos da escola", "users"],
  ];

  return (
    <div className="min-h-screen">
      {/* header exclusivo */}
      <header className="sticky top-0 z-40 h-[64px] border-b border-line bg-ink/85 backdrop-blur-md flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Logo s={30} />
          <span className="cy-badge b-amber hidden sm:inline-flex"><I n={isNgo ? "globe" : "cap"} s={11} /> {isNgo ? "ONG Parceira" : "Escola Parceira"}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[12.5px] font-semibold text-mist leading-tight">{org?.[isNgo ? "name" : "schoolName"] || user.name}</div>
            <div className="font-mono text-[10px] text-dim">{user.email}</div>
          </div>
          <button onClick={() => { logout(); setUser(null); navigate("/"); }} className="cy-btn cy-btn-x px-2.5 py-2" title="Sair"><I n="out" s={16} /></button>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-5 py-8">
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className={`w-12 h-12 rounded-xl grid place-items-center border ${isNgo ? "bg-[#3a2a10] border-ember/50 text-ember" : "bg-cy-500/12 border-cy-600/50 text-cy-300"}`}>
            <I n={isNgo ? "globe" : "cap"} s={22} />
          </span>
          <div>
            <div className="cy-chip text-ember">{isNgo ? "Rede Social Cyber Academy" : "Programa de Parcerias"}</div>
            <h1 className="display-xl text-[24px] md:text-[28px] text-mist">{org?.[isNgo ? "name" : "schoolName"] || "Área do Parceiro"}</h1>
          </div>
          {!isNgo && org && <span className="cy-badge b-teal ml-auto">desconto {discount}% aplicado</span>}
        </div>

        {/* abas */}
        <div className="flex gap-1 border-b border-line mb-7 overflow-x-auto">
          {nav.map(([k, l, ic]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-display text-[12.5px] uppercase tracking-wide whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-2 ${tab === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent hover:text-mist"}`}>
              <I n={ic} s={14} /> {l}
            </button>
          ))}
        </div>

        {/* VISÃO GERAL */}
        {tab === "visao" && (
          <div className="space-y-6 anim-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat icon="users" label={isNgo ? "Beneficiários" : "Alunos vinculados"} value={linked.length} />
              <Stat icon="award" label="Matrículas ativas" value={enrollments.filter((e) => e.status === "ACTIVE").length} />
              <Stat icon="layers" label="Cursos disponíveis" value={courses.length} tone="amber" />
              {!isNgo && <Stat icon="wallet" label="Volume faturado" value={fmtBRL(revenue)} tone="amber" />}
              {isNgo && <Stat icon="globe" label="Impacto social" value={`${enrollments.length} bolsas`} tone="amber" />}
            </div>
            <Card className="p-6">
              <h3 className="font-display font-semibold text-[15px] text-mist mb-2 flex items-center gap-2"><I n="shield" s={16} c="text-ember" /> Como funciona</h3>
              <p className="text-[13.5px] text-fog leading-relaxed">
                {isNgo
                  ? "Sua ONG tem acesso a cursos gratuitos liberados pela Cyber Academy. Matricule beneficiários pelo e-mail — eles recebem conta e acesso imediato ao AVA, sem custo."
                  : `Sua escola oferece os cursos da Cyber Academy com ${discount}% de desconto sobre as mensalidades. Matricule alunos pelo e-mail: a conta é criada automaticamente e o valor é faturado à escola.`}
              </p>
              <Btn v="e" className="mt-4" onClick={() => setTab("cursos")}><I n="layers" s={15} /> {isNgo ? "Ver cursos gratuitos" : "Ver catálogo com desconto"}</Btn>
            </Card>
          </div>
        )}

        {/* CATÁLOGO */}
        {tab === "cursos" && (
          <div className="anim-fade-in">
            {courses.length === 0 ? (
              <Empty icon="layers" title="Nenhum curso publicado" desc="A administração ainda não publicou cursos no catálogo." />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {courses.map((c) => {
                  const p = coursePricing(c);
                  const freeFor = isNgo && where("ngo_courses", (n) => n.courseId === c.id && n.ngoId === user.ngoId).length > 0;
                  const finalMonthly = Math.round(p.monthly * (1 - discount / 100) * 100) / 100;
                  return (
                    <Card key={c.id} hover className="p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display font-semibold text-[15px] text-mist leading-snug">{c.title}</h3>
                        {isNgo ? (freeFor ? <Tag tone="amber">grátis p/ sua ONG</Tag> : <Tag tone="mist">não liberado</Tag>) : <span className="cy-badge b-teal shrink-0">-{discount}%</span>}
                      </div>
                      <div className="font-mono text-[10.5px] text-dim mt-1.5">{c.hours}h · {c.level} · {p.months} mensalidades</div>
                      <div className="mt-3 flex items-baseline gap-2">
                        {isNgo ? (
                          <span className="font-display font-bold text-[22px] text-ember tnum">{freeFor ? "R$ 0,00" : "—"}</span>
                        ) : (
                          <>
                            <span className="font-display font-bold text-[22px] text-cy-300 tnum">{fmtBRL(finalMonthly)}</span>
                            <span className="font-mono text-[11px] text-dim">/mês</span>
                            <span className="font-mono text-[11px] text-dim line-through">{fmtBRL(p.monthly)}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-auto pt-4">
                        <Btn v={isNgo && !freeFor ? "x" : "e"} sm className="w-full" disabled={isNgo && !freeFor}
                          onClick={() => { setEf({ ...ef, courseId: c.id }); setEnroll(true); }}>
                          <I n="plus" s={14} /> {isNgo ? (freeFor ? "Matricular beneficiário" : "Não liberado") : "Matricular aluno"}
                        </Btn>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ALUNOS / BENEFICIÁRIOS */}
        {tab === "alunos" && (
          <div className="anim-fade-in">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[13px] text-fog">{linked.length} {isNgo ? "beneficiário(s)" : "aluno(s)"} vinculado(s)</p>
              <Btn v="e" sm onClick={() => setEnroll(true)}><I n="plus" s={14} /> {isNgo ? "Matricular beneficiário" : "Matricular aluno"}</Btn>
            </div>
            {enrollments.length === 0 ? (
              <Empty icon="users" title={isNgo ? "Nenhum beneficiário matriculado" : "Nenhum aluno matriculado"} desc="Use o catálogo para fazer a primeira matrícula." />
            ) : (
              <Card className="overflow-x-auto">
                <table className="cy-tbl">
                  <thead><tr><th>{isNgo ? "Beneficiário" : "Aluno"}</th><th>Curso</th><th>Matrícula</th><th>Início</th><th>Situação</th></tr></thead>
                  <tbody>
                    {enrollments.map((e) => {
                      const s = find("users", e.studentId);
                      const c = find("courses", e.courseId);
                      return (
                        <tr key={e.id}>
                          <td><div className="text-mist font-semibold">{s?.name}</div><div className="font-mono text-[10.5px] text-dim">{s?.email}</div></td>
                          <td>{c?.title}</td>
                          <td className="font-mono text-cy-300">{e.number}</td>
                          <td className="font-mono text-[11px]">{fmtDate(e.startDate)}</td>
                          <td><Badge s={e.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* MODAL MATRÍCULA */}
      <Modal open={enroll} onClose={() => setEnroll(false)} title={isNgo ? "Matricular beneficiário (gratuito)" : "Matricular aluno da escola"} w={480}>
        <div className="space-y-4">
          <Field label={`${isNgo ? "Beneficiário" : "Aluno"} — nome completo`} req><TIn value={ef.name} onChange={(e) => setEf({ ...ef, name: e.target.value })} /></Field>
          <Field label="E-mail (login do AVA)" req hint="se não existir, a conta é criada automaticamente"><TIn type="email" value={ef.email} onChange={(e) => setEf({ ...ef, email: e.target.value })} /></Field>
          <Field label="Curso" req>
            <TSel value={ef.courseId} onChange={(e) => setEf({ ...ef, courseId: e.target.value })}>
              <option value="">selecione…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </TSel>
          </Field>
          <div className="cy-card p-3.5 border-cy-700 text-[12px] text-fog flex items-start gap-2.5">
            <I n="shield" s={16} c="text-ember shrink-0 mt-0.5" />
            {isNgo ? "A matrícula é 100% gratuita (bolsa social). O beneficiário recebe acesso imediato ao AVA." : `O valor será faturado à escola com ${discount}% de desconto. O aluno recebe acesso imediato ao AVA.`}
          </div>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setEnroll(false)}>Cancelar</Btn><Btn v="e" onClick={doEnroll}>Confirmar matrícula</Btn></div>
        </div>
      </Modal>
    </div>
  );
}

/* matricula beneficiário de ONG gratuitamente (cria conta se necessário) */
async function enrollNgoStudent(actor: Row, ef: { name: string; email: string; courseId: string }) {
  let student = one("users", (u: Row) => u.email.toLowerCase() === ef.email.trim().toLowerCase());
  if (!student) {
    const passHash = await hashPw("Ong@" + (ef.email.split("@")[0] || "cyber").slice(0, 6));
    student = insUser("users", { name: ef.name.trim(), email: ef.email.trim().toLowerCase(), passHash, role: "student", ngoId: actor.ngoId, status: "active", loginFails: 0, createdAt: nowTs() });
  } else if (!student.ngoId) {
    updUser("users", student.id, { ngoId: actor.ngoId });
  }
  const enrollment = ngoFreeEnroll(student, actor.ngoId!, ef.courseId);
  return { student, enrollment };
}
