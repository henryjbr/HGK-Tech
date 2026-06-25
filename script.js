const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector(".contact-form");
const techCanvas = document.querySelector("[data-tech-canvas]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const localeSelector = document.querySelector("[data-locale-selector]");
const localeToggle = document.querySelector("[data-locale-toggle]");
const localeFlag = document.querySelector("[data-locale-flag]");
const localeCode = document.querySelector("[data-locale-code]");
const localeButtons = document.querySelectorAll("[data-lang]");
const contactInfoTriggers = document.querySelectorAll("[data-contact-info-trigger]");
let contactToastTimer = 0;
let contactFormStarted = false;

const supabaseConfig = window.HGK_SUPABASE || {};
const trackingState = {
  visitorId: getStoredId("hgk-visitor-id"),
  sessionId: getStoredId("hgk-session-id", true),
};

function getStoredId(key, sessionOnly = false) {
  const storage = sessionOnly ? sessionStorage : localStorage;
  const current = storage.getItem(key);
  if (current) return current;

  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  storage.setItem(key, value);
  return value;
}

function hasSupabaseConfig() {
  return Boolean(
    supabaseConfig.url &&
      supabaseConfig.anonKey &&
      !supabaseConfig.url.includes("SEU-PROJETO") &&
      !supabaseConfig.anonKey.includes("SUA_CHAVE")
  );
}

function supabaseEndpoint(table) {
  return `${supabaseConfig.url.replace(/\/$/, "")}/rest/v1/${table}`;
}

async function supabaseInsert(table, payload) {
  if (!hasSupabaseConfig()) return { skipped: true };

  const response = await fetch(supabaseEndpoint(table), {
    method: "POST",
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${supabaseConfig.anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} ${errorText}`);
  }

  return { ok: true };
}

function isMissingPhoneColumnError(error) {
  return error.message.includes("phone") && error.message.includes("schema cache");
}

async function submitContactSubmission(payload) {
  try {
    return await supabaseInsert("contact_submissions", payload);
  } catch (error) {
    if ("phone" in payload && isMissingPhoneColumnError(error)) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.phone;
      return supabaseInsert("contact_submissions", fallbackPayload);
    }

    throw error;
  }
}

function baseTrackingPayload() {
  return {
    page_path: `${location.pathname}${location.search}${location.hash}`,
    page_title: document.title,
    language: currentLanguage,
    visitor_id: trackingState.visitorId,
    session_id: trackingState.sessionId,
  };
}

function trackEvent(eventName, details = {}) {
  const payload = {
    event_name: eventName,
    ...baseTrackingPayload(),
    ...details,
    metadata: {
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      ...details.metadata,
    },
  };

  supabaseInsert("analytics_events", payload).catch(() => {});
}

function contactPayloadFromForm(contactForm) {
  const data = new FormData(contactForm);
  const phone = String(data.get("telefone") || "").trim();

  const payload = {
    name: String(data.get("nome") || "").trim(),
    email: String(data.get("email") || "").trim(),
    company: String(data.get("empresa") || "").trim() || null,
    goal: String(data.get("objetivo") || "").trim() || null,
    language: currentLanguage,
    page_path: `${location.pathname}${location.search}`,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
    visitor_id: trackingState.visitorId,
    session_id: trackingState.sessionId,
  };

  if (phone) payload.phone = phone;

  return payload;
}

const localeMeta = {
  pt: { code: "BR", flagSrc: "assets/br.jpg", lang: "pt-BR" },
  es: { code: "ES", flagSrc: "assets/es.jpg", lang: "es" },
  en: { code: "EN", flagSrc: "assets/us.png", lang: "en" },
};

const translations = {
  pt: {
    metaTitle: "HGK | Tecnologia para empresas que fazem acontecer",
    metaDescription: "Soluções digitais, automação e inteligência de dados para empresas que precisam crescer com eficiência.",
    detailMetaTitle: "HGK | Informações detalhadas",
    detailMetaDescription: "Conheça em detalhes como a HGK estrutura projetos de tecnologia, automação, dados e sistemas para empresas.",
    "language.select": "Selecionar idioma",
    "nav.openMenu": "Abrir menu",
    "nav.business": "Serviços",
    "nav.products": "Contato",
    "nav.segments": "Segmentos",
    "nav.about": "Sobre",
    "nav.call": "LIGAMOS PARA VOCÊ",
    "nav.client": "RECEBER MAIS INFORMAÇÕES",
    "contactToast.title": "Receber mais informações",
    "contactToast.copy": "Cadastre seus dados na área de contato e a equipe HGK entrará em contato oferecendo o suporte necessário.",
    "hero.title": "TECNOLOGIA PARA SUA OPERAÇÃO.",
    "hero.copy": "Automação, dados e sistemas integrados para sua empresa evoluir.",
    "hero.button": "SAIBA MAIS",
    "trust.projects": "projetos entregues",
    "trust.sectorsNumber": "9 setores",
    "trust.sectors": "atendidos com tecnologia",
    "trust.monitoring": "monitoramento de sistemas",
    "trust.clients": "clientes em evolução contínua",
    "intro.eyebrow": "Empresas que movem o mercado precisam de base digital",
    "intro.title": "Conectamos estratégia, sistemas e pessoas em uma operação mais fluida.",
    "intro.copy1": "A HGK cria ambientes digitais para gestão empresarial, integrando processos comerciais, financeiros, logística, atendimento e indicadores em uma única visão de negócio.",
    "intro.copy2": "Nosso trabalho combina consultoria, desenvolvimento e sustentação para que a tecnologia deixe de ser obstáculo e passe a acelerar decisões.",
    "solutions.eyebrow": "Serviços",
    "solutions.title": "Quer saber mais sobre <span>Sistema de Gestão</span>?<br>Selecionamos alguns materiais para você:",
    "solutions.card1.chip": "ERP + CRM",
    "solutions.card1.title": "Gestão integrada",
    "solutions.card1.copy": "Implantamos e conectamos sistemas para organizar vendas, financeiro, operação e atendimento em uma rotina única.",
    "solutions.card2.chip": "Workflows",
    "solutions.card2.title": "Automação de processos",
    "solutions.card2.copy": "Criamos fluxos, formulários e robôs para reduzir tarefas repetitivas e dar velocidade ao time.",
    "solutions.card3.chip": "BI + Dashboards",
    "solutions.card3.title": "Dados e analytics",
    "solutions.card3.copy": "Montamos painéis executivos e indicadores para transformar dados em decisão clara e acionável.",
    "solutions.card4.chip": "Sistemas sob medida",
    "solutions.card4.title": "Desenvolvimento digital",
    "solutions.card4.copy": "Desenvolvemos sistemas internos, portais, landing pages e ferramentas digitais alinhadas ao seu processo.",
    "solutions.card5.chip": "APIs + Integrações",
    "solutions.card5.title": "Integração de plataformas",
    "solutions.card5.copy": "Conectamos ferramentas, bancos de dados e sistemas legados para eliminar retrabalho e centralizar informações.",
    "solutions.card6.chip": "Consultoria contínua",
    "solutions.card6.title": "Suporte e evolução",
    "solutions.card6.copy": "Acompanhamos melhorias, sustentação e evolução dos sistemas para manter a tecnologia funcionando com o negócio.",
    "common.learnMore": "Saiba mais",
    "segments.imageAlt": "Parceiros e colaboradores trabalhando em tecnologia",
    "segments.listLabel": "Parceiros e colaboradores HGK",
    "segments.eyebrow": "Parceiros HGK",
    "segments.title": "Uma rede de colaboradores para entregar tecnologia com mais consistência.",
    "segments.list.services": "Tecnologia",
    "segments.list.retail": "Implantação",
    "segments.list.distribution": "Dados",
    "segments.list.health": "Suporte",
    "segments.list.education": "Educação",
    "segments.list.industry": "Industria",
    "segments.partner1.copy": "Plataformas, sistemas e ferramentas conectadas ao seu processo.",
    "segments.partner2.copy": "Especialistas para estruturar rotinas, treinar times e acompanhar entregas.",
    "segments.partner3.copy": "Colaboradores focados em indicadores, dashboards e tomada de decisão.",
    "segments.partner4.copy": "Acompanhamento contínuo para evoluir a operação depois do go-live.",
    "segments.copy": "A HGK trabalha com uma rede de parceiros e profissionais especializados para unir estratégia, execução e sustentação em cada projeto.",
    "results.eyebrow": "Inovação na prática",
    "results.title": "Uma operação mais inteligente aparece nos indicadores.",
    "results.metric1": "menos tempo em tarefas administrativas após automações.",
    "results.metric2": "mais velocidade para consolidar relatórios gerenciais.",
    "results.metric3": "para colocar os primeiros fluxos digitais em produção.",
    "contact.eyebrow": "Conte com a HGK",
    "contact.title": "Vamos potencializar o crescimento da sua empresa.",
    "form.label": "Formulário de contato",
    "form.name": "Nome",
    "form.namePlaceholder": "Seu nome",
    "form.email": "E-mail",
    "form.emailPlaceholder": "voce@empresa.com",
    "form.phone": "WhatsApp",
    "form.phonePlaceholder": "(11) 99999-9999",
    "form.company": "Empresa",
    "form.companyPlaceholder": "Nome da empresa",
    "form.goal": "Objetivo",
    "form.option1": "Digitalizar processos",
    "form.option2": "Integrar sistemas",
    "form.option3": "Criar dashboards",
    "form.option4": "Solicitar consultoria",
    "form.submit": "Solicitar contato",
    "form.success": "Contato solicitado",
    "footer.copy": "© 2026 HGK. Tecnologia para gestão, dados e automação.",
    "footer.solutions": "Soluções",
    "footer.segments": "Parceiros",
    "footer.contact": "Contato",
    "detail.back": "Voltar",
    "detail.backAria": "Voltar para a página principal",
    "detail.hero.eyebrow": "Visão detalhada",
    "detail.hero.title": "Como a HGK transforma processos em <span>operações digitais</span> mais inteligentes.",
    "detail.hero.copy": "Unimos consultoria, desenvolvimento, automação e dados para criar uma base tecnológica clara, escalável e alinhada ao funcionamento real da sua empresa.",
    "detail.dashboard.kpi": "eficiência",
    "detail.deliver.eyebrow": "O que entregamos",
    "detail.deliver.title": "Projetos digitais com foco em gestão, produtividade e decisão.",
    "detail.card1.title": "Diagnóstico operacional",
    "detail.card1.copy": "Mapeamos processos, gargalos, sistemas existentes e oportunidades de automação antes de propor a solução.",
    "detail.card2.title": "Sistemas e integrações",
    "detail.card2.copy": "Conectamos ERP, CRM, formulários, dashboards, APIs e ferramentas internas em uma rotina mais fluida.",
    "detail.card3.title": "Dados e indicadores",
    "detail.card3.copy": "Criamos painéis executivos para acompanhar produtividade, performance comercial, operação e resultados.",
    "detail.card4.title": "Evolução contínua",
    "detail.card4.copy": "Acompanhamos melhorias, ajustes e sustentação para que a tecnologia continue acompanhando o negócio.",
    "detail.process.eyebrow": "Método HGK",
    "detail.process.title": "Da ideia ao uso diário.",
    "detail.step1.title": "Entender",
    "detail.step1.copy": "Objetivos, rotina, sistemas e dores da operação.",
    "detail.step2.title": "Planejar",
    "detail.step2.copy": "Prioridades, arquitetura, etapas e indicadores do projeto.",
    "detail.step3.title": "Implementar",
    "detail.step3.copy": "Desenvolvimento, integrações, automações e validações.",
    "detail.step4.title": "Evoluir",
    "detail.step4.copy": "Suporte, melhorias e acompanhamento dos resultados.",
  },
  en: {
    metaTitle: "HGK | Technology for companies that get things done",
    metaDescription: "Digital solutions, automation, and data intelligence for companies that need to grow efficiently.",
    detailMetaTitle: "HGK | Detailed information",
    detailMetaDescription: "Learn how HGK structures technology, automation, data, and systems projects for companies.",
    "language.select": "Select language",
    "nav.openMenu": "Open menu",
    "nav.business": "Services",
    "nav.products": "Contact",
    "nav.segments": "Segments",
    "nav.about": "About",
    "nav.call": "WE CALL YOU",
    "nav.client": "GET MORE INFORMATION",
    "contactToast.title": "Get more information",
    "contactToast.copy": "Submit your details in the contact area and the HGK team will reach out with the support you need.",
    "hero.title": "TECHNOLOGY FOR YOUR OPERATION.",
    "hero.copy": "Automation, data, and integrated systems to help your company evolve.",
    "hero.button": "LEARN MORE",
    "trust.projects": "projects delivered",
    "trust.sectorsNumber": "9 sectors",
    "trust.sectors": "served with technology",
    "trust.monitoring": "system monitoring",
    "trust.clients": "clients in continuous evolution",
    "intro.eyebrow": "Companies that move markets need a digital foundation",
    "intro.title": "We connect strategy, systems, and people into a smoother operation.",
    "intro.copy1": "HGK creates digital environments for business management, integrating sales, finance, logistics, service, and indicators into one business view.",
    "intro.copy2": "Our work combines consulting, development, and support so technology stops being an obstacle and starts accelerating decisions.",
    "solutions.eyebrow": "Services",
    "solutions.title": "Want to know more about <span>management systems</span>?<br>We selected some materials for you:",
    "solutions.card1.chip": "ERP + CRM",
    "solutions.card1.title": "Integrated management",
    "solutions.card1.copy": "We implement and connect systems to organize sales, finance, operations, and support in one workflow.",
    "solutions.card2.chip": "Workflows",
    "solutions.card2.title": "Process automation",
    "solutions.card2.copy": "We create workflows, forms, and bots to reduce repetitive tasks and give teams more speed.",
    "solutions.card3.chip": "BI + Dashboards",
    "solutions.card3.title": "Data and analytics",
    "solutions.card3.copy": "We build executive dashboards and indicators that turn data into clear, actionable decisions.",
    "solutions.card4.chip": "Custom systems",
    "solutions.card4.title": "Digital development",
    "solutions.card4.copy": "We develop internal systems, portals, landing pages, and digital tools aligned with your process.",
    "solutions.card5.chip": "APIs + Integrations",
    "solutions.card5.title": "Platform integration",
    "solutions.card5.copy": "We connect tools, databases, and legacy systems to eliminate rework and centralize information.",
    "solutions.card6.chip": "Ongoing consulting",
    "solutions.card6.title": "Support and evolution",
    "solutions.card6.copy": "We support improvements, maintenance, and system evolution so technology keeps working with the business.",
    "common.learnMore": "Learn more",
    "segments.imageAlt": "Partners and collaborators working with technology",
    "segments.listLabel": "HGK partners and collaborators",
    "segments.eyebrow": "HGK Partners",
    "segments.title": "A collaborator network to deliver technology with more consistency.",
    "segments.list.services": "Technology",
    "segments.list.retail": "Implementation",
    "segments.list.distribution": "Data",
    "segments.list.health": "Support",
    "segments.list.education": "Education",
    "segments.list.industry": "Industry",
    "segments.partner1.copy": "Platforms, systems, and tools connected to your process.",
    "segments.partner2.copy": "Specialists to structure routines, train teams, and follow deliveries.",
    "segments.partner3.copy": "Collaborators focused on indicators, dashboards, and decision-making.",
    "segments.partner4.copy": "Ongoing follow-up to evolve operations after go-live.",
    "segments.copy": "HGK works with a network of partners and specialized professionals to unite strategy, execution, and support in every project.",
    "results.eyebrow": "Innovation in practice",
    "results.title": "A smarter operation shows up in the indicators.",
    "results.metric1": "less time spent on administrative tasks after automation.",
    "results.metric2": "more speed to consolidate management reports.",
    "results.metric3": "to put the first digital workflows into production.",
    "contact.eyebrow": "Count on HGK",
    "contact.title": "Let's boost your company's growth.",
    "form.label": "Contact form",
    "form.name": "Name",
    "form.namePlaceholder": "Your name",
    "form.email": "Email",
    "form.emailPlaceholder": "you@company.com",
    "form.phone": "WhatsApp",
    "form.phonePlaceholder": "+1 555 000 0000",
    "form.company": "Company",
    "form.companyPlaceholder": "Company name",
    "form.goal": "Goal",
    "form.option1": "Digitize processes",
    "form.option2": "Integrate systems",
    "form.option3": "Create dashboards",
    "form.option4": "Request consulting",
    "form.submit": "Request contact",
    "form.success": "Request sent",
    "footer.copy": "© 2026 HGK. Technology for management, data, and automation.",
    "footer.solutions": "Services",
    "footer.segments": "Partners",
    "footer.contact": "Contact",
    "detail.back": "Back",
    "detail.backAria": "Back to the main page",
    "detail.hero.eyebrow": "Detailed view",
    "detail.hero.title": "How HGK turns processes into smarter <span>digital operations</span>.",
    "detail.hero.copy": "We combine consulting, development, automation, and data to create a clear, scalable technology foundation aligned with how your company really works.",
    "detail.dashboard.kpi": "efficiency",
    "detail.deliver.eyebrow": "What we deliver",
    "detail.deliver.title": "Digital projects focused on management, productivity, and decision-making.",
    "detail.card1.title": "Operational diagnosis",
    "detail.card1.copy": "We map processes, bottlenecks, existing systems, and automation opportunities before proposing a solution.",
    "detail.card2.title": "Systems and integrations",
    "detail.card2.copy": "We connect ERP, CRM, forms, dashboards, APIs, and internal tools into a smoother workflow.",
    "detail.card3.title": "Data and indicators",
    "detail.card3.copy": "We create executive dashboards to monitor productivity, commercial performance, operations, and results.",
    "detail.card4.title": "Continuous evolution",
    "detail.card4.copy": "We support improvements, adjustments, and maintenance so technology keeps pace with the business.",
    "detail.process.eyebrow": "HGK Method",
    "detail.process.title": "From idea to daily use.",
    "detail.step1.title": "Understand",
    "detail.step1.copy": "Goals, routines, systems, and operational pain points.",
    "detail.step2.title": "Plan",
    "detail.step2.copy": "Priorities, architecture, stages, and project indicators.",
    "detail.step3.title": "Implement",
    "detail.step3.copy": "Development, integrations, automation, and validation.",
    "detail.step4.title": "Evolve",
    "detail.step4.copy": "Support, improvements, and results monitoring.",
  },
  es: {
    metaTitle: "HGK | Tecnología para empresas que hacen que las cosas sucedan",
    metaDescription: "Soluciones digitales, automatización e inteligencia de datos para empresas que necesitan crecer con eficiencia.",
    detailMetaTitle: "HGK | Información detallada",
    detailMetaDescription: "Conoce en detalle cómo HGK estructura proyectos de tecnología, automatización, datos y sistemas para empresas.",
    "language.select": "Seleccionar idioma",
    "nav.openMenu": "Abrir menú",
    "nav.business": "Servicios",
    "nav.products": "Contacto",
    "nav.segments": "Segmentos",
    "nav.about": "Sobre nosotros",
    "nav.call": "TE LLAMAMOS",
    "nav.client": "RECIBIR MÁS INFORMACIÓN",
    "contactToast.title": "Recibir más información",
    "contactToast.copy": "Registra tus datos en el área de contacto y el equipo HGK se pondrá en contacto con el soporte necesario.",
    "hero.title": "TECNOLOGÍA PARA TU OPERACIÓN.",
    "hero.copy": "Automatización, datos y sistemas integrados para que tu empresa evolucione.",
    "hero.button": "SABER MÁS",
    "trust.projects": "proyectos entregados",
    "trust.sectorsNumber": "9 sectores",
    "trust.sectors": "atendidos con tecnología",
    "trust.monitoring": "monitoreo de sistemas",
    "trust.clients": "clientes en evolución continua",
    "intro.eyebrow": "Las empresas que mueven el mercado necesitan una base digital",
    "intro.title": "Conectamos estrategia, sistemas y personas en una operación más fluida.",
    "intro.copy1": "HGK crea entornos digitales para la gestión empresarial, integrando procesos comerciales, financieros, logística, atención e indicadores en una única visión del negocio.",
    "intro.copy2": "Nuestro trabajo combina consultoría, desarrollo y soporte para que la tecnología deje de ser un obstáculo y acelere decisiones.",
    "solutions.eyebrow": "Servicios",
    "solutions.title": "¿Quieres saber más sobre <span>sistemas de gestión</span>?<br>Seleccionamos algunos materiales para ti:",
    "solutions.card1.chip": "ERP + CRM",
    "solutions.card1.title": "Gestión integrada",
    "solutions.card1.copy": "Implementamos y conectamos sistemas para organizar ventas, finanzas, operación y atención en una sola rutina.",
    "solutions.card2.chip": "Workflows",
    "solutions.card2.title": "Automatización de procesos",
    "solutions.card2.copy": "Creamos flujos, formularios y bots para reducir tareas repetitivas y dar velocidad al equipo.",
    "solutions.card3.chip": "BI + Dashboards",
    "solutions.card3.title": "Datos y analytics",
    "solutions.card3.copy": "Creamos paneles ejecutivos e indicadores para transformar datos en decisiones claras y accionables.",
    "solutions.card4.chip": "Sistemas a medida",
    "solutions.card4.title": "Desarrollo digital",
    "solutions.card4.copy": "Desarrollamos sistemas internos, portales, landing pages y herramientas digitales alineadas con tu proceso.",
    "solutions.card5.chip": "APIs + Integraciones",
    "solutions.card5.title": "Integración de plataformas",
    "solutions.card5.copy": "Conectamos herramientas, bases de datos y sistemas heredados para eliminar retrabajo y centralizar información.",
    "solutions.card6.chip": "Consultoría continua",
    "solutions.card6.title": "Soporte y evolución",
    "solutions.card6.copy": "Acompañamos mejoras, soporte y evolución de sistemas para mantener la tecnología funcionando con el negocio.",
    "common.learnMore": "Saber más",
    "segments.imageAlt": "Socios y colaboradores trabajando con tecnología",
    "segments.listLabel": "Socios y colaboradores HGK",
    "segments.eyebrow": "Socios HGK",
    "segments.title": "Una red de colaboradores para entregar tecnología con más consistencia.",
    "segments.list.services": "Tecnología",
    "segments.list.retail": "Implementación",
    "segments.list.distribution": "Datos",
    "segments.list.health": "Soporte",
    "segments.list.education": "Educación",
    "segments.list.industry": "Industria",
    "segments.partner1.copy": "Plataformas, sistemas y herramientas conectadas a tu proceso.",
    "segments.partner2.copy": "Especialistas para estructurar rutinas, entrenar equipos y acompañar entregas.",
    "segments.partner3.copy": "Colaboradores enfocados en indicadores, dashboards y toma de decisiones.",
    "segments.partner4.copy": "Seguimiento continuo para evolucionar la operación después del go-live.",
    "segments.copy": "HGK trabaja con una red de socios y profesionales especializados para unir estrategia, ejecución y soporte en cada proyecto.",
    "results.eyebrow": "Innovación en la práctica",
    "results.title": "Una operación más inteligente aparece en los indicadores.",
    "results.metric1": "menos tiempo en tareas administrativas después de automatizaciones.",
    "results.metric2": "más velocidad para consolidar informes gerenciales.",
    "results.metric3": "para poner los primeros flujos digitales en producción.",
    "contact.eyebrow": "Cuenta con HGK",
    "contact.title": "Vamos a potenciar el crecimiento de tu empresa.",
    "form.label": "Formulario de contacto",
    "form.name": "Nombre",
    "form.namePlaceholder": "Tu nombre",
    "form.email": "E-mail",
    "form.emailPlaceholder": "tu@empresa.com",
    "form.phone": "WhatsApp",
    "form.phonePlaceholder": "+55 11 99999-9999",
    "form.company": "Empresa",
    "form.companyPlaceholder": "Nombre de la empresa",
    "form.goal": "Objetivo",
    "form.option1": "Digitalizar procesos",
    "form.option2": "Integrar sistemas",
    "form.option3": "Crear dashboards",
    "form.option4": "Solicitar consultoría",
    "form.submit": "Solicitar contacto",
    "form.success": "Solicitud enviada",
    "footer.copy": "© 2026 HGK. Tecnología para gestión, datos y automatización.",
    "footer.solutions": "Servicios",
    "footer.segments": "Socios",
    "footer.contact": "Contacto",
    "detail.back": "Volver",
    "detail.backAria": "Volver a la página principal",
    "detail.hero.eyebrow": "Visión detallada",
    "detail.hero.title": "Cómo HGK transforma procesos en <span>operaciones digitales</span> más inteligentes.",
    "detail.hero.copy": "Unimos consultoría, desarrollo, automatización y datos para crear una base tecnológica clara, escalable y alineada con el funcionamiento real de tu empresa.",
    "detail.dashboard.kpi": "eficiencia",
    "detail.deliver.eyebrow": "Lo que entregamos",
    "detail.deliver.title": "Proyectos digitales enfocados en gestión, productividad y decisión.",
    "detail.card1.title": "Diagnóstico operacional",
    "detail.card1.copy": "Mapeamos procesos, cuellos de botella, sistemas existentes y oportunidades de automatización antes de proponer la solución.",
    "detail.card2.title": "Sistemas e integraciones",
    "detail.card2.copy": "Conectamos ERP, CRM, formularios, dashboards, APIs y herramientas internas en una rutina más fluida.",
    "detail.card3.title": "Datos e indicadores",
    "detail.card3.copy": "Creamos paneles ejecutivos para acompañar productividad, rendimiento comercial, operación y resultados.",
    "detail.card4.title": "Evolución continua",
    "detail.card4.copy": "Acompañamos mejoras, ajustes y soporte para que la tecnología siga acompañando al negocio.",
    "detail.process.eyebrow": "Método HGK",
    "detail.process.title": "De la idea al uso diario.",
    "detail.step1.title": "Entender",
    "detail.step1.copy": "Objetivos, rutina, sistemas y dolores de la operación.",
    "detail.step2.title": "Planificar",
    "detail.step2.copy": "Prioridades, arquitectura, etapas e indicadores del proyecto.",
    "detail.step3.title": "Implementar",
    "detail.step3.copy": "Desarrollo, integraciones, automatizaciones y validaciones.",
    "detail.step4.title": "Evolucionar",
    "detail.step4.copy": "Soporte, mejoras y seguimiento de resultados.",
  },
};

let currentLanguage = "pt";

function translate(key) {
  return translations[currentLanguage]?.[key] || translations.pt[key] || key;
}

function applyLanguage(language) {
  currentLanguage = translations[language] ? language : "pt";
  const meta = localeMeta[currentLanguage];
  const description = document.querySelector('meta[name="description"]');
  const isDetailPage = document.body.classList.contains("detail-page");

  document.documentElement.lang = meta.lang;
  document.title = translate(isDetailPage ? "detailMetaTitle" : "metaTitle");
  if (description) description.setAttribute("content", translate(isDetailPage ? "detailMetaDescription" : "metaDescription"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = translate(element.dataset.i18nHtml);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder));
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", translate(element.dataset.i18nAlt));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel));
  });

  if (localeFlag) {
    const image = localeFlag.querySelector("img") || document.createElement("img");
    image.src = meta.flagSrc;
    image.alt = "";
    localeFlag.replaceChildren(image);
  }
  if (localeCode) localeCode.textContent = meta.code;

  localeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === currentLanguage);
  });

  localStorage.setItem("hgk-language", currentLanguage);
}

function closeLocaleMenu() {
  localeSelector?.classList.remove("is-open");
  localeToggle?.setAttribute("aria-expanded", "false");
}

function toggleLocaleMenu() {
  const isOpen = localeSelector?.classList.toggle("is-open");
  localeToggle?.setAttribute("aria-expanded", String(Boolean(isOpen)));
}

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

function showContactInfoToast() {
  window.clearTimeout(contactToastTimer);

  const currentToast = document.querySelector(".support-toast");
  currentToast?.remove();

  const toast = document.createElement("div");
  toast.className = "support-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.innerHTML = `
    <span class="support-toast__icon" aria-hidden="true"></span>
    <span class="support-toast__content">
      <strong>${translate("contactToast.title")}</strong>
      <small>${translate("contactToast.copy")}</small>
    </span>
    <button class="support-toast__close" type="button" aria-label="Fechar aviso">×</button>
  `;

  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));

  const closeToast = () => {
    window.clearTimeout(contactToastTimer);
    toast.classList.remove("is-visible");
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 520);
  };

  toast.querySelector(".support-toast__close")?.addEventListener("click", closeToast);

  contactToastTimer = window.setTimeout(() => {
    closeToast();
  }, 2200);
}

contactInfoTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    showContactInfoToast();

    window.setTimeout(() => {
      document.querySelector("#contato")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 450);
  });
});

toggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", isOpen);
  header?.classList.toggle("nav-active", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
});

nav?.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  header?.classList.remove("nav-active");
  toggle.setAttribute("aria-expanded", "false");
});

form?.addEventListener("focusin", () => {
  if (contactFormStarted) return;
  contactFormStarted = true;
  trackEvent("contact_focus");
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  const originalText = translate("form.submit");

  button.textContent = "Enviando...";
  button.disabled = true;

  try {
    const payload = contactPayloadFromForm(form);
    await submitContactSubmission(payload);
    trackEvent("contact_submit", {
      metadata: {
        company: payload.company,
        goal: payload.goal,
        has_company: Boolean(payload.company),
      },
    });

    button.textContent = translate("form.success");
    window.setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      form.reset();
      contactFormStarted = false;
    }, 2200);
  } catch (error) {
    trackEvent("contact_submit_error", {
      metadata: {
        message: error.message,
      },
    });

    button.textContent = "Tente novamente";
    button.disabled = false;
  }
});

localeToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleLocaleMenu();
});

localeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
    closeLocaleMenu();
  });
});

document.addEventListener("click", (event) => {
  if (!localeSelector?.contains(event.target)) closeLocaleMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLocaleMenu();
});

function initTechCanvas() {
  if (!techCanvas) return;

  const context = techCanvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = 0;
  let isVisible = true;
  let lastFrame = 0;
  const frameInterval = 1000 / 24;

  function particleCount() {
    if (window.innerWidth < 620) return 16;
    if (window.innerWidth < 980) return 22;
    return 34;
  }

  function createParticle() {
    const speed = 0.18 + Math.random() * 0.42;
    const angle = Math.random() * Math.PI * 2;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1.1 + Math.random() * 1.8,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
    const rect = techCanvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    techCanvas.width = Math.floor(width * ratio);
    techCanvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: particleCount() }, createParticle);
  }

  function drawParticle(particle) {
    const glow = 0.45 + Math.sin(particle.pulse) * 0.22;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(175, 220, 255, ${glow})`;
    context.fill();
  }

  function drawConnections() {
    const maxDistance = Math.min(width, 320) * 0.28;

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 2) {
        const first = particles[i];
        const second = particles[j];
        const dx = first.x - second.x;
        const dy = first.y - second.y;
        const distance = Math.hypot(dx, dy);

        if (distance > maxDistance) continue;

        const opacity = (1 - distance / maxDistance) * 0.2;
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.strokeStyle = `rgba(111, 168, 220, ${opacity})`;
        context.lineWidth = 1;
        context.stroke();
      }
    }
  }

  function updateParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.pulse += 0.035;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;
  }

  function render(timestamp = 0) {
    if (!isVisible || document.hidden) {
      animationFrame = 0;
      return;
    }

    if (timestamp - lastFrame < frameInterval) {
      animationFrame = window.requestAnimationFrame(render);
      return;
    }

    lastFrame = timestamp;
    context.clearRect(0, 0, width, height);

    drawConnections();
    particles.forEach((particle) => {
      if (!reduceMotion.matches) updateParticle(particle);
      drawParticle(particle);
    });

    if (!reduceMotion.matches) {
      animationFrame = window.requestAnimationFrame(render);
    }
  }

  function start() {
    window.cancelAnimationFrame(animationFrame);
    resizeCanvas();
    render();
  }

  function resume() {
    if (!animationFrame && isVisible && !document.hidden && !reduceMotion.matches) {
      animationFrame = window.requestAnimationFrame(render);
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) resume();
    else {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  });

  observer.observe(techCanvas);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(start, 160);
  }, { passive: true });
  document.addEventListener("visibilitychange", resume);
  reduceMotion.addEventListener("change", start);
  start();
}

