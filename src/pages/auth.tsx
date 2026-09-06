import React, { useEffect, useRef, useState } from "react";
import { I, Logo } from "../components/icons";
import { Btn, Card, Field, TIn, CoverImg, useToast, Badge } from "../components/ui";
import { QRMatrix } from "../components/fx";
import { useApp, navigate } from "../state";
import {
  login, register, setupAdmin, createOrder, createGatewayPayment, handleWebhook,
  courseById, effectivePrice, requestReset, doReset, one, myEnrollments,
  fmtBRL, type Row,
} from "../lib/api";

/* ================= SETUP INICIAL ================= */
export function Setup() {
  const toast = useToast();
  const { setUser } = useApp();
  const [f, setF] = useState({ school: "Cyber Academy", name: "", email: "", pass: "" });
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!f.name || !f.email.includes("@") || f.pass.length < 6) { toast("Preencha todos os campos (senha 6+).", "err"); return; }
    setBusy(true);
    try {
      const u = await setupAdmin(f);
      const s = await login(f.email, f.pass);
      setUser(s);
      toast("SIA configurado. Bem-vindo(a), administrador(a)!", "ok");
      navigate("/admin");
    } catch (e: any) { toast(e.message, "err"); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-[520px] anim-fade-up">
        <div className="flex justify-center mb-8"><Logo s={44} /></div>
        <Card className="p-7 md:p-9">
          <div className="cy-chip text-ember mb-2 flex items-center gap-2"><I n="alert" s={13} /> PRIMEIRO ACESSO</div>
          <h1 className="display-xl text-[24px] text-mist">Configuração inicial do SIA</h1>
          <p className="text-[13px] text-fog mt-2 leading-relaxed">A produção inicia sem dados comerciais. Crie o usuário administrador raiz para começar a cadastrar professores, cursos e turmas.</p>
          <div className="space-y-4 mt-6">
            <Field label="Nome da instituição" req><TIn value={f.school} onChange={(e) => setF({ ...f, school: e.target.value })} /></Field>
            <Field label="Nome do administrador" req><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Maria Souza" /></Field>
            <Field label="E-mail" req><TIn type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="admin@cyberacademy.com.br" /></Field>
            <Field label="Senha" req hint="Mínimo 6 caracteres · armazenada com hash SHA-256"><TIn type="password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} /></Field>
            <Btn v="e" className="w-full py-3" disabled={busy} onClick={go}>{busy ? "Configurando…" : "Inicializar sistema"}</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= LOGIN ================= */
export function Login({ next }: { next?: string }) {
  const toast = useToast();
  const { setUser } = useApp();
  const [f, setF] = useState({ email: "", pass: "" });
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const u = await login(f.email, f.pass);
      setUser(u);
      toast(`Sessão iniciada. Bem-vindo(a), ${u.name.split(" ")[0]}!`, "ok");
      const home = u.role === "admin" ? "/admin" : u.role === "teacher" ? "/professor" : u.role === "support" ? "/suporte" : "/aluno";
      navigate(next || home);
    } catch (e: any) { toast(e.message, "err"); }
    setBusy(false);
  };
  return (
    <AuthWrap title="Acessar o ecossistema" sub="Portal do Aluno, Área do Professor e Painel Administrativo — o SIA identifica seu perfil automaticamente.">
      <div className="space-y-4">
        <Field label="E-mail" req><TIn type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="voce@email.com" onKeyDown={(e) => e.key === "Enter" && go()} /></Field>
        <Field label="Senha" req><TIn type="password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} onKeyDown={(e) => e.key === "Enter" && go()} /></Field>
        <Btn v="p" className="w-full py-3" disabled={busy} onClick={go}>{busy ? "Autenticando…" : "Entrar"}</Btn>
        <div className="flex justify-between text-[12px]">
          <a href={`#/recuperar${next ? `?next=${next}` : ""}`} className="text-fog hover:text-cy-300">Esqueci a senha</a>
          <a href={`#/cadastro${next ? `?next=${next}` : ""}`} className="text-cy-300 hover:underline font-semibold">Criar conta de aluno</a>
        </div>
      </div>
      <div className="mt-6 pt-5 border-t border-line">
        <p className="font-mono text-[10.5px] text-dim leading-relaxed">
          Autenticação JWT + refresh token · senhas com hash · proteção anti brute-force (bloqueio após 5 tentativas).
        </p>
      </div>
    </AuthWrap>
  );
}

