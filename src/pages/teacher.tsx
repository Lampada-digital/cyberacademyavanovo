import React, { useState } from "react";
import { I } from "../components/icons";
import { AppShell, type NavItem } from "../components/layout";
import { Btn, Card, Badge, Empty, Field, TIn, TArea, TSel, Modal, Stat, Tag, PageHead, useToast, Confirm, Bar } from "../components/ui";
import { useApp } from "../state";
import {
  teacherCourses, teacherClasses, canTeacherAccess, gradeAttempt, reviewSubmission,
  setAttendance, courseProgress, notify,
  all, one, where, find, insert, update, remove, uid, audit, fmtDate, fmtDT, type Row,
} from "../lib/api";

const NAV: NavItem[] = [
  { to: "/professor", icon: "home", label: "Início" },
  { to: "/professor/aulas", icon: "video", label: "Dar aulas" },
  { to: "/professor/cursos", icon: "layers", label: "Conteúdo dos cursos" },
  { to: "/professor/correcoes", icon: "file", label: "Correções" },
  { to: "/professor/projetos", icon: "git", label: "Projetos" },
  { to: "/professor/notas", icon: "chart", label: "Notas" },
  { to: "/professor/turmas", icon: "users", label: "Turmas & frequência" },
  { to: "/professor/questoes", icon: "db", label: "Banco de questões" },
];

export default function TeacherArea({ path, segs }: { path: string; segs: string[] }) {
  const { user } = useApp();
  if (!user) return null;
  const teacher = one("teachers", (t) => t.userId === user!.id) || { id: "", name: user!.name, courseIds: [] };
  const myTeacherIds = where("teachers", (t) => t.email === user!.email || t.userId === user!.id).map((t) => t.id);
  const myCourses = where("courses", (c) => myTeacherIds.includes(c.teacherId));
  const sub = segs[1] || "";
  let page: React.ReactNode;
  switch (sub) {
    case "": page = <TDash myCourses={myCourses} myTeacherIds={myTeacherIds} />; break;
    case "cursos": page = segs[2] ? <ContentGuard courseId={segs[2]} myCourses={myCourses} /> : <TCursos myCourses={myCourses} />; break;
    case "aulas": page = <MinhasAulas myCourses={myCourses} />; break;
    case "correcoes": page = <Correcoes myCourses={myCourses} />; break;
    case "projetos": page = <ProjetosProf myCourses={myCourses} />; break;
    case "notas": page = <NotasProf myCourses={myCourses} />; break;
    case "turmas": page = <Turmas myCourses={myCourses} myTeacherIds={myTeacherIds} />; break;
    case "questoes": page = <BancoQuestoes myCourses={myCourses} />; break;
    default: page = <TDash myCourses={myCourses} myTeacherIds={myTeacherIds} />;
  }
  return <AppShell title="Área do Professor" nav={NAV} path={path}>{page}</AppShell>;
}

function ContentGuard({ courseId, myCourses }: { courseId: string; myCourses: Row[] }) {
  const { user } = useApp();
  const teacher = where("teachers", (t) => t.userId === user!.id || t.email === user!.email)[0];
  const allowed = teacher && (myCourses.some((c) => c.id === courseId) || canTeacherAccess(teacher.id, courseId));
  if (!allowed) return <Empty icon="lock" title="Sem autorização" desc="Suas permissões de professor estão limitadas aos cursos/turmas atribuídos pela administração (RBAC)." />;
  return <CourseContent courseId={courseId} actor={user!} />;
}

/* ================= DASHBOARD ================= */
function TDash({ myCourses, myTeacherIds }: { myCourses: Row[]; myTeacherIds: string[] }) {
  const { user } = useApp();
  const cids = myCourses.map((c) => c.id);
  const students = new Set(where("enrollments", (e) => cids.includes(e.courseId) && e.status !== "CANCELLED").map((e) => e.studentId));
  const pending = where("attempts", (a) => a.status === "review" && cids.includes(a.courseId)).length;
  const projPend = where("submissions", (s) => s.status === "submitted" && cids.includes(s.courseId)).length;
  const lessons = where("lessons", (l) => cids.includes(l.courseId)).length;
  return (
    <div className="space-y-6">
      <div className="anim-fade-up">
        <div className="cy-chip text-cy-500">ÁREA DO PROFESSOR</div>
        <h1 className="display-xl text-[26px] md:text-[32px] text-mist mt-1">Olá, Prof.(a) {user!.name.split(" ")[0]}</h1>
        <p className="text-[13.5px] text-fog mt-1.5">Produção de conteúdo, correções e acompanhamento pedagógico dos seus cursos.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="layers" label="Meus cursos" value={myCourses.length} />
        <Stat icon="users" label="Alunos" value={students.size} tone="amber" />
        <Stat icon="file" label="Correções pendentes" value={pending + projPend} sub="dissertativas + projetos" />
        <Stat icon="video" label="Aulas criadas" value={lessons} />
      </div>
      {pending + projPend > 0 && (
        <Card className="p-4 border-ember/40 flex items-center gap-3">
          <I n="alert" s={20} c="text-ember" />
          <span className="text-[13px] text-fog flex-1">Você tem <strong className="text-ember">{pending} avaliação(ões)</strong> e <strong className="text-ember">{projPend} projeto(s)</strong> aguardando correção.</span>
          <a href="#/professor/correcoes" className="cy-btn cy-btn-e px-4 py-2 text-[12px]">Corrigir agora</a>
        </Card>
      )}
      <Card className="p-5 border-cy-600/50 relative overflow-hidden anim-fade-up">
        <div className="absolute -right-14 -top-14 w-48 h-48 rounded-full border border-cy-700/40" />
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border border-cy-700/60" />
        <div className="flex flex-wrap items-center gap-5 relative">
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-cy-500/15 border border-cy-500/50 text-cy-300 shrink-0"><I n="video" s={22} /></span>
          <div className="flex-1 min-w-[240px]">
            <h3 className="font-display font-semibold text-[15.5px] text-mist">Vai dar aula hoje?</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 font-mono text-[10.5px] text-dim">
              <span className="text-cy-300">criar aula</span> → <span className="text-ember">enviar vídeo</span> → <span className="text-cy-300">anexar materiais</span> → <span className="text-cy-300">publicar</span>
            </div>
          </div>
          <a href="#/professor/aulas" className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px]"><I n="plus" s={14} /> Nova aula com vídeo</a>
        </div>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {myCourses.map((c) => {
          const ens = where("enrollments", (e) => e.courseId === c.id && e.status !== "CANCELLED");
          return (
            <Card key={c.id} hover className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-semibold text-[15px] text-mist">{c.title}</h3>
                <Badge s={c.published ? "published" : "unpublished"} />
              </div>
              <div className="font-mono text-[10.5px] text-dim mt-1.5">{ens.length} alunos matriculados · {where("lessons", (l) => l.courseId === c.id).length} aulas</div>
              <div className="flex gap-2 mt-4">
                <a href={`#/professor/cursos/${c.id}`} className="cy-btn cy-btn-p px-4 py-2 text-[12px]"><I n="edit" s={14} /> Gerenciar conteúdo</a>
                <a href={`#/cursos/${c.slug}`} className="cy-btn cy-btn-x px-3 py-2 text-[12px]"><I n="eye" s={14} /> Ver página</a>
              </div>
            </Card>
          );
        })}
        {myCourses.length === 0 && <Empty icon="layers" title="Nenhum curso atribuído" desc="A administração vincula professores a cursos e turmas no painel." />}
      </div>
    </div>
  );
}

