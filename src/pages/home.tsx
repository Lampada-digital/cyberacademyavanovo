import React, { useState } from "react";
import { I } from "../components/icons";
import { Btn, Card, CoverImg, Tag } from "../components/ui";
import { Particles, QRMatrix, Scramble, SectionHead, Terminal, useReveal, CountUp } from "../components/fx";
import { useApp } from "../state";
import { publishedCourses, effectivePrice, validateCertificate, teacherName } from "../lib/api";
import { all, fmtBRL, getSettings, type Row } from "../lib/db";
import { IMG } from "../lib/seed";

const TERM_LINES = [
  "$ sia --portal cyberacademy.com.br",
  "> visitante escolheu: Full-Stack React & Node",
  "> checkout iniciado · Mercado Pago Checkout Pro",
  "! webhook recebido · assinatura validada",
  "> pagamento aprovado · pedido PED-2026-00042",
  "> matricula CA2026000001 criada ✓",
  "> AVA liberado · módulo 01 desbloqueado",
  "> aula concluída · progresso 100%",
  "> certificado CA-9F3K-Q2ZB emitido ✓",
];

const TICKER = ["MATRÍCULAS ABERTAS 2026", "WEBHOOK MP → MATRÍCULA AUTOMÁTICA", "CERTIFICADOS COM QR CODE VERIFICÁVEL", "SIA · SISTEMA DE INFORMAÇÕES ACADÊMICAS", "AVA INTEGRADO AO PROGRESSO REAL", "PIX E CARTÃO EM ATÉ 6X", "CORREÇÃO AUTOMÁTICA + PROFESSORES REAIS"];

