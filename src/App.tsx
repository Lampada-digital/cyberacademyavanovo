import React, { useEffect, useState } from "react";
import { AppProvider, useApp, navigate } from "./state";
import { ToastProvider, Btn, Empty } from "./components/ui";
import { I } from "./components/icons";
import { SiteShell } from "./components/layout";
import { all } from "./lib/db";
import Home from "./pages/home";
import { Catalog, CoursePage, About, Teachers, Blog, Faq, Contact, Terms, Privacy, Cookies, ValidateCert } from "./pages/site";
import { Setup, Login, Register, Recover, Checkout } from "./pages/auth";
import StudentArea from "./pages/student";
import TeacherArea from "./pages/teacher";
import AdminArea from "./pages/admin";
import { TicketsConsole } from "./pages/admin2";

function useRoute() {
  const [h, setH] = useState(location.hash || "#/");
  useEffect(() => {
    const f = () => setH(location.hash || "#/");
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const path = h.slice(1) || "/";
  const [p, q] = path.split("?");
  return { path: p, query: new URLSearchParams(q || ""), segs: p.split("/").filter(Boolean) };
}

function Redirect({ to }: { to: string }) {
  useEffect(() => { navigate(to); }, [to]);
  return null;
}

function SupportArea({ path }: { path: string }) {
  const { user } = useApp();
  if (!user) return <Redirect to="/login" />;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 h-[62px] border-b border-line bg-ink/85 backdrop-blur-md flex items-center justify-between px-5">
        <span className="font-display font-semibold text-[14px] tracking-widest uppercase text-cy-300 flex items-center gap-2.5"><I n="msg" s={17} /> Área de Atendimento</span>
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-fog hidden sm:block">{user.name}</span>
          <a href="#/" className="cy-btn cy-btn-x px-3 py-2 text-[12px]">Site</a>
        </div>
      </header>
      <main className="p-5 md:p-7 max-w-[1100px]"><TicketsConsole /></main>
    </div>
  );
}

function Router() {
  const { path, query, segs } = useRoute();
  const { user } = useApp();
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  const s0 = segs[0] || "";

  // setup inicial obrigatório quando o banco está vazio
  const needsSetup = all("users").length === 0;
  if (s0 === "setup") return needsSetup ? <Setup /> : <Redirect to="/login" />;
  if (needsSetup && !["", "termos", "privacidade", "cookies", "validar-certificado", "cursos", "sobre", "faq", "contato", "blog", "professores", "login", "cadastro", "recuperar"].includes(s0)) {
    return <Redirect to="/setup" />;
  }

  // guards por papel (RBAC)
  const guard = (role: string) => {
    if (!user) return <Redirect to={`/login?next=${encodeURIComponent(path)}`} />;
    if (role === "teacher" && user.role !== "teacher" && user.role !== "admin") return <Redirect to={user.role === "admin" ? "/admin" : "/aluno"} />;
    if (role === "admin" && user.role !== "admin") return <Redirect to="/aluno" />;
    if (role === "support" && user.role !== "support" && user.role !== "admin") return <Redirect to="/aluno" />;
    return null;
  };

  let page: React.ReactNode;
  switch (s0) {
    case "": page = <Home />; break;
    case "cursos": page = segs[1] ? <CoursePage slug={segs[1]} /> : <Catalog />; break;
    case "sobre": page = <About />; break;
    case "professores": page = <Teachers />; break;
    case "blog": page = <Blog />; break;
    case "faq": page = <Faq />; break;
    case "contato": page = <Contact />; break;
    case "termos": page = <Terms />; break;
    case "privacidade": page = <Privacy />; break;
    case "cookies": page = <Cookies />; break;
    case "validar-certificado": page = <ValidateCert code={segs[1]} />; break;
    case "login": page = user ? <Redirect to={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/professor" : user.role === "support" ? "/suporte" : "/aluno"} /> : <Login next={query.get("next") || undefined} />; break;
    case "cadastro": page = user ? <Redirect to="/aluno" /> : <Register next={query.get("next") || undefined} />; break;
    case "recuperar": page = <Recover />; break;
    case "checkout": {
      const g = guard("student");
      page = g || <Checkout courseId={segs[1] || ""} />;
      break;
    }
    case "aluno": case "ava": {
      if (!user) { page = <Redirect to={`/login?next=${encodeURIComponent(path)}`} />; break; }
      if (user.role !== "student" && user.role !== "admin") { page = <Redirect to={user.role === "admin" ? "/admin" : "/professor"} />; break; }
      page = <StudentArea path={path} segs={segs} />;
      break;
    }
    case "professor": { const g = guard("teacher"); page = g || <TeacherArea path={path} segs={segs} />; break; }
    case "admin": { const g = guard("admin"); page = g || <AdminArea path={path} segs={segs} />; break; }
    case "suporte": { const g = guard("support"); page = g || <SupportArea path={path} />; break; }
    default:
      page = (
        <div className="max-w-[700px] mx-auto px-5 py-24">
          <Empty icon="search" title="Página não encontrada" desc={`A rota "${path}" não existe no ecossistema.`}>
            <a href="#/" className="cy-btn cy-btn-p px-5 py-2.5 text-[12.5px]">Voltar ao início</a>
          </Empty>
        </div>
      );
  }

  // páginas sem o shell do site
  const bare = ["aluno", "ava", "professor", "admin", "suporte", "login", "cadastro", "recuperar", "setup", "checkout"].includes(s0);
  return (
    <>
      <div className="cy-bg" /><div className="cy-grid" /><div className="cy-scan" />
      {bare ? page : <SiteShell path={path}>{page}</SiteShell>}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </AppProvider>
  );
}
