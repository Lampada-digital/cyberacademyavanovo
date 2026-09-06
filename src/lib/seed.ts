/* ============================================================
   SEED DE DEMONSTRAÇÃO — somente para ambiente dev/testes.
   Produção inicia vazia: nada aqui roda automaticamente.
   ============================================================ */
import { all, insert, audit, hashPw, now, uid } from "./db";

export const IMG = {
  fullstack: "https://image.qwenlm.ai/generated-images/88ec0a0e-59d3-45d3-99bd-d1796be9ec1a/_result.png",
  security: "https://image.qwenlm.ai/generated-images/17b5adef-9efb-4712-8dc5-1bc4409aa22a/_result.png",
  data: "https://image.qwenlm.ai/generated-images/2cd6e9ec-0b15-43c1-9d2e-a9c246067e60/_result.png",
};

const APOSTILA = "data:text/plain;charset=utf-8;base64," + btoa(unescape(encodeURIComponent("Cyber Academy — Material de apoio (demonstracao). Conteudo complementar da aula.")));

export function hasData(): boolean { return all("users").length > 0 || all("courses").length > 0; }

export async function seedDemo(): Promise<{ admin: string; teacher: string; student?: string }> {
  const creds = { admin: "admin@cyber.dev", teacher: "professor@cyber.dev" };

  /* ---------- usuários base ---------- */
  let admin = all("users").find((u) => u.role === "admin");
  if (!admin) {
    admin = insert("users", { name: "Administradora SIA", email: creds.admin, passHash: await hashPw("Cyber@2026"), role: "admin", status: "active" });
  }
  let profUser = all("users").find((u) => u.email === creds.teacher);
  if (!profUser) profUser = insert("users", { name: "Rafael Monteiro", email: creds.teacher, passHash: await hashPw("Cyber@2026"), role: "teacher", status: "active" });
  const profUser2 = insert("users", { name: "Ana Duarte", email: "ana@cyber.dev", passHash: await hashPw("Cyber@2026"), role: "teacher", status: "active" });

  const t1 = insert("teachers", { userId: profUser.id, name: "Rafael Monteiro", email: creds.teacher, phone: "(11) 98888-1020", cpf: "214.556.878-90", bio: "Engenheiro de software com 12 anos de experiência em produto. Ex-líder técnico em fintechs, especialista em arquitetura full-stack e segurança aplicada.", specialty: "Engenharia de Software", status: "active", courseIds: [] });
  const t2 = insert("teachers", { userId: profUser2.id, name: "Ana Duarte", email: "ana@cyber.dev", phone: "(11) 97777-3040", cpf: "388.201.456-11", bio: "Especialista em segurança ofensiva, OSCP. Liderou times de red team e resposta a incidentes em grandes operações digitais.", specialty: "Cibersegurança", status: "active", courseIds: [] });
  const t3 = insert("teachers", { userId: profUser2.id, name: "Ana Duarte", email: "ana@cyber.dev", phone: "(11) 97777-3040", cpf: "388.201.456-11", bio: "Cientista de dados com passagem por times de ML em varejo e crédito. Foco em engenharia de dados e modelos em produção.", specialty: "Dados & IA", status: "active", courseIds: [] });

  insert("course_categories", { id: "cat-dev", name: "Desenvolvimento", order: 1 });
  insert("course_categories", { id: "cat-sec", name: "Cibersegurança", order: 2 });
  insert("course_categories", { id: "cat-data", name: "Dados & IA", order: 3 });

  const mk = (o: any) => o;

  /* ---------------- CURSO 1 — FULL-STACK ---------------- */
  const c1 = insert("courses", mk({
    slug: "desenvolvimento-fullstack-react-node", title: "Desenvolvimento Full-Stack com React & Node",
    subtitle: "Do zero ao deploy: construa aplicações completas com as stacks mais requisitadas do mercado.",
    image: IMG.fullstack, categoryId: "cat-dev", teacherId: t1.id, hours: 120, level: "Intermediário",
    description: "Um programa intensivo e orientado a projetos para formar desenvolvedores capazes de construir, testar e publicar aplicações web completas. Você evolui da base de JavaScript moderno até uma aplicação full-stack com autenticação, banco de dados, API REST e deploy em nuvem — com code review em cada entrega.",
    objectives: ["Dominar JavaScript moderno, TypeScript, React e Node.js", "Projetar e consumir APIs REST com segurança", "Modelar bancos relacionais e escrever SQL eficiente", "Implementar autenticação JWT e boas práticas de segurança", "Publicar aplicações com CI/CD e monitoramento"],
    audience: ["Quem já programa o básico e quer virar full-stack", "Estudantes de TI buscando portfólio real", "Profissionais migrando de área para tecnologia"],
    prerequisites: ["Lógica de programação", "HTML e CSS básicos", "Computador com 8GB de RAM"],
    benefits: ["9 projetos práticos para portfólio", "Code review individual nas entregas", "Comunidade privada de alunos", "Certificado verificável com QR Code", "Acesso por 24 meses"],
    methodology: "Ciclo aprender → construir → revisar: videoaulas objetivas, laboratórios guiados, atividades com correção automática e projeto final avaliado individualmente por um professor.",
    finalProject: "Aplicação SaaS completa: front-end React, API Node com autenticação, banco PostgreSQL e deploy — apresentada em banca ao vivo.",
    certificateText: "concluiu o programa de formação em Desenvolvimento Full-Stack",
    price: 899, promoPrice: 599, promoActive: true, installments: 6, published: true,
  }));
  const c1m1 = insert("course_modules", { courseId: c1.id, title: "Fundamentos da Web Moderna", description: "Base sólida: JavaScript ES2024, tooling e fluxo de trabalho profissional.", order: 1 });
  const c1m2 = insert("course_modules", { courseId: c1.id, title: "React & Interfaces Profissionais", description: "Componentização, estado, rotas e performance no front-end.", order: 2 });
  const c1m3 = insert("course_modules", { courseId: c1.id, title: "Node, APIs e Deploy", description: "Back-end, banco de dados, autenticação e publicação em nuvem.", order: 3 });
  const L = (moduleId: string, courseId: string, title: string, order: number, dur: number, desc: string) =>
    insert("lessons", { moduleId, courseId, title, order, durationMin: dur, description: desc, videoType: "simulated", videoUrl: "", published: true });
  const c1l = [
    L(c1m1.id, c1.id, "Ambiente profissional & Git Flow", 1, 24, "Configuração do ambiente, VS Code, ESLint, Prettier e fluxo de branches como em times reais."),
    L(c1m1.id, c1.id, "JavaScript ES2024 na prática", 2, 38, "Destructuring, módulos, async/await, iterators e os recursos que o mercado cobra em entrevista."),
    L(c1m1.id, c1.id, "TypeScript sem mistério", 3, 32, "Tipagem progressiva, generics e utilitários para escrever código seguro e produtivo."),
    L(c1m2.id, c1.id, "React: componente é contrato", 4, 41, "Props, estado, composição e o modelo mental que separa júnior de pleno."),
    L(c1m2.id, c1.id, "Estado global e dados remotos", 5, 36, "Context, reducers e cache de API com invalidação inteligente."),
    L(c1m2.id, c1.id, "Roteamento e performance", 6, 30, "Code-splitting, lazy loading, memoização e Core Web Vitals."),
    L(c1m3.id, c1.id, "Node.js e arquitetura de APIs", 7, 44, "REST bem desenhada, middlewares, validação com schemas e tratamento de erros."),
    L(c1m3.id, c1.id, "PostgreSQL e modelagem de dados", 8, 39, "Modelagem relacional, migrations, índices e consultas que escalam."),
    L(c1m3.id, c1.id, "Autenticação JWT & deploy", 9, 35, "JWT com refresh token, RBAC, variáveis de ambiente e CI/CD até produção."),
  ];
  c1l.forEach((l, i) => {
    insert("lesson_materials", { lessonId: l.id, courseId: c1.id, name: `Apostila da aula ${i + 1}.txt`, kind: "arquivo", fileType: "TXT", dataUrl: APOSTILA, size: "2 KB", access: "enrolled" });
  });
  insert("lesson_materials", { lessonId: c1l[3].id, courseId: c1.id, name: "Guia oficial do React", kind: "link", url: "https://react.dev", fileType: "LINK", access: "public" });
  insert("lesson_materials", { lessonId: c1l[7].id, courseId: c1.id, name: "Documentação PostgreSQL", kind: "link", url: "https://www.postgresql.org/docs/", fileType: "LINK", access: "public" });

  insert("activities", {
    courseId: c1.id, moduleId: c1m1.id, title: "Quiz — Fundamentos da Web", kind: "questionario",
    description: "Verificação rápida dos conceitos de JavaScript moderno e fluxo de trabalho.",
    dueDate: "", maxScore: 4, weight: 1, passScore: 50, attempts: 3, published: true,
    questions: [
      { qid: "a1q1", type: "single", prompt: "Qual palavra-chave declara uma variável de escopo de bloco que pode ser reatribuída?", options: ["var", "let", "const", "static"], correct: 1, explanation: "let tem escopo de bloco e permite reatribuição.", points: 1, difficulty: "fácil", topic: "JavaScript" },
      { qid: "a1q2", type: "tf", prompt: "async/await elimina a necessidade de Promises no JavaScript.", options: ["Verdadeiro", "Falso"], correct: 1, explanation: "async/await é açúcar sintático sobre Promises.", points: 1, difficulty: "fácil", topic: "JavaScript" },
      { qid: "a1q3", type: "single", prompt: "Em Git, qual comando cria E troca para uma nova branch?", options: ["git branch nova", "git checkout -b nova", "git switch nova --new", "git merge nova"], correct: 1, explanation: "git checkout -b (ou git switch -c) cria e faz o checkout.", points: 1, difficulty: "médio", topic: "Git" },
      { qid: "a1q4", type: "multi", prompt: "Quais são princípios de um commit bem escrito? (marque todas)", options: ["Mensagem imperativa e curta", "Agrupar mudanças não relacionadas", "Referenciar issue quando existir", "Commits atômicos"], correct: [0, 2, 3], explanation: "Commits atômicos, mensagem imperativa e referência a issues.", points: 1, difficulty: "médio", topic: "Git" },
    ],
  });

  const av1 = insert("assessments", {
    courseId: c1.id, title: "Prova Final — Full-Stack", type: "prova", durationMin: 60, passScore: 70,
    maxScore: 10, weight: 2, attempts: 2, published: true,
    description: "Avaliação conclusiva do programa. Objetivas com correção automática e dissertativa corrigida pelo professor.",
    questions: [
      { qid: "p1", type: "single", prompt: "Em uma API REST, qual método é idempotente por definição?", options: ["POST", "PUT", "PATCH apenas", "Nenhum"], correct: 1, explanation: "PUT é idempotente: repetições produzem o mesmo resultado.", points: 2, difficulty: "médio", topic: "APIs" },
      { qid: "p2", type: "single", prompt: "Qual o papel do refresh token em uma autenticação JWT?", options: ["Substituir a senha", "Renovar o access token sem reautenticar", "Criptografar o payload", "Validar CORS"], correct: 1, explanation: "O refresh token permite emitir novos access tokens com sessão válida.", points: 2, difficulty: "médio", topic: "Segurança" },
      { qid: "p3", type: "tf", prompt: "Índices em banco de dados aceleram leituras e nunca impactam escritas.", options: ["Verdadeiro", "Falso"], correct: 1, explanation: "Índices têm custo de manutenção em INSERT/UPDATE.", points: 2, difficulty: "fácil", topic: "Banco de dados" },
      { qid: "p4", type: "multi", prompt: "Quais práticas reduzem risco de XSS? (marque todas)", options: ["Escapar output", "Content-Security-Policy", "Guardar senha em texto claro", "Sanitizar HTML do usuário"], correct: [0, 1, 3], explanation: "Escape de output, CSP e sanitização mitigam XSS.", points: 2, difficulty: "difícil", topic: "Segurança" },
      { qid: "p5", type: "essay", prompt: "Descreva como você estruturaria a autenticação de uma API (endpoints, tokens, expiração) e quais erros evitar.", options: [], correct: null, explanation: "", points: 2, difficulty: "difícil", topic: "Arquitetura" },
    ],
  });
  insert("projects", {
    courseId: c1.id, title: "Projeto Final — SaaS Full-Stack", weight: 3, maxScore: 100, passScore: 70,
    description: "Construa uma aplicação SaaS completa: front-end React, API Node com JWT, PostgreSQL e deploy público. Entregue repositório, URL publicada e um README documentando decisões de arquitetura.",
    deliverables: ["Repositório no GitHub", "URL da aplicação publicada", "README com decisões técnicas", "Vídeo de 3min demonstrando o produto"],
  });

  /* ---------------- CURSO 2 — CIBERSEGURANÇA ---------------- */
  const c2 = insert("courses", mk({
    slug: "ciberseguranca-ofensiva-ethical-hacking", title: "Cibersegurança Ofensiva — Ethical Hacking",
    subtitle: "Pense como um atacante para defender como um profissional: pentest web, redes e reporte executivo.",
    image: IMG.security, categoryId: "cat-sec", teacherId: t2.id, hours: 90, level: "Avançado",
    description: "Formação em segurança ofensiva com laboratórios isolados e metodologia de pentest profissional: reconhecimento, exploração, pós-exploração e reporte. Você sai pronto para operações reais de teste de intrusão e para certificações do mercado.",
    objectives: ["Executar pentests web com metodologia OWASP", "Explorar vulnerabilidades em redes e serviços", "Operar Kali Linux e ferramentas profissionais", "Escalar privilégios em Linux e Windows", "Escrever relatórios executivos e técnicos"],
    audience: ["Profissionais de TI e devs que querem migrar para segurança", "Analistas de SOC buscando o lado ofensivo", "Estudantes avançados de redes"],
    prerequisites: ["Redes de computadores", "Linux básico", "Noções de HTTP e web"],
    benefits: ["Laboratórios isolados na nuvem", "Metodologia alinhada ao OWASP Top 10", "Relatórios revisados individualmente", "Certificado verificável", "Preparação para OSCP"],
    methodology: "Ataque guiado: cada módulo reproduz uma fase real de um pentest, com labs cronometrados e debrief técnico ao final.",
    finalProject: "Pentest completo de uma aplicação-alvo: relatório técnico + sumário executivo, defendido em sessão ao vivo.",
    certificateText: "concluiu a formação em Cibersegurança Ofensiva",
    price: 749, promoPrice: 499, promoActive: true, installments: 6, published: true,
  }));
  const c2m1 = insert("course_modules", { courseId: c2.id, title: "Reconhecimento & OWASP", description: "Footprinting, scanning e as vulnerabilidades web que mais caem em produção.", order: 1 });
  const c2m2 = insert("course_modules", { courseId: c2.id, title: "Exploração & Pós-Exploração", description: "Ganhando acesso, escalando privilégios e documentando tudo.", order: 2 });
  [
    [c2m1, "Metodologia de pentest & ética", 22, "Regras de engajamento, escopo, legalidade e o ciclo completo de um teste de intrusão."],
    [c2m1, "Recon: do OSINT ao mapeamento", 34, "Técnicas passivas e ativas de levantamento de superfície de ataque."],
    [c2m1, "OWASP Top 10 na prática", 45, "Injection, quebras de autenticação, SSRF e companhia — explorando em lab."],
    [c2m2, "Exploração de serviços de rede", 40, "SMB, SSH, serviços expostos e pivoting entre segmentos."],
    [c2m2, "Escalonamento de privilégios", 38, "De usuário comum a root/SYSTEM: vetores clássicos e modernos."],
    [c2m2, "Reporte executivo e técnico", 26, "Como transformar achados em decisões: severidade, evidência e plano de ação."],
  ].forEach(([m, title, dur, desc]: any, i) => {
    const l = L(m.id, c2.id, title as string, i + 1, dur as number, desc as string);
    insert("lesson_materials", { lessonId: l.id, courseId: c2.id, name: `Checklist da fase ${i + 1}.txt`, kind: "arquivo", fileType: "TXT", dataUrl: APOSTILA, size: "2 KB", access: "enrolled" });
  });
  insert("activities", {
    courseId: c2.id, moduleId: c2m1.id, title: "Quiz — OWASP Top 10", kind: "questionario",
    description: "Verificação dos conceitos das vulnerabilidades web mais críticas.",
    maxScore: 3, weight: 1, passScore: 50, attempts: 3, published: true,
    questions: [
      { qid: "s1", type: "single", prompt: "Qual vulnerabilidade permite executar SQL arbitrário via entrada do usuário?", options: ["XSS", "Injection", "CSRF", "Clickjacking"], correct: 1, explanation: "SQL Injection é a classe clássica de injection.", points: 1, difficulty: "fácil", topic: "OWASP" },
      { qid: "s2", type: "tf", prompt: "CSRF explora a confiança que um site tem no navegador autenticado da vítima.", options: ["Verdadeiro", "Falso"], correct: 0, explanation: "Exato: o ataque cavalga a sessão autenticada.", points: 1, difficulty: "médio", topic: "OWASP" },
      { qid: "s3", type: "single", prompt: "Qual header ajuda a mitigar XSS?", options: ["Content-Security-Policy", "Accept-Language", "ETag", "Range"], correct: 0, explanation: "CSP restringe origens de scripts.", points: 1, difficulty: "médio", topic: "OWASP" },
    ],
  });
  insert("assessments", {
    courseId: c2.id, title: "Avaliação — Metodologia de Pentest", type: "avaliacao", durationMin: 45, passScore: 70,
    maxScore: 8, weight: 2, attempts: 2, published: true,
    description: "Avaliação teórica e prática sobre o ciclo de pentest.",
    questions: [
      { qid: "e1", type: "single", prompt: "Qual a PRIMEIRA fase de um pentest?", options: ["Exploração", "Reconhecimento", "Reporte", "Pós-exploração"], correct: 1, explanation: "Recon antecede qualquer exploração.", points: 2, difficulty: "fácil", topic: "Metodologia" },
      { qid: "e2", type: "multi", prompt: "O que deve constar em um bom relatório de pentest? (marque todas)", options: ["Evidências reproduzíveis", "Severidade e risco", "Recomendações de correção", "Senhas descobertas em texto claro"], correct: [0, 1, 2], explanation: "Evidência, risco e plano de ação — sem expor credenciais.", points: 2, difficulty: "médio", topic: "Reporte" },
      { qid: "e3", type: "tf", prompt: "Um pentest sem escopo definido pode se tornar atividade ilegal.", options: ["Verdadeiro", "Falso"], correct: 0, explanation: "Sem autorização formal, testar sistemas alheios é crime.", points: 2, difficulty: "fácil", topic: "Ética" },
      { qid: "e4", type: "essay", prompt: "Descreva um vetor de escalonamento de privilégios em Linux e como mitigá-lo.", options: [], correct: null, explanation: "", points: 2, difficulty: "difícil", topic: "Pós-exploração" },
    ],
  });
  insert("projects", {
    courseId: c2.id, title: "Pentest Completo + Relatório", weight: 3, maxScore: 100, passScore: 70,
    description: "Execute um pentest completo no ambiente-alvo do curso e entregue o relatório técnico e o sumário executivo seguindo o template fornecido.",
    deliverables: ["Relatório técnico (PDF)", "Sumário executivo", "Repositório com scripts utilizados"],
  });

  /* ---------------- CURSO 3 — DADOS & IA ---------------- */
  const c3 = insert("courses", mk({
    slug: "dados-e-ia-do-sql-ao-machine-learning", title: "Dados & IA: do SQL ao Machine Learning",
    subtitle: "A trilha completa de dados: SQL, Python, pipelines e modelos de ML em produção.",
    image: IMG.data, categoryId: "cat-data", teacherId: t3.id, hours: 100, level: "Iniciante ao Intermediário",
    description: "Da primeira consulta SQL ao primeiro modelo em produção. Uma trilha progressiva que cobre fundamentos de dados, Python para análise, visualização, estatística aplicada e machine learning com projetos reais em cada etapa.",
    objectives: ["Escrever SQL analítico com confiança", "Manipular dados com Python e pandas", "Construir dashboards que respondem perguntas de negócio", "Aplicar estatística para decidir, não para decorar", "Treinar e avaliar modelos de ML clássicos"],
    audience: ["Iniciantes que querem entrar na área de dados", "Analistas que querem evoluir para ML", "Devs que precisam trabalhar com dados"],
    prerequisites: ["Nenhum: a trilha começa do zero", "Afinidade com planilhas ajuda"],
    benefits: ["6 projetos com dados reais", "Notebooks comentados aula a aula", "Mentoria em grupo quinzenal", "Certificado verificável", "Portfólio no GitHub"],
    methodology: "Dados reais, perguntas reais: cada módulo termina com um mini-projeto analisando um dataset público e apresentando conclusões.",
    finalProject: "Pipeline completo: extração SQL, tratamento, análise e modelo preditivo publicado com API — do dado bruto à decisão.",
    certificateText: "concluiu a trilha de Dados & Inteligência Artificial",
    price: 799, promoPrice: 549, promoActive: true, installments: 6, published: true,
  }));
  const c3m1 = insert("course_modules", { courseId: c3.id, title: "Fundamentos de Dados", description: "SQL, modelagem e Python para análise.", order: 1 });
  const c3m2 = insert("course_modules", { courseId: c3.id, title: "Machine Learning Aplicado", description: "Da estatística ao modelo em produção.", order: 2 });
  [
    [c3m1, "SQL para análise de dados", 40, "SELECT, JOINs, CTEs e window functions com datasets reais."],
    [c3m1, "Python & pandas na prática", 42, "DataFrames, limpeza, agrupamentos e a rotina real de um analista."],
    [c3m1, "Visualização que conta histórias", 28, "Gráficos que respondem perguntas — e os que só confundem."],
    [c3m2, "Estatística para decidir", 35, "Distribuições, testes de hipótese e intervalos sem sofrimento."],
    [c3m2, "Modelos clássicos de ML", 44, "Regressão, árvores e ensembles: quando usar cada um."],
    [c3m2, "ML em produção", 30, "Serialização, APIs, monitoramento e o que quebra depois do deploy."],
  ].forEach(([m, title, dur, desc]: any, i) => {
    const l = L(m.id, c3.id, title as string, i + 1, dur as number, desc as string);
    insert("lesson_materials", { lessonId: l.id, courseId: c3.id, name: `Notebook da aula ${i + 1}.txt`, kind: "arquivo", fileType: "TXT", dataUrl: APOSTILA, size: "2 KB", access: "enrolled" });
  });
  insert("activities", {
    courseId: c3.id, moduleId: c3m1.id, title: "Quiz — SQL Essencial", kind: "questionario",
    description: "Consultas, JOINs e agregações.",
    maxScore: 3, weight: 1, passScore: 50, attempts: 3, published: true,
    questions: [
      { qid: "d1", type: "single", prompt: "Qual cláusula filtra grupos após um GROUP BY?", options: ["WHERE", "HAVING", "FILTER", "ORDER BY"], correct: 1, explanation: "HAVING filtra agregações; WHERE filtra linhas.", points: 1, difficulty: "fácil", topic: "SQL" },
      { qid: "d2", type: "tf", prompt: "LEFT JOIN retorna todas as linhas da tabela à esquerda, mesmo sem correspondência.", options: ["Verdadeiro", "Falso"], correct: 0, explanation: "Exato, com NULLs onde não houver match.", points: 1, difficulty: "fácil", topic: "SQL" },
      { qid: "d3", type: "single", prompt: "Window functions se diferenciam de GROUP BY porque…", options: ["São mais lentas", "Não colapsam linhas", "Só funcionam no MySQL", "Exigem índices"], correct: 1, explanation: "Funções de janela preservam as linhas originais.", points: 1, difficulty: "médio", topic: "SQL" },
    ],
  });
  insert("assessments", {
    courseId: c3.id, title: "Prova — Análise & ML", type: "prova", durationMin: 50, passScore: 70,
    maxScore: 8, weight: 2, attempts: 2, published: true,
    description: "Conceitos de análise de dados e machine learning.",
    questions: [
      { qid: "m1", type: "single", prompt: "Overfitting acontece quando o modelo…", options: ["Erra muito em treino", "Memoriza o treino e generaliza mal", "Tem muitos dados", "Usa regularização"], correct: 1, explanation: "O modelo decora o treino e performa mal em dados novos.", points: 2, difficulty: "médio", topic: "ML" },
      { qid: "m2", type: "single", prompt: "Qual métrica é mais informativa que acurácia em classes desbalanceadas?", options: ["R²", "F1-score", "Média", "Variância"], correct: 1, explanation: "F1 equilibra precisão e revocação.", points: 2, difficulty: "médio", topic: "ML" },
      { qid: "m3", type: "tf", prompt: "Normalizar features pode acelerar a convergência de modelos baseados em gradiente.", options: ["Verdadeiro", "Falso"], correct: 0, explanation: "Escalas semelhantes facilitam o descenso de gradiente.", points: 2, difficulty: "médio", topic: "ML" },
      { qid: "m4", type: "essay", prompt: "Explique como você validaria um modelo preditivo antes de colocá-lo em produção.", options: [], correct: null, explanation: "", points: 2, difficulty: "difícil", topic: "ML" },
    ],
  });
  insert("projects", {
    courseId: c3.id, title: "Pipeline de Dados + Modelo Preditivo", weight: 3, maxScore: 100, passScore: 70,
    description: "Construa um pipeline completo com dados públicos: extração, limpeza, análise exploratória, modelo preditivo e API de inferência publicada.",
    deliverables: ["Repositório com notebooks", "API de inferência publicada", "Relatório de análise (PDF ou README)"],
  });

  /* vínculo professor → cursos */
  t1.courseIds = [c1.id]; t2.courseIds = [c2.id]; t3.courseIds = [c3.id];
  insert("classes", { name: "Full-Stack · Turma 2026.1", code: "FS-2026-1", courseId: c1.id, teacherId: t1.id, start: now(), end: new Date(Date.now() + 180 * 86400e3).toISOString(), capacity: 40, status: "ACTIVE" });
  insert("classes", { name: "Cybersec · Turma 2026.1", code: "SEC-2026-1", courseId: c2.id, teacherId: t2.id, start: now(), end: new Date(Date.now() + 150 * 86400e3).toISOString(), capacity: 30, status: "ACTIVE" });
  insert("classes", { name: "Dados & IA · Turma 2026.1", code: "DIA-2026-1", courseId: c3.id, teacherId: t3.id, start: now(), end: new Date(Date.now() + 160 * 86400e3).toISOString(), capacity: 35, status: "PLANNED" });

  /* ---------- conteúdo do site ---------- */
  insert("faqs", { q: "Como recebo acesso ao curso após a compra?", a: "O acesso é automático: assim que o Mercado Pago confirma o pagamento via webhook, o SIA cria sua matrícula e o curso aparece no seu Portal do Aluno em segundos — sem intervenção manual.", order: 1 });
  insert("faqs", { q: "O certificado é válido e verificável?", a: "Sim. Todo certificado possui código único e QR Code. Qualquer pessoa pode validar a autenticidade na página pública de validação, que consulta o SIA em tempo real.", order: 2 });
  insert("faqs", { q: "Quais são as formas de pagamento?", a: "Cartão de crédito em até 6x e Pix via Mercado Pago (Checkout Pro). O processamento é feito com criptografia de ponta a ponta — não armazenamos dados de cartão.", order: 3 });
  insert("faqs", { q: "Por quanto tempo tenho acesso ao conteúdo?", a: "O acesso padrão é de 24 meses após a matrícula, incluindo todas as atualizações do curso publicadas nesse período.", order: 4 });
  insert("faqs", { q: "Posso pedir reembolso?", a: "Sim, conforme o CDC: até 7 dias após a compra, com estorno processado pelo próprio Mercado Pago e cancelamento automático da matrícula pelo SIA.", order: 5 });
  insert("posts", {
    slug: "por-que-fullstack-continua-em-alta", title: "Por que o perfil full-stack continua em alta em 2026",
    excerpt: "Levantamentos de vagas mostram demanda crescente por quem transita entre front e back-end — e o que isso muda na formação.",
    body: "O mercado amadureceu: times enxutos precisam de profissionais que entregem valor de ponta a ponta. Isso não significa saber tudo superficialmente, mas dominar um eixo profundo (JavaScript/TypeScript) e navegar com segurança entre banco de dados, APIs e interface.\n\nNa Cyber Academy, a trilha full-stack foi desenhada em torno dessa realidade: cada módulo termina com uma entrega que simula o trabalho real — code review, deploy e observação em produção.",
    author: "Rafael Monteiro", tag: "Carreira", published: true, at: now(),
  });
  insert("posts", {
    slug: "owasp-top-10-guia-pratico", title: "OWASP Top 10 sem decoreba: um guia prático",
    excerpt: "As 10 vulnerabilidades mais críticas explicadas com exemplos reais de exploração e correção.",
    body: "Decorar a lista do OWASP não protege ninguém. Entender o mecanismo de cada classe de vulnerabilidade, sim. Injection, por exemplo, raramente é um erro exótico: é confiança indevida em entrada do usuário.\n\nNeste guia, percorremos cada item com um cenário de exploração, o impacto no negócio e o controle que elimina a causa — não apenas o sintoma. É a mesma base usada no nosso curso de Cibersegurança Ofensiva.",
    author: "Ana Duarte", tag: "Segurança", published: true, at: now(),
  });

  audit(admin, "CREATE", "seed", "", "Dados de demonstração gerados (ambiente dev)");
  return creds;
}