function initScrollReveal() {
  const revealGroups = [
    ".intro-visual",
    ".intro-text .section-heading",
    ".intro-copy p",
    ".solutions .section-heading",
    ".solution-card",
    ".feature-image",
    ".feature-content",
    ".innovation .section-heading",
    ".metric-grid article",
    ".final-cta > div",
    ".contact-form",
    ".site-footer > *",
    ".detail-hero-copy > *",
    ".detail-hero-panel",
    ".detail-heading > *",
    ".detail-grid article",
    ".detail-process > div",
    ".detail-process li",
  ];

  const elements = [...document.querySelectorAll(revealGroups.join(","))];
  if (!elements.length) return;

  const groupedSelectors = [".solution-card", ".metric-grid article", ".intro-copy p", ".detail-grid article", ".detail-process li"];

  elements.forEach((element) => {
    element.classList.add("reveal-element");

    const parent = groupedSelectors.find((selector) => element.matches(selector));
    if (!parent) return;

    const siblings = [...element.parentElement.querySelectorAll(parent)];
    const delayStep = element.matches(".detail-grid article") ? 35 : 55;
    element.style.setProperty("--reveal-delay", `${siblings.indexOf(element) * delayStep}ms`);
  });

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const exitsAbove = entry.boundingClientRect.top < 0;

      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        entry.target.classList.remove("is-exiting-up", "is-exiting-down");
        return;
      }

      entry.target.classList.remove("is-visible");
      entry.target.classList.toggle("is-exiting-up", exitsAbove);
      entry.target.classList.toggle("is-exiting-down", !exitsAbove);
    });
  }, {
    rootMargin: "-4% 0px -8% 0px",
    threshold: 0.22,
  });

  elements.forEach((element) => observer.observe(element));
}

