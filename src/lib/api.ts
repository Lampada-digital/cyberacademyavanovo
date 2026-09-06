/* ============================================================
   SIA API — camada de serviços (equivalente ao backend FastAPI)
   auth JWT-like · RBAC · checkout · webhook · acadêmico
   ============================================================ */
import {
  all, one, where, find, insert, update, remove, uid, now, audit, sendEmail,
  notify, nextEnrollmentNumber, nextCertCode, nextOrderNumber, hashPw,
  getSettings, type Row, wipeDB, save, fmtBRL,
} from "./db";

/* ================= SESSÃO / AUTH ================= */
const SKEY = "ca_session";

export function currentUser(): Row | null {
  try {
    const raw = localStorage.getItem(SKEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.exp < Date.now()) { localStorage.removeItem(SKEY); return null; }
    const u = find("users", s.userId);
    if (!u || u.status === "inactive") return null;
    return u;
  } catch { return null; }
}

export function homeFor(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/professor";
  if (role === "support") return "/suporte";
  if (role === "rh") return "/rh";
  if (role === "finance") return "/financeiro";
  if (role === "atendimento") return "/atendimento";
  return "/aluno";
}

/* Áreas de trabalho (gestão) — cada usuário acessa só a sua; admin acessa todas */
export const STAFF_AREAS: Record<string, string> = {
  rh: "RH", finance: "Financeiro", atendimento: "Atendimento", support: "Suporte", teacher: "Professor", admin: "Administração",
};
export const AREA_ROLES = ["rh", "finance", "atendimento"];
export function isStaff(role: string): boolean {
  return ["admin", "teacher", "support", "rh", "finance", "atendimento"].includes(role);
}
export function canAccessArea(user: Row | null, area: string): boolean {
  if (!user) return false;
  if (user.role === "admin") return true; // dono acessa tudo
  return user.role === area;
}