function TCursos({ myCourses }: { myCourses: Row[] }) {
  return (
    <div>
      <PageHead kicker="conteúdo" title="Meus cursos" desc="Crie módulos, aulas, videoaulas, materiais, atividades, avaliações e projetos." />
      <div className="grid md:grid-cols-2 gap-4">
        {myCourses.map((c) => (
          <a key={c.id} href={`#/professor/cursos/${c.id}`} className="cy-card cy-card-h p-5 block">
            <div className="flex items-center justify-between"><h3 className="font-display font-semibold text-[15px] text-mist">{c.title}</h3><Badge s={c.published ? "published" : "unpublished"} /></div>
            <div className="font-mono text-[10.5px] text-dim mt-2">{where("course_modules", (m) => m.courseId === c.id).length} módulos · {where("lessons", (l) => l.courseId === c.id).length} aulas · {where("assessments", (a) => a.courseId === c.id).length} avaliações</div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ================= DAR AULAS (criar aula → vídeo → materiais → publicar) ================= */
function MinhasAulas({ myCourses }: { myCourses: Row[] }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const [courseId, setCourseId] = useState(myCourses[0]?.id || "");
  const [lesModal, setLesModal] = useState<Row | null>(null);
  const [matModal, setMatModal] = useState<Row | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  if (myCourses.length === 0) return <Empty icon="video" title="Nenhum curso atribuído" desc="A administração precisa vincular você a um curso para que possa ministrar aulas." />;
  const course = find("courses", courseId) || myCourses[0];
  const modules = where("course_modules", (m) => m.courseId === course.id).sort((a, b) => a.order - b.order);
  const lessons = where("lessons", (l) => l.courseId === course.id).sort((a, b) => {
    const ma = modules.findIndex((m) => m.id === a.moduleId), mb = modules.findIndex((m) => m.id === b.moduleId);
    return ma !== mb ? ma - mb : a.order - b.order;
  });
  const videos = lessons.filter((l) => l.videoUrl).length;
  const mats = where("lesson_materials", (m) => m.courseId === course.id).length;
  const published = lessons.filter((l) => l.published).length;

  const bump = (id: string, dir: number) => {
    const arr = lessons.filter((l) => l.moduleId === find("lessons", id)?.moduleId);
    const i = arr.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    update("lessons", arr[i].id, { order: arr[j].order });
    update("lessons", arr[j].id, { order: arr[i].order });
    refresh();
  };
  const publishToggle = (l: Row) => {
    update("lessons", l.id, { published: !l.published });
    audit(user, l.published ? "UNPUBLISH" : "PUBLISH", "lessons", l.id, `Aula "${l.title}"`);
    if (!l.published) where("enrollments", (e) => e.courseId === course.id && e.status === "ACTIVE").forEach((e) => notify(e.studentId, "Nova aula disponível", `"${l.title}" foi publicada no curso ${course.title}.`, "info"));
    toast(l.published ? "Aula retirada do AVA." : "Aula publicada — alunos matriculados notificados!", "ok");
    refresh();
  };
  const videoBadge = (l: Row) =>
    l.videoUrl?.startsWith("data:video") ? <Tag>upload · {l.videoSize || "vídeo"}</Tag>
      : l.videoUrl && /(youtube|youtu\.be|vimeo)/.test(l.videoUrl) ? <Tag tone="amber">embed</Tag>
      : l.videoUrl ? <Tag>mp4</Tag>
      : <Tag tone="mist">player integrado</Tag>;

  return (
    <div>
      <PageHead kicker="ÁREA DO PROFESSOR · dar aulas" title="Minhas aulas" desc="Crie a aula, envie o vídeo, anexe os materiais e publique para os alunos — tudo registrado no SIA." />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="min-w-[240px]"><TSel value={course.id} onChange={(e) => setCourseId(e.target.value)}>{myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</TSel></div>
        <Btn v="e" onClick={() => {
          if (modules.length === 0) { toast("Crie um módulo primeiro (Conteúdo dos cursos → Novo módulo).", "err"); return; }
          setLesModal({ ...({} as Row), moduleId: modules[0].id, _new: true });
        }}><I n="plus" s={15} /> Nova aula com vídeo</Btn>
        <a href={`#/professor/cursos/${course.id}`} className="cy-btn cy-btn-x px-4 py-2.5 text-[12px]"><I n="layers" s={14} /> Gerenciar curso completo</a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon="video" label="Aulas criadas" value={lessons.length} />
        <Stat icon="checkc" label="Publicadas no AVA" value={published} />
        <Stat icon="upload" label="Vídeos enviados" value={videos} tone="amber" />
        <Stat icon="file" label="Materiais anexados" value={mats} />
      </div>

      {modules.length === 0 ? (
        <Empty icon="layers" title="Este curso ainda não tem módulos" desc="Os módulos organizam as aulas no AVA. Crie o primeiro pelo gestor de conteúdo.">
          <a href={`#/professor/cursos/${course.id}`} className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px]">Criar módulo</a>
        </Empty>
      ) : lessons.length === 0 ? (
        <Empty icon="video" title="Nenhuma aula neste curso" desc="Crie a primeira aula: envie a videoaula (upload ou link), anexe PDFs e materiais e publique para os alunos.">
          <Btn v="e" onClick={() => setLesModal({ ...({} as Row), moduleId: modules[0].id, _new: true })}><I n="plus" s={14} /> Criar primeira aula</Btn>
        </Empty>
      ) : (
        <div className="space-y-5">
          {modules.map((m, mi) => {
            const ls = lessons.filter((l) => l.moduleId === m.id);
            if (ls.length === 0) return null;
            return (
              <Card key={m.id} className="overflow-hidden">
                <div className="px-5 py-3.5 flex items-center gap-3 border-b border-line bg-cy-900/30">
                  <span className="font-display font-bold text-[15px] text-cy-600">{String(mi + 1).padStart(2, "0")}</span>
                  <span className="font-display font-semibold text-[13.5px] text-mist flex-1">{m.title}</span>
                  <span className="font-mono text-[10.5px] text-dim">{ls.length} aula(s)</span>
                  <Btn v="g" sm onClick={() => setLesModal({ ...({} as Row), moduleId: m.id, _new: true })}><I n="plus" s={12} /> aula</Btn>
                </div>
                {ls.map((l, li) => (
                  <div key={l.id} className="flex items-center gap-3 px-5 py-3 border-b border-line/40 last:border-0 hover:bg-cy-500/5 transition-colors flex-wrap">
                    <span className="font-mono text-[11px] text-dim w-5">{li + 1}</span>
                    <I n={l.videoUrl ? "video" : "playc"} s={16} c={l.videoUrl ? "text-ember" : "text-cy-400"} />
                    <div className="flex-1 min-w-[180px]">
                      <span className="text-[13.5px] text-mist">{l.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {videoBadge(l)}
                        <span className="font-mono text-[10px] text-dim">{l.durationMin}min · {where("lesson_materials", (mt) => mt.lessonId === l.id).length} materiais</span>
                      </div>
                    </div>
                    <Badge s={l.published ? "published" : "unpublished"} />
                    <div className="flex gap-1">
                      <Btn v="x" sm onClick={() => bump(l.id, -1)} title="Subir"><I n="chevD" s={12} c="rotate-180" /></Btn>
                      <Btn v="x" sm onClick={() => bump(l.id, 1)} title="Descer"><I n="chevD" s={12} /></Btn>
                      <Btn v="x" sm onClick={() => setMatModal(l)} title="Materiais"><I n="file" s={13} /></Btn>
                      <Btn v="x" sm onClick={() => setLesModal(l)} title="Editar aula/vídeo"><I n="edit" s={13} /></Btn>
                      <Btn v={l.published ? "g" : "x"} sm onClick={() => publishToggle(l)} title={l.published ? "Retirar do AVA" : "Publicar no AVA"}><I n={l.published ? "eye" : "lock"} s={13} /></Btn>
                      <Btn v="x" sm onClick={() => setDel(l)} title="Excluir"><I n="trash" s={13} /></Btn>
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      <LessonModal state={lesModal} onClose={() => setLesModal(null)} courseId={course.id} actor={user!} onSaved={(l: Row) => setMatModal(l)} />
      <MaterialModal lesson={matModal} onClose={() => setMatModal(null)} courseId={course.id} actor={user!} />
      <Confirm open={!!del} onClose={() => setDel(null)} title="Excluir aula?" desc={`"${del?.title}" e seus materiais serão removidos do AVA. A ação fica registrada em auditoria.`}
        onYes={() => { if (del) { where("lesson_materials", (m) => m.lessonId === del.id).forEach((m) => remove("lesson_materials", m.id)); remove("lessons", del.id); audit(user, "DELETE", "lessons", del.id, del.title); toast("Aula removida.", "ok"); refresh(); } }} />
    </div>
  );
}

/* ================= GESTOR DE CONTEÚDO (compartilhado com admin) ================= */
export function CourseContent({ courseId, actor }: { courseId: string; actor: Row }) {
  const toast = useToast();
  const c = find("courses", courseId);
  const [tab, setTab] = useState("estrutura");
  const [modModal, setModModal] = useState<Row | null | "new">(null);
  const [lesModal, setLesModal] = useState<Row | null>(null);
  const [matModal, setMatModal] = useState<Row | null>(null);
  const [itemModal, setItemModal] = useState<{ kind: string; item: Row | null } | null>(null);
  const [del, setDel] = useState<{ t: string; id: string; label: string } | null>(null);
  if (!c) return <Empty icon="search" title="Curso não encontrado" />;
  const modules = where("course_modules", (m) => m.courseId === courseId).sort((a, b) => a.order - b.order);
  const bump = (t: string, arr: Row[], id: string, dir: number) => {
    const i = arr.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const a = arr[i], b = arr[j];
    update(t, a.id, { order: b.order }); update(t, b.id, { order: a.order });
  };
  const publishToggle = (t: string, item: Row, label: string) => {
    update(t, item.id, { published: !item.published });
    audit(actor, item.published ? "UNPUBLISH" : "PUBLISH", t, item.id, `${label} "${item.title}"`);
    if (!item.published) where("enrollments", (e) => e.courseId === courseId && e.status === "ACTIVE").forEach((e) => notify(e.studentId, t === "lessons" ? "Nova aula disponível" : t === "activities" ? "Nova atividade" : "Nova avaliação", `${item.title} publicada no curso ${c.title}.`, "info"));
    toast(item.published ? "Retirado de publicação." : "Publicado! Alunos notificados.", "ok");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <a href={actor.role === "admin" ? "#/admin/cursos" : "#/professor/cursos"} className="text-fog hover:text-cy-300"><I n="chevL" s={20} /></a>
        <div className="flex-1">
          <div className="cy-chip text-cy-500">GESTÃO DE CONTEÚDO</div>
          <h1 className="display-xl text-[20px] md:text-[26px] text-mist mt-0.5">{c.title}</h1>
        </div>
        <Badge s={c.published ? "published" : "unpublished"} />
      </div>
      <div className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
        {[["estrutura", "Módulos & Aulas"], ["midia", "Mídia & Arquivos"], ["atividades", "Atividades"], ["avaliacoes", "Avaliações"], ["projetos", "Projetos"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 font-display text-[12.5px] uppercase tracking-wide whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === k ? "text-cy-300 border-cy-500" : "text-fog border-transparent hover:text-mist"}`}>{l}</button>
        ))}
      </div>

      {/* ------- ESTRUTURA ------- */}
      {tab === "estrutura" && (
        <div className="space-y-5">
          <div className="flex justify-end"><Btn v="e" onClick={() => setModModal("new")}><I n="plus" s={15} /> Novo módulo</Btn></div>
          {modules.length === 0 && <Empty icon="layers" title="Nenhum módulo" desc="Crie o primeiro módulo para começar a estruturar o curso." />}
          {modules.map((m, mi) => {
            const lessons = where("lessons", (l) => l.moduleId === m.id).sort((a, b) => a.order - b.order);
            return (
              <Card key={m.id} className="overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-3 border-b border-line bg-cy-900/30 flex-wrap">
                  <span className="font-display font-bold text-[17px] text-cy-600">{String(mi + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-[14.5px] text-mist">{m.title}</h3>
                    <div className="text-[11.5px] text-dim">{m.description}</div>
                  </div>
                  <div className="flex gap-1">
                    <Btn v="x" sm onClick={() => bump("course_modules", modules, m.id, -1)} title="Subir"><I n="chevD" s={13} c="rotate-180" /></Btn>
                    <Btn v="x" sm onClick={() => bump("course_modules", modules, m.id, 1)} title="Descer"><I n="chevD" s={13} /></Btn>
                    <Btn v="x" sm onClick={() => setModModal(m)}><I n="edit" s={13} /></Btn>
                    <Btn v="x" sm onClick={() => setDel({ t: "course_modules", id: m.id, label: m.title })}><I n="trash" s={13} /></Btn>
                  </div>
                </div>
                {lessons.map((l, li) => (
                  <div key={l.id} className="flex items-center gap-3 px-5 py-3 border-b border-line/40 last:border-0 hover:bg-cy-500/5">
                    <span className="font-mono text-[11px] text-dim w-6">{li + 1}</span>
                    <I n={l.videoUrl ? "video" : "playc"} s={16} c="text-cy-400" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13.5px] text-mist">{l.title}</span>
                      <span className="font-mono text-[10.5px] text-dim ml-2">{l.durationMin}min · {where("lesson_materials", (mt) => mt.lessonId === l.id).length} mat.</span>
                    </div>
                    <Badge s={l.published ? "published" : "unpublished"} />
                    <div className="flex gap-1">
                      <Btn v="x" sm onClick={() => bump("lessons", lessons, l.id, -1)}><I n="chevD" s={12} c="rotate-180" /></Btn>
                      <Btn v="x" sm onClick={() => bump("lessons", lessons, l.id, 1)}><I n="chevD" s={12} /></Btn>
                      <Btn v="x" sm onClick={() => setMatModal(l)} title="Materiais"><I n="file" s={13} /></Btn>
                      <Btn v="x" sm onClick={() => publishToggle("lessons", l, "Aula")} title="Publicar/retirar"><I n={l.published ? "eye" : "lock"} s={13} /></Btn>
                      <Btn v="x" sm onClick={() => setLesModal({ ...l, moduleId: m.id })}><I n="edit" s={13} /></Btn>
                      <Btn v="x" sm onClick={() => setDel({ t: "lessons", id: l.id, label: l.title })}><I n="trash" s={13} /></Btn>
                    </div>
                  </div>
                ))}
                <button className="w-full px-5 py-3 text-[12.5px] text-cy-300 hover:bg-cy-500/10 transition-colors flex items-center gap-2" onClick={() => setLesModal({ ...({} as Row), moduleId: m.id, _new: true })}>
                  <I n="plus" s={14} /> Adicionar aula
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* ------- MÍDIA & ARQUIVOS (biblioteca do curso) ------- */}
      {tab === "midia" && <MediaLibrary courseId={courseId} actor={actor} onEditLesson={(l) => setLesModal(l)} onMats={(l) => setMatModal(l)} />}

      {/* ------- ATIVIDADES / AVALIAÇÕES ------- */}
      {(tab === "atividades" || tab === "avaliacoes") && (() => {
        const kind = tab === "atividades" ? "activity" : "assessment";
        const tbl = tab === "atividades" ? "activities" : "assessments";
        const items = where(tbl, (a) => a.courseId === courseId);
        return (
          <div className="space-y-4">
            <div className="flex justify-end"><Btn v="e" onClick={() => setItemModal({ kind, item: null })}><I n="plus" s={15} /> Nova {kind === "activity" ? "atividade" : "avaliação"}</Btn></div>
            {items.length === 0 && <Empty icon="file" title="Nada criado ainda" desc={`Crie ${kind === "activity" ? "exercícios e questionários" : "provas e simulados"} com o editor de questões.`} />}
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((it) => (
                <Card key={it.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <Tag tone={kind === "activity" ? "amber" : "teal"}>{kind === "activity" ? it.kind : it.type}</Tag>
                    <Badge s={it.published ? "published" : "unpublished"} />
                  </div>
                  <h3 className="font-display font-semibold text-[15px] text-mist mt-3">{it.title}</h3>
                  <div className="font-mono text-[10.5px] text-dim mt-1.5">{it.questions?.length || 0} questões · peso {it.weight} · {where("attempts", (a) => a.itemId === it.id).length} envio(s)</div>
                  <div className="flex gap-2 mt-4">
                    <Btn v="g" sm onClick={() => setItemModal({ kind, item: it })}><I n="edit" s={13} /> Editar</Btn>
                    <Btn v="x" sm onClick={() => publishToggle(tbl, it, kind === "activity" ? "Atividade" : "Avaliação")}><I n={it.published ? "eye" : "lock"} s={13} /> {it.published ? "Retirar" : "Publicar"}</Btn>
                    <Btn v="x" sm onClick={() => setDel({ t: tbl, id: it.id, label: it.title })}><I n="trash" s={13} /></Btn>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ------- PROJETOS ------- */}
      {tab === "projetos" && <ProjectsAdmin courseId={courseId} actor={actor} />}

      {/* ------- MODAIS ------- */}
      <ModuleModal open={!!modModal} onClose={() => setModModal(null)} courseId={courseId} mod={modModal === "new" ? null : modModal} actor={actor} />
      <LessonModal state={lesModal} onClose={() => setLesModal(null)} courseId={courseId} actor={actor} onSaved={(l: Row) => setMatModal(l)} />
      <MaterialModal lesson={matModal} onClose={() => setMatModal(null)} courseId={courseId} actor={actor} />
      {itemModal && <ItemModal kind={itemModal.kind} item={itemModal.item} courseId={courseId} onClose={() => setItemModal(null)} actor={actor} />}
      <Confirm open={!!del} onClose={() => setDel(null)} title="Excluir registro?" desc={`"${del?.label}" será removido permanentemente do SIA. A ação fica registrada em auditoria.`}
        onYes={() => { if (del) { remove(del.t, del.id); audit(actor, "DELETE", del.t, del.id, del.label); toast("Removido.", "ok"); } }} />
    </div>
  );
}

/* ================= BIBLIOTECA DE MÍDIA DO CURSO ================= */
function MediaLibrary({ courseId, actor, onEditLesson, onMats }: { courseId: string; actor: Row; onEditLesson: (l: Row) => void; onMats: (l: Row) => void }) {
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const lessons = where("lessons", (l) => l.courseId === courseId);
  const videos = lessons.filter((l) => l.videoUrl);
  const mats = where("lesson_materials", (m) => m.courseId === courseId);
  const files = mats.filter((m) => m.kind !== "link");
  const links = mats.filter((m) => m.kind === "link");
  const lessonTitle = (id: string) => find("lessons", id)?.title || "—";
  const delMat = (m: Row) => { remove("lesson_materials", m.id); audit(actor, "FILE_DELETE", "lesson_materials", m.id, m.name); toast("Arquivo removido do storage.", "ok"); };
  const delVideo = (l: Row) => { update("lessons", l.id, { videoUrl: "", videoName: "", videoSize: "", videoType: "simulated" }); audit(actor, "FILE_DELETE", "lessons", l.id, `Vídeo removido de "${l.title}"`); toast("Vídeo removido.", "ok"); };
  const groups: [string, string, Row[]][] = [["videos", `Videoaulas (${videos.length})`, videos], ["files", `Arquivos (${files.length})`, files], ["links", `Links externos (${links.length})`, links]];
  const cur = groups.find((g) => g[0] === filter) || groups[0];
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {groups.map(([k, label, arr]) => (
          <button key={k} onClick={() => setFilter(k)} className={`cy-card p-4 text-left transition-all ${filter === k ? "border-cy-500 shadow-[0_0_0_1px_rgba(3,166,166,.4)]" : "hover:border-cy-700"}`}>
            <div className="flex items-center gap-2.5">
              <I n={k === "videos" ? "video" : k === "files" ? "file" : "ext"} s={18} c={filter === k ? "text-cy-300" : "text-dim"} />
              <span className="font-display font-semibold text-[13px] text-mist">{label}</span>
            </div>
            <div className="font-mono text-[10px] text-dim mt-1.5">{k === "videos" ? "mp4 · webm · embed" : k === "files" ? "pdf · doc · zip · imagens · código" : "referências e docs online"}</div>
          </button>
        ))}
      </div>

      {cur[2].length === 0 ? (
        <Empty icon={cur[0] === "videos" ? "video" : "file"} title={`Nenhum item em ${cur[0] === "videos" ? "videoaulas" : cur[0] === "files" ? "arquivos" : "links"}`}
          desc={cur[0] === "videos" ? "Crie uma aula e envie o vídeo pelo editor — o arquivo fica registrado no storage com tamanho, formato e status." : cur[0] === "files" ? "Anexe PDFs, slides, planilhas ou códigos diretamente em cada aula." : "Adicione links externos de referência em cada aula."} />
      ) : cur[0] === "videos" ? (
        <div className="grid md:grid-cols-2 gap-4">
          {videos.map((l) => (
            <Card key={l.id} className="overflow-hidden">
              <div className="relative h-[130px] bg-[#020C12] grid place-items-center border-b border-line">
                {l.videoUrl.startsWith("data:video") || /\.mp4($|\?)/.test(l.videoUrl || "") ? (
                  <video src={l.videoUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="text-center"><I n="video" s={30} c="text-cy-600" /><div className="font-mono text-[10px] text-dim mt-1.5">{/(youtube|youtu\.be|vimeo)/.test(l.videoUrl) ? "embed externo" : "player integrado"}</div></div>
                )}
                <span className="absolute top-2 right-2"><Badge s={l.published ? "published" : "unpublished"} /></span>
              </div>
              <div className="p-4">
                <div className="text-[13.5px] font-semibold text-mist truncate">{l.title}</div>
                <div className="font-mono text-[10.5px] text-dim mt-1 truncate">{l.videoName ? `${l.videoName} · ${l.videoSize}` : `${l.durationMin}min`} · {where("lesson_materials", (m) => m.lessonId === l.id).length} materiais</div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <Btn v="g" sm onClick={() => onEditLesson(l)}><I n="video" s={12} /> Vídeo</Btn>
                  <Btn v="x" sm onClick={() => onMats(l)}><I n="file" s={12} /> Materiais</Btn>
                  <Btn v="x" sm onClick={() => delVideo(l)}><I n="trash" s={12} /></Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>{cur[0] === "files" ? "Arquivo" : "Link"}</th><th>Aula</th><th>Tipo</th><th>{cur[0] === "files" ? "Tamanho" : "URL"}</th><th></th></tr></thead>
            <tbody>
              {cur[2].map((m) => (
                <tr key={m.id}>
                  <td className="text-mist font-semibold">{m.name}</td>
                  <td className="text-[12.5px]">{lessonTitle(m.lessonId)}</td>
                  <td><Tag tone="mist">{m.fileType}</Tag></td>
                  <td className="font-mono text-[11px] text-dim max-w-[200px] truncate">{cur[0] === "files" ? m.size : m.url}</td>
                  <td className="text-right"><Btn v="x" sm onClick={() => delMat(m)}><I n="trash" s={13} /></Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function ModuleModal({ open, onClose, courseId, mod, actor }: { open: boolean; onClose: () => void; courseId: string; mod: Row | null; actor: Row }) {
  const toast = useToast();
  const [f, setF] = useState({ title: mod?.title || "", description: mod?.description || "" });
  React.useEffect(() => setF({ title: mod?.title || "", description: mod?.description || "" }), [mod]);
  const save = () => {
    if (!f.title) { toast("Informe o título.", "err"); return; }
    if (mod) { update("course_modules", mod.id, f); audit(actor, "UPDATE", "course_modules", mod.id, f.title); }
    else {
      const order = where("course_modules", (m) => m.courseId === courseId).length + 1;
      const m = insert("course_modules", { ...f, courseId, order });
      audit(actor, "CREATE", "course_modules", m.id, f.title);
    }
    toast("Módulo salvo.", "ok"); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={mod ? "Editar módulo" : "Novo módulo"}>
      <div className="space-y-4">
        <Field label="Título" req><TIn value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Fundamentos" /></Field>
        <Field label="Descrição"><TArea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="flex justify-end gap-2"><Btn v="x" onClick={onClose}>Cancelar</Btn><Btn v="e" onClick={save}>Salvar módulo</Btn></div>
      </div>
    </Modal>
  );
}

function LessonModal({ state, onClose, courseId, actor, onSaved }: { state: Row | null; onClose: () => void; courseId: string; actor: Row; onSaved?: (l: Row) => void }) {
  const toast = useToast();
  const isNew = !!state && (state._new || !state.id);
  const [f, setF] = useState({ title: "", description: "", durationMin: 30, videoUrl: "", videoName: "", videoSize: "", published: false });
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  React.useEffect(() => {
    if (state) setF({ title: state.title || "", description: state.description || "", durationMin: state.durationMin || 30, videoUrl: state.videoUrl || "", videoName: state.videoName || "", videoSize: state.videoSize || "", published: !!state.published });
    else setF({ title: "", description: "", durationMin: 30, videoUrl: "", videoName: "", videoSize: "", published: false });
  }, [state]);
  if (!state) return null;
  const onVideoFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast("Selecione um arquivo de vídeo (mp4/webm/mov).", "err"); return; }
    if (file.size > 4e6) { toast("Arquivo acima de 4MB. Em produção o upload vai direto para o storage S3 — aqui é armazenamento local de demonstração.", "err"); return; }
    setUploading(true);
    const r = new FileReader();
    r.onload = () => {
      setF((p) => ({ ...p, videoUrl: String(r.result), videoName: file.name, videoSize: `${(file.size / 1024 / 1024).toFixed(1)}MB` }));
      setUploading(false);
      toast(`Vídeo "${file.name}" enviado para o storage (${(file.size / 1024 / 1024).toFixed(1)}MB).`, "ok");
    };
    r.onerror = () => { setUploading(false); toast("Falha ao ler o arquivo.", "err"); };
    r.readAsDataURL(file);
  };
  const save = (thenMaterials: boolean) => {
    if (!f.title) { toast("Informe o título da aula.", "err"); return; }
    const isUpload = f.videoUrl.startsWith("data:video");
    const payload = {
      ...f, durationMin: Number(f.durationMin) || 30,
      videoType: isUpload ? "uploaded" : /youtube|youtu\.be|vimeo/.test(f.videoUrl) ? "embed" : /\.mp4/.test(f.videoUrl) ? "mp4" : "simulated",
    };
    let rec: Row;
    if (isNew) {
      const order = where("lessons", (l) => l.moduleId === state.moduleId).length + 1;
      rec = insert("lessons", { ...payload, moduleId: state.moduleId, courseId, order });
      audit(actor, isUpload ? "FILE_UPLOAD" : "CREATE", "lessons", rec.id, f.title);
    } else { update("lessons", state.id, payload); rec = find("lessons", state.id)!; audit(actor, isUpload ? "FILE_UPLOAD" : "UPDATE", "lessons", state.id, f.title); }
    toast(thenMaterials ? "Aula criada! Agora anexe os materiais." : "Aula salva.", "ok");
    onClose();
    if (thenMaterials && onSaved) onSaved(rec);
  };
  const hasVideo = !!f.videoUrl;
  return (
    <Modal open onClose={onClose} title={isNew ? "Nova aula" : "Editar aula"} w={620}>
      <div className="space-y-4">
        <Field label="Título" req><TIn value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: React na prática" /></Field>
        <Field label="Descrição / roteiro"><TArea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="O que o aluno vai aprender nesta aula…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duração (min)"><TIn type="number" value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: Number(e.target.value) })} /></Field>
          <Field label="Publicada">
            <TSel value={String(f.published)} onChange={(e) => setF({ ...f, published: e.target.value === "true" })}><option value="false">Não</option><option value="true">Sim</option></TSel>
          </Field>
        </div>

        {/* VIDEOAULA — dropzone */}
        <div>
          <span className="block font-mono text-[10.5px] tracking-[.16em] uppercase text-fog mb-1.5">Videoaula <span className="text-cy-400">*</span></span>
          {hasVideo && f.videoUrl.startsWith("data:video") ? (
            <div className="rounded-lg border border-cy-600/60 overflow-hidden bg-[#020C12]">
              <video src={f.videoUrl} controls className="w-full max-h-[190px]" />
              <div className="px-3.5 py-2.5 flex items-center gap-2.5 bg-cy-900/40">
                <I n="video" s={15} c="text-cy-300" />
                <span className="text-[12px] text-mist flex-1 truncate">{f.videoName}</span>
                <span className="font-mono text-[10px] text-dim">{f.videoSize} · {(f.videoUrl.slice(5, 15) || "video").split(";")[0].replace("data:", "").toUpperCase()}</span>
                <Btn v="x" sm onClick={() => setF({ ...f, videoUrl: "", videoName: "", videoSize: "" })} title="Remover vídeo"><I n="trash" s={13} /></Btn>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); onVideoFile(e.dataTransfer.files?.[0]); }}
              className={`rounded-lg border border-dashed p-5 text-center cursor-pointer transition-all ${drag ? "border-cy-300 bg-cy-500/15 scale-[1.01]" : "border-cy-700 bg-[#041821] hover:border-cy-500"}`}>
              <input id="les-video-drop" type="file" accept="video/*" className="hidden" onChange={(e) => { onVideoFile(e.target.files?.[0]); e.target.value = ""; }} />
              {uploading ? (
                <div className="py-3"><span className="inline-block w-8 h-8 border-2 border-cy-400 border-t-transparent rounded-full spin-slow" style={{ animationDuration: ".9s" }} /><p className="font-mono text-[11px] text-cy-300 mt-3">enviando para o storage…</p></div>
              ) : (
                <>
                  <I n="upload" s={26} c={`mx-auto ${drag ? "text-cy-200" : "text-cy-500"}`} />
                  <p className="text-[13px] text-mist font-semibold mt-2.5">Arraste o vídeo da aula aqui</p>
                  <p className="font-mono text-[10.5px] text-dim mt-1">MP4 · WEBM · MOV · até 4MB (demo) · storage S3 em produção</p>
                  <label htmlFor="les-video-drop" className="cy-btn cy-btn-g px-4 py-2 text-[12px] mt-3 cursor-pointer"><I n="video" s={13} /> Escolher arquivo</label>
                </>
              )}
            </div>
          )}
          {!hasVideo && (
            <div className="mt-2">
              <TIn value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value, videoName: "", videoSize: "" })} placeholder="…ou cole um link do YouTube/Vimeo/MP4 (opcional)" />
              <p className="font-mono text-[10px] text-dim mt-1.5">Sem vídeo? O aluno usa o player integrado da plataforma — o progresso é registrado do mesmo jeito.</p>
            </div>
          )}
          {hasVideo && !f.videoUrl.startsWith("data:video") && (
            <div className="mt-2 flex items-center gap-2">
              <TIn value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
              <Btn v="x" sm onClick={() => setF({ ...f, videoUrl: "", videoName: "", videoSize: "" })}><I n="trash" s={13} /></Btn>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Btn v="x" onClick={onClose}>Cancelar</Btn>
          <Btn v="g" onClick={() => save(false)}><I n="check" s={14} /> Salvar aula</Btn>
          <Btn v="e" onClick={() => save(true)}><I n="file" s={14} /> Salvar e adicionar materiais</Btn>
        </div>
      </div>
    </Modal>
  );
}

function MaterialModal({ lesson, onClose, courseId, actor }: { lesson: Row | null; onClose: () => void; courseId: string; actor: Row }) {
  const toast = useToast();
  const [f, setF] = useState({ name: "", kind: "link", url: "", fileType: "PDF" });
  const [drag, setDrag] = useState(false);
  const mats = lesson ? where("lesson_materials", (m) => m.lessonId === lesson.id) : [];
  if (!lesson) return null;
  const addLink = () => {
    if (!f.name || !f.url) { toast("Nome e URL obrigatórios.", "err"); return; }
    const m = insert("lesson_materials", { lessonId: lesson.id, courseId, name: f.name, kind: "link", url: f.url, fileType: "LINK", access: "enrolled" });
    audit(actor, "FILE_UPLOAD", "lesson_materials", m.id, f.name);
    setF({ name: "", kind: "link", url: "", fileType: "PDF" }); toast("Material adicionado.", "ok");
  };
  const addFile = (file: File) => {
    if (file.size > 1.4e6) { toast("Arquivo acima de 1,4MB — em produção vai para o storage S3.", "err"); return; }
    const r = new FileReader();
    r.onload = () => {
      const m = insert("lesson_materials", { lessonId: lesson.id, courseId, name: file.name, kind: "arquivo", dataUrl: String(r.result), fileType: (file.name.split(".").pop() || "FILE").toUpperCase(), size: `${Math.max(1, Math.round(file.size / 1024))} KB`, access: "enrolled" });
      audit(actor, "FILE_UPLOAD", "lesson_materials", m.id, file.name);
      toast("Arquivo enviado.", "ok");
    };
    r.readAsDataURL(file);
  };
  const addFiles = (files: FileList | null) => { if (files) Array.from(files).forEach(addFile); };
  return (
    <Modal open onClose={onClose} title={`Materiais — ${lesson.title}`} w={620}>
      <div className="space-y-2 mb-5">
        {mats.length === 0 && <p className="text-[12.5px] text-dim">Nenhum material.</p>}
        {mats.map((m) => (
          <div key={m.id} className="cy-card p-3 flex items-center gap-3">
            <I n={m.kind === "link" ? "ext" : "file"} s={16} c="text-cy-400" />
            <div className="flex-1 min-w-0"><div className="text-[12.5px] text-mist truncate">{m.name}</div><div className="font-mono text-[10px] text-dim uppercase">{m.fileType} · acesso: {m.access}</div></div>
            <Btn v="x" sm onClick={() => { remove("lesson_materials", m.id); audit(actor, "FILE_DELETE", "lesson_materials", m.id, m.name); }}><I n="trash" s={13} /></Btn>
          </div>
        ))}
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        className={`border-t border-line pt-4`}>
        <div className={`rounded-lg border-2 border-dashed p-4 text-center transition-all ${drag ? "border-cy-400 bg-cy-500/10" : "border-line hover:border-cy-600"}`}>
          <input id={`mat-drop-${lesson.id}`} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <I n="upload" s={22} c={`mx-auto ${drag ? "text-cy-300" : "text-cy-500"}`} />
          <p className="text-[12.5px] text-mist font-semibold mt-2">{drag ? "Solte para enviar!" : "Arraste arquivos aqui ou"}</p>
          <label htmlFor={`mat-drop-${lesson.id}`} className="cy-btn cy-btn-g px-3.5 py-1.5 text-[11.5px] mt-2 cursor-pointer"><I n="file" s={13} /> Selecionar arquivos</label>
          <p className="font-mono text-[10px] text-dim mt-2">PDF · DOC · PPT · XLS · ZIP · imagens · código · até 1,4MB cada</p>
        </div>
      </div>
      <div className="border-t border-line mt-4 pt-4 grid sm:grid-cols-[1fr_auto] gap-2">
        <TIn placeholder="Nome do material (link)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <TIn placeholder="https://link-externo" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3 items-center">
        <Btn v="p" sm onClick={addLink}><I n="link" s={13} /> Adicionar link externo</Btn>
        <span className="font-mono text-[10px] text-dim">Links abrem em nova aba · arquivos baixam direto</span>
      </div>
    </Modal>
  );
}

/* ================= EDITOR DE QUESTÕES ================= */
export function QuestionEditor({ questions, onChange }: { questions: Row[]; onChange: (q: Row[]) => void }) {
  const upd = (i: number, patch: Row) => onChange(questions.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const addQ = (type: string) => onChange([...questions, { qid: "q" + uid().slice(0, 6), type, prompt: "", options: type === "tf" ? ["Verdadeiro", "Falso"] : ["", ""], correct: type === "multi" ? [] : 0, explanation: "", points: 1, difficulty: "médio", topic: "" }]);
  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={q.qid} className="cy-card p-4 border-cy-700">
          <div className="flex items-center justify-between mb-3">
            <Tag tone="teal">{q.type === "single" ? "múltipla escolha" : q.type === "multi" ? "múltiplas respostas" : q.type === "tf" ? "V/F" : "dissertativa"}</Tag>
            <div className="flex gap-1 items-center">
              <span className="font-mono text-[10.5px] text-dim mr-1">pts</span>
              <TIn type="number" className="!w-16 !py-1" value={q.points} onChange={(e) => upd(i, { points: Number(e.target.value) || 1 })} />
              <Btn v="x" sm onClick={() => onChange(questions.filter((_, j) => j !== i))}><I n="trash" s={13} /></Btn>
            </div>
          </div>
          <TArea rows={2} placeholder="Enunciado da questão" value={q.prompt} onChange={(e) => upd(i, { prompt: e.target.value })} />
          {(q.type === "single" || q.type === "multi" || q.type === "tf") && (
            <div className="space-y-2 mt-3">
              {q.options.map((op: string, oi: number) => {
                const isCorrect = q.type === "multi" ? (q.correct || []).includes(oi) : q.correct === oi;
                return (
                  <div key={oi} className="flex items-center gap-2">
                    <button className={`w-5 h-5 rounded-${q.type === "multi" ? "sm" : "full"} border grid place-items-center shrink-0 ${isCorrect ? "bg-cy-500 border-cy-400" : "border-dim"}`}
                      onClick={() => {
                        if (q.type === "multi") { const cur = q.correct || []; upd(i, { correct: isCorrect ? cur.filter((x: number) => x !== oi) : [...cur, oi] }); }
                        else upd(i, { correct: oi });
                      }} title="Marcar correta">{isCorrect && <I n="check" s={11} c="text-ink" />}</button>
                    <TIn value={op} onChange={(e) => upd(i, { options: q.options.map((x: string, xi: number) => (xi === oi ? e.target.value : x)) })} placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`} />
                    {q.options.length > 2 && q.type !== "tf" && <Btn v="x" sm onClick={() => upd(i, { options: q.options.filter((_: string, xi: number) => xi !== oi) })}><I n="x" s={12} /></Btn>}
                  </div>
                );
              })}
              {q.type !== "tf" && <button className="text-[12px] text-cy-300 hover:underline" onClick={() => upd(i, { options: [...q.options, ""] })}>+ alternativa</button>}
            </div>
          )}
          {q.type !== "essay" && q.type !== "open" && <TIn className="mt-3" placeholder="Explicação (mostrada após a correção)" value={q.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} />}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <TSel value={q.difficulty} onChange={(e) => upd(i, { difficulty: e.target.value })}><option>fácil</option><option>médio</option><option>difícil</option></TSel>
            <TIn placeholder="Assunto / tópico" value={q.topic} onChange={(e) => upd(i, { topic: e.target.value })} />
          </div>
        </div>
      ))}
      <div className="flex gap-2 flex-wrap">
        {(["single", "multi", "tf", "essay"] as const).map((t) => (
          <Btn key={t} v="g" sm onClick={() => addQ(t)}><I n="plus" s={12} /> {t === "single" ? "Múltipla escolha" : t === "multi" ? "Múltiplas respostas" : t === "tf" ? "Verdadeiro/Falso" : "Dissertativa"}</Btn>
        ))}
      </div>
    </div>
  );
}

function ItemModal({ kind, item, courseId, onClose, actor }: { kind: string; item: Row | null; courseId: string; onClose: () => void; actor: Row }) {
  const toast = useToast();
  const tbl = kind === "activity" ? "activities" : "assessments";
  const [f, setF] = useState<Row>({
    title: item?.title || "", description: item?.description || "", kind: item?.kind || "questionario", type: item?.type || "avaliacao",
    durationMin: item?.durationMin || 0, weight: item?.weight || (kind === "activity" ? 1 : 2), passScore: item?.passScore || 50,
    attempts: item?.attempts || 2, published: !!item?.published, questions: item?.questions || [], moduleId: item?.moduleId || "",
  });
  const mods = where("course_modules", (m) => m.courseId === courseId);
  const save = () => {
    if (!f.title || !f.questions.length) { toast("Título e ao menos 1 questão são obrigatórios.", "err"); return; }
    const payload = { ...f, durationMin: Number(f.durationMin) || 0, weight: Number(f.weight) || 1, attempts: Number(f.attempts) || 0, maxScore: f.questions.reduce((s: number, q: Row) => s + (q.points || 1), 0) };
    if (item) { update(tbl, item.id, payload); audit(actor, "UPDATE", tbl, item.id, f.title); }
    else { const it = insert(tbl, { ...payload, courseId }); audit(actor, "CREATE", tbl, it.id, f.title); }
    toast("Salvo! Publique para liberar aos alunos.", "ok"); onClose();
  };
  const bankQs = where("questions", (q) => q.courseId === courseId);
  return (
    <Modal open onClose={onClose} title={`${item ? "Editar" : "Nova"} ${kind === "activity" ? "atividade" : "avaliação"}`} w={760}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Título" req><TIn value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label={kind === "activity" ? "Tipo de atividade" : "Tipo de avaliação"}>
            <TSel value={kind === "activity" ? f.kind : f.type} onChange={(e) => setF(kind === "activity" ? { ...f, kind: e.target.value } : { ...f, type: e.target.value })}>
              {(kind === "activity" ? [["questionario", "Questionário"], ["exercicio", "Exercício"], ["pratica", "Atividade prática"], ["programacao", "Programação"]] : [["prova", "Prova"], ["avaliacao", "Avaliação"], ["questionario", "Questionário"], ["simulado", "Simulado"]]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </TSel>
          </Field>
        </div>
        <Field label="Descrição / instruções"><TArea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Field label="Duração (min)"><TIn type="number" value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: e.target.value })} /></Field>
          <Field label="Peso"><TIn type="number" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} /></Field>
          <Field label="% aprovação"><TIn type="number" value={f.passScore} onChange={(e) => setF({ ...f, passScore: e.target.value })} /></Field>
          <Field label="Tentativas"><TIn type="number" value={f.attempts} onChange={(e) => setF({ ...f, attempts: e.target.value })} /></Field>
          {kind === "activity" && <Field label="Módulo"><TSel value={f.moduleId} onChange={(e) => setF({ ...f, moduleId: e.target.value })}><option value="">—</option>{mods.map((m) => <option key={m.id} value={m.id}>{m.title.slice(0, 18)}</option>)}</TSel></Field>}
        </div>
        {bankQs.length > 0 && (
          <div className="cy-card p-3 border-cy-700">
            <div className="font-mono text-[10.5px] uppercase text-cy-500 mb-2">Reutilizar do banco de questões</div>
            <div className="flex gap-2 flex-wrap">
              {bankQs.map((q) => (
                <button key={q.id} className="cy-badge b-mist hover:border-cy-400 transition-colors" title={q.prompt}
                  onClick={() => setF({ ...f, questions: [...f.questions, { ...q, qid: "q" + uid().slice(0, 6) }] })}>+ {q.topic || q.prompt.slice(0, 26)}…</button>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="font-mono text-[10.5px] tracking-[.16em] uppercase text-cy-500 mb-2">Questões ({f.questions.length})</div>
          <QuestionEditor questions={f.questions} onChange={(qs) => setF({ ...f, questions: qs })} />
        </div>
        <div className="flex justify-end gap-2 pt-2"><Btn v="x" onClick={onClose}>Cancelar</Btn><Btn v="e" onClick={save}>Salvar</Btn></div>
      </div>
    </Modal>
  );
}

function ProjectsAdmin({ courseId, actor }: { courseId: string; actor: Row }) {
  const toast = useToast();
  const [edit, setEdit] = useState<Row | null | "new">(null);
  const [f, setF] = useState({ title: "", description: "", deliverables: "", maxScore: 100, passScore: 70 });
  const projects = where("projects", (p) => p.courseId === courseId);
  React.useEffect(() => {
    if (edit && edit !== "new") setF({ title: edit.title, description: edit.description, deliverables: (edit.deliverables || []).join("\n"), maxScore: edit.maxScore, passScore: edit.passScore });
    else if (edit === "new") setF({ title: "", description: "", deliverables: "", maxScore: 100, passScore: 70 });
  }, [edit]);
  const save = () => {
    if (!f.title) { toast("Informe o título.", "err"); return; }
    const payload = { ...f, deliverables: f.deliverables.split("\n").filter(Boolean), maxScore: Number(f.maxScore), passScore: Number(f.passScore) };
    if (edit && edit !== "new") { update("projects", edit.id, payload); audit(actor, "UPDATE", "projects", edit.id, f.title); }
    else { const p = insert("projects", { ...payload, courseId, weight: 3 }); audit(actor, "CREATE", "projects", p.id, f.title); }
    toast("Projeto salvo.", "ok"); setEdit(null);
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Btn v="e" onClick={() => setEdit("new")}><I n="plus" s={15} /> Novo projeto</Btn></div>
      {projects.length === 0 && <Empty icon="git" title="Nenhum projeto" desc="Crie o projeto prático que sela a conclusão do curso." />}
      {projects.map((p) => (
        <Card key={p.id} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-[15px] text-mist">{p.title}</h3>
              <p className="text-[12.5px] text-fog mt-1.5 leading-relaxed">{p.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">{(p.deliverables || []).map((d: string) => <span key={d} className="cy-badge b-mist">{d}</span>)}</div>
              <div className="font-mono text-[10.5px] text-dim mt-2">{where("submissions", (s) => s.projectId === p.id).length} entrega(s) · nota máx. {p.maxScore}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Btn v="x" sm onClick={() => setEdit(p)}><I n="edit" s={13} /></Btn>
              <Btn v="x" sm onClick={() => remove("projects", p.id)}><I n="trash" s={13} /></Btn>
            </div>
          </div>
        </Card>
      ))}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Novo projeto" : "Editar projeto"} w={640}>
        <div className="space-y-4">
          <Field label="Título" req><TIn value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Projeto final — SaaS completo" /></Field>
          <Field label="Descrição / escopo"><TArea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Entregáveis (um por linha)"><TArea rows={3} value={f.deliverables} onChange={(e) => setF({ ...f, deliverables: e.target.value })} placeholder={"Repositório no GitHub\nURL publicada"} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nota máxima"><TIn type="number" value={f.maxScore} onChange={(e) => setF({ ...f, maxScore: Number(e.target.value) })} /></Field>
            <Field label="Nota de aprovação"><TIn type="number" value={f.passScore} onChange={(e) => setF({ ...f, passScore: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setEdit(null)}>Cancelar</Btn><Btn v="e" onClick={save}>Salvar projeto</Btn></div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= CORREÇÕES ================= */
function Correcoes({ myCourses }: { myCourses: Row[] }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const cids = myCourses.map((c) => c.id);
  const pending = where("attempts", (a) => a.status === "review" && cids.includes(a.courseId)).sort((a, b) => (a.submittedAt || "").localeCompare(b.submittedAt || ""));
  const [sel, setSel] = useState<Row | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  if (pending.length === 0) return <div><PageHead kicker="correção" title="Correções pendentes" desc="Questões dissertativas aguardando avaliação do professor." /><Empty icon="checkc" title="Tudo corrigido!" desc="Nenhuma dissertativa pendente nos seus cursos." /></div>;
  const item = sel ? find(sel.kind === "activity" ? "activities" : "assessments", sel.itemId) : null;
  const essays = item ? (item.questions || []).filter((q: Row) => q.type === "essay" || q.type === "open") : [];
  const student = sel ? find("users", sel.studentId) : null;
  const save = () => {
    if (!sel) return;
    gradeAttempt(user!, sel.id, scores, feedback);
    setSel(null); setScores({}); setFeedback(""); refresh();
    toast("Correção registrada e aluno notificado.", "ok");
  };
  return (
    <div>
      <PageHead kicker="correção" title="Correções pendentes" desc="Objetivas já foram corrigidas automaticamente — avalie as dissertativas abaixo." />
      <div className="space-y-3">
        {pending.map((a) => (
          <Card key={a.id} hover className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => { setSel(a); setScores({}); setFeedback(""); }}>
            <span className="w-10 h-10 rounded-lg grid place-items-center bg-ember/10 border border-ember/40 text-ember"><I n="file" s={18} /></span>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] text-mist font-semibold">{a.itemTitle}</div>
              <div className="font-mono text-[10.5px] text-dim mt-0.5">{find("users", a.studentId)?.name} · {a.kind === "activity" ? "atividade" : "avaliação"} · enviada {fmtDT(a.submittedAt)}</div>
            </div>
            <Badge s={a.status} />
          </Card>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={`Corrigir — ${student?.name || ""}`} w={760}>
        <div className="space-y-5">
          <div className="font-mono text-[11.5px] text-fog">Objetivas: <span className="text-[#7BE0A2]">{sel?.objScore || 0} pts</span> (correção automática)</div>
          {essays.map((q: Row) => (
            <div key={q.qid} className="cy-card p-4 border-cy-700">
              <div className="text-[13px] text-mist font-semibold">{q.prompt} <span className="font-mono text-[10.5px] text-dim">({q.points} pts)</span></div>
              <p className="text-[13px] text-fog mt-2 cy-card p-3 whitespace-pre-line">{sel?.answers?.[q.qid] || "(sem resposta)"}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="font-mono text-[11px] text-dim">nota (0–{q.points})</span>
                <input type="range" min={0} max={q.points} step={q.points > 2 ? 0.5 : 0.25} value={scores[q.qid] ?? 0}
                  onChange={(e) => setScores({ ...scores, [q.qid]: Number(e.target.value) })} className="flex-1 accent-[#03A6A6]" />
                <span className="font-display font-bold text-cy-300 w-10 text-right tnum">{scores[q.qid] ?? 0}</span>
              </div>
            </div>
          ))}
          <Field label="Feedback para o aluno"><TArea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Pontos fortes, o que melhorar…" /></Field>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setSel(null)}>Cancelar</Btn><Btn v="e" onClick={save}><I n="check" s={15} /> Lançar nota</Btn></div>
        </div>
      </Modal>
    </div>
  );
}

/* ================= PROJETOS (professor) ================= */
function ProjetosProf({ myCourses }: { myCourses: Row[] }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const cids = myCourses.map((c) => c.id);
  const subs = where("submissions", (s) => cids.includes(s.courseId)).sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));
  const [sel, setSel] = useState<Row | null>(null);
  const [f, setF] = useState({ score: 70, comment: "" });
  const review = (status: string) => {
    if (!sel) return;
    reviewSubmission(user!, sel.id, { status, score: status === "approved" ? Number(f.score) : undefined, comment: f.comment });
    setSel(null); refresh();
    toast(status === "approved" ? "Projeto aprovado!" : "Avaliação registrada.", "ok");
  };
  return (
    <div>
      <PageHead kicker="projetos" title="Entregas de projetos" desc="Avalie, comente, solicite ajustes ou aprove as entregas dos alunos." />
      {subs.length === 0 ? <Empty icon="git" title="Nenhuma entrega" desc="As entregas dos alunos aparecem aqui." /> : (
        <div className="space-y-3">
          {subs.map((s) => {
            const p = find("projects", s.projectId);
            return (
              <Card key={s.id} hover className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => { setSel(s); setF({ score: p?.passScore || 70, comment: "" }); }}>
                <span className="w-10 h-10 rounded-lg grid place-items-center bg-cy-500/10 border border-cy-700 text-cy-400"><I n="git" s={18} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-mist font-semibold">{p?.title}</div>
                  <div className="font-mono text-[10.5px] text-dim mt-0.5">{find("users", s.studentId)?.name} · {fmtDT(s.submittedAt)}</div>
                </div>
                {s.score != null && <span className="font-mono text-[12px] text-cy-300 tnum">{s.score}/{p?.maxScore}</span>}
                <Badge s={s.status} />
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={`Avaliar — ${find("users", sel?.studentId || "")?.name || ""}`} w={680}>
        {sel && (() => {
          const p = find("projects", sel.projectId)!;
          return (
            <div className="space-y-4">
              <div className="cy-card p-4 border-cy-700">
                <div className="font-mono text-[10.5px] uppercase text-cy-500 mb-2">{p.title}</div>
                <p className="text-[13px] text-fog whitespace-pre-line">{sel.description || "—"}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[12px]">
                  {sel.url && <a href={sel.url} target="_blank" rel="noreferrer" className="text-cy-300 underline flex items-center gap-1.5"><I n="ext" s={13} />{sel.url}</a>}
                  {sel.github && <a href={sel.github} target="_blank" rel="noreferrer" className="text-cy-300 underline flex items-center gap-1.5"><I n="git" s={13} />{sel.github}</a>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] text-dim">nota (0–{p.maxScore})</span>
                <input type="range" min={0} max={p.maxScore} step={1} value={f.score} onChange={(e) => setF({ ...f, score: Number(e.target.value) })} className="flex-1 accent-[#F5B84B]" />
                <span className="font-display font-bold text-ember w-12 text-right tnum">{f.score}</span>
              </div>
              <Field label="Comentário da avaliação" req><TArea rows={3} value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} placeholder="O que funcionou, o que falta…" /></Field>
              <div className="flex flex-wrap justify-end gap-2">
                <Btn v="d" onClick={() => review("changes_requested")}><I n="refresh" s={14} /> Solicitar ajustes</Btn>
                <Btn v="x" onClick={() => review("rejected")}>Reprovar</Btn>
                <Btn v="e" onClick={() => review("approved")} disabled={!f.comment}><I n="check" s={14} /> Aprovar</Btn>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

/* ================= NOTAS (professor) ================= */
function NotasProf({ myCourses }: { myCourses: Row[] }) {
  const cids = myCourses.map((c) => c.id);
  const [cid, setCid] = useState(cids[0]?.id || "");
  const gs = where("grades", (g) => g.courseId === cid).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return (
    <div>
      <PageHead kicker="notas" title="Notas lançadas" desc="Todas as notas dos seus cursos, registradas no SIA." />
      {cids.length === 0 ? <Empty icon="chart" title="Sem cursos" /> : (
        <>
          <TSel className="!w-auto mb-4" value={cid} onChange={(e) => setCid(e.target.value)}>
            {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </TSel>
          {gs.length === 0 ? <Empty icon="chart" title="Nenhuma nota" desc="As notas aparecem após correções e avaliações." /> : (
            <Card className="overflow-x-auto">
              <table className="cy-tbl">
                <thead><tr><th>Aluno</th><th>Entrega</th><th>Tipo</th><th>Nota</th><th>%</th><th>Data</th><th>Avaliador</th></tr></thead>
                <tbody>{gs.map((g) => (
                  <tr key={g.id}>
                    <td className="text-mist font-semibold">{find("users", g.studentId)?.name}</td>
                    <td>{g.refTitle}</td>
                    <td><Tag tone={g.kind === "project" ? "amber" : "mist"}>{g.kind}</Tag></td>
                    <td className="font-mono text-cy-300 tnum">{g.score}/{g.max}</td>
                    <td className="font-mono tnum">{g.max ? Math.round((g.score / g.max) * 100) : 0}%</td>
                    <td>{fmtDate(g.date)}</td>
                    <td className="text-dim">{g.gradedBy || "automática"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ================= TURMAS & FREQUÊNCIA ================= */
function Turmas({ myCourses, myTeacherIds }: { myCourses: Row[]; myTeacherIds: string[] }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const classes = where("classes", (k) => myTeacherIds.includes(k.teacherId) || myCourses.some((c) => c.id === k.courseId));
  const [sel, setSel] = useState<Row | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [just, setJust] = useState<Record<string, string>>({});
  if (classes.length === 0) return <div><PageHead kicker="turmas" title="Turmas & frequência" /><Empty icon="users" title="Nenhuma turma atribuída" desc="A administração cria turmas e vincula você como professor." /></div>;
  const cls = sel || classes[0];
  const lessons = where("lessons", (l) => l.courseId === cls.courseId && l.published).sort((a, b) => a.order - b.order);
  const students = where("enrollments", (e) => e.courseId === cls.courseId && e.status !== "CANCELLED");
  const setAtt = (studentId: string, status: string) => {
    if (!lessonId) { toast("Selecione a aula da chamada.", "err"); return; }
    setAttendance(user!, { studentId, classId: cls.id, lessonId, date: new Date().toISOString(), status, justification: just[studentId] || "" });
    refresh();
  };
  return (
    <div>
      <PageHead kicker="turmas" title="Turmas & frequência" desc="Registre presença por aula quando o modelo do curso exigir controle de frequência." />
      <div className="flex gap-2 flex-wrap mb-5">
        {classes.map((k) => (
          <button key={k.id} onClick={() => setSel(k)} className={`cy-btn px-4 py-2 text-[12px] ${cls.id === k.id ? "cy-btn-p" : "cy-btn-g"}`}>{k.name} <Badge s={k.status} /></button>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <Field label="Aula da chamada">
            <TSel className="!w-auto" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              <option value="">selecione…</option>
              {lessons.map((l, i) => <option key={l.id} value={l.id}>{i + 1}. {l.title}</option>)}
            </TSel>
          </Field>
          <span className="font-mono text-[11px] text-dim pb-2.5">{students.length} alunos · capacidade {cls.capacity}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="cy-tbl">
            <thead><tr><th>Aluno</th><th>Matrícula</th><th>Frequência</th><th>Justificativa</th></tr></thead>
            <tbody>
              {students.length === 0 && <tr><td colSpan={4} className="text-center text-dim py-6">Nenhum aluno matriculado nesta turma.</td></tr>}
              {students.map((e) => {
                const att = lessonId ? one("attendance", (a) => a.studentId === e.studentId && a.classId === cls.id && a.lessonId === lessonId) : null;
                const st = find("users", e.studentId);
                return (
                  <tr key={e.id}>
                    <td className="text-mist font-semibold">{st?.name}</td>
                    <td className="font-mono text-cy-300 text-[11.5px]">{e.number}</td>
                    <td>
                      <div className="flex gap-1.5">
                        {[["present", "Presente", "b-green"], ["absent", "Ausente", "b-coral"], ["justified", "Justificado", "b-amber"]].map(([v, l]) => (
                          <button key={v} onClick={() => setAtt(e.studentId, v)}
                            className={`cy-badge ${att?.status === v ? (v === "present" ? "b-green" : v === "absent" ? "b-coral" : "b-amber") : "b-mist"} ${att?.status === v ? "ring-1 ring-cy-400" : "opacity-60 hover:opacity-100"} transition-all cursor-pointer`}>{l}</button>
                        ))}
                      </div>
                    </td>
                    <td><input className="cy-in !py-1.5 !text-[12px]" placeholder="opcional" value={just[e.studentId] || ""} onChange={(ev) => setJust({ ...just, [e.studentId]: ev.target.value })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ================= BANCO DE QUESTÕES ================= */
function BancoQuestoes({ myCourses }: { myCourses: Row[] }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const cids = myCourses.map((c) => c.id);
  const [cid, setCid] = useState(cids[0]?.id || "");
  const [edit, setEdit] = useState<Row | null | "new">(null);
  const [q, setQ] = useState<Row>({ type: "single", prompt: "", options: ["", ""], correct: 0, explanation: "", points: 1, difficulty: "médio", topic: "" });
  const qs = where("questions", (x) => x.courseId === cid);
  const save = () => {
    if (!q.prompt) { toast("Informe o enunciado.", "err"); return; }
    if (edit && edit !== "new") { update("questions", edit.id, q); audit(user, "UPDATE", "questions", edit.id, q.topic); }
    else { const nq = insert("questions", { ...q, courseId: cid }); audit(user, "CREATE", "questions", nq.id, q.topic || q.prompt.slice(0, 30)); }
    toast("Questão salva no banco.", "ok"); setEdit(null);
  };
  if (cids.length === 0) return <div><PageHead kicker="banco de questões" title="Banco de questões" /><Empty icon="db" title="Sem cursos" /></div>;
  return (
    <div>
      <PageHead kicker="banco de questões" title="Banco de questões" desc="Crie e reutilize questões em atividades e avaliações."
        right={<Btn v="e" onClick={() => { setEdit("new"); setQ({ qid: "q" + uid().slice(0, 6), type: "single", prompt: "", options: ["", ""], correct: 0, explanation: "", points: 1, difficulty: "médio", topic: "" }); }}><I n="plus" s={15} /> Nova questão</Btn>} />
      <TSel className="!w-auto mb-4" value={cid} onChange={(e) => setCid(e.target.value)}>
        {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </TSel>
      {qs.length === 0 ? <Empty icon="db" title="Banco vazio" desc="Crie questões para reutilizar no editor de avaliações." /> : (
        <div className="space-y-3">
          {qs.map((x) => (
            <Card key={x.id} className="p-4 flex items-start gap-4">
              <Tag tone="teal">{x.type === "single" ? "escolha" : x.type === "multi" ? "múltipla" : x.type === "tf" ? "V/F" : "dissert."}</Tag>
              <div className="flex-1">
                <div className="text-[13.5px] text-mist">{x.prompt}</div>
                <div className="font-mono text-[10.5px] text-dim mt-1">{x.topic || "sem tópico"} · {x.difficulty} · {x.points} pt(s)</div>
              </div>
              <Btn v="x" sm onClick={() => { setEdit(x); setQ({ ...x }); }}><I n="edit" s={13} /></Btn>
              <Btn v="x" sm onClick={() => { remove("questions", x.id); refresh(); }}><I n="trash" s={13} /></Btn>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Nova questão" : "Editar questão"} w={680}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tipo"><TSel value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value, options: e.target.value === "tf" ? ["Verdadeiro", "Falso"] : q.options, correct: e.target.value === "multi" ? [] : 0 })}><option value="single">Múltipla escolha</option><option value="multi">Múltiplas respostas</option><option value="tf">V/F</option><option value="essay">Dissertativa</option></TSel></Field>
            <Field label="Pontos"><TIn type="number" value={q.points} onChange={(e) => setQ({ ...q, points: Number(e.target.value) || 1 })} /></Field>
            <Field label="Dificuldade"><TSel value={q.difficulty} onChange={(e) => setQ({ ...q, difficulty: e.target.value })}><option>fácil</option><option>médio</option><option>difícil</option></TSel></Field>
          </div>
          <Field label="Enunciado" req><TArea rows={3} value={q.prompt} onChange={(e) => setQ({ ...q, prompt: e.target.value })} /></Field>
          {(q.type === "single" || q.type === "multi" || q.type === "tf") && q.options.map((op: string, oi: number) => {
            const isC = q.type === "multi" ? (q.correct || []).includes(oi) : q.correct === oi;
            return (
              <div key={oi} className="flex items-center gap-2">
                <button className={`w-5 h-5 rounded-sm border grid place-items-center shrink-0 ${isC ? "bg-cy-500 border-cy-400" : "border-dim"}`}
                  onClick={() => q.type === "multi" ? setQ({ ...q, correct: isC ? (q.correct || []).filter((x: number) => x !== oi) : [...(q.correct || []), oi] }) : setQ({ ...q, correct: oi })}>{isC && <I n="check" s={11} c="text-ink" />}</button>
                <TIn value={op} onChange={(e) => setQ({ ...q, options: q.options.map((x: string, xi: number) => (xi === oi ? e.target.value : x)) })} placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`} />
              </div>
            );
          })}
          <Field label="Assunto / tópico"><TIn value={q.topic} onChange={(e) => setQ({ ...q, topic: e.target.value })} placeholder="Ex.: OWASP, SQL, React…" /></Field>
          <Field label="Explicação"><TIn value={q.explanation} onChange={(e) => setQ({ ...q, explanation: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><Btn v="x" onClick={() => setEdit(null)}>Cancelar</Btn><Btn v="e" onClick={save}>Salvar questão</Btn></div>
        </div>
      </Modal>
    </div>
  );
}
