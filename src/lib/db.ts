/* ============================================================
   SIA — Sistema de Informações Acadêmicas · Cyber Academy
   Camada de persistência (espelha o schema PostgreSQL:
   users, courses, enrollments, payments, certificates, ...)
   ============================================================ */
export type Row = Record<string, any>;

const KEY = "cyberacademy_db_v1";

export const TABLES = [
  "users", "sessions", "password_resets", "email_verifications",
  "terms_acceptances", "consents", "teachers", "course_categories",
  "courses", "course_modules", "lessons", "lesson_materials", "classes",
  "enrollments", "lesson_progress", "course_progress", "attendance",
  "activities", "assessments", "questions", "assessment_questions",
  "attempts", "grades", "projects", "submissions",
  "orders", "payments", "payment_transactions", "installments",
  "employees", "departments", "expenses", "calls", "quick_replies",
  "certificates", "certificate_validations",
  "notifications", "support_tickets", "ticket_messages",
  "audit_logs", "emails", "posts", "faqs", "files",
  "documents", "forum_posts", "lesson_notes", "xp_events",
  "partnerships", "partner_students", "course_contracts", "contract_acceptances",
  "service_requests", "career_sessions", "jobs", "cv_requests",
  "ngos", "ngo_courses", "lab_access",
  // RH
  "job_openings", "candidates", "interviews", "hiring_process",
  "employee_contracts", "contract_addendums", "employee_documents",
  "job_titles", "job_levels", "cost_centers",
  "performance_reviews", "goals", "feedbacks", "pdi",
  "trainings", "internal_courses", "skills", "career_plans",
  "benefits", "commissions", "vacations", "absences",
  "announcements", "notices", "bulletin_board",
  // Financeiro
  "accounts_receivable", "accounts_payable", "invoices",
  "scholarships", "refunds", "bank_accounts", "pix_transactions",
  "card_transactions", "budgets", "tax_documents",
  // Call Center
  "call_center_agents", "call_queues", "call_records", "call_campaigns",
  "leads", "lead_history", "call_transfers", "call_recordings",
  "supervisor_notes", "quality_evaluations",
  // Professor
  "teacher_formations", "teacher_specialties", "teacher_hours",
  "content_production", "content_reviews", "teacher_payments",
  "teacher_communications", "lab_exercises",
];

export const DOC_KINDS: Record<string, string> = {
  photo3x4: "Foto 3x4 (perfil)",
  id_doc: "Documento de identidade (RG/CNH)",
  address_proof: "Comprovante de residência",
  transcript: "Histórico / comprovante escolar",
  other: "Outro documento",
  CARTEIRINHA: "Carteirinha de estudante",
};

export const XP_LEVELS: [string, number][] = [
  ["Iniciante", 0], ["Explorador", 120], ["Praticante", 300],
  ["Avançado", 600], ["Especialista", 1000], ["Mestre Cyber", 1600],
];

export interface DB {
  v: number;
  createdAt: string;
  seq: Record<string, number>;
  tables: Record<string, Row[]>;
  settings: Record<string, any>;
}

let cache: DB | null = null;
const listeners = new Set<() => void>();

function blank(): DB {
  const tables: Record<string, Row[]> = {};
  TABLES.forEach((t) => (tables[t] = []));
  return {
    v: 1,
    createdAt: now(),
    seq: {},
    tables,
    settings: {
      schoolName: "Cyber Academy",
      slogan: "Tecnologia que forma carreiras",
      heroTitle: "Aprenda tecnologia do zero ao nível profissional",
      heroSub: "Cursos com videoaulas, projetos reais, avaliações, certificado verificável e um ecossistema acadêmico completo (SIA + AVA).",
      aboutText: "A Cyber Academy é uma escola de tecnologia com ecossistema acadêmico próprio. Do cadastro à emissão do certificado, toda a jornada do aluno é registrada no SIA — matrículas, notas, frequência e certificados verificáveis publicamente.",
      contactEmail: "contato@cyberacademy.com.br",
      contactPhone: "(11) 4004-2026",
      contactAddress: "Av. Paulista, 1000 · São Paulo/SP",
      passScore: 70,
      certSigner: "Direção Acadêmica — Cyber Academy",
      certCity: "São Paulo",
      mpPublicKey: "",
      mpAccessTokenHint: "Definido via variável de ambiente no backend (MP_ACCESS_TOKEN)",
      completionRequireProject: true,
      mode: "producao",
    },
  };
}

export function db(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      TABLES.forEach((t) => { if (!cache!.tables[t]) cache!.tables[t] = []; });
      return cache!;
    }
  } catch { /* banco corrompido → recria */ }
  cache = blank();
  persist();
  return cache;
}

export function save() { persist(); emit(); }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { console.warn("storage cheio", e); } }
function emit() { listeners.forEach((f) => f()); }
export function onChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function wipeDB() { cache = blank(); persist(); emit(); localStorage.removeItem("ca_session"); }

/* ---------------- CRUD ---------------- */
export const uid = () =>
  typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const now = () => new Date().toISOString();

export function all(t: string): Row[] { const d = db(); return d.tables[t] || (d.tables[t] = []); }
export function find(t: string, id: string): Row | undefined { return all(t).find((r) => r.id === id); }
export function one(t: string, pred: (r: Row) => boolean): Row | undefined { return all(t).find(pred); }
export function where(t: string, pred: (r: Row) => boolean): Row[] { return all(t).filter(pred); }