function initAnalytics() {
  trackEvent("page_view", {
    metadata: {
      referrer: document.referrer || null,
    },
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a, button");
    if (!link) return;

    const label = (link.textContent || link.getAttribute("aria-label") || "").trim().slice(0, 120);
    const href = link.getAttribute("href") || null;
    const isContactLink = href === "#contato" || link.matches("[data-contact-info-trigger]");
    const isPrimaryCta = link.classList.contains("button") || link.classList.contains("header-client") || isContactLink;

    trackEvent(isPrimaryCta ? "cta_click" : "interaction_click", {
      element_label: label || null,
      element_href: href,
      metadata: {
        classes: link.className || null,
      },
    });
  }, { passive: true });

  const sections = [...document.querySelectorAll("section[id], main > section")];
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const seenSections = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const sectionId = entry.target.id || entry.target.className || "section";
      if (seenSections.has(sectionId)) return;

      seenSections.add(sectionId);
      trackEvent("section_view", {
        section_id: String(sectionId).slice(0, 120),
      });
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.36,
  });

  sections.forEach((section) => observer.observe(section));
}

updateHeader();
applyLanguage(localStorage.getItem("hgk-language") || "pt");
initAnalytics();
initTechCanvas();
initScrollReveal();
window.addEventListener("scroll", updateHeader, { passive: true });