/* ================= CADASTRO ================= */
export function Register({ next }: { next?: string }) {
  const toast = useToast();
  const { setUser } = useApp();
  const [f, setF] = useState({ name: "", email: "", cpf: "", phone: "", pass: "", pass2: "", acceptTerms: false, acceptPrivacy: false, news: false });
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (f.pass !== f.pass2) { toast("As senhas não conferem.", "err"); return; }
    setBusy(true);
    try {
      await register(f);
      const u = await login(f.email, f.pass);
      setUser(u);
      toast("Conta criada! E-mail de confirmação enviado.", "ok");
      navigate(next || "/aluno");
    } catch (e: any) { toast(e.message, "err"); }
    setBusy(false);
  };
  return (
    <AuthWrap title="Criar conta de aluno" sub="Sua conta no SIA nasce aqui — é com ela que você acompanha matrículas, notas e certificados.">
      <div className="space-y-4">
        <Field label="Nome completo" req><TIn value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Seu nome" /></Field>
        <Field label="E-mail" req><TIn type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="voce@email.com" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CPF"><TIn value={f.cpf} onChange={(e) => setF({ ...f, cpf: e.target.value })} placeholder="000.000.000-00" /></Field>
          <Field label="Telefone"><TIn value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="(11) 9…" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Senha" req><TIn type="password" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} /></Field>
          <Field label="Confirmar senha" req><TIn type="password" value={f.pass2} onChange={(e) => setF({ ...f, pass2: e.target.value })} /></Field>
        </div>
        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-2.5 text-[12.5px] text-fog cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-[#03A6A6]" checked={f.acceptTerms} onChange={(e) => setF({ ...f, acceptTerms: e.target.checked })} />
            <span>Li e aceito os <a href="#/termos" className="text-cy-300 underline">Termos de Uso</a> <span className="text-dim">(registro de aceite LGPD)</span></span>
          </label>
          <label className="flex items-start gap-2.5 text-[12.5px] text-fog cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-[#03A6A6]" checked={f.acceptPrivacy} onChange={(e) => setF({ ...f, acceptPrivacy: e.target.checked })} />
            <span>Li e aceito a <a href="#/privacidade" className="text-cy-300 underline">Política de Privacidade</a></span>
          </label>
          <label className="flex items-start gap-2.5 text-[12.5px] text-fog cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-[#03A6A6]" checked={f.news} onChange={(e) => setF({ ...f, news: e.target.checked })} />
            <span>Quero receber novidades e ofertas por e-mail <span className="text-dim">(consentimento opcional)</span></span>
          </label>
        </div>
        <Btn v="e" className="w-full py-3" disabled={busy} onClick={go}>{busy ? "Criando conta…" : "Criar minha conta"}</Btn>
        <p className="text-center text-[12px] text-fog">Já tem conta? <a href={`#/login${next ? `?next=${next}` : ""}`} className="text-cy-300 font-semibold hover:underline">Entrar</a></p>
      </div>
    </AuthWrap>
  );
}