export default function Home() {
  const ref = useReveal<HTMLDivElement>();
  const { user } = useApp();
  const courses = publishedCourses().slice(0, 3);
  const students = all("users").filter((u) => u.role === "student" && u.status === "active").length;
  const certs = all("certificates").length;
  const enrollments = all("enrollments").filter((e) => e.status !== "CANCELLED").length;
  const [code, setCode] = useState("");
  const [valRes, setValRes] = useState<null | { valid: boolean; cert?: Row; course?: Row }>(null);

  return (
    <div ref={ref}>
      {/* ============ ABERTURA ============ */}
      <section className="relative overflow-hidden">
        <Particles n={26} />
        <div className="max-w-[1200px] mx-auto px-5 pt-14 md:pt-20 pb-16 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          <div className="anim-fade-up">
            <div className="inline-flex items-center gap-2.5 cy-chip text-cy-400 border border-cy-700 bg-cy-900/60 rounded-full px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cy-400 animate-pulse" />
              ESCOLA DE TECNOLOGIA · {getSettings().schoolName?.toUpperCase()}
            </div>
            <h1 className="display-xl text-[42px] md:text-[64px] mt-6 text-mist">
              <Scramble text="APRENDA." delay={0} />{" "}
              <span className="text-cy-400"><Scramble text="CONSTRUA." delay={14} /></span>
              <br />
              <Scramble text="DOMINE O DIGITAL." delay={28} />
            </h1>
            <p className="text-[15.5px] md:text-[16.5px] text-fog leading-relaxed mt-6 max-w-[520px]">
              {getSettings().heroSub || "Formações intensivas com portal do aluno, AVA com progresso real e certificado verificável."}
            </p>
            <div className="flex flex-wrap gap-3.5 mt-8">
              <a href="#/cursos" className="cy-btn cy-btn-e px-6 py-3.5 text-[13.5px]">Explorar cursos <I n="arrowR" s={16} /></a>
              <a href="#/validar-certificado" className="cy-btn cy-btn-g px-6 py-3.5 text-[13.5px]"><I n="qr" s={16} /> Validar certificado</a>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 mt-9 font-mono text-[11.5px] text-dim">
              <span className="flex items-center gap-2"><I n="zap" s={13} c="text-ember" /> Acesso imediato após o pagamento</span>
              <span className="flex items-center gap-2"><I n="shield" s={13} c="text-cy-400" /> Checkout via Mercado Pago</span>
              <span className="flex items-center gap-2"><I n="cap" s={13} c="text-cy-400" /> Certificado com código único</span>
            </div>
          </div>
          <div className="anim-fade-up dl-2 relative">
            <div className="absolute -inset-8 rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(closest-side,#03A6A6,transparent)" }} />
            <Terminal lines={TERM_LINES} className="relative" />
            <div className="hidden md:flex items-center gap-3 mt-4 ml-2 font-mono text-[11px] text-dim">
              <span className="w-8 h-px bg-cy-700" /> o fluxo real do SIA, do checkout ao certificado
            </div>
          </div>
        </div>
        {/* ticker */}
        <div className="border-y border-line bg-abyss/70 overflow-hidden py-3">
          <div className="flex whitespace-nowrap marquee-track w-max">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="cy-chip text-dim px-6 flex items-center gap-6">
                {t} <span className="text-cy-600">◆</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PIPELINE DA JORNADA ============ */}
      <section className="max-w-[1200px] mx-auto px-5 py-20">
        <SectionHead kicker="O ecossistema" title="Uma jornada, um sistema integrado"
          desc="Do primeiro clique no site à emissão do certificado: site comercial, Mercado Pago, SIA, AVA e área do professor operando como um único organismo." />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: "01", icon: "globe", t: "Site comercial", d: "Catálogo dinâmico servido pelo SIA: o que o admin publica é o que o visitante compra.", tag: "SITE" },
            { n: "02", icon: "card", t: "Checkout & Webhook", d: "Mercado Pago Checkout Pro processa; o webhook validado cria a matrícula automaticamente.", tag: "MP → SIA" },
            { n: "03", icon: "playc", t: "AVA com progresso real", d: "Aulas, materiais, atividades e avaliações registradas no histórico acadêmico do aluno.", tag: "AVA" },
            { n: "04", icon: "award", t: "Certificado verificável", d: "Conclusão auditada pelo SIA gera certificado com código único e validação pública.", tag: "SIA" },
          ].map((s, i) => (
            <div key={s.n} className={`rv cy-card cy-card-h p-5 relative overflow-hidden ${i === 1 ? "border-ember/30" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[34px] text-cy-800 leading-none">{s.n}</span>
                <span className={`cy-badge ${i === 1 ? "b-amber" : "b-teal"}`}>{s.tag}</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg grid place-items-center bg-cy-500/10 border border-cy-700 text-cy-400"><I n={s.icon} s={19} /></span>
                <h3 className="font-display font-semibold text-[15.5px] text-mist">{s.t}</h3>
              </div>
              <p className="text-[13px] text-fog leading-relaxed mt-3">{s.d}</p>
              {i < 3 && <span className="hidden lg:block absolute top-1/2 -right-[13px] text-cy-600 z-10"><I n="chevR" s={18} /></span>}
            </div>
          ))}
        </div>
      </section>

      {/* ============ CURSOS EM DESTAQUE (dados reais do SIA) ============ */}
      <section className="max-w-[1200px] mx-auto px-5 py-8">
        <SectionHead kicker="Catálogo ao vivo" title="Formações em destaque"
          desc="Cursos publicados pela administração no SIA — preço, carga horária e professor em tempo real."
          right={<a href="#/cursos" className="cy-btn cy-btn-g px-5 py-2.5 text-[12.5px] hidden md:inline-flex">Ver catálogo completo <I n="arrowR" s={15} /></a>} />
        {courses.length === 0 ? (
          <Card className="p-10 text-center rv">
            <I n="layers" s={34} c="text-cy-600 mx-auto" />
            <h3 className="font-display font-semibold text-mist text-[17px] mt-3">Nenhum curso publicado ainda</h3>
            <p className="text-[13.5px] text-fog mt-2 max-w-[460px] mx-auto">
              A produção inicia vazia por projeto: a administração cadastra e publica os cursos pelo Painel Administrativo e eles aparecem aqui automaticamente.
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <a href="#/admin" className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px]"><I n="gear" s={15} /> Acessar administração</a>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {courses.map((c, i) => (
              <a key={c.id} href={`#/cursos/${c.slug}`} className={`rv cy-card cy-card-h overflow-hidden group block dl-${i % 4}`}>
                <div className="h-[168px] overflow-hidden relative">
                  <CoverImg src={c.image} title={c.title} className="h-full transition-transform duration-500 group-hover:scale-[1.05]" />
                  <span className="absolute top-3 left-3 cy-badge b-teal">{c.level}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold text-[15.5px] text-mist leading-snug group-hover:text-cy-300 transition-colors">{c.title}</h3>
                  <p className="text-[12.5px] text-fog mt-2 line-clamp-2 leading-relaxed">{c.subtitle}</p>
                  <div className="flex items-center gap-4 mt-4 font-mono text-[11px] text-dim">
                    <span className="flex items-center gap-1.5"><I n="clock" s={13} /> {c.hours}h</span>
                    <span className="flex items-center gap-1.5"><I n="video" s={13} /> {all("lessons").filter((l) => l.courseId === c.id && l.published).length} aulas</span>
                    <span className="flex items-center gap-1.5"><I n="user" s={13} /> {teacherName(c.teacherId && all("teachers").find((t) => t.id === c.teacherId))}</span>
                  </div>
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-line">
                    <div>
                      {c.promoActive && c.promoPrice ? (
                        <>
                          <span className="text-[11.5px] text-dim line-through font-mono">{fmtBRL(Number(c.price))}</span>
                          <span className="block font-display font-bold text-[19px] text-ember tnum">{fmtBRL(effectivePrice(c))}</span>
                        </>
                      ) : (
                        <span className="font-display font-bold text-[19px] text-cy-300 tnum">{fmtBRL(Number(c.price))}</span>
                      )}
                    </div>
                    <span className="cy-btn cy-btn-p px-3.5 py-2 text-[11.5px] pointer-events-none">Ver curso</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ============ MÉTODO (assimétrico) ============ */}
      <section className="max-w-[1200px] mx-auto px-5 py-20 grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
        <div className="rv lg:sticky lg:top-28">
          <div className="cy-chip text-cy-500 mb-2.5 flex items-center gap-2"><span className="inline-block w-6 h-px bg-cy-600" /> METODOLOGIA</div>
          <h2 className="display-xl text-[30px] md:text-[40px] text-mist">Não é curso em vídeo.<br /><span className="text-cy-400">É formação com sistema.</span></h2>
          <p className="text-[14px] text-fog mt-4 leading-relaxed max-w-[420px]">
            Cada aluno tem matrícula com número único, histórico acadêmico auditável, notas com peso e um AVA que sabe exatamente onde você parou.
          </p>
          <a href="#/cursos" className="cy-btn cy-btn-g px-5 py-3 text-[12.5px] mt-7 inline-flex">Conhecer as trilhas <I n="arrowR" s={15} /></a>
          <div className="cy-card p-5 mt-8 hidden md:block">
            <div className="flex items-center gap-3 mb-3">
              <QRMatrix code="CA-DEMO-2026" size={72} />
              <div>
                <div className="font-mono text-[11px] text-cy-400 tracking-wider">CA-9F3K-Q2ZB</div>
                <div className="text-[12px] text-fog mt-1">Todo certificado carrega um código validável publicamente — teste no rodapé desta página.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { icon: "term", t: "Matrícula com número único", d: "Cada compra aprovada gera uma matrícula tipo CA2026000001, rastreada do pedido ao certificado — nada de acesso solto por e-mail.", n: "01" },
            { icon: "layers", t: "AVA que registra tudo", d: "Aula iniciada, vídeo assistido, material acessado, atividade entregue: o progresso alimenta módulo, curso e histórico automaticamente.", n: "02" },
            { icon: "target", t: "Avaliações com correção híbrida", d: "Objetivas corrigidas na hora pelo sistema; dissertativas e projetos avaliados individualmente pelo professor, com feedback registrado.", n: "03" },
            { icon: "wallet", t: "Financeiro integrado ao acadêmico", d: "Pedidos, pagamentos e parcelas no mesmo banco da vida acadêmica. Reembolso cancela a matrícula no mesmo ato.", n: "04" },
            { icon: "award", t: "Conclusão auditada, certificado real", d: "O certificado só nasce quando progresso, notas mínimas e projeto aprovado se encontram — e qualquer pessoa pode validá-lo online.", n: "05" },
          ].map((f) => (
            <div key={f.n} className="rv cy-card cy-card-h p-5 flex gap-5 items-start">
              <span className="w-12 h-12 rounded-lg grid place-items-center bg-cy-500/10 border border-cy-700 text-cy-400 shrink-0"><I n={f.icon} s={22} /></span>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-semibold text-[16px] text-mist">{f.t}</h3>
                  <span className="font-mono text-[11px] text-cy-700">/{f.n}</span>
                </div>
                <p className="text-[13.5px] text-fog leading-relaxed mt-1.5">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ NÚMEROS (banco real) ============ */}
      <section className="border-y border-line bg-abyss/60">
        <div className="max-w-[1200px] mx-auto px-5 py-14 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Alunos ativos", v: students, icon: "users" },
            { label: "Cursos publicados", v: courses.length, icon: "layers" },
            { label: "Matrículas emitidas", v: enrollments, icon: "cap" },
            { label: "Certificados gerados", v: certs, icon: "award" },
          ].map((s, i) => (
            <div key={s.label} className={`rv text-center dl-${i}`}>
              <I n={s.icon} s={22} c="text-cy-500 mx-auto" />
              <div className="display-xl text-[38px] text-cy-300 mt-2"><CountUp to={s.v} /></div>
              <div className="cy-chip text-dim mt-1">{s.label}</div>
              <div className="font-mono text-[10px] text-cy-800 mt-1">fonte: SIA · tempo real</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ VALIDADOR + CTA ============ */}
      <section className="max-w-[1200px] mx-auto px-5 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div className="rv">
          <div className="cy-chip text-cy-500 mb-2.5 flex items-center gap-2"><span className="inline-block w-6 h-px bg-cy-600" /> TRANSPARÊNCIA</div>
          <h2 className="display-xl text-[28px] md:text-[36px] text-mist">Valide qualquer certificado<br />agora, sem cadastro.</h2>
          <p className="text-[14px] text-fog mt-3 leading-relaxed max-w-[440px]">
            Empregadores e instituições podem checar a autenticidade consultando o SIA diretamente. Cada validação fica registrada em auditoria.
          </p>
          <div className="flex gap-2.5 mt-6 max-w-[430px]">
            <input className="cy-in font-mono uppercase" placeholder="CA-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setValRes(validateCertificate(code))} />
            <Btn v="e" onClick={() => setValRes(validateCertificate(code))}>Validar</Btn>
          </div>
          {valRes && (
            <div className={`mt-4 cy-card p-4 flex items-center gap-3 anim-fade-up ${valRes.valid ? "border-[#5ECF8B]/40" : "border-coral/40"}`}>
              <I n={valRes.valid ? "checkc" : "alert"} s={22} c={valRes.valid ? "text-[#7BE0A2]" : "text-coral"} />
              {valRes.valid ? (
                <div>
                  <div className="text-[13.5px] font-semibold text-[#7BE0A2]">Certificado autêntico</div>
                  <div className="text-[12.5px] text-fog">{valRes.cert?.studentName} · {valRes.course?.title} · {valRes.cert?.hours}h</div>
                </div>
              ) : (
                <div>
                  <div className="text-[13.5px] font-semibold text-coral">Nenhum certificado encontrado</div>
                  <div className="text-[12.5px] text-fog">O código informado não existe no SIA.</div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="rv cy-card p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-20" style={{ background: "#F5B84B" }} />
          <Tag tone="amber">MATRÍCULAS 2026</Tag>
          <h3 className="display-xl text-[26px] md:text-[32px] text-mist mt-4">Sua matrícula começa<br />com um <span className="text-ember">checkout aprovado.</span></h3>
          <p className="text-[13.5px] text-fog mt-3 leading-relaxed">
            Escolha o curso, pague com Mercado Pago e o SIA faz o resto: matrícula, acesso ao AVA e trilha até o certificado.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <a href="#/cursos" className="cy-btn cy-btn-e px-6 py-3 text-[13px]">Escolher meu curso</a>
            <a href={`#${user ? "/aluno" : "/cadastro"}`} className="cy-btn cy-btn-g px-6 py-3 text-[13px]">{user ? "Ir para o portal" : "Criar conta grátis"}</a>
          </div>
          <img src={IMG.fullstack} alt="" className="hidden" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      </section>
    </div>
  );
}
