import React, { useMemo, useState } from "react";
import { I } from "../components/icons";
import { Btn, Card, CoverImg, Empty, Field, TIn, TArea, Tag, useToast } from "../components/ui";
import { QRMatrix, SectionHead, useReveal, Scramble } from "../components/fx";
import { useApp, navigate } from "../state";
import {
  publishedCourses, courseBySlug, courseTree, effectivePrice, teacherName, coursePricing,
  validateCertificate, validateStudentCard, all, where, insert, type Row, fmtBRL, fmtDate, getSettings, audit,
} from "../lib/api";

/* ============ CATÁLOGO ============ */
export function Catalog() {
  const ref = useReveal<HTMLDivElement>();
  const [cat, setCat] = useState("all");
  const [level, setLevel] = useState("all");
  const [q, setQ] = useState("");
  const cats = all("course_categories").sort((a: Row, b: Row) => a.order - b.order);
  const courses = publishedCourses().filter((c) =>
    (cat === "all" || c.categoryId === cat) &&
    (level === "all" || c.level === level) &&
    (!q || (c.title + c.subtitle).toLowerCase().includes(q.toLowerCase()))
  );
  const levels = [...new Set(publishedCourses().map((c) => c.level))];
  return (
    <div ref={ref} className="max-w-[1200px] mx-auto px-5 py-14">
      <SectionHead kicker="Catálogo" title="Escolha sua trilha"
        desc="Todos os cursos publicados pela Cyber Academy, com carga horária, nível e condição de pagamento." />
      <div className="rv flex flex-wrap gap-3 items-center mb-8">
        <div className="relative flex-1 min-w-[220px] max-w-[340px]">
          <I n="search" s={16} c="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input className="cy-in pl-9" placeholder="Buscar curso…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button onClick={() => { setCat("all"); setLevel("all"); setQ(""); }}
          className={`cy-btn px-3.5 py-2 text-[12px] ${cat === "all" && !q ? "cy-btn-p" : "cy-btn-x"}`}>Todos</button>
        {cats.map((c: Row) => (
          <button key={c.id} onClick={() => setCat(cat === c.id ? "all" : c.id)}
            className={`cy-btn px-3.5 py-2 text-[12px] ${cat === c.id ? "cy-btn-p" : "cy-btn-g"}`}>{c.name}</button>
        ))}
        <select className="cy-in w-auto text-[12.5px]" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="all">Todos os níveis</option>
          {levels.map((l: any) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      {courses.length === 0 ? (
        <Empty icon="layers" title={q || cat !== "all" || level !== "all" ? "Nada encontrado com esses filtros" : "Catálogo em construção"}
          desc={q ? "Tente outra busca ou limpe os filtros." : "A administração publica os cursos pelo Painel Administrativo — assim que publicados, aparecem aqui."}>
          {q && <Btn v="g" onClick={() => { setQ(""); setCat("all"); setLevel("all"); }}>Limpar filtros</Btn>}
          <a href="#/admin" className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px]">Área administrativa</a>
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c, i) => {
            const lessons = where("lessons", (l) => l.courseId === c.id && l.published).length;
            const t = all("teachers").find((t) => t.id === c.teacherId);
            return (
              <a key={c.id} href={`#/cursos/${c.slug}`} className={`rv cy-card cy-card-h overflow-hidden group block dl-${i % 4}`}>
                <div className="h-[160px] overflow-hidden relative">
                  <CoverImg src={c.image} title={c.title} className="h-full transition-transform duration-500 group-hover:scale-[1.05]" />
                  <span className="absolute top-3 left-3 cy-badge b-teal">{c.level}</span>
                  {c.promoActive && <span className="absolute top-3 right-3 cy-badge b-amber">OFERTA</span>}
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold text-[15px] text-mist leading-snug group-hover:text-cy-300 transition-colors">{c.title}</h3>
                  <p className="text-[12.5px] text-fog mt-2 line-clamp-2 leading-relaxed">{c.subtitle}</p>
                  <div className="flex items-center gap-4 mt-4 font-mono text-[11px] text-dim">
                    <span className="flex items-center gap-1.5"><I n="clock" s={13} />{c.hours}h</span>
                    <span className="flex items-center gap-1.5"><I n="video" s={13} />{lessons} aulas</span>
                    <span className="flex items-center gap-1.5"><I n="user" s={13} />{teacherName(t)}</span>
                  </div>
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-line">
                    <div>
                      {(() => { const p = coursePricing(c); return p.model === "subscription" ? (
                        <>
                          <span className="block font-display font-bold text-[19px] tnum text-cy-300">{fmtBRL(p.monthly)}<span className="text-[11px] font-normal text-dim">/mês</span></span>
                          <span className="font-mono text-[10.5px] text-dim">plano de {p.months} mensalidades</span>
                        </>
                      ) : (
                        <>
                          {c.promoActive && c.promoPrice && <span className="text-[11px] text-dim line-through font-mono">{fmtBRL(Number(c.price))}</span>}
                          <span className={`block font-display font-bold text-[19px] tnum ${c.promoActive ? "text-ember" : "text-cy-300"}`}>{fmtBRL(effectivePrice(c))}</span>
                          {c.installments > 1 && <span className="font-mono text-[10.5px] text-dim">ou {c.installments}x de {fmtBRL(effectivePrice(c) / c.installments)}</span>}
                        </>
                      ); })()}
                      {c.freeReenroll && <span className="cy-badge b-amber mt-1.5"><I n="refresh" s={10} /> rematrícula grátis</span>}
                    </div>
                    <span className="cy-btn cy-btn-p px-3.5 py-2 text-[11.5px] pointer-events-none">Comprar</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ PÁGINA COMERCIAL DO CURSO ============ */
export function CoursePage({ slug }: { slug: string }) {
  const ref = useReveal<HTMLDivElement>();
  const { user } = useApp();
  const toast = useToast();
  const tree = courseBySlug(slug) ? courseTree(courseBySlug(slug)!.id) : null;
  const [openMod, setOpenMod] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  if (!tree) return <div className="max-w-[800px] mx-auto px-5 py-24"><Empty icon="search" title="Curso não encontrado" desc="Este curso não existe ou ainda não foi publicado."><a href="#/cursos" className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px]">Ver catálogo</a></Empty></div>;
  const { course: c, modules, teacher } = tree;
  const lessons = where("lessons", (l) => l.courseId === c.id && l.published);
  const cat = all("course_categories").find((k: Row) => k.id === c.categoryId);
  const buy = () => {
    if (!user) { toast("Entre ou crie sua conta para comprar.", "info"); navigate(`/login?next=/checkout/${c.id}`); return; }
    navigate(`/checkout/${c.id}`);
  };
  const courseFaqs: [string, string][] = [
    ["Como funciona o acesso?", `Após a aprovação do pagamento via Mercado Pago, o SIA cria sua matrícula automaticamente e o AVA é liberado na hora — o acesso fica disponível no seu Portal do Aluno.`],
    ["O certificado é reconhecido?", `Sim: certificado de conclusão com ${c.hours}h, código único e QR Code, verificável publicamente na página de validação da Cyber Academy.`],
    ["E se eu não gostar?", "Você tem 7 dias de garantia incondicional: reembolso integral processado pelo Mercado Pago e cancelamento automático da matrícula."],
  ];
  const priceCard = (
    <Card className="p-6 lg:sticky lg:top-24">
      <div className="h-[150px] rounded-lg overflow-hidden mb-5"><CoverImg src={c.image} title={c.title} className="h-full" /></div>
      {c.promoActive && c.promoPrice ? (
        <div className="flex items-end gap-3">
          <span className="font-display font-bold text-[32px] text-ember tnum">{fmtBRL(effectivePrice(c))}</span>
          <span className="font-mono text-[13px] text-dim line-through mb-1">{fmtBRL(Number(c.price))}</span>
        </div>
      ) : (
        <span className="font-display font-bold text-[32px] text-cy-300 tnum">{fmtBRL(Number(c.price))}</span>
      )}
      {c.installments > 1 && <div className="font-mono text-[12px] text-fog mt-1">em até {c.installments}x de {fmtBRL(effectivePrice(c) / c.installments)} no cartão</div>}
      <div className="font-mono text-[11.5px] text-dim mt-1 flex items-center gap-2"><I n="pix" s={13} /> Pix à vista · <I n="card" s={13} /> Cartão via Mercado Pago</div>
      <button onClick={buy} className="cy-btn cy-btn-e w-full py-3.5 text-[14px] mt-5">COMPRAR AGORA <I n="arrowR" s={16} /></button>
      <div className="text-center font-mono text-[10.5px] text-dim mt-2.5">acesso liberado automaticamente após o webhook</div>
      <div className="mt-5 space-y-2.5">
        {[
          ["clock", `${c.hours}h de carga horária`], ["layers", `${modules.length} módulos · ${lessons.length} aulas`],
          ["target", `Nível ${c.level}`], ["user", `Professor: ${teacherName(teacher)}`],
          ["award", "Certificado verificável com QR Code"], ["shield", "Garantia de 7 dias"],
        ].map(([ic, t]) => (
          <div key={t} className="flex items-center gap-2.5 text-[13px] text-fog"><I n={ic} s={15} c="text-cy-400" /> {t}</div>
        ))}
      </div>
    </Card>
  );

  return (
    <div ref={ref}>
      <section className="border-b border-line bg-abyss/50">
        <div className="max-w-[1200px] mx-auto px-5 py-12 grid lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
          <div className="anim-fade-up">
            <div className="flex flex-wrap gap-2 mb-4">
              {cat && <Tag>{cat.name}</Tag>}<Tag tone="amber">{c.level}</Tag>
              <span className="cy-badge b-mist">{c.hours}h</span>
            </div>
            <h1 className="display-xl text-[30px] md:text-[44px] text-mist leading-[1.05]"><Scramble text={c.title} /></h1>
            <p className="text-[15.5px] text-cy-200/90 mt-4 leading-relaxed max-w-[620px]">{c.subtitle}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-[13px] text-fog">
              <span className="flex items-center gap-2"><I n="user" s={15} c="text-cy-400" /> {teacherName(teacher)}{teacher?.specialty ? ` · ${teacher.specialty}` : ""}</span>
              <span className="flex items-center gap-2"><I n="video" s={15} c="text-cy-400" /> {lessons.length} aulas publicadas</span>
              <span className="flex items-center gap-2"><I n="file" s={15} c="text-cy-400" /> {where("lesson_materials", (m) => m.courseId === c.id).length} materiais</span>
            </div>
          </div>
          <div className="anim-fade-up dl-2 hidden lg:block">{priceCard}</div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 py-12 grid lg:grid-cols-[1.5fr_1fr] gap-10">
        <div className="space-y-10 min-w-0">
          <section className="rv">
            <h2 className="font-display font-semibold text-[20px] text-cy-300 mb-3 flex items-center gap-2.5"><I n="term" s={18} /> Sobre o curso</h2>
            <p className="text-[14.5px] text-fog leading-[1.8] whitespace-pre-line">{c.description}</p>
          </section>
          <section className="rv grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-mono text-[11px] tracking-[.16em] uppercase text-cy-500 mb-3">O que você vai dominar</h3>
              <ul className="space-y-2.5">{(c.objectives || []).map((o: string) => <li key={o} className="flex gap-2.5 text-[13.5px] text-fog"><I n="checkc" s={16} c="text-cy-400 shrink-0 mt-0.5" />{o}</li>)}</ul>
            </div>
            <div>
              <h3 className="font-mono text-[11px] tracking-[.16em] uppercase text-cy-500 mb-3">Para quem é</h3>
              <ul className="space-y-2.5">{(c.audience || []).map((o: string) => <li key={o} className="flex gap-2.5 text-[13.5px] text-fog"><I n="users" s={16} c="text-ember shrink-0 mt-0.5" />{o}</li>)}</ul>
              <h3 className="font-mono text-[11px] tracking-[.16em] uppercase text-cy-500 mb-3 mt-6">Pré-requisitos</h3>
              <ul className="space-y-2">{(c.prerequisites || []).map((o: string) => <li key={o} className="flex gap-2.5 text-[13px] text-dim"><I n="chevR" s={14} c="text-dim shrink-0 mt-0.5" />{o}</li>)}</ul>
            </div>
          </section>

          <section className="rv">
            <h2 className="font-display font-semibold text-[20px] text-cy-300 mb-4 flex items-center gap-2.5"><I n="layers" s={18} /> Conteúdo programático</h2>
            <div className="space-y-3">
              {modules.length === 0 && <Card className="p-6 text-[13.5px] text-dim">Módulos serão publicados em breve pela coordenação.</Card>}
              {modules.map((m, i) => {
                const ls = m.lessons.filter((l: Row) => l.published);
                const open = openMod === i;
                return (
                  <Card key={m.id} className="overflow-hidden">
                    <button className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cy-500/5 transition-colors" onClick={() => setOpenMod(open ? -1 : i)}>
                      <div className="flex items-center gap-4">
                        <span className="font-display font-bold text-[17px] text-cy-600 w-8">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <div className="font-display font-semibold text-[14.5px] text-mist">{m.title}</div>
                          <div className="font-mono text-[10.5px] text-dim mt-0.5">{ls.length} aulas · {ls.reduce((s: number, l: Row) => s + (l.durationMin || 0), 0)} min</div>
                        </div>
                      </div>
                      <I n="chevD" s={17} c={`text-fog transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="border-t border-line anim-fade-in">
                        {ls.map((l: Row, j: number) => (
                          <div key={l.id} className="flex items-center gap-3.5 px-5 py-3 border-b border-line/50 last:border-0 hover:bg-cy-500/5">
                            <span className="font-mono text-[11px] text-dim w-7">{String(j + 1).padStart(2, "0")}</span>
                            <I n="playc" s={16} c="text-cy-400" />
                            <span className="text-[13.5px] text-fog flex-1">{l.title}</span>
                            <span className="font-mono text-[11px] text-dim">{l.durationMin}min</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="rv grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-display font-semibold text-[16px] text-mist mb-3 flex items-center gap-2"><I n="target" s={17} c="text-cy-400" /> Metodologia</h3>
              <p className="text-[13.5px] text-fog leading-relaxed">{c.methodology}</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-display font-semibold text-[16px] text-mist mb-3 flex items-center gap-2"><I n="git" s={17} c="text-ember" /> Projeto final</h3>
              <p className="text-[13.5px] text-fog leading-relaxed">{c.finalProject}</p>
            </Card>
          </section>

          <section className="rv">
            <h2 className="font-display font-semibold text-[20px] text-cy-300 mb-4 flex items-center gap-2.5"><I n="award" s={18} /> Benefícios incluídos</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {(c.benefits || []).map((b: string) => (
                <div key={b} className="cy-card p-4 flex items-center gap-3 text-[13.5px] text-fog"><I n="check" s={16} c="text-ember" />{b}</div>
              ))}
            </div>
          </section>

          <section className="rv">
            <h2 className="font-display font-semibold text-[20px] text-cy-300 mb-4">Perguntas sobre este curso</h2>
            <div className="space-y-2.5">
              {courseFaqs.map(([q, a], i) => (
                <Card key={i} className="overflow-hidden">
                  <button className="w-full flex justify-between items-center px-5 py-3.5 text-left" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                    <span className="text-[13.5px] font-semibold text-mist">{q}</span>
                    <I n="chevD" s={16} c={`text-fog transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
                  </button>
                  {faqOpen === i && <p className="px-5 pb-4 text-[13px] text-fog leading-relaxed anim-fade-in">{a}</p>}
                </Card>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:hidden mb-8">{priceCard}</div>
      </div>
    </div>
  );
}

/* ============ SOBRE ============ */
export function About() {
  const ref = useReveal<HTMLDivElement>();
  const s = getSettings();
  return (
    <div ref={ref} className="max-w-[1000px] mx-auto px-5 py-16">
      <SectionHead kicker="Institucional" title={s.schoolName || "Cyber Academy"} desc="Uma escola de tecnologia construída em cima de um sistema acadêmico de verdade — não de uma playlist de vídeos." />
      <div className="rv space-y-5 text-[14.5px] text-fog leading-[1.85]">
        <p>Nascemos com uma convicção: <strong className="text-mist">educação tecnológica precisa de infraestrutura acadêmica</strong>. Por isso desenvolvemos o SIA — nosso Sistema de Informações Acadêmicas — que registra cada matrícula, cada aula assistida, cada nota e cada certificado com a mesma seriedade de uma instituição de ensino regulamentada.</p>
        <p>O site vende, o Mercado Pago processa, o SIA governa a vida acadêmica e o AVA cuida da experiência de aprendizagem. Quando um pagamento é aprovado, a matrícula nasce sozinha, com número único. Quando o aluno conclui os critérios, o certificado é emitido — e qualquer empregador pode validá-lo publicamente.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        {[["term", "SIA próprio", "Matrículas, histórico, notas e certificados em um núcleo auditável."],
          ["playc", "AVA integrado", "Progresso real de aulas, materiais e avaliações — nunca planilha manual."],
          ["shield", "LGPD by design", "Consentimentos registrados, auditoria completa e dados sob controle."]].map(([ic, t, d], i) => (
          <Card key={t} className={`rv p-5 dl-${i}`}>
            <I n={ic} s={22} c="text-cy-400" />
            <h3 className="font-display font-semibold text-[15px] text-mist mt-3">{t}</h3>
            <p className="text-[12.5px] text-fog mt-1.5 leading-relaxed">{d}</p>
          </Card>
        ))}
      </div>
      <Card className="rv mt-10 p-6 flex flex-wrap items-center justify-between gap-4 border-ember/30">
        <div>
          <h3 className="font-display font-semibold text-[17px] text-mist">Missão</h3>
          <p className="text-[13.5px] text-fog mt-1 max-w-[520px]">Formar profissionais de tecnologia com profundidade técnica e portfólio verificável — do primeiro commit ao certificado validado.</p>
        </div>
        <a href="#/cursos" className="cy-btn cy-btn-e px-5 py-3 text-[12.5px]">Ver formações</a>
      </Card>
    </div>
  );
}

/* ============ PROFESSORES ============ */
export function Teachers() {
  const ref = useReveal<HTMLDivElement>();
  const teachers = all("teachers").filter((t: Row) => t.status === "active");
  const uniq: Row[] = [];
  teachers.forEach((t: Row) => { if (!uniq.some((u) => u.email === t.email)) uniq.push(t); });
  return (
    <div ref={ref} className="max-w-[1100px] mx-auto px-5 py-16">
      <SectionHead kicker="Corpo docente" title="Quem ensina aqui" desc="Profissionais de mercado cadastrados no SIA, com permissões limitadas aos cursos e turmas que lecionam." />
      {uniq.length === 0 ? (
        <Empty icon="users" title="Corpo docente em formação" desc="Os professores são cadastrados pela administração no SIA e aparecem aqui automaticamente." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {uniq.map((t: Row, i: number) => {
            const courses = where("courses", (c) => c.teacherId === t.id || all("teachers").some((x) => x.email === t.email && x.id === c.teacherId));
            return (
              <Card key={t.id} hover className={`rv p-6 dl-${i % 4}`}>
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 rounded-xl grid place-items-center font-display font-bold text-[20px] border border-cy-700 bg-cy-500/10 text-cy-300">
                    {t.name.split(" ").slice(0, 2).map((p: string) => p[0]).join("")}
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-[16px] text-mist">{t.name}</h3>
                    <div className="font-mono text-[11px] text-cy-500 uppercase tracking-wider mt-0.5">{t.specialty || "Docente"}</div>
                  </div>
                </div>
                <p className="text-[13px] text-fog leading-relaxed mt-4">{t.bio}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {courses.slice(0, 2).map((c: Row) => <a key={c.id} href={`#/cursos/${c.slug}`} className="cy-badge b-teal hover:border-cy-400 transition-colors">{c.title.slice(0, 26)}…</a>)}
                  {courses.length === 0 && <span className="cy-badge b-mist">cursos em cadastro</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ BLOG ============ */
export function Blog() {
  const ref = useReveal<HTMLDivElement>();
  const posts = where("posts", (p) => p.published).sort((a: Row, b: Row) => b.at.localeCompare(a.at));
  const [open, setOpen] = useState<Row | null>(null);
  return (
    <div ref={ref} className="max-w-[900px] mx-auto px-5 py-16">
      <SectionHead kicker="Blog" title="Conteúdo da redação" desc="Análises e guias publicados pela equipe e pelos docentes da Cyber Academy." />
      {posts.length === 0 ? (
        <Empty icon="file" title="Nenhuma publicação ainda" desc="Os artigos são publicados pela administração e aparecem aqui." />
      ) : (
        <div className="space-y-4">
          {posts.map((p: Row, i: number) => (
            <Card key={p.id} hover className={`rv p-6 cursor-pointer dl-${i % 3}`} onClick={() => setOpen(p)}>
              <div className="flex items-center gap-3 flex-wrap">
                <Tag tone="amber">{p.tag}</Tag>
                <span className="font-mono text-[11px] text-dim">{fmtDate(p.at)} · {p.author}</span>
              </div>
              <h3 className="font-display font-semibold text-[18px] text-mist mt-3">{p.title}</h3>
              <p className="text-[13.5px] text-fog mt-2 leading-relaxed">{p.excerpt}</p>
              <span className="inline-flex items-center gap-2 text-[12.5px] text-cy-300 mt-3 font-display">Ler artigo <I n="arrowR" s={14} /></span>
            </Card>
          ))}
        </div>
      )}
      {open && (
        <div className="cy-modal-back" onMouseDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="cy-modal anim-fade-up" style={{ maxWidth: 720 }}>
            <div className="p-7">
              <div className="flex items-center gap-3"><Tag tone="amber">{open.tag}</Tag><span className="font-mono text-[11px] text-dim">{fmtDate(open.at)} · {open.author}</span></div>
              <h2 className="display-xl text-[24px] md:text-[30px] text-mist mt-4">{open.title}</h2>
              <div className="text-[14px] text-fog leading-[1.9] mt-5 whitespace-pre-line">{open.body}</div>
              <button className="cy-btn cy-btn-g px-4 py-2 text-[12px] mt-6" onClick={() => setOpen(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ FAQ ============ */
export function Faq() {
  const ref = useReveal<HTMLDivElement>();
  const faqs = all("faqs").sort((a: Row, b: Row) => a.order - b.order);
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div ref={ref} className="max-w-[820px] mx-auto px-5 py-16">
      <SectionHead kicker="FAQ" title="Perguntas frequentes" desc="Dúvidas sobre matrícula, pagamento, acesso e certificados — respondidas pelo que o sistema realmente faz." />
      {faqs.length === 0 ? <Empty icon="msg" title="Nenhuma pergunta cadastrada" desc="O FAQ é gerenciado pela administração no painel." /> : (
        <div className="space-y-3">
          {faqs.map((f: Row, i: number) => (
            <Card key={f.id} className="rv overflow-hidden">
              <button className="w-full flex justify-between items-center gap-4 px-6 py-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-display font-semibold text-[15px] text-mist">{f.q}</span>
                <I n="chevD" s={17} c={`text-cy-400 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="px-6 pb-5 text-[13.5px] text-fog leading-relaxed anim-fade-in">{f.a}</p>}
            </Card>
          ))}
        </div>
      )}
      <Card className="rv mt-8 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><I n="msg" s={22} c="text-cy-400" /><span className="text-[13.5px] text-fog">Não achou sua resposta? Alunos têm suporte por chamados dentro do portal.</span></div>
        <a href="#/contato" className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px]">Falar com a escola</a>
      </Card>
    </div>
  );
}

/* ============ CONTATO ============ */
export function Contact() {
  const ref = useReveal<HTMLDivElement>();
  const toast = useToast();
  const { user } = useApp();
  const [f, setF] = useState({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
  const send = () => {
    if (!f.name || !f.email.includes("@") || !f.message) { toast("Preencha nome, e-mail e mensagem.", "err"); return; }
    const t = insert("support_tickets", { userId: user?.id || "visitante", userName: f.name, subject: `[Site] ${f.subject || "Contato"}`, category: "contato", status: "open", email: f.email });
    insert("ticket_messages", { ticketId: t.id, authorId: "visitante", authorName: f.name, authorRole: "visitante", text: f.message, at: new Date().toISOString() });
    audit(null, "CREATE", "support_tickets", "", "Mensagem via formulário do site");
    toast("Mensagem enviada! Retornaremos pelo e-mail informado.", "ok");
    setF({ name: "", email: "", subject: "", message: "" });
  };
  return (
    <div ref={ref} className="max-w-[900px] mx-auto px-5 py-16 grid md:grid-cols-[1fr_1.3fr] gap-10">
      <div className="rv">
        <SectionHead kicker="Contato" title="Fale com a escola" />
        <div className="space-y-4">
          {[["mail", "contato@cyberacademy.com.br"], ["term", "Atendimento: seg–sex, 9h às 18h"], ["globe", "Av. Paulista, 1000 · São Paulo/SP"]].map(([ic, t]) => (
            <div key={t} className="cy-card p-4 flex items-center gap-3.5 text-[13.5px] text-fog"><I n={ic} s={18} c="text-cy-400" />{t}</div>
          ))}
          <p className="text-[12.5px] text-dim leading-relaxed">Alunos matriculados: usem o módulo de <strong className="text-fog">Suporte</strong> no portal — o tempo de resposta é priorizado.</p>
        </div>
      </div>
      <Card className="rv p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome" req><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Seu nome" /></Field>
          <Field label="E-mail" req><TIn type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="voce@email.com" /></Field>
        </div>
        <Field label="Assunto"><TIn value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Ex.: dúvida sobre matrícula" /></Field>
        <Field label="Mensagem" req><TArea rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Como podemos ajudar?" /></Field>
        <Btn v="e" onClick={send} className="w-full">Enviar mensagem <I n="send" s={15} /></Btn>
      </Card>
    </div>
  );
}

/* ============ LGPD ============ */
function Legal({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="max-w-[780px] mx-auto px-5 py-16">
      <SectionHead kicker={kicker} title={title} />
      <div className="rv cy-card p-7 md:p-9 text-[13.5px] text-fog leading-[1.9] space-y-5">{children}</div>
    </div>
  );
}
export function Terms() {
  return (
    <Legal kicker="LGPD · v1.0" title="Termos de Uso">
      <p><strong className="text-mist">1. Objeto.</strong> Estes termos regem o uso da plataforma Cyber Academy (site, SIA, AVA e portais), incluindo a compra de cursos, a vida acadêmica e a emissão de certificados.</p>
      <p><strong className="text-mist">2. Matrícula e acesso.</strong> A matrícula é criada automaticamente após a confirmação do pagamento pelo gateway (Mercado Pago) via webhook. O acesso é pessoal e intransferível, vinculado ao CPF/e-mail do titular.</p>
      <p><strong className="text-mist">3. Propriedade intelectual.</strong> Videoaulas e materiais são licenciados para uso individual. É vedada a redistribuição, revenda ou exibição pública do conteúdo.</p>
      <p><strong className="text-mist">4. Avaliações e certificado.</strong> O certificado é emitido somente quando cumpridos os critérios acadêmicos registrados no SIA (progresso, notas mínimas e projeto aprovado, quando aplicável). Tentativas de fraude acadêmica resultam em cancelamento sem reembolso.</p>
      <p><strong className="text-mist">5. Reembolso.</strong> Garantia incondicional de 7 dias após a compra, conforme o CDC, com estorno pelo gateway e cancelamento automático da matrícula.</p>
      <p><strong className="text-mist">6. Conduta.</strong> É vedado compartilhar credenciais, burlar mecanismos de progresso ou acessar áreas de outros usuários. Violações são registradas em auditoria e podem levar ao bloqueio da conta.</p>
    </Legal>
  );
}
export function Privacy() {
  return (
    <Legal kicker="LGPD · Lei 13.709/2018" title="Política de Privacidade">
      <p><strong className="text-mist">Controladora.</strong> Cyber Academy Ltda. trata seus dados pessoais para executar o contrato educacional: cadastro, matrícula, pagamentos, registros acadêmicos e certificados.</p>
      <p><strong className="text-mist">Dados tratados.</strong> Nome, e-mail, CPF, telefone, histórico acadêmico (notas, progresso, frequência), registros financeiros e logs de auditoria. Dados de cartão nunca tocam nossos servidores — o processamento é do Mercado Pago.</p>
      <p><strong className="text-mist">Bases legais.</strong> Execução de contrato (art. 7º, V), cumprimento de obrigação legal e legítimo interesse para segurança e antifraude.</p>
      <p><strong className="text-mist">Direitos do titular.</strong> Você pode solicitar acesso, correção, portabilidade e eliminação dos dados pelo canal de suporte. Toda solicitação é registrada e respondida em até 15 dias.</p>
      <p><strong className="text-mist">Segurança.</strong> Senhas com hash, tokens com expiração, RBAC por perfil, auditoria de eventos e backups do PostgreSQL. Retenção pelo prazo legal dos registros acadêmicos.</p>
    </Legal>
  );
}
export function Cookies() {
  return (
    <Legal kicker="LGPD" title="Política de Cookies">
      <p><strong className="text-mist">Essenciais.</strong> Usamos armazenamento local para manter sua sessão autenticada (token JWT), suas preferências e o registro de aceite deste aviso. Sem eles, o portal não funciona.</p>
      <p><strong className="text-mist">Medição.</strong> Métricas agregadas de uso podem ser coletadas para melhorar a plataforma, sem identificação individual.</p>
      <p><strong className="text-mist">Gestão.</strong> Você pode limpar os dados locais pelo navegador; isso encerra sessões e exige novo login. O aceite fica registrado com data na tabela de consentimentos.</p>
    </Legal>
  );
}

/* ============ VALIDAÇÃO DE CERTIFICADO ============ */
export function ValidateCert({ code }: { code?: string }) {
  const ref = useReveal<HTMLDivElement>();
  const [input, setInput] = useState(code || "");
  const [res, setRes] = useState<null | ReturnType<typeof validateCertificate>>(code ? validateCertificate(code) : null);
  return (
    <div ref={ref} className="max-w-[860px] mx-auto px-5 py-16">
      <SectionHead kicker="Transparência pública" title="Validar certificado"
        desc="Consulta direta ao SIA: informe o código impresso no certificado (ou escaneie o QR Code) para verificar autenticidade, titular e carga horária." />
      <Card className="rv p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-3 max-w-[560px]">
          <div className="relative flex-1">
            <I n="qr" s={17} c="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
            <input className="cy-in pl-10 font-mono uppercase tracking-wider" placeholder="CA-XXXX-XXXX" value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && setRes(validateCertificate(input))} />
          </div>
          <Btn v="e" className="px-7" onClick={() => setRes(validateCertificate(input))}>Consultar SIA</Btn>
        </div>
        {res && !res.valid && (
          <div className="mt-6 border border-coral/40 bg-coral/5 rounded-lg p-5 flex items-start gap-4 anim-fade-up">
            <I n="alert" s={26} c="text-coral shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold text-coral">Certificado não localizado</h3>
              <p className="text-[13px] text-fog mt-1 leading-relaxed">O código informado não existe na base do SIA ou foi digitado incorretamente. A tentativa de validação foi registrada em auditoria.</p>
            </div>
          </div>
        )}
        {res && res.valid && res.cert && (
          <div className="mt-8 anim-fade-up">
            <div className="flex items-center gap-2 mb-4 text-[#7BE0A2] font-mono text-[12px] tracking-wider uppercase"><I n="checkc" s={16} /> Autêntico · emitido pelo SIA</div>
            <div className="relative overflow-hidden rounded-xl border border-cy-600 bg-gradient-to-br from-[#05202B] via-[#062A2E] to-[#0A3E41] p-8 md:p-10">
              <div className="absolute inset-3 border border-cy-700/50 rounded-lg pointer-events-none" />
              <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
                <div>
                  <div className="cy-chip text-cy-400">CERTIFICADO DE CONCLUSÃO</div>
                  <h3 className="display-xl text-[26px] md:text-[32px] text-mist mt-3">{res.cert.studentName}</h3>
                  <p className="text-[13.5px] text-fog mt-3 leading-relaxed">{res.course?.certificateText || "concluiu o programa"} <strong className="text-cy-300">{res.cert.courseTitle}</strong>, com carga horária de <strong className="text-mist">{res.cert.hours} horas</strong>, nível {res.cert.level}.</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-5 font-mono text-[11.5px] text-dim">
                    <span>emitido em {fmtDate(res.cert.issuedAt)}</span>
                    <span>período {fmtDate(res.cert.periodStart)} → {fmtDate(res.cert.periodEnd)}</span>
                    <span className="text-cy-400">{res.cert.code}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2"><QRMatrix code={res.cert.code} size={110} /><span className="font-mono text-[10px] text-dim">matrícula {res.enrollment?.number}</span></div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============ VALIDAÇÃO PÚBLICA DE CARTEIRINHA ============ */
export function ValidateCard({ code }: { code?: string }) {
  const [input, setInput] = useState(code || "");
  const [res, setRes] = useState<null | ReturnType<typeof validateStudentCard>>(code ? validateStudentCard(code) : null);
  return (
    <div className="max-w-[760px] mx-auto px-5 py-16">
      <SectionHead kicker="Transparência pública" title="Validar carteirinha de estudante"
        desc="Consulta direta ao SIA: informe o número impresso na carteirinha digital (ou escaneie o QR Code) para verificar autenticidade e validade." />
      <Card className="rv p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-3 max-w-[560px]">
          <div className="relative flex-1">
            <I n="idcard" s={17} c="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
            <input className="cy-in pl-10 font-mono uppercase tracking-wider" placeholder="CA-ID-2026-000001" value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && setRes(validateStudentCard(input))} />
          </div>
          <Btn v="e" className="px-7" onClick={() => setRes(validateStudentCard(input))}>Consultar SIA</Btn>
        </div>
        {res && !res.valid && (
          <div className="mt-6 border border-coral/40 bg-coral/5 rounded-lg p-5 flex items-start gap-4 anim-fade-up">
            <I n="alert" s={26} c="text-coral shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold text-coral">{res.expired ? "Carteirinha expirada" : "Carteirinha não localizada"}</h3>
              <p className="text-[13px] text-fog mt-1 leading-relaxed">{res.expired ? "O número existe na base do SIA, mas a validade expirou. O aluno deve emitir uma nova versão pelo Portal do Aluno." : "O número informado não existe na base do SIA ou foi digitado incorretamente. A tentativa de validação foi registrada em auditoria."}</p>
            </div>
          </div>
        )}
        {res && res.valid && res.doc && (
          <div className="mt-8 anim-fade-up">
            <div className="flex items-center gap-2 mb-4 text-[#7BE0A2] font-mono text-[12px] tracking-wider uppercase"><I n="checkc" s={16} /> Autêntica · emitida pelo SIA</div>
            <div className="relative overflow-hidden rounded-xl border border-cy-600 bg-gradient-to-br from-[#05202B] via-[#062A2E] to-[#0A3E41] p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="flex-1 text-center sm:text-left">
                  <div className="cy-chip text-cy-400">CYBER ACADEMY · CARTEIRA DE ESTUDANTE</div>
                  <h3 className="display-xl text-[24px] text-mist mt-3">{res.user?.name}</h3>
                  <p className="text-[13.5px] text-fog mt-2 leading-relaxed">Curso: <strong className="text-cy-300">{res.course?.title}</strong></p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 font-mono text-[11.5px] text-dim">
                    <span>matrícula {res.enrollment?.number}</span>
                    <span>válida até {fmtDate(res.doc.validUntil)}</span>
                    <span className="text-cy-400">{res.doc.cardNumber}</span>
                  </div>
                </div>
                {res.user?.photo && <img src={res.user.photo} alt="foto" className="w-[90px] h-[110px] object-cover rounded-lg border border-cy-500/50" />}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