export function insert(t: string, row: Row): Row {
  row.id = row.id || uid();
  row.createdAt = row.createdAt || now();
  all(t).push(row);
  save();
  return row;
}
export function update(t: string, id: string, patch: Row): Row | undefined {
  const r = find(t, id);
  if (r) { Object.assign(r, patch, { updatedAt: now() }); save(); }
  return r;
}
export function remove(t: string, id: string): boolean {
  const arr = all(t); const i = arr.findIndex((r) => r.id === id);
  if (i >= 0) { arr.splice(i, 1); save(); return true; }
  return false;
}

/* ---------------- Numerações oficiais (geradas pelo backend) ---------------- */
export function nextEnrollmentNumber(): string {
  const d = db();
  const year = new Date().getFullYear();
  const used = new Set(all("enrollments").map((e) => e.number));
  let n = d.seq.enroll || 0;
  let num = "";
  do { n += 1; num = `CA${year}${String(n).padStart(6, "0")}`; } while (used.has(num));
  d.seq.enroll = n;
  save();
  return num;
}

export function nextCertCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = (k: number) => Array.from({ length: k }, () => A[Math.floor(Math.random() * A.length)]).join("");
  let code = "";
  do { code = `CA-${rnd(4)}-${rnd(4)}`; } while (one("certificates", (c) => c.code === code));
  return code;
}

export function nextOrderNumber(): string {
  const d = db();
  d.seq.order = (d.seq.order || 0) + 1;
  save();
  return `PED-${new Date().getFullYear()}-${String(d.seq.order).padStart(5, "0")}`;
}

/* ---------------- Auditoria / Comunicação ---------------- */
export function audit(actor: Row | null, event: string, entity = "", entityId = "", detail = "") {
  const row: Row = { actorId: actor?.id || "system", actorName: actor?.name || "SIA (sistema)", event, entity, entityId, detail, at: now() };
  row.id = uid(); row.createdAt = row.at;
  all("audit_logs").push(row); save();
}

export function sendEmail(to: string, subject: string, body: string) {
  insert("emails", { to, subject, body, at: now(), status: "enviado" });
}

export function notify(userId: string, title: string, body: string, type = "info") {
  insert("notifications", { userId, title, body, type, read: false, at: now() });
}

/* ---------------- Configurações ---------------- */
export function getSettings(): Row { return db().settings; }
export function setSettings(patch: Row) { Object.assign(db().settings, patch); save(); }

/* ---------------- Hash de senha (SHA-256 + salt) ---------------- */
export async function hashPw(pw: string): Promise<string> {
  const salted = "cyber::" + pw;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let h = 5381;
    for (let i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
    return "djb2:" + (h >>> 0).toString(16);
  }
}

/* ---------------- Formatação ---------------- */
export const fmtBRL = (v: number) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
export const fmtDT = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") + " " + new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/* ---------------- Status → badge ---------------- */
export const STATUS_LABEL: Record<string, [string, string]> = {
  PENDING: ["Pendente", "b-amber"], ACTIVE: ["Ativa", "b-green"], SUSPENDED: ["Suspensa", "b-coral"],
  CANCELLED: ["Cancelada", "b-coral"], COMPLETED: ["Concluída", "b-teal"],
  PLANNED: ["Planejada", "b-mist"], FINISHED: ["Encerrada", "b-mist"],
  created: ["Criado", "b-mist"], paid: ["Pago", "b-green"], refunded: ["Reembolsado", "b-coral"], cancelled: ["Cancelado", "b-coral"],
  pending: ["Pendente", "b-amber"], approved: ["Aprovado", "b-green"], rejected: ["Rejeitado", "b-coral"],
  in_analysis: ["Em análise", "b-amber"], approved_webhook: ["Aprovado (webhook)", "b-green"],
  draft: ["Rascunho", "b-mist"], submitted: ["Enviado", "b-mp"], changes_requested: ["Revisar", "b-amber"],
  open: ["Aberto", "b-amber"], answered: ["Respondido", "b-green"], closed: ["Fechado", "b-mist"],
  auto_graded: ["Corrigida", "b-green"], review: ["Aguard. correção", "b-amber"], graded: ["Nota lançada", "b-green"],
  expired: ["Expirada", "b-coral"], published: ["Publicado", "b-green"], unpublished: ["Não publicado", "b-mist"],
  active: ["Ativo", "b-green"], inactive: ["Inativo", "b-mist"],
  IN_PROGRESS: ["Em andamento", "b-mp"],
  scheduled: ["Agendada", "b-amber"], confirmed: ["Confirmada", "b-green"], done: ["Realizada", "b-green"],
  filled: ["Preenchida", "b-mist"], partner: ["Parceira", "b-amber"], overdue: ["Em atraso", "b-coral"],
  PENDING_REVIEW: ["Em análise", "b-amber"], APPROVED: ["Aprovado", "b-green"], REJECTED: ["Rejeitado", "b-coral"],
  on: ["Ativado", "b-green"], off: ["Desativado", "b-mist"],
};
export function statusBadge(s: string): [string, string] { return STATUS_LABEL[s] || [s || "—", "b-mist"]; }