/* ================= RECUPERAR SENHA ================= */
export function Recover() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const sentCode = () => {
    const u = one("users", (x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return "";
    const resets = (window as any).__r; void resets;
    return "";
  };
  void sentCode;
  const req = () => {
    if (!requestReset(email)) { toast("E-mail não encontrado.", "err"); return; }
    setStep(2);
    toast("Código de recuperação enviado por e-mail.", "ok");
  };
  const finish = async () => {
    try { await doReset(email, code, pass); toast("Senha redefinida! Faça login.", "ok"); navigate("/login"); }
    catch (e: any) { toast(e.message, "err"); }
  };
  return (
    <AuthWrap title="Recuperar acesso" sub="Enviaremos um código de verificação para o seu e-mail (simulação de SMTP — o código fica registrado na caixa de saída do SIA).">
      {step === 1 ? (
        <div className="space-y-4">
          <Field label="E-mail da conta" req><TIn type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></Field>
          <Btn v="p" className="w-full py-3" onClick={req}>Enviar código</Btn>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="cy-card p-3.5 border-cy-700 text-[12.5px] text-fog flex items-center gap-3">
            <I n="mail" s={18} c="text-cy-400" /> E-mail enviado. Em produção o código chega por SMTP; nesta build ele fica na tabela <span className="font-mono text-cy-300">emails</span> do SIA (admin → Configurações → Caixa de saída).
          </div>
          <Field label="Código de 6 dígitos" req><TIn value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" /></Field>
          <Field label="Nova senha" req><TIn type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></Field>
          <Btn v="e" className="w-full py-3" onClick={finish}>Redefinir senha</Btn>
        </div>
      )}
    </AuthWrap>
  );
}

function AuthWrap({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-5 py-16">
      <div className="w-full max-w-[480px] anim-fade-up">
        <div className="flex justify-center mb-8"><Logo s={40} /></div>
        <Card className="p-7 md:p-8">
          <h1 className="display-xl text-[22px] text-mist">{title}</h1>
          <p className="text-[12.5px] text-fog mt-1.5 leading-relaxed">{sub}</p>
          <div className="mt-6">{children}</div>
        </Card>
      </div>
    </div>
  );
}

/* ================= CHECKOUT + MERCADO PAGO ================= */
type Step = "resumo" | "pagamento" | "processando" | "sucesso" | "erro";
export function Checkout({ courseId }: { courseId: string }) {
  const { user, refresh } = useApp();
  const toast = useToast();
  const course = courseById(courseId);
  const [step, setStep] = useState<Step>("resumo");
  const [inst, setInst] = useState(1);
  const [method, setMethod] = useState<"card" | "pix">("card");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [order, setOrder] = useState<Row | null>(null);
  const [pay, setPay] = useState<Row | null>(null);
  const [pipe, setPipe] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; message: string; enrollment?: Row } | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!user) return null;
  if (!course || !course.published) {
    return <div className="max-w-[700px] mx-auto px-5 py-24 text-center"><h1 className="display-xl text-[24px] text-mist">Curso indisponível</h1><p className="text-fog mt-2 text-[13.5px]">Este curso não está publicado no catálogo.</p><a href="#/cursos" className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px] mt-5 inline-flex">Ver catálogo</a></div>;
  }
  const existing = myEnrollments(user.id).find((e) => e.courseId === course.id && ["ACTIVE", "COMPLETED", "PENDING"].includes(e.status));
  if (existing) {
    return <div className="max-w-[700px] mx-auto px-5 py-24 text-center anim-fade-up">
      <div className="w-16 h-16 mx-auto rounded-full bg-cy-500/10 border border-cy-500 grid place-items-center text-cy-300"><I n="checkc" s={30} /></div>
      <h1 className="display-xl text-[24px] text-mist mt-5">Você já possui esta matrícula</h1>
      <p className="text-fog mt-2 text-[13.5px]">A matrícula <span className="font-mono text-cy-300">{existing.number}</span> de <strong className="text-mist">{course.title}</strong> está {existing.status === "COMPLETED" ? "concluída" : "ativa"} — o SIA impede a duplicidade de acesso.</p>
      <div className="flex gap-3 justify-center mt-6">
        <a href={`#/aluno/avacurso/${course.id}`} className="cy-btn cy-btn-e px-6 py-3 text-[13px]"><I n="playc" s={16} /> Ir para o AVA</a>
        <a href="#/cursos" className="cy-btn cy-btn-g px-5 py-3 text-[13px]">Ver outros cursos</a>
      </div>
    </div>;
  }
  const price = effectivePrice(course);
  const already = (window as any).__enr; void already;

  const startPayment = () => {
    const o = createOrder(user, course, inst);
    const p = createGatewayPayment(o, method);
    setOrder(o); setPay(p);
    setStep("processando"); setPipe(0);
    const steps = [
      ["Pedido criado no SIA", 500],
      ["Checkout Pro inicializado · preferência enviada ao Mercado Pago", 1300],
      ["Pagamento autorizado pelo comprador", 2400],
      ["Webhook recebido · POST /api/payments/mercadopago/webhook", 3300],
      ["Assinatura validada · consultando pagamento no MP…", 4100],
    ] as [string, number][];
    steps.forEach(([, t], i) => timers.current.push(window.setTimeout(() => setPipe(i + 1), t)));
    timers.current.push(window.setTimeout(() => {
      const res = handleWebhook({ type: "payment", paymentId: p.mpPaymentId, status: method === "pix" ? "approved" : card.number.replace(/\s/g, "").endsWith("0002") ? "rejected" : "approved", x_signature: "ts=1718·v1=a94b…f31d" });
      setResult(res);
      setStep(res.ok ? "sucesso" : "erro");
      refresh();
    }, 5300));
  };

  const steps = ["Pedido criado no SIA", "Checkout Pro · preferência enviada ao MP", "Pagamento autorizado", "Webhook recebido (assinatura validada)", "Consulta ao Mercado Pago", "Matrícula criada · acesso liberado"];

  return (
    <div className="min-h-screen px-5 py-14">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <a href={`#/cursos/${course.slug}`} className="text-fog hover:text-cy-300"><I n="chevL" s={20} /></a>
          <div>
            <div className="cy-chip text-cy-500">CHECKOUT SEGURO</div>
            <h1 className="display-xl text-[24px] md:text-[30px] text-mist mt-1">{step === "resumo" ? "Confirmar compra" : step === "pagamento" ? "Mercado Pago · Checkout Pro" : step === "processando" ? "Processando pagamento" : step === "sucesso" ? "Tudo certo!" : "Pagamento não aprovado"}</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
          <div>
            {/* RESUMO */}
            {step === "resumo" && (
              <Card className="p-6 md:p-7 anim-fade-up">
                <div className="font-mono text-[11px] tracking-[.16em] uppercase text-fog mb-4">1 · Confirmação dos dados</div>
                <div className="flex items-center gap-3 text-[13.5px] text-fog mb-6">
                  <I n="user" s={16} c="text-cy-400" /> {user.name} · {user.email}
                </div>
                <Field label="Parcelamento">
                  <div className="grid sm:grid-cols-3 gap-2.5">
                    {Array.from({ length: course.installments || 1 }, (_, i) => i + 1).map((n) => (
                      <button key={n} onClick={() => setInst(n)}
                        className={`cy-card p-3.5 text-left transition-all ${inst === n ? "border-ember/70 shadow-[0_0_0_1px_rgba(245,184,75,.4)]" : "hover:border-cy-600"}`}>
                        <div className="font-display font-semibold text-[13.5px] text-mist">{n}x de {fmtBRL(price / n)}</div>
                        <div className="font-mono text-[10.5px] text-dim mt-0.5">{n === 1 ? "à vista · Pix ou cartão" : "sem juros"}</div>
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="mt-6 flex items-start gap-3 text-[12.5px] text-fog cy-card p-4 border-cy-700">
                  <I n="shield" s={17} c="text-cy-400 shrink-0 mt-0.5" />
                  Após a aprovação, o webhook do Mercado Pago cria sua matrícula automaticamente no SIA e libera o AVA. Garantia de 7 dias.
                </div>
                <Btn v="e" className="w-full py-3.5 mt-6 text-[14px]" onClick={() => setStep("pagamento")}>
                  Pagar com Mercado Pago <I n="arrowR" s={16} />
                </Btn>
              </Card>
            )}

            {/* PAGAMENTO (sandbox Checkout Pro) */}
            {step === "pagamento" && (
              <Card className="overflow-hidden anim-fade-up">
                <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#0A2B3D" }}>
                  <span className="font-display font-bold text-[15px] text-[#BFE7F8]">mercado<span className="text-[#7AD4F7]">pago</span> <span className="font-mono text-[10px] ml-2 text-[#5E93AC] uppercase tracking-widest">sandbox · checkout pro</span></span>
                  <I n="lock" s={16} c="text-[#7AD4F7]" />
                </div>
                <div className="p-6">
                  <div className="flex gap-2 mb-6">
                    <button onClick={() => setMethod("card")} className={`cy-btn px-4 py-2.5 text-[12.5px] ${method === "card" ? "cy-btn-p" : "cy-btn-g"}`}><I n="card" s={15} /> Cartão</button>
                    <button onClick={() => setMethod("pix")} className={`cy-btn px-4 py-2.5 text-[12.5px] ${method === "pix" ? "cy-btn-p" : "cy-btn-g"}`}><I n="pix" s={15} /> Pix</button>
                  </div>
                  {method === "card" ? (
                    <div className="space-y-4">
                      <Field label="Número do cartão" req hint="Sandbox: qualquer número é aprovado · final 0002 simula recusa">
                        <TIn value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="4242 4242 4242 4242" />
                      </Field>
                      <Field label="Nome impresso" req><TIn value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="COMO NO CARTÃO" /></Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Validade" req><TIn value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="12/28" /></Field>
                        <Field label="CVV" req><TIn value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="123" /></Field>
                      </div>
                      <Btn v="p" className="w-full py-3.5 text-[14px]" onClick={() => {
                        if (card.number.replace(/\s/g, "").length < 12 || !card.name) { toast("Preencha os dados do cartão.", "err"); return; }
                        startPayment();
                      }}>Pagar {fmtBRL(price)} {inst > 1 ? `em ${inst}x` : ""}</Btn>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <QRMatrix code={`PIX-${order?.id || "pref"}-${course.id}`} size={168} />
                      <p className="text-[13px] text-fog mt-4">Escaneie com o app do seu banco ou</p>
                      <Btn v="p" className="mt-4 px-6 py-3" onClick={startPayment}><I n="pix" s={15} /> Simular confirmação do Pix</Btn>
                      <p className="font-mono text-[10.5px] text-dim mt-3">O QR real é gerado pela API do Mercado Pago (credenciais no backend).</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* PROCESSANDO */}
            {step === "processando" && (
              <Card className="p-6 md:p-8 anim-fade-up">
                <div className="font-mono text-[11px] tracking-[.16em] uppercase text-fog mb-6 flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-cy-500 border-t-transparent rounded-full spin-slow" style={{ animationDuration: "1s" }} />
                  PIPELINE WEBHOOK → SIA
                </div>
                <div className="space-y-3.5">
                  {steps.map((s, i) => {
                    const done = i < pipe;
                    const active = i === pipe;
                    return (
                      <div key={s} className={`flex items-center gap-3.5 text-[13.5px] transition-all duration-300 ${done ? "text-cy-300" : active ? "text-mist" : "text-dim"}`}>
                        <span className={`w-6 h-6 rounded-full grid place-items-center border shrink-0 transition-all ${done ? "border-cy-500 bg-cy-500/15 anim-tick" : active ? "border-ember text-ember" : "border-line"}`}>
                          {done ? <I n="check" s={13} /> : active ? <span className="w-2 h-2 rounded-full bg-ember animate-pulse" /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                        </span>
                        {s}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* SUCESSO */}
            {step === "sucesso" && result?.enrollment && (
              <Card className="p-7 md:p-9 text-center anim-fade-up border-[#5ECF8B]/40">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#5ECF8B]/10 border border-[#5ECF8B]/50 grid place-items-center text-[#7BE0A2] anim-tick"><I n="check" s={30} /></div>
                <h2 className="display-xl text-[26px] text-mist mt-5">Curso liberado!</h2>
                <p className="text-[13.5px] text-fog mt-2">O webhook confirmou o pagamento e o SIA criou sua matrícula automaticamente.</p>
                <div className="cy-card p-5 mt-6 text-left max-w-[420px] mx-auto space-y-2.5">
                  <div className="flex justify-between text-[13px]"><span className="text-fog">Matrícula</span><span className="font-mono text-cy-300">{result.enrollment.number}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-fog">Curso</span><span className="text-mist font-semibold text-right">{course.title}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-fog">Pedido</span><span className="font-mono text-fog">{order?.number}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-fog">Situação</span><Badge s="ACTIVE" /></div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-7">
                  <a href="#/aluno" className="cy-btn cy-btn-e px-6 py-3 text-[13px]"><I n="term" s={16} /> Ir para o Portal do Aluno</a>
                  <a href={`#/aluno/ava/${course.id}`} className="cy-btn cy-btn-g px-6 py-3 text-[13px]"><I n="playc" s={16} /> Começar a estudar</a>
                </div>
              </Card>
            )}

            {/* ERRO */}
            {step === "erro" && (
              <Card className="p-7 md:p-9 text-center anim-fade-up border-coral/40">
                <div className="w-16 h-16 mx-auto rounded-full bg-coral/10 border border-coral/50 grid place-items-center text-coral anim-tick"><I n="alert" s={28} /></div>
                <h2 className="display-xl text-[24px] text-mist mt-5">{result?.message || "Pagamento não aprovado"}</h2>
                <p className="text-[13.5px] text-fog mt-2 max-w-[420px] mx-auto">Nenhuma matrícula foi criada — o curso só é liberado por webhook confirmado, nunca pelo retorno do checkout. Nenhum valor foi capturado.</p>
                <div className="flex gap-3 justify-center mt-6">
                  <Btn v="e" onClick={() => { setStep("pagamento"); setResult(null); }}>Tentar novamente</Btn>
                  <a href="#/cursos" className="cy-btn cy-btn-x px-5 py-2.5 text-[12.5px]">Voltar ao catálogo</a>
                </div>
              </Card>
            )}
          </div>

          {/* RESUMO LATERAL */}
          <Card className="p-5 lg:sticky lg:top-24">
            <div className="h-[120px] rounded-lg overflow-hidden mb-4"><CoverImg src={course.image} title={course.title} className="h-full" /></div>
            <h3 className="font-display font-semibold text-[14.5px] text-mist leading-snug">{course.title}</h3>
            <div className="flex gap-3 mt-2 font-mono text-[10.5px] text-dim"><span>{course.hours}h</span><span>·</span><span>{course.level}</span><span>·</span><span>acesso 24 meses</span></div>
            <div className="border-t border-line mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-[13px]"><span className="text-fog">Valor</span><span className="font-mono text-mist tnum">{fmtBRL(price)}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-fog">Parcelas</span><span className="font-mono text-mist">{inst}x de {fmtBRL(price / inst)}</span></div>
              <div className="flex justify-between text-[14px] pt-2 border-t border-line"><span className="text-mist font-semibold">Total</span><span className="font-display font-bold text-ember tnum">{fmtBRL(price)}</span></div>
            </div>
            <div className="flex items-center gap-2 mt-4 font-mono text-[10.5px] text-dim"><I n="lock" s={12} c="text-cy-500" /> Credenciais MP somente no backend (env)</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
