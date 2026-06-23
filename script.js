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

const localeMeta = {
  pt: { code: "BR", flag: "🇧🇷", lang: "pt-BR" },
  es: { code: "ES", flag: "🇪🇸", lang: "es" },
  en: { code: "EN", flag: "🇺🇸", lang: "en" },
};

const translations = {
  pt: {
    metaTitle: "HGK | Tecnologia para empresas que fazem acontecer",
    metaDescription: "Solucoes digitais, automacao e inteligencia de dados para empresas que precisam crescer com eficiencia.",
    "language.select": "Selecionar idioma",
    "nav.openMenu": "Abrir menu",
    "nav.business": "Unidades de negocio",
    "nav.products": "Produtos",
    "nav.segments": "Segmentos",
    "nav.about": "Sobre",
    "nav.call": "LIGAMOS PARA VOCE",
    "nav.client": "SOU CLIENTE",
    "hero.title": "TECNOLOGIA PARA SUA OPERACAO.",
    "hero.copy": "Automacao, dados e sistemas integrados para sua empresa evoluir.",
    "hero.button": "SAIBA MAIS",
    "trust.projects": "projetos entregues",
    "trust.sectorsNumber": "9 setores",
    "trust.sectors": "atendidos com tecnologia",
    "trust.monitoring": "monitoramento de sistemas",
    "trust.clients": "clientes em evolucao continua",
    "intro.eyebrow": "Empresas que movem o mercado precisam de base digital",
    "intro.title": "Conectamos estrategia, sistemas e pessoas em uma operacao mais fluida.",
    "intro.copy1": "A HGK cria ambientes digitais para gestao empresarial, integrando processos comerciais, financeiros, logistica, atendimento e indicadores em uma unica visao de negocio.",
    "intro.copy2": "Nosso trabalho combina consultoria, desenvolvimento e sustentacao para que a tecnologia deixe de ser obstaculo e passe a acelerar decisoes.",
    "solutions.eyebrow": "Solucoes",
    "solutions.title": "Portifolio para digitalizar a gestao da sua empresa.",
    "solutions.card1.title": "Gestao integrada",
    "solutions.card1.copy": "ERP, CRM e fluxos conectados para organizar rotinas, reduzir retrabalho e dar previsibilidade.",
    "solutions.card2.title": "Automacao de processos",
    "solutions.card2.copy": "Robos, formularios e integracoes que eliminam tarefas manuais e aceleram a operacao.",
    "solutions.card3.title": "Dados e analytics",
    "solutions.card3.copy": "Paineis executivos, indicadores de performance e modelos de decisao orientados por dados.",
    "common.learnMore": "Saiba mais",
    "segments.imageAlt": "Equipe analisando dados em um painel digital",
    "segments.listLabel": "Segmentos atendidos",
    "segments.eyebrow": "Segmentos",
    "segments.title": "Atuamos perto da rotina de quem vende, produz, entrega e atende.",
    "segments.list.services": "Servicos",
    "segments.list.retail": "Varejo",
    "segments.list.distribution": "Distribuicao",
    "segments.list.health": "Saude",
    "segments.list.education": "Educacao",
    "segments.list.industry": "Industria",
    "segments.copy": "Cada implantacao parte do seu processo real: metas, gargalos, times envolvidos, sistemas legados e o nivel de maturidade digital da empresa.",
    "results.eyebrow": "Inovacao na pratica",
    "results.title": "Uma operacao mais inteligente aparece nos indicadores.",
    "results.metric1": "menos tempo em tarefas administrativas apos automacoes.",
    "results.metric2": "mais velocidade para consolidar relatorios gerenciais.",
    "results.metric3": "para colocar os primeiros fluxos digitais em producao.",
    "content.eyebrow": "Conteudos que ajudam sua empresa",
    "content.title": "Ideias para entender tendencias e melhorar a gestao.",
    "content.card1.alt": "Painel de dados em uma tela",
    "content.card1.type": "Guia",
    "content.card1.title": "Como escolher indicadores que realmente movem a operacao",
    "content.card2.alt": "Profissionais em reuniao de planejamento",
    "content.card2.type": "Artigo",
    "content.card2.title": "Automacao empresarial: por onde comecar sem travar o time",
    "content.card3.alt": "Pessoa trabalhando em notebook com graficos",
    "content.card3.type": "Checklist",
    "content.card3.title": "O que revisar antes de integrar sistemas internos",
    "content.read": "Ler conteudo",
    "contact.eyebrow": "Conte com a HGK",
    "contact.title": "Vamos potencializar o crescimento da sua empresa.",
    "form.label": "Formulario de contato",
    "form.name": "Nome",
    "form.namePlaceholder": "Seu nome",
    "form.email": "E-mail",
    "form.emailPlaceholder": "voce@empresa.com",
    "form.company": "Empresa",
    "form.companyPlaceholder": "Nome da empresa",
    "form.goal": "Objetivo",
    "form.option1": "Digitalizar processos",
    "form.option2": "Integrar sistemas",
    "form.option3": "Criar dashboards",
    "form.option4": "Solicitar consultoria",
    "form.submit": "Solicitar contato",
    "form.success": "Contato solicitado",
    "footer.copy": "© 2026 HGK. Tecnologia para gestao, dados e automacao.",
    "footer.solutions": "Solucoes",
    "footer.segments": "Segmentos",
    "footer.contact": "Contato",
  },
  en: {
    metaTitle: "HGK | Technology for companies that get things done",
    metaDescription: "Digital solutions, automation, and data intelligence for companies that need to grow efficiently.",
    "language.select": "Select language",
    "nav.openMenu": "Open menu",
    "nav.business": "Business units",
    "nav.products": "Products",
    "nav.segments": "Segments",
    "nav.about": "About",
    "nav.call": "WE CALL YOU",
    "nav.client": "I AM A CLIENT",
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
    "solutions.eyebrow": "Solutions",
    "solutions.title": "A portfolio to digitize your company's management.",
    "solutions.card1.title": "Integrated management",
    "solutions.card1.copy": "ERP, CRM, and connected workflows to organize routines, reduce rework, and create predictability.",
    "solutions.card2.title": "Process automation",
    "solutions.card2.copy": "Bots, forms, and integrations that eliminate manual tasks and speed up operations.",
    "solutions.card3.title": "Data and analytics",
    "solutions.card3.copy": "Executive dashboards, performance indicators, and decision models guided by data.",
    "common.learnMore": "Learn more",
    "segments.imageAlt": "Team analyzing data on a digital dashboard",
    "segments.listLabel": "Served segments",
    "segments.eyebrow": "Segments",
    "segments.title": "We work close to the routine of teams that sell, produce, deliver, and support.",
    "segments.list.services": "Services",
    "segments.list.retail": "Retail",
    "segments.list.distribution": "Distribution",
    "segments.list.health": "Healthcare",
    "segments.list.education": "Education",
    "segments.list.industry": "Industry",
    "segments.copy": "Every implementation starts from your real process: goals, bottlenecks, teams involved, legacy systems, and the company's digital maturity level.",
    "results.eyebrow": "Innovation in practice",
    "results.title": "A smarter operation shows up in the indicators.",
    "results.metric1": "less time spent on administrative tasks after automation.",
    "results.metric2": "more speed to consolidate management reports.",
    "results.metric3": "to put the first digital workflows into production.",
    "content.eyebrow": "Content that helps your company",
    "content.title": "Ideas to understand trends and improve management.",
    "content.card1.alt": "Data dashboard on a screen",
    "content.card1.type": "Guide",
    "content.card1.title": "How to choose indicators that truly move the operation",
    "content.card2.alt": "Professionals in a planning meeting",
    "content.card2.type": "Article",
    "content.card2.title": "Business automation: where to start without blocking the team",
    "content.card3.alt": "Person working on a laptop with charts",
    "content.card3.type": "Checklist",
    "content.card3.title": "What to review before integrating internal systems",
    "content.read": "Read content",
    "contact.eyebrow": "Count on HGK",
    "contact.title": "Let's boost your company's growth.",
    "form.label": "Contact form",
    "form.name": "Name",
    "form.namePlaceholder": "Your name",
    "form.email": "Email",
    "form.emailPlaceholder": "you@company.com",
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
    "footer.solutions": "Solutions",
    "footer.segments": "Segments",
    "footer.contact": "Contact",
  },
  es: {
    metaTitle: "HGK | Tecnologia para empresas que hacen que las cosas sucedan",
    metaDescription: "Soluciones digitales, automatizacion e inteligencia de datos para empresas que necesitan crecer con eficiencia.",
    "language.select": "Seleccionar idioma",
    "nav.openMenu": "Abrir menu",
    "nav.business": "Unidades de negocio",
    "nav.products": "Productos",
    "nav.segments": "Segmentos",
    "nav.about": "Sobre nosotros",
    "nav.call": "TE LLAMAMOS",
    "nav.client": "SOY CLIENTE",
    "hero.title": "TECNOLOGIA PARA TU OPERACION.",
    "hero.copy": "Automatizacion, datos y sistemas integrados para que tu empresa evolucione.",
    "hero.button": "SABER MAS",
    "trust.projects": "proyectos entregados",
    "trust.sectorsNumber": "9 sectores",
    "trust.sectors": "atendidos con tecnologia",
    "trust.monitoring": "monitoreo de sistemas",
    "trust.clients": "clientes en evolucion continua",
    "intro.eyebrow": "Las empresas que mueven el mercado necesitan una base digital",
    "intro.title": "Conectamos estrategia, sistemas y personas en una operacion mas fluida.",
    "intro.copy1": "HGK crea entornos digitales para la gestion empresarial, integrando procesos comerciales, financieros, logistica, atencion e indicadores en una unica vision del negocio.",
    "intro.copy2": "Nuestro trabajo combina consultoria, desarrollo y soporte para que la tecnologia deje de ser un obstaculo y acelere decisiones.",
    "solutions.eyebrow": "Soluciones",
    "solutions.title": "Portafolio para digitalizar la gestion de tu empresa.",
    "solutions.card1.title": "Gestion integrada",
    "solutions.card1.copy": "ERP, CRM y flujos conectados para organizar rutinas, reducir retrabajo y dar previsibilidad.",
    "solutions.card2.title": "Automatizacion de procesos",
    "solutions.card2.copy": "Bots, formularios e integraciones que eliminan tareas manuales y aceleran la operacion.",
    "solutions.card3.title": "Datos y analytics",
    "solutions.card3.copy": "Paneles ejecutivos, indicadores de rendimiento y modelos de decision orientados por datos.",
    "common.learnMore": "Saber mas",
    "segments.imageAlt": "Equipo analizando datos en un panel digital",
    "segments.listLabel": "Segmentos atendidos",
    "segments.eyebrow": "Segmentos",
    "segments.title": "Actuamos cerca de la rutina de quienes venden, producen, entregan y atienden.",
    "segments.list.services": "Servicios",
    "segments.list.retail": "Retail",
    "segments.list.distribution": "Distribucion",
    "segments.list.health": "Salud",
    "segments.list.education": "Educacion",
    "segments.list.industry": "Industria",
    "segments.copy": "Cada implementacion parte de tu proceso real: metas, cuellos de botella, equipos involucrados, sistemas heredados y nivel de madurez digital de la empresa.",
    "results.eyebrow": "Innovacion en la practica",
    "results.title": "Una operacion mas inteligente aparece en los indicadores.",
    "results.metric1": "menos tiempo en tareas administrativas despues de automatizaciones.",
    "results.metric2": "mas velocidad para consolidar informes gerenciales.",
    "results.metric3": "para poner los primeros flujos digitales en produccion.",
    "content.eyebrow": "Contenidos que ayudan a tu empresa",
    "content.title": "Ideas para entender tendencias y mejorar la gestion.",
    "content.card1.alt": "Panel de datos en una pantalla",
    "content.card1.type": "Guia",
    "content.card1.title": "Como elegir indicadores que realmente mueven la operacion",
    "content.card2.alt": "Profesionales en una reunion de planificacion",
    "content.card2.type": "Articulo",
    "content.card2.title": "Automatizacion empresarial: por donde empezar sin frenar al equipo",
    "content.card3.alt": "Persona trabajando en una laptop con graficos",
    "content.card3.type": "Checklist",
    "content.card3.title": "Que revisar antes de integrar sistemas internos",
    "content.read": "Leer contenido",
    "contact.eyebrow": "Cuenta con HGK",
    "contact.title": "Vamos a potenciar el crecimiento de tu empresa.",
    "form.label": "Formulario de contacto",
    "form.name": "Nombre",
    "form.namePlaceholder": "Tu nombre",
    "form.email": "E-mail",
    "form.emailPlaceholder": "tu@empresa.com",
    "form.company": "Empresa",
    "form.companyPlaceholder": "Nombre de la empresa",
    "form.goal": "Objetivo",
    "form.option1": "Digitalizar procesos",
    "form.option2": "Integrar sistemas",
    "form.option3": "Crear dashboards",
    "form.option4": "Solicitar consultoria",
    "form.submit": "Solicitar contacto",
    "form.success": "Solicitud enviada",
    "footer.copy": "© 2026 HGK. Tecnologia para gestion, datos y automatizacion.",
    "footer.solutions": "Soluciones",
    "footer.segments": "Segmentos",
    "footer.contact": "Contacto",
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

  document.documentElement.lang = meta.lang;
  document.title = translate("metaTitle");
  if (description) description.setAttribute("content", translate("metaDescription"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
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

  if (localeFlag) localeFlag.textContent = meta.flag;
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
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", isOpen);
  header.classList.toggle("nav-active", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  header.classList.remove("nav-active");
  toggle.setAttribute("aria-expanded", "false");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.textContent = translate("form.success");
  button.disabled = true;

  window.setTimeout(() => {
    button.textContent = translate("form.submit");
    button.disabled = false;
    form.reset();
  }, 2200);
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
      animationFrame = window.requestAnimationFrame(render);
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

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
  });

  observer.observe(techCanvas);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(start, 160);
  }, { passive: true });
  reduceMotion.addEventListener("change", start);
  start();
}

updateHeader();
applyLanguage(localStorage.getItem("hgk-language") || "pt");
initTechCanvas();
window.addEventListener("scroll", updateHeader, { passive: true });