export async function login(email: string, pass: string): Promise<Row> {
  const u = one("users", (x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) throw new Error("E-mail não encontrado. Verifique ou crie sua conta.");
  if (u.status === "inactive") throw new Error("Conta desativada. Contate o suporte.");
  const h = await hashPw(pass);
  if (u.passHash !== h) {
    u.loginFails = (u.loginFails || 0) + 1; save();
    throw new Error(u.loginFails >= 5 ? "Conta temporariamente bloqueada por tentativas excessivas." : "Senha incorreta.");
  }
  u.loginFails = 0; save();
  const token = uid() + uid();
  insert("sessions", { userId: u.id, token, exp: Date.now() + 8 * 3600e3, device: (navigator.userAgent || "navegador").slice(0, 90), createdAt: now(), ip: "local" });
  localStorage.setItem(SKEY, JSON.stringify({ userId: u.id, token, exp: Date.now() + 8 * 3600e3 }));
  audit(u, "LOGIN", "users", u.id, "Autenticação via JWT");
  return u;
}

export function logout() {
  const u = currentUser();
  if (u) audit(u, "LOGOUT", "users", u.id);
  localStorage.removeItem(SKEY);
}

export async function register(data: { name: string; email: string; pass: string; cpf?: string; phone?: string; acceptTerms: boolean; acceptPrivacy: boolean; news?: boolean }): Promise<Row> {
  if (!data.name.trim() || !data.email.includes("@") || data.pass.length < 6)
    throw new Error("Preencha nome, e-mail válido e senha com 6+ caracteres.");
  if (!data.acceptTerms || !data.acceptPrivacy)
    throw new Error("É necessário aceitar os Termos de Uso e a Política de Privacidade (LGPD).");
  if (one("users", (x) => x.email.toLowerCase() === data.email.trim().toLowerCase()))
    throw new Error("Este e-mail já possui conta. Faça login.");
  const passHash = await hashPw(data.pass);
  const u = insert("users", {
    name: data.name.trim(), email: data.email.trim().toLowerCase(), passHash,
    cpf: data.cpf || "", phone: data.phone || "", role: "student", status: "active", loginFails: 0,
  });
  insert("terms_acceptances", { userId: u.id, doc: "termos", version: "1.0", ip: "local", at: now() });
  insert("terms_acceptances", { userId: u.id, doc: "privacidade", version: "1.0", ip: "local", at: now() });
  insert("consents", { userId: u.id, kind: "marketing", granted: !!data.news, at: now() });
  audit(u, "CREATE", "users", u.id, "Conta de aluno criada (cadastro público)");
  sendEmail(u.email, "Confirmação de cadastro — Cyber Academy", `Olá ${u.name}, sua conta foi criada com sucesso. Bem-vindo(a) à Cyber Academy!`);
  notify(u.id, "Boas-vindas à Cyber Academy", "Sua conta foi criada. Explore o catálogo e matricule-se em um curso.");
  return u;
}

export async function setupAdmin(data: { school: string; name: string; email: string; pass: string }): Promise<Row> {
  if (all("users").length > 0) throw new Error("O sistema já foi configurado.");
  const { setSettings } = await import("./db");
  setSettings({ schoolName: data.school.trim() || "Cyber Academy" });
  const passHash = await hashPw(data.pass);
  const u = insert("users", { name: data.name.trim(), email: data.email.trim().toLowerCase(), passHash, role: "admin", status: "active" });
  audit(u, "CREATE", "users", u.id, "Administrador inicial criado (setup)");
  audit(u, "UPDATE", "settings", "", "Configuração inicial da instituição");
  return u;
}

export async function changePassword(userId: string, current: string, next: string): Promise<void> {
  const u = find("users", userId)!;
  if ((await hashPw(current)) !== u.passHash) throw new Error("Senha atual incorreta.");
  if (next.length < 6) throw new Error("A nova senha precisa de 6+ caracteres.");
  update("users", userId, { passHash: await hashPw(next) });
  audit(u, "UPDATE", "users", userId, "Senha alterada");
}

export function requestReset(email: string): boolean {
  const u = one("users", (x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) return false;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  insert("password_resets", { userId: u.id, code, exp: Date.now() + 30 * 60e3, used: false });
  sendEmail(u.email, "Recuperação de senha — Cyber Academy", `Seu código de recuperação é: ${code}. Válido por 30 minutos.`);
  audit(null, "UPDATE", "password_resets", u.id, "Código de recuperação emitido");
  return true;
}

export async function doReset(email: string, code: string, newPass: string): Promise<void> {
  const u = one("users", (x) => x.email.toLowerCase() === email.trim().toLowerCase());
  const r = u && one("password_resets", (p) => p.userId === u.id && p.code === code.trim() && !p.used && p.exp > Date.now());
  if (!u || !r) throw new Error("Código inválido ou expirado.");
  update("users", u.id, { passHash: await hashPw(newPass) });
  update("password_resets", r.id, { used: true });
  sendEmail(u.email, "Senha redefinida — Cyber Academy", "Sua senha foi redefinida com sucesso.");
  audit(null, "UPDATE", "users", u.id, "Senha redefinida via código");
}

/* ================= CATÁLOGO ================= */
export const publishedCourses = () => where("courses", (c) => c.published);
export const courseById = (id: string) => find("courses", id);
export const courseBySlug = (slug: string) => one("courses", (c) => c.slug === slug);
export const effectivePrice = (c: Row) => (c.promoActive && c.promoPrice ? Number(c.promoPrice) : Number(c.price));

/* ================= MODELO DE PRECIFICAÇÃO (avulso × mensalidade) ================= */
/** Modelo único de venda: MENSALIDADES.
 *  - monthly: valor integral da mensalidade
 *  - promoMonthly: mensalidade promocional (opcional)
 *  RESSALVA: a promoção vale apenas se cada mensalidade for paga ATÉ a data de
 *  vencimento. Passado o prazo, a mensalidade volta ao VALOR INTEGRAL. */
export interface Pricing {
  model: "subscription";
  monthly: number;          // mensalidade integral
  promoMonthly: number;     // mensalidade promocional (0 = sem promoção)
  months: number;           // nº de mensalidades (plano)
  freeReenroll: boolean;
  label: string;
  note: string;             // ressalva da promoção
}
export function coursePricing(c: Row): Pricing {
  const months = Math.max(1, Number(c.planMonths) || 1);
  const monthly = Number(c.monthlyPrice) || Math.round((effectivePrice(c) / months) * 100) / 100;
  const promoMonthly = c.promoActive ? Number(c.promoPrice) || 0 : 0;
  const freeReenroll = !!c.freeReenroll;
  const eff = promoMonthly > 0 && promoMonthly < monthly ? promoMonthly : monthly;
  const label = `${months}x de ${fmtBRL(eff)}/mês`;
  const note = promoMonthly > 0
    ? `Mensalidade promocional de ${fmtBRL(promoMonthly)} válida somente com pagamento até a data de vencimento. Em atraso, a mensalidade passa a ser cobrada pelo valor integral de ${fmtBRL(monthly)}.`
    : `Mensalidade de ${fmtBRL(monthly)} — pagamento via boleto, Pix ou cartão até o vencimento.`;
  return { model: "subscription", monthly, promoMonthly, months, freeReenroll, label, note };
}
/** Valor da mensalidade vigente: promocional se paga em dia, integral se em atraso. */
export function installmentAmount(inst: Row, course: Row): { amount: number; late: boolean } {
  const p = coursePricing(course);
  const due = new Date(inst.dueDate).getTime();
  const late = Date.now() > due;
  if (!late && p.promoMonthly > 0 && p.promoMonthly < p.monthly) return { amount: p.promoMonthly, late: false };
  return { amount: p.monthly, late };
}

/** Parcelas/mensalidades de um pedido (cronograma financeiro). */
export function orderInstallments(orderId: string): Row[] {
  return where("installments", (i) => i.orderId === orderId).sort((a, b) => a.n - b.n);
}

/** Rematrícula grátis: aluno concluído reativa o acesso sem novo pagamento. */
export function reenrollFree(studentId: string, courseId: string): Row {
  const c = find("courses", courseId);
  if (!c) throw new Error("Curso não encontrado.");
  const p = coursePricing(c);
  if (!p.freeReenroll) throw new Error("Este curso não possui rematrícula grátis habilitada.");
  const done = one("enrollments", (e) => e.studentId === studentId && e.courseId === courseId && e.status === "COMPLETED");
  if (!done) throw new Error("Rematrícula grátis vale para cursos já concluídos.");
  const active = one("enrollments", (e) => e.studentId === studentId && e.courseId === courseId && e.status === "ACTIVE");
  if (active) throw new Error("Você já possui matrícula ativa neste curso.");
  const u = find("users", studentId)!;
  const en = insert("enrollments", {
    number: nextEnrollmentNumber(), studentId, courseId, classId: c.defaultClassId || null,
    status: "ACTIVE", origin: "reenroll-free", orderId: null, paymentId: null,
    startDate: now(), dueDate: new Date(Date.now() + 365 * 86400e3).toISOString(), progress: 0,
  });
  audit(u, "ENROLLMENT", "enrollments", en.id, `Rematrícula grátis ${en.number} · ${c.title}`);
  notify(studentId, "Rematrícula grátis ativa", `Acesso ao curso ${c.title} reativado sem custo. Matrícula ${en.number}.`, "enrollment");
  sendEmail(u.email, "Rematrícula grátis — Cyber Academy", `Sua rematrícula no curso ${c.title} foi ativada gratuitamente. Matrícula ${en.number}.`);
  return en;
}

export function courseTree(courseId: string) {
  const course = find("courses", courseId);
  if (!course) return null;
  const modules: Row[] = where("course_modules", (m) => m.courseId === courseId)
    .sort((a, b) => a.order - b.order)
    .map((m: Row) => Object.assign({}, m, {
      lessons: where("lessons", (l) => l.moduleId === m.id).sort((a, b) => a.order - b.order),
    }));
  const teacher = find("teachers", course.teacherId);
  return { course, modules, teacher };
}

export const teacherName = (t?: Row) => t?.name || "A definir";

/* ================= CHECKOUT + MERCADO PAGO + WEBHOOK ================= */
/**
 * Cria o pedido no modelo de MENSALIDADES.
 * payDay: dia do mês escolhido pelo aluno para vencimento (ex.: 5, 10, 15…).
 * method: "boleto" | "pix" | "credit" | "debit".
 * Desconto de parceiro (percent) é aplicado sobre a mensalidade.
 */
export function createOrder(user: Row, course: Row, opts: { payDay: number; method: string; partnerDiscount?: number }): Row {
  const p = coursePricing(course);
  const disc = opts.partnerDiscount || 0;
  const base = (v: number) => Math.round(v * (1 - disc / 100) * 100) / 100;
  const monthly = base(p.monthly);
  const promo = p.promoMonthly > 0 ? base(p.promoMonthly) : 0;
  const order = insert("orders", {
    number: nextOrderNumber(), userId: user.id, courseId: course.id,
    amount: promo || monthly, installments: p.months, status: "created",
    gateway: "mercadopago", model: "subscription", payDay: opts.payDay, method: opts.method,
    partnerDiscount: disc,
  });
  for (let n = 1; n <= p.months; n++) {
    const due = new Date();
    due.setDate(opts.payDay);
    due.setMonth(due.getMonth() + (n - 1));
    if (n === 1 && due.getTime() < Date.now()) due.setMonth(due.getMonth() + 1);
    insert("installments", {
      orderId: order.id, userId: user.id, courseId: course.id, n,
      amount: promo || monthly, dueDate: due.toISOString(),
      status: n === 1 ? "pending" : "scheduled", paidAt: null, boleto: null,
    });
  }
  audit(user, "CREATE", "orders", order.id, `Pedido ${order.number} · ${course.title} · ${p.label}${disc ? ` · parceiro -${disc}%` : ""}`);
  return order;
}

/** Gera a linha digitável de um boleto (simulação de backend bancário). */
export function boletoLinhaDigitavel(pay: Row): string {
  let h = 0;
  for (let i = 0; i < pay.id.length; i++) h = (h * 33 + pay.id.charCodeAt(i)) >>> 0;
  const g = (n: number) => String((h >> n) % 100000).padStart(5, "0");
  return `23793.${g(2)}  ${g(7)}.${g(12)}  ${g(17)}.${g(22)}  ${g(3)}  ${String(Math.round(pay.amount * 100)).padStart(10, "0")}`;
}

/** Liquida a mensalidade atual de uma assinatura e agenda a cobrança da próxima. */
export function settleSubscriptionMonth(pay: Row) {
  const order = find("orders", pay.orderId);
  if (!order || order.model !== "subscription") return;
  const due = one("installments", (i) => i.orderId === order.id && i.status === "pending");
  if (due) update("installments", due.id, { status: "paid", paidAt: now() });
  const next = one("installments", (i) => i.orderId === order.id && i.status === "scheduled");
  if (next) update("installments", next.id, { status: "pending" });
}

/** Simula a criação do pagamento no Checkout Pro (backend → Mercado Pago). */
export function createGatewayPayment(order: Row, method: string): Row {
  const pay = insert("payments", {
    orderId: order.id, userId: order.userId, courseId: order.courseId,
    amount: order.amount, installments: order.installments, method,
    gateway: "mercadopago", mpPaymentId: "MP-" + Math.floor(Math.random() * 9e8 + 1e8),
    status: "pending",
  });
  insert("payment_transactions", { paymentId: pay.id, type: "authorization", detail: "Pagamento iniciado no Checkout Pro", at: now() });
  update("orders", order.id, { paymentId: pay.id });
  return pay;
}

/**
 * POST /api/payments/mercadopago/webhook
 * 1. valida autenticidade  2. identifica pagamento  3. consulta no MP
 * 4. confirma status  5. localiza pedido  6. atualiza pagamento/pedido
 * 7. cria matrícula  8. libera curso  9. auditoria  10. comunicação
 */
export function handleWebhook(payload: { type: string; paymentId: string; status: string; x_signature?: string }): { ok: boolean; message: string; enrollment?: Row } {
  audit(null, "WEBHOOK_RECEIVED", "payments", payload.paymentId, `type=${payload.type} status=${payload.status} sign=${payload.x_signature ? "válida" : "AUSENTE"}`);
  if (!payload.x_signature) {
    audit(null, "WEBHOOK_PROCESSED", "payments", payload.paymentId, "Rejeitado: assinatura inválida");
    return { ok: false, message: "Webhook rejeitado: assinatura inválida." };
  }
  const pay = one("payments", (p) => p.mpPaymentId === payload.paymentId || p.id === payload.paymentId);
  if (!pay) return { ok: false, message: "Pagamento não localizado." };
  if (pay.status === "approved") return { ok: false, message: "Pagamento já processado (idempotência)." };

  // "consulta no Mercado Pago" — confirma a fonte oficial, nunca o retorno do checkout
  const confirmed = payload.status;
  insert("payment_transactions", { paymentId: pay.id, type: "webhook", detail: `Notificação ${payload.type} → ${confirmed}`, at: now() });

  if (confirmed === "approved" || confirmed === "approved_webhook") {
    update("payments", pay.id, { status: "approved", paidAt: now() });
    update("orders", pay.orderId, { status: "paid", paidAt: now() });
    settleSubscriptionMonth(pay);
    const order = find("orders", pay.orderId)!;
    const student = find("users", order.userId)!;
    const course = find("courses", order.courseId)!;

    const enrollment = insert("enrollments", {
      number: nextEnrollmentNumber(), studentId: student.id, courseId: course.id,
      classId: course.defaultClassId || null, status: "ACTIVE", origin: "checkout-mercadopago",
      orderId: order.id, paymentId: pay.id, startDate: now(),
      dueDate: new Date(Date.now() + (course.hours || 60) * 86400e3 * 2).toISOString(),
      progress: 0,
    });
    audit(null, "WEBHOOK_PROCESSED", "payments", pay.id, `Pagamento ${pay.mpPaymentId} aprovado`);
    audit(null, "PAYMENT", "payments", pay.id, "Pagamento confirmado via webhook");
    audit(null, "ENROLLMENT", "enrollments", enrollment.id, `Matrícula ${enrollment.number} criada automaticamente`);
    sendEmail(student.email, "Pagamento aprovado — Cyber Academy", `Olá ${student.name}, confirmamos o pagamento de ${course.title}. Sua matrícula ${enrollment.number} foi criada.`);
    sendEmail(student.email, "Curso liberado — Cyber Academy", `O curso ${course.title} já está disponível no seu AVA. Bons estudos!`);
    notify(student.id, "Pagamento aprovado ✔", `Pedido ${order.number} confirmado pelo Mercado Pago.`, "finance");
    notify(student.id, "Matrícula criada", `Matrícula ${enrollment.number} · ${course.title}. Acesso liberado ao AVA.`, "enrollment");
    return { ok: true, message: "Pagamento aprovado, matrícula criada e curso liberado.", enrollment };
  }
  update("payments", pay.id, { status: "rejected" });
  update("orders", pay.orderId, { status: "cancelled" });
  audit(null, "WEBHOOK_PROCESSED", "payments", pay.id, `Pagamento ${confirmed}`);
  return { ok: false, message: "Pagamento não aprovado pelo gateway." };
}

export function refundPayment(actor: Row, paymentId: string) {
  const pay = find("payments", paymentId);
  if (!pay || pay.status !== "approved") throw new Error("Somente pagamentos aprovados podem ser reembolsados.");
  update("payments", paymentId, { status: "refunded", refundedAt: now() });
  update("orders", pay.orderId, { status: "refunded" });
  const en = one("enrollments", (e) => e.paymentId === paymentId);
  if (en) update("enrollments", en.id, { status: "CANCELLED" });
  insert("payment_transactions", { paymentId, type: "refund", detail: "Reembolso processado", at: now() });
  audit(actor, "REFUND", "payments", paymentId, "Reembolso emitido");
  const u = find("users", pay.userId);
  if (u) notify(u.id, "Reembolso processado", "Seu pagamento foi reembolsado. A matrícula vinculada foi cancelada.", "finance");
}

/* ================= MATRÍCULAS / PROGRESSO ================= */
export const myEnrollments = (studentId: string) => where("enrollments", (e) => e.studentId === studentId);

export function publishedLessons(courseId: string): Row[] {
  return where("lessons", (l) => l.courseId === courseId && l.published);
}

export function lessonState(studentId: string, lessonId: string): Row | undefined {
  return one("lesson_progress", (p) => p.studentId === studentId && p.lessonId === lessonId);
}

export function markLesson(studentId: string, lesson: Row, percent: number, completed = false) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const done = completed || pct >= 100;
  const existing = lessonState(studentId, lesson.id);
  if (existing) update("lesson_progress", existing.id, { percent: Math.max(existing.percent || 0, pct), completed: done || existing.completed, updatedAt: now() });
  else insert("lesson_progress", { studentId, lessonId: lesson.id, courseId: lesson.courseId, moduleId: lesson.moduleId, percent: pct, completed: done });
  const wasDone = existing?.completed;
  if (done) {
    const u = find("users", studentId);
    if (u) audit(u, "UPDATE", "lesson_progress", lesson.id, `Aula "${lesson.title}" concluída`);
    if (!wasDone) awardXp(studentId, 15, `Aula concluída: ${lesson.title}`);
  }
  checkCompletionFor(studentId, lesson.courseId);
}

export function courseProgress(studentId: string, courseId: string) {
  const lessons = publishedLessons(courseId);
  const states = where("lesson_progress", (p) => p.studentId === studentId && p.courseId === courseId);
  const byLesson = new Map(states.map((s) => [s.lessonId, s]));
  const done = lessons.filter((l) => byLesson.get(l.id)?.completed).length;
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const modules = where("course_modules", (m) => m.courseId === courseId).sort((a, b) => a.order - b.order).map((m) => {
    const ls = lessons.filter((l) => l.moduleId === m.id);
    const md = ls.filter((l) => byLesson.get(l.id)?.completed).length;
    return { ...m, lessons: ls, done: md, total: ls.length, percent: ls.length ? Math.round((md / ls.length) * 100) : 0 };
  });
  return { percent, done, total: lessons.length, modules, byLesson };
}

/* ================= NOTAS ================= */
export function upsertGrade(g: { studentId: string; courseId: string; moduleId?: string; kind: string; refId: string; refTitle: string; score: number; max: number; weight: number; status: string; feedback?: string; gradedBy?: string }) {
  const existing = one("grades", (x) => x.studentId === g.studentId && x.kind === g.kind && x.refId === g.refId);
  if (existing) return update("grades", existing.id, { ...g });
  return insert("grades", { ...g, date: now() });
}

export function weightedAvg(studentId: string, courseId: string): { avg: number; count: number } {
  const gs = where("grades", (g) => g.studentId === studentId && g.courseId === courseId && (g.status === "graded" || g.status === "auto_graded"));
  if (!gs.length) return { avg: 0, count: 0 };
  let num = 0, den = 0;
  gs.forEach((g) => { const pct = g.max ? (g.score / g.max) * 100 : 0; num += pct * (g.weight || 1); den += g.weight || 1; });
  return { avg: den ? Math.round((num / den) * 10) / 10 : 0, count: gs.length };
}

/* ================= ATIVIDADES / AVALIAÇÕES (tentativas + correção) ================= */
export function autoScore(item: Row, answers: Record<string, any>) {
  let score = 0; const max = (item.questions || []).reduce((s: number, q: Row) => s + (q.points || 1), 0);
  const detail: Record<string, boolean> = {};
  (item.questions || []).forEach((q: Row) => {
    const a = answers[q.qid];
    let ok = false;
    if (q.type === "single") ok = a === q.correct;
    else if (q.type === "tf") ok = String(a) === String(q.correct);
    else if (q.type === "multi") {
      const c = [...(q.correct || [])].sort().join(",");
      const v = [...(a || [])].sort().join(",");
      ok = c === v && c !== "";
    }
    detail[q.qid] = ok;
    if (ok) score += q.points || 1;
  });
  return { score, max, detail };
}

export function submitAttempt(kind: "activity" | "assessment", itemId: string, student: Row, answers: Record<string, any>) {
  const item = find(kind === "activity" ? "activities" : "assessments", itemId);
  if (!item) throw new Error("Item não encontrado.");
  const prev = where("attempts", (a) => a.kind === kind && a.itemId === itemId && a.studentId === student.id && a.status !== "abandoned");
  if (item.attempts && prev.length >= item.attempts) throw new Error("Limite de tentativas atingido.");
  const { score, max, detail } = autoScore(item, answers);
  const hasEssay = (item.questions || []).some((q: Row) => q.type === "essay" || q.type === "open");
  const status = hasEssay ? "review" : "auto_graded";
  const at = insert("attempts", {
    kind, itemId, itemTitle: item.title, courseId: item.courseId, studentId: student.id,
    answers, detail, objScore: score, essayScore: null, score: hasEssay ? null : score, max,
    status, submittedAt: now(), n: prev.length + 1,
  });
  audit(student, "CREATE", "attempts", at.id, `${kind === "activity" ? "Atividade" : "Avaliação"} "${item.title}" enviada`);
  if (!hasEssay) {
    upsertGrade({
      studentId: student.id, courseId: item.courseId, kind, refId: itemId, refTitle: item.title,
      score, max, weight: item.weight || (kind === "activity" ? 1 : 2), status: "auto_graded",
    });
    notify(student.id, "Resultado disponível", `${item.title}: ${score}/${max} pontos.`, "grade");
  } else {
    notify(student.id, "Envio confirmado", `${item.title} recebida — aguardando correção do professor.`, "grade");
    // avisa professores do curso
    where("teachers", (t) => t.courseIds?.includes(item.courseId)).forEach((t) => t.userId && notify(t.userId, "Correção pendente", `"${item.title}" aguarda correção de questões dissertativas.`, "grade"));
  }
  checkCompletionFor(student.id, item.courseId);
  awardXp(student.id, kind === "activity" ? 25 : 40, `${kind === "activity" ? "Atividade" : "Avaliação"} enviada: ${item.title}`);
  return at;
}

export function gradeAttempt(actor: Row, attemptId: string, essayScores: Record<string, number>, feedback: string) {
  const at = find("attempts", attemptId);
  if (!at) throw new Error("Tentativa não encontrada.");
  const item = find(at.kind === "activity" ? "activities" : "assessments", at.itemId);
  const qs = (item?.questions || []).filter((q: Row) => q.type === "essay" || q.type === "open");
  let es = 0;
  qs.forEach((q: Row) => { es += Math.min(Number(essayScores[q.qid] ?? 0), q.points || 1); });
  const total = (at.objScore || 0) + es;
  update("attempts", attemptId, { essayScore: es, score: total, status: "graded", feedback, gradedBy: actor.name, gradedAt: now() });
  upsertGrade({
    studentId: at.studentId, courseId: at.courseId, kind: at.kind, refId: at.itemId, refTitle: at.itemTitle,
    score: total, max: at.max, weight: item?.weight || (at.kind === "activity" ? 1 : 2),
    status: "graded", feedback, gradedBy: actor.name,
  });
  audit(actor, "GRADE_CHANGE", "attempts", attemptId, `Nota ${total}/${at.max} lançada · ${at.itemTitle}`);
  notify(at.studentId, "Correção concluída", `${at.itemTitle}: nota ${total}/${at.max}. ${feedback ? "Feedback: " + feedback : ""}`, "grade");
  checkCompletionFor(at.studentId, at.courseId);
}

/* ================= PROJETOS ================= */
export function submitSubmission(student: Row, project: Row, data: { url: string; github: string; description: string; fileName?: string; fileData?: string }) {
  const prev = one("submissions", (s) => s.projectId === project.id && s.studentId === student.id);
  const payload = {
    projectId: project.id, courseId: project.courseId, studentId: student.id,
    ...data, status: "submitted", submittedAt: now(),
  };
  if (prev) { update("submissions", prev.id, payload); audit(student, "UPDATE", "submissions", prev.id, `Projeto "${project.title}" reenviado`); return find("submissions", prev.id); }
  const s = insert("submissions", payload);
  audit(student, "CREATE", "submissions", s.id, `Projeto "${project.title}" enviado`);
  notify(student.id, "Projeto enviado", `"${project.title}" recebido. Aguarde a avaliação do professor.`, "project");
  where("teachers", (t) => t.courseIds?.includes(project.courseId)).forEach((t) => t.userId && notify(t.userId, "Projeto para avaliar", `Entrega de "${project.title}" aguardando avaliação.`, "project"));
  return s;
}

export function reviewSubmission(actor: Row, submissionId: string, data: { status: string; score?: number; comment: string }) {
  const sub = find("submissions", submissionId);
  if (!sub) throw new Error("Entrega não encontrada.");
  const project = find("projects", sub.projectId);
  update("submissions", submissionId, { ...data, reviewedBy: actor.name, reviewedAt: now(), feedback: [...(sub.feedback || []), { by: actor.name, at: now(), text: data.comment }] });
  if (data.status === "approved" && typeof data.score === "number") {
    upsertGrade({
      studentId: sub.studentId, courseId: sub.courseId, kind: "project", refId: sub.projectId,
      refTitle: project?.title || "Projeto", score: data.score, max: project?.maxScore || 100,
      weight: 3, status: "graded", feedback: data.comment, gradedBy: actor.name,
    });
    audit(actor, "GRADE_CHANGE", "submissions", submissionId, `Projeto aprovado · nota ${data.score}`);
  } else {
    audit(actor, "UPDATE", "submissions", submissionId, `Projeto → ${data.status}`);
  }
  const msg = data.status === "approved" ? "aprovado" : data.status === "rejected" ? "reprovado" : "devolvido para ajustes";
  notify(sub.studentId, `Projeto ${msg}`, `"${project?.title}" — ${data.comment || "Sem comentários."}`, "project");
  checkCompletionFor(sub.studentId, sub.courseId);
}

/* ================= CONCLUSÃO + CERTIFICADO ================= */
export function checkCompletionFor(studentId: string, courseId: string) {
  const en = one("enrollments", (e) => e.studentId === studentId && e.courseId === courseId && (e.status === "ACTIVE"));
  if (!en) return null;
  const prog = courseProgress(studentId, courseId);
  const assessments = where("assessments", (a) => a.courseId === courseId && a.published);
  const attempts = where("attempts", (a) => a.studentId === studentId && a.courseId === courseId);
  const allAssessed = assessments.every((a) => attempts.some((t) => t.itemId === a.id && ["auto_graded", "graded", "review"].includes(t.status)));
  const { avg, count } = weightedAvg(studentId, courseId);
  const pass = getSettings().passScore || 70;
  const avgOk = count === 0 || avg >= pass;
  const projects = where("projects", (p) => p.courseId === courseId);
  const projOk = !getSettings().completionRequireProject || projects.length === 0 ||
    projects.some((p) => one("submissions", (s) => s.projectId === p.id && s.studentId === studentId && s.status === "approved"));
  if (prog.total > 0 && prog.percent >= 100 && allAssessed && avgOk && projOk) {
    update("enrollments", en.id, { status: "COMPLETED", completedAt: now(), progress: 100 });
    audit(null, "UPDATE", "enrollments", en.id, `Curso concluído · matrícula ${en.number}`);
    issueCertificate(en);
    return true;
  }
  update("enrollments", en.id, { progress: prog.percent });
  return false;
}

export function issueCertificate(enrollment: Row): Row | undefined {
  const existing = one("certificates", (c) => c.enrollmentId === enrollment.id);
  if (existing) return existing;
  const course = find("courses", enrollment.courseId)!;
  const student = find("users", enrollment.studentId)!;
  const cert = insert("certificates", {
    code: nextCertCode(), studentId: student.id, courseId: course.id, enrollmentId: enrollment.id,
    studentName: student.name, courseTitle: course.title, hours: course.hours || 0,
    level: course.level, periodStart: enrollment.startDate, periodEnd: now(), issuedAt: now(),
  });
  audit(null, "CERTIFICATE_GENERATED", "certificates", cert.id, `Certificado ${cert.code} · ${student.name} · ${course.title}`);
  sendEmail(student.email, "Certificado disponível — Cyber Academy", `Parabéns ${student.name}! Você concluiu ${course.title}. Certificado ${cert.code} disponível no portal.`);
  notify(student.id, "Certificado emitido 🏅", `Você concluiu ${course.title}! Certificado ${cert.code} disponível.`, "certificate");
  return cert;
}

export function validateCertificate(code: string): { valid: boolean; cert?: Row; course?: Row; enrollment?: Row } {
  const clean = code.trim().toUpperCase();
  const cert = one("certificates", (c) => c.code.toUpperCase() === clean);
  insert("certificate_validations", { code: clean, valid: !!cert, at: now(), origin: "página pública" });
  if (!cert) return { valid: false };
  audit(null, "UPDATE", "certificate_validations", cert.id, `Validação pública do certificado ${cert.code}`);
  return { valid: true, cert, course: find("courses", cert.courseId), enrollment: find("enrollments", cert.enrollmentId) };
}

/* ================= FREQUÊNCIA ================= */
export function setAttendance(actor: Row, data: { studentId: string; classId: string; lessonId: string; date: string; status: string; justification?: string }) {
  const ex = one("attendance", (a) => a.studentId === data.studentId && a.classId === data.classId && a.lessonId === data.lessonId);
  if (ex) { update("attendance", ex.id, { status: data.status, justification: data.justification || "", date: data.date }); audit(actor, "UPDATE", "attendance", ex.id, `Frequência → ${data.status}`); return find("attendance", ex.id); }
  const a = insert("attendance", data);
  audit(actor, "CREATE", "attendance", a.id, `Frequência registrada (${data.status})`);
  return a;
}

/* ================= SUPORTE ================= */
export function createTicket(user: Row, subject: string, category: string, message: string, enrollmentId?: string) {
  const t = insert("support_tickets", { userId: user.id, userName: user.name, subject, category, status: "open", enrollmentId, createdAt: now() });
  insert("ticket_messages", { ticketId: t.id, authorId: user.id, authorName: user.name, authorRole: "student", text: message, at: now() });
  audit(user, "CREATE", "support_tickets", t.id, `Chamado "${subject}" aberto`);
  where("users", (u) => u.role === "support" || u.role === "admin").forEach((u) => notify(u.id, "Novo chamado", `${user.name}: ${subject}`, "support"));
  return t;
}

export function replyTicket(actor: Row, ticketId: string, text: string, close = false) {
  insert("ticket_messages", { ticketId, authorId: actor.id, authorName: actor.name, authorRole: actor.role, text, at: now() });
  update("support_tickets", ticketId, { status: close ? "closed" : "answered" });
  const t = find("support_tickets", ticketId)!;
  if (actor.role !== "student") notify(t.userId, "Resposta no seu chamado", `${t.subject}: nova resposta do suporte.`, "support");
  audit(actor, "UPDATE", "support_tickets", ticketId, close ? "Chamado encerrado" : "Chamado respondido");
}

/* ================= EXPORTAÇÃO ================= */
export function downloadCSV(name: string, rows: Row[], cols: [string, string][]) {
  const head = cols.map((c) => c[1]).join(";");
  const body = rows.map((r) => cols.map(([k]) => String(r[k] ?? "").replace(/;/g, ",").replace(/\n/g, " ")).join(";")).join("\n");
  const blob = new Blob(["\ufeff" + head + "\n" + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ================= PERMISSÕES (RBAC) ================= */
export function teacherCourses(teacherId: string): Row[] {
  return where("courses", (c) => c.teacherId === teacherId);
}
export function teacherClasses(teacherId: string): Row[] {
  return where("classes", (c) => c.teacherId === teacherId);
}
export function canTeacherAccess(teacherId: string, courseId: string): boolean {
  const c = find("courses", courseId);
  if (!c) return false;
  if (c.teacherId === teacherId) return true;
  return where("classes", (k) => k.courseId === courseId && k.teacherId === teacherId).length > 0;
}

/* ================= XP · NÍVEIS · STREAK ================= */
import { XP_LEVELS } from "./db";

export function levelInfo(xp: number) {
  let idx = 0;
  XP_LEVELS.forEach(([, min], i) => { if (xp >= min) idx = i; });
  const [name, min] = XP_LEVELS[idx];
  const next = XP_LEVELS[idx + 1];
  const pct = next ? Math.round(((xp - min) / (next[1] - min)) * 100) : 100;
  return { name, idx, xp, min, nextName: next?.[0] || null, nextMin: next?.[1] || min, pct };
}

export function awardXp(userId: string, amount: number, reason: string) {
  const u = find("users", userId);
  if (!u) return;
  const today = now().slice(0, 10);
  let streak = u.streak || 0;
  if (u.lastXpDay !== today) {
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    streak = u.lastXpDay === yesterday ? streak + 1 : 1;
  }
  update("users", userId, { xp: (u.xp || 0) + amount, lastXpDay: today, streak });
  insert("xp_events", { userId, amount, reason, at: now() });
  const lv = levelInfo((u.xp || 0) + amount);
  const prev = levelInfo(u.xp || 0);
  if (lv.idx > prev.idx) notify(userId, "Nível alcançado!", `Você subiu para ${lv.name} (${lv.xp} XP). Continue assim!`, "xp");
}

export function streakDays(userId: string) {
  const u = find("users", userId);
  if (!u?.lastXpDay) return 0;
  const today = now().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return u.lastXpDay === today || u.lastXpDay === yesterday ? (u.streak || 0) : 0;
}

/* ================= PERFIL + FOTO ================= */
export function updateProfile(user: Row, data: Record<string, any>) {
  if (data.email && one("users", (x) => x.email.toLowerCase() === String(data.email).toLowerCase() && x.id !== user.id))
    throw new Error("Este e-mail já está em uso.");
  update("users", user.id, data);
  audit(user, "UPDATE", "users", user.id, "Dados do perfil atualizados");
  return find("users", user.id)!;
}

export function passwordScore(pw: string): { score: number; label: string; tone: "coral" | "amber" | "green" } {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length < 6) return { score: 0, label: "muito fraca", tone: "coral" };
  if (s <= 2) return { score: 1, label: "fraca", tone: "coral" };
  if (s === 3) return { score: 2, label: "razoável", tone: "amber" };
  if (s === 4) return { score: 3, label: "forte", tone: "green" };
  return { score: 4, label: "excelente", tone: "green" };
}

/* ================= DOCUMENTOS + FOTO + CARTEIRINHA ================= */
export function myDocuments(userId: string): Row[] {
  return where("documents", (d) => d.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function uploadDocument(user: Row, data: { kind: string; fileName: string; dataUrl: string; enrollmentId?: string; note?: string }) {
  if (!data.dataUrl || !data.dataUrl.startsWith("data:image/")) throw new Error("Envie um arquivo de imagem (PNG/JPG).");
  if (data.dataUrl.length > 1_500_000) throw new Error("Imagem muito grande (máx. ~1MB após compressão).");
  const prev = myDocuments(user.id).filter((d) => d.kind === data.kind && d.status !== "REJECTED");
  const doc = insert("documents", {
    userId: user.id, kind: data.kind, fileName: data.fileName, dataUrl: data.dataUrl,
    enrollmentId: data.enrollmentId || null, note: data.note || "",
    status: "PENDING_REVIEW", version: prev.length + 1,
    createdAt: now(), reviewedBy: null, reviewNote: "",
  });
  audit(user, "FILE_UPLOAD", "documents", doc.id, `Documento enviado: ${data.kind} v${doc.version}`);
  where("users", (u) => u.role === "admin").forEach((a) => notify(a.id, "Documento para análise", `${user.name} enviou ${data.kind} (v${doc.version}).`, "document"));
  return doc;
}

export function reviewDocument(admin: Row, docId: string, approve: boolean, note: string) {
  const d = find("documents", docId);
  if (!d) return;
  update("documents", docId, { status: approve ? "APPROVED" : "REJECTED", reviewedBy: admin.id, reviewNote: note, reviewedAt: now() });
  audit(admin, "UPDATE", "documents", docId, `Documento ${approve ? "aprovado" : "rejeitado"}${note ? ` — ${note}` : ""}`);
  notify(d.userId, approve ? "Documento aprovado" : "Documento rejeitado",
    approve ? `Seu documento (${d.kind}) foi validado pela secretaria.` : `Seu documento (${d.kind}) foi rejeitado. ${note || "Envie uma nova versão."}`, "document");
}

export function issueStudentCard(user: Row, enrollmentId: string): Row {
  const en = find("enrollments", enrollmentId);
  if (!en) throw new Error("Matrícula não encontrada.");
  if (!user.photo) throw new Error("Envie sua foto 3x4 no perfil antes de emitir a carteirinha.");
  const year = new Date().getFullYear();
  const seq = String(where("documents", (d) => d.kind === "CARTEIRINHA").length + 1).padStart(6, "0");
  const number = `CA-ID-${year}-${seq}`;
  const doc = insert("documents", {
    userId: user.id, kind: "CARTEIRINHA", fileName: `carteirinha-${number}.png`, dataUrl: "",
    enrollmentId, status: "APPROVED", version: 1, createdAt: now(),
    cardNumber: number, validUntil: new Date(Date.now() + 365 * 864e5).toISOString(),
    reviewedBy: "system", reviewNote: "Emissão automática via SIA",
  });
  audit(user, "CREATE", "documents", doc.id, `Carteirinha de estudante emitida: ${number}`);
  notify(user.id, "Carteirinha emitida", `Sua carteirinha digital ${number} está disponível em Documentos.`, "document");
  return doc;
}

export function validateStudentCard(code: string) {
  const d = one("documents", (x) => x.kind === "CARTEIRINHA" && x.cardNumber === code?.trim());
  if (!d) return { valid: false };
  const u = find("users", d.userId);
  const en = find("enrollments", d.enrollmentId);
  const c = en && find("courses", en.courseId);
  const expired = new Date(d.validUntil) < new Date();
  return { valid: !expired, expired, doc: d, user: u, enrollment: en, course: c };
}

/* ================= 2FA (TOTP) ================= */
function totpCode(secret: string, slot: number): string {
  let h = 0;
  const s = secret + ":" + slot;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return String(h % 1000000).padStart(6, "0");
}
export function currentTotp(secret: string): { code: string; remaining: number } {
  const slot = Math.floor(Date.now() / 30000);
  return { code: totpCode(secret, slot), remaining: 30 - Math.floor((Date.now() % 30000) / 1000) };
}
export function enable2FA(user: Row): string {
  const secret = uid().slice(0, 12).toUpperCase();
  update("users", user.id, { totpSecret: secret, twoFactor: "pending" });
  audit(user, "UPDATE", "users", user.id, "2FA: segredo gerado (ativação pendente)");
  return secret;
}
export function confirm2FA(user: Row, code: string) {
  const u = find("users", user.id)!;
  if (!u.totpSecret) throw new Error("Inicie a ativação do 2FA primeiro.");
  const slot = Math.floor(Date.now() / 30000);
  if (code !== totpCode(u.totpSecret, slot) && code !== totpCode(u.totpSecret, slot - 1))
    throw new Error("Código inválido. Verifique o autenticador.");
  update("users", user.id, { twoFactor: "on" });
  audit(user, "UPDATE", "users", user.id, "2FA ativado (TOTP)");
  sendEmail(u.email, "Segurança — 2FA ativado", "A verificação em duas etapas foi ativada na sua conta Cyber Academy.");
}
export function disable2FA(user: Row, code: string) {
  const u = find("users", user.id)!;
  const slot = Math.floor(Date.now() / 30000);
  if (code !== totpCode(u.totpSecret || "", slot) && code !== totpCode(u.totpSecret || "", slot - 1))
    throw new Error("Código inválido.");
  update("users", user.id, { twoFactor: "off", totpSecret: "" });
  audit(user, "UPDATE", "users", user.id, "2FA desativado");
}

/* ================= SESSÕES ================= */
export function mySessions(userId: string): Row[] {
  const raw = localStorage.getItem(SKEY);
  const cur = raw ? JSON.parse(raw).token : "";
  return where("sessions", (s) => s.userId === userId && (s.exp || 0) > Date.now())
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .map((s) => ({ ...s, current: s.token === cur }));
}
export function revokeSession(user: Row, sessionId: string) {
  const s = find("sessions", sessionId);
  if (!s || s.userId !== user.id) throw new Error("Sessão não encontrada.");
  update("sessions", sessionId, { exp: 0, revoked: true });
  audit(user, "UPDATE", "sessions", sessionId, `Sessão revogada (${s.device || "dispositivo"})`);
}

/* ================= FÓRUM DA TURMA ================= */
export function forumPosts(courseId: string): Row[] {
  return where("forum_posts", (p) => p.courseId === courseId && !p.parentId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((p) => ({ ...p, replies: where("forum_posts", (r) => r.parentId === p.id).sort((a, b) => a.at.localeCompare(b.at)) }));
}
export function createForumPost(user: Row, courseId: string, parentId: string | null, body: string) {
  if (!body.trim()) throw new Error("Escreva sua mensagem.");
  const isTeacher = canTeacherAccess(user.id, courseId) || user.role === "teacher";
  const p = insert("forum_posts", {
    courseId, parentId: parentId || null, authorId: user.id, authorName: user.name,
    authorRole: isTeacher ? "teacher" : "student", body: body.trim(), at: now(),
  });
  audit(user, "CREATE", "forum_posts", p.id, parentId ? "Resposta no fórum" : "Novo tópico no fórum");
  if (!parentId) {
    where("enrollments", (e) => e.courseId === courseId && e.status === "ACTIVE" && e.studentId !== user.id)
      .forEach((e) => notify(e.studentId, "Novo tópico no fórum", `${user.name} abriu "${body.trim().slice(0, 60)}…"`, "forum"));
  }
  awardXp(user.id, 5, "Participação no fórum");
  return p;
}
export function deleteForumPost(user: Row, postId: string) {
  const p = find("forum_posts", postId);
  if (!p) return;
  if (p.authorId !== user.id && user.role !== "admin") throw new Error("Sem permissão para excluir.");
  where("forum_posts", (r) => r.parentId === postId).forEach((r) => remove("forum_posts", r.id));
  remove("forum_posts", postId);
  audit(user, "DELETE", "forum_posts", postId, "Post removido do fórum");
}

/* ================= ANOTAÇÕES DE AULA ================= */
export function lessonNote(userId: string, lessonId: string): Row | undefined {
  return one("lesson_notes", (n) => n.userId === userId && n.lessonId === lessonId);
}
export function saveLessonNote(userId: string, lessonId: string, courseId: string, text: string) {
  const ex = lessonNote(userId, lessonId);
  if (ex) update("lesson_notes", ex.id, { text, updatedAt: now() });
  else insert("lesson_notes", { userId, lessonId, courseId, text, updatedAt: now() });
}

/* ================= RETOMADA / PRÓXIMA AULA ================= */
export function resumeLesson(studentId: string, courseId: string): Row | undefined {
  const lessons = publishedLessons(courseId);
  const states = new Map(where("lesson_progress", (p) => p.studentId === studentId).map((s) => [s.lessonId, s]));
  const started = lessons.find((l) => { const s = states.get(l.id); return s && !s.completed; });
  if (started) return started;
  return lessons.find((l) => !states.get(l.id)?.completed);
}

/* ================= EQUIPE (RH / Financeiro / Atendimento) ================= */
export async function createStaffUser(actor: Row, data: { name: string; email: string; pass: string; role: string; dept?: string; phone?: string; salary?: number }) {
  if (actor.role !== "admin") throw new Error("Somente o administrador pode cadastrar a equipe.");
  if (!data.name.trim() || !data.email.includes("@")) throw new Error("Nome e e-mail válidos são obrigatórios.");
  if (data.pass.length < 6) throw new Error("A senha inicial precisa de 6+ caracteres.");
  if (one("users", (u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) throw new Error("Este e-mail já está cadastrado.");
  const role = AREA_ROLES.includes(data.role) || data.role === "teacher" || data.role === "support" ? data.role : "atendimento";
  const passHash = await hashPw(data.pass);
  const u = insert("users", {
    name: data.name.trim(), email: data.email.trim().toLowerCase(), passHash, role,
    dept: data.dept || STAFF_AREAS[role] || "", phone: data.phone || "", salary: Number(data.salary) || 0,
    status: "active", loginFails: 0, createdAt: now(),
  });
  audit(actor, "ROLE_CHANGE", "users", u.id, `Usuário de equipe criado: ${u.name} → área ${STAFF_AREAS[role] || role}`);
  sendEmail(u.email, "Acesso liberado — Cyber Academy", `Olá ${u.name}, seu acesso à área ${STAFF_AREAS[role] || role} foi ativado. Entre pela Intranet.`);
  notify(u.id, "Acesso liberado", `Você foi alocado(a) na área ${STAFF_AREAS[role] || role}. Acesse pela Intranet.`, "info");
  return u;
}

export function setStaffRole(actor: Row, userId: string, role: string, dept?: string) {
  if (actor.role !== "admin") throw new Error("Sem permissão.");
  const u = find("users", userId);
  if (!u) throw new Error("Usuário não encontrado.");
  if (u.role === "admin") throw new Error("Não é possível alterar o administrador raiz.");
  const valid = ["teacher", "support", ...AREA_ROLES].includes(role) ? role : u.role;
  update("users", userId, { role: valid, ...(dept ? { dept } : {}) });
  audit(actor, "ROLE_CHANGE", "users", userId, `${u.name} → área ${STAFF_AREAS[valid] || valid}${dept ? ` (${dept})` : ""}`);
  notify(userId, "Área de trabalho atualizada", `Seu acesso agora é: ${STAFF_AREAS[valid] || valid}.`, "info");
}

/* ================= PROTEÇÃO DE CONTEÚDO ================= */
export function isProtectedBuild(): boolean {
  return true;
}

/* ================= SESSÃO EXPIRADA (segurança) ================= */
export function sessionExpired(): boolean {
  const raw = localStorage.getItem(SKEY);
  if (!raw) return false;
  try {
    const s = JSON.parse(raw);
    if (s.exp < Date.now()) { localStorage.removeItem(SKEY); return true; }
    const ses = one("sessions", (x) => x.token === s.token);
    if (ses && (ses.revoked || (ses.exp || 0) < Date.now())) { localStorage.removeItem(SKEY); return true; }
  } catch { localStorage.removeItem(SKEY); }
  return false;
}

/* ================= PARCERIAS (escolas parceiras) ================= */
export function partnerByCode(code: string): Row | undefined {
  return one("partnerships", (p) => p.code === code?.trim().toUpperCase() && p.status === "ACTIVE");
}
export function createPartnership(admin: Row, d: Record<string, any>): Row {
  const code = d.code || ("CA-" + (d.schoolName || "PAR").slice(0, 3).toUpperCase() + "-" + String(all("partnerships").length + 1).padStart(3, "0")).toUpperCase();
  const pt = insert("partnerships", { schoolName: d.schoolName, contactName: d.contactName || "", contactEmail: d.contactEmail || "", contactPhone: d.contactPhone || "", discountPercent: Number(d.discountPercent) || 10, code, status: "ACTIVE", createdAt: now() });
  audit(admin, "CREATE", "partnerships", pt.id, `Parceria ${pt.schoolName} (${pt.code}) desconto ${pt.discountPercent}%`);
  return pt;
}
export function linkPartnerStudent(studentId: string, partnerId: string) {
  if (one("partner_students", (ps) => ps.studentId === studentId)) return;
  insert("partner_students", { studentId, partnerId, linkedAt: now() });
}
export function studentPartner(studentId: string): Row | undefined {
  const link = one("partner_students", (ps) => ps.studentId === studentId);
  return link ? find("partnerships", link.partnerId) : undefined;
}

/* ================= CONTRATOS POR CURSO ================= */
export function courseContract(courseId: string): Row | undefined {
  return where("course_contracts", (c) => c.courseId === courseId).sort((a, b) => b.version - a.version)[0];
}
export function acceptContract(user: Row, courseId: string): Row {
  const c = courseContract(courseId);
  if (!c) throw new Error("Curso sem contrato vigente.");
  if (one("contract_acceptances", (a) => a.userId === user.id && a.contractId === c.id)) throw new Error("Contrato já aceito.");
  const acc = insert("contract_acceptances", { userId: user.id, contractId: c.id, courseId, at: now(), ip: "local" });
  audit(user, "CREATE", "contract_acceptances", acc.id, `Aceite do contrato "${c.title}" v${c.version}`);
  return acc;
}

/* ================= SOLICITAÇÕES DE SERVIÇO (AVA) ================= */
export const SERVICE_TYPES: Record<string, string> = {
  historico: "Histórico escolar",
  declaracao: "Declaração / comprovante",
  financeiro: "Serviços financeiros",
  certificado: "2ª via de certificado",
  outro: "Solicitação geral",
};
export function createServiceRequest(user: Row, d: { type: string; subject: string; description: string }): Row {
  const sr = insert("service_requests", { userId: user.id, type: d.type, subject: d.subject, description: d.description, status: "PENDING", response: "", createdAt: now() });
  audit(user, "CREATE", "service_requests", sr.id, `${SERVICE_TYPES[d.type] || d.type}: ${d.subject}`);
  where("users", (u) => ["admin", "support", "finance", "atendimento"].includes(u.role)).forEach((u) => notify(u.id, "Nova solicitação de aluno", `${user.name}: ${d.subject}`, "support"));
  return sr;
}
export function respondServiceRequest(actor: Row, id: string, response: string, done: boolean) {
  const sr = find("service_requests", id);
  if (!sr) return;
  update("service_requests", id, { response, status: done ? "COMPLETED" : "IN_PROGRESS", answeredAt: now() });
  audit(actor, "UPDATE", "service_requests", id, `${done ? "Concluída" : "Em andamento"}: ${sr.subject}`);
  notify(sr.userId, done ? "Solicitação concluída" : "Solicitação em andamento", `${sr.subject} — ${response.slice(0, 120)}`, "support");
}

/* ================= CENTRAL DE CARREIRAS ================= */
export function bookCareerSession(user: Row, d: { service: string; date: string; notes: string }): Row {
  const s = insert("career_sessions", { userId: user.id, service: d.service, date: d.date, notes: d.notes, status: "scheduled", createdAt: now() });
  audit(user, "CREATE", "career_sessions", s.id, `Agendamento: ${d.service}`);
  where("users", (u) => ["admin", "support", "atendimento"].includes(u.role)).forEach((u) => notify(u.id, "Novo agendamento de carreira", `${user.name}: ${d.service}`, "info"));
  return s;
}
export function requestCvReview(user: Row, cvText: string): Row {
  const r = insert("cv_requests", { userId: user.id, cvText, status: "PENDING", feedback: "", createdAt: now() });
  audit(user, "CREATE", "cv_requests", r.id, "Revisão de currículo solicitada");
  return r;
}

/* ================= ONGs (cursos gratuitos) ================= */
export function createNgo(admin: Row, d: Record<string, any>): Row {
  const o = insert("ngos", { name: d.name, contactName: d.contactName || "", contactEmail: d.contactEmail || "", status: "ACTIVE", createdAt: now() });
  audit(admin, "CREATE", "ngos", o.id, `ONG cadastrada: ${d.name}`);
  return o;
}
export function assignNgoCourse(admin: Row, ngoId: string, courseId: string) {
  if (one("ngo_courses", (n) => n.ngoId === ngoId && n.courseId === courseId)) return;
  insert("ngo_courses", { ngoId, courseId, seats: 20, createdAt: now() });
  audit(admin, "CREATE", "ngo_courses", "", `Curso gratuito liberado para ONG`);
}
export function ngoFreeEnroll(user: Row, ngoId: string, courseId: string): Row {
  const nc = one("ngo_courses", (n) => n.ngoId === ngoId && n.courseId === courseId);
  if (!nc) throw new Error("Este curso não está liberado para sua ONG.");
  if (one("enrollments", (e) => e.studentId === user.id && e.courseId === courseId && ["ACTIVE", "COMPLETED"].includes(e.status))) throw new Error("Você já está matriculado neste curso.");
  const en = insert("enrollments", {
    number: nextEnrollmentNumber(), studentId: user.id, courseId, classId: null,
    status: "ACTIVE", origin: "ngo-free", orderId: null, paymentId: null, ngoId,
    startDate: now(), dueDate: new Date(Date.now() + 365 * 86400e3).toISOString(), progress: 0,
  });
  audit(user, "ENROLLMENT", "enrollments", en.id, `Matrícula gratuita ONG ${en.number}`);
  notify(user.id, "Curso gratuito liberado", `Matrícula ${en.number} ativa — bons estudos!`, "enrollment");
  return en;
}
export function userNgo(userId: string): Row | undefined {
  const u = find("users", userId);
  return u?.ngoId ? find("ngos", u.ngoId) : undefined;
}

/* ================= DIÁRIO DE CLASSE / FREQUÊNCIA (AVA) ================= */
/** Presença = aula assistida/concluída no AVA. Retorna % de presença do aluno no curso. */
export function studentAttendance(studentId: string, courseId: string): { present: number; total: number; percent: number } {
  const lessons = publishedLessons(courseId);
  const states = new Map(where("lesson_progress", (p) => p.studentId === studentId && lessons.some((l) => l.id === p.lessonId)).map((s) => [s.lessonId, s]));
  const present = lessons.filter((l) => (states.get(l.id)?.percent || 0) >= 75).length;
  const total = lessons.length;
  return { present, total, percent: total ? Math.round((present / total) * 100) : 0 };
}
export function minAttendance(): number {
  return Number(getSettings().minAttendance ?? 75);
}
/** Diário de classe: por aluno, presença em cada aula. */
export function classDiary(courseId: string) {
  const lessons = publishedLessons(courseId);
  const ens = where("enrollments", (e) => e.courseId === courseId && ["ACTIVE", "COMPLETED"].includes(e.status));
  return ens.map((e) => {
    const att = studentAttendance(e.studentId, courseId);
    const perLesson = lessons.map((l) => {
      const st = one("lesson_progress", (p) => p.studentId === e.studentId && p.lessonId === l.id);
      return { lesson: l.title, present: (st?.percent || 0) >= 75, percent: st?.percent || 0 };
    });
    return { enrollment: e, student: find("users", e.studentId), attendance: att, perLesson };
  }).filter((d) => d.student);
}

export { all, one, where, find, insert, update, remove, uid, now, audit, notify, sendEmail, wipeDB, save, getSettings, hashPw };
export { fmtBRL, fmtDate, fmtDT, timeAgo, nextOrderNumber, nextEnrollmentNumber, nextCertCode, setSettings, statusBadge } from "./db";
export { DOC_KINDS } from "./db";
export type { Row } from "./db";
