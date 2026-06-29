const config = window.HGK_SUPABASE || {};
const loginPanel = document.querySelector("[data-login-panel]");
const dashboardApp = document.querySelector("[data-dashboard-app]");
const loginForm = document.querySelector("[data-login-form]");
const loginMessage = document.querySelector("[data-login-message]");
const refreshButton = document.querySelector("[data-refresh]");
const logoutButton = document.querySelector("[data-logout]");
const loadingScreen = document.querySelector("[data-loading-screen]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const statusFilter = document.querySelector("[data-status-filter]");
const contactsTable = document.querySelector("[data-contacts-table]");
const dailyChart = document.querySelector("[data-daily-chart]");
const teamForm = document.querySelector("[data-team-form]");
const teamMessage = document.querySelector("[data-team-message]");
const teamList = document.querySelector("[data-team-list]");
const loginEventsList = document.querySelector("[data-login-events]");

const themeKey = "hgk-dashboard-theme";
const idleTimeoutMs = 15 * 60 * 1000;
let dashboardSession = null;
let idleTimer = null;
let contactsCache = [];
let dailyCache = [];
let teamCache = [];
let loginEventsCache = [];
let loadingStartedAt = 0;
let themeTransitionTimer = null;

function preferredTheme() {
  const saved = localStorage.getItem(themeKey);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme, animate = false) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  const currentTheme = document.body.dataset.theme;

  if (animate && currentTheme && currentTheme !== nextTheme) {
    window.clearTimeout(themeTransitionTimer);
    document.body.classList.remove("theme-transition");
    void document.body.offsetWidth;
    document.body.classList.add("theme-transition");
    themeTransitionTimer = window.setTimeout(() => {
      document.body.classList.remove("theme-transition");
    }, 760);
  }

  document.body.dataset.theme = nextTheme;
  localStorage.setItem(themeKey, nextTheme);

  if (themeToggle) {
    const isDark = nextTheme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Alternar modo claro" : "Alternar modo escuro");
  }

  if (themeLabel) {
    themeLabel.textContent = nextTheme === "dark" ? "Modo claro" : "Modo escuro";
  }
}

function hasConfig() {
  return Boolean(
    config.url &&
      config.anonKey &&
      !config.url.includes("SEU-PROJETO") &&
      !config.anonKey.includes("SUA_CHAVE")
  );
}

function baseUrl() {
  return config.url.replace(/\/$/, "");
}

function saveSession(session) {
  dashboardSession = session;
  resetIdleTimer();
}

function clearSession() {
  dashboardSession = null;
  window.clearTimeout(idleTimer);
}

function resetIdleTimer() {
  if (!dashboardSession) return;
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(async () => {
    try {
      await logout();
    } catch {
    }
    clearSession();
    showLogin("Sessao encerrada apos 15 minutos sem atividade.");
  }, idleTimeoutMs);
}

function showLoading() {
  loadingStartedAt = performance.now();
  loadingScreen.hidden = false;
}

async function hideLoading() {
  const elapsed = performance.now() - loadingStartedAt;
  const remaining = Math.max(0, 650 - elapsed);
  if (remaining) {
    await new Promise((resolve) => window.setTimeout(resolve, remaining));
  }
  loadingScreen.hidden = true;
}

function authHeaders() {
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${dashboardSession?.access_token || ""}`,
    "Content-Type": "application/json",
  };
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  let response;

  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...options,
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
      headers: {
        ...authHeaders(),
        ...options.headers,
      },
    });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      showLogin("Sessao expirada. Entre novamente.");
    }
    throw new Error(`Erro ${response.status}`);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function optionalRequest(path, fallback = [], options = {}) {
  try {
    return await request(path, options);
  } catch {
    return fallback;
  }
}

async function login(email, password) {
  const response = await fetch(`${baseUrl()}/auth/v1/token?grant_type=password`, {
    method: "POST",
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: {
      apikey: config.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Email ou senha invalidos.");
  }

  return response.json();
}

async function authorizeDashboardMember(email, fullName) {
  await request("/rest/v1/rpc/authorize_dashboard_member", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      member_email: email,
      member_name: fullName,
    }),
  });
}

async function logout() {
  if (!dashboardSession?.access_token || !hasConfig()) return;

  await fetch(`${baseUrl()}/auth/v1/logout`, {
    method: "POST",
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: authHeaders(),
  });
}

async function recordLoginEvent(eventType) {
  if (!dashboardSession?.user?.email || !hasConfig()) return;

  try {
    await request("/rest/v1/rpc/record_dashboard_login", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        event_type: eventType,
        user_agent: navigator.userAgent,
      }),
    });
  } catch {
  }
}

function showLogin(message = "") {
  loginPanel.hidden = false;
  dashboardApp.hidden = true;
  loginMessage.textContent = message;
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboardApp.hidden = false;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function setKpi(name, value) {
  const element = document.querySelector(`[data-kpi="${name}"]`);
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function whatsappHref(phone, name) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";

  const normalized = digits.length <= 11 ? `55${digits}` : digits;
  const message = encodeURIComponent(`Olá, ${name || "tudo bem"}! Aqui é da HGK Tech. Recebemos seu contato pelo site e gostaríamos de conversar sobre sua solicitação.`);
  return `https://wa.me/${normalized}?text=${message}`;
}

function renderTeam() {
  if (!teamList || !loginEventsList) return;

  if (!teamCache.length) {
    teamList.innerHTML = `<p class="empty-state">Nenhum funcionario autorizado.</p>`;
  } else {
    teamList.innerHTML = teamCache.map((member) => `
      <article class="team-member">
        <div>
          <strong>${escapeHtml(member.full_name || member.email)}</strong>
          <a href="mailto:${escapeHtml(member.email)}">${escapeHtml(member.email)}</a>
          <small>${member.is_active ? "Ativo" : "Bloqueado"} · ${escapeHtml(member.role || "operador")}</small>
        </div>
        <button class="team-status" type="button" data-toggle-member="${escapeHtml(member.email)}">
          ${member.is_active ? "Bloquear" : "Ativar"}
        </button>
      </article>
    `).join("");
  }

  if (!loginEventsCache.length) {
    loginEventsList.innerHTML = `<p class="empty-state">Nenhum login registrado.</p>`;
    return;
  }

  loginEventsList.innerHTML = loginEventsCache.map((event) => `
    <article class="login-event">
      <div>
        <strong>${escapeHtml(event.email)}</strong>
        <small>${event.event_type === "logout" ? "Saiu" : "Entrou"} em ${formatDate(event.created_at)}</small>
      </div>
    </article>
  `).join("");
}

function renderContacts() {
  const filter = statusFilter.value;
  const contacts = filter ? contactsCache.filter((item) => item.status === filter) : contactsCache;

  if (!contacts.length) {
    contactsTable.innerHTML = `<p class="empty-state">Nenhum contato encontrado.</p>`;
    return;
  }

  contactsTable.innerHTML = contacts.map((contact) => {
    const hasPhone = Boolean(contact.phone);

    return `
      <article class="contact-card">
      <div class="contact-main ${hasPhone ? "" : "without-whatsapp"}">
        <div>
          <span class="contact-label">Cliente</span>
          <strong>${escapeHtml(contact.name)}</strong>
          <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>
          ${hasPhone ? `<small>${escapeHtml(contact.phone)}</small>` : ""}
        </div>
        <div class="contact-actions">
          <span class="contact-label">Contato</span>
          <a class="contact-action" href="mailto:${escapeHtml(contact.email)}?subject=${encodeURIComponent("Contato HGK Tech")}" target="_blank" rel="noopener">E-mail</a>
          ${hasPhone ? `<a class="contact-action whatsapp" href="${whatsappHref(contact.phone, contact.name)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
        </div>
        <div>
          <span class="contact-label">Status</span>
        <select class="status-select" data-contact-status="${contact.id}">
          ${["novo", "em_contato", "convertido", "arquivado"].map((status) => `
            <option value="${status}" ${contact.status === status ? "selected" : ""}>${status.replace("_", " ")}</option>
          `).join("")}
        </select>
        </div>
      </div>
      <div class="contact-details">
        <div>
          <span class="contact-label">Empresa</span>
          <strong>${escapeHtml(contact.company || "Sem empresa")}</strong>
        </div>
        <div>
          <span class="contact-label">Objetivo</span>
          <strong>${escapeHtml(contact.goal || "-")}</strong>
        </div>
        <div>
          <span class="contact-label">Recebido</span>
          <strong>${formatDate(contact.created_at)}</strong>
        </div>
      </div>
    </article>
    `;
  }).join("");
}

function renderDailyChart(days) {
  const ordered = [...days].reverse();
  const maxViews = Math.max(1, ...ordered.map((day) => Number(day.page_views || 0)));

  if (!ordered.length) {
    dailyChart.innerHTML = `<p class="chart-empty">Sem dados nos ultimos 14 dias.</p>`;
    return;
  }

  const totalViews = ordered.reduce((sum, day) => sum + Number(day.page_views || 0), 0);
  const totalContacts = ordered.reduce((sum, day) => sum + Number(day.contact_submits || 0), 0);
  const bars = ordered.map((day) => {
    const views = Number(day.page_views || 0);
    const contacts = Number(day.contact_submits || 0);
    const height = Math.max(5, Math.round((views / maxViews) * 100));
    const label = new Date(`${day.day}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    return `
      <div class="chart-bar-item" title="${views} visualizacoes | ${contacts} contatos">
        <span class="chart-bar-value">${views}</span>
        <span class="chart-bar-track">
          <span class="chart-bar-fill" style="height: ${height}%"></span>
          ${contacts ? `<span class="chart-contact-marker">${contacts}</span>` : ""}
        </span>
        <span class="chart-bar-label">${label}</span>
      </div>
    `;
  }).join("");

  dailyChart.innerHTML = `
    <div class="chart-summary">
      <div>
        <span>Visualizacoes</span>
        <strong>${totalViews}</strong>
      </div>
      <div>
        <span>Contatos</span>
        <strong>${totalContacts}</strong>
      </div>
    </div>
    <div class="chart-bars" aria-label="Visualizacoes e contatos dos ultimos 14 dias">
      ${bars}
    </div>
    <div class="chart-legend">
      <span><i></i> Visualizacoes</span>
      <span><i></i> Contatos enviados</span>
    </div>
  `;
}

function renderKpis(contacts, days) {
  const pageViews = days.reduce((sum, day) => sum + Number(day.page_views || 0), 0);
  const newContacts = contacts.filter((contact) => contact.status === "novo").length;
  const conversion = pageViews ? `${((contacts.length / pageViews) * 100).toFixed(1)}%` : "0%";

  setKpi("contacts", contacts.length);
  setKpi("newContacts", newContacts);
  setKpi("pageViews", pageViews);
  setKpi("conversion", conversion);
}

async function loadDashboard() {
  if (!hasConfig()) {
    showLogin("Preencha supabase-config.js com URL e anon key.");
    return;
  }

  const [contacts, days, members, loginEvents] = await Promise.all([
    request("/rest/v1/rpc/list_contact_submissions", {
      method: "POST",
      body: JSON.stringify({ result_limit: 100 }),
    }),
    request("/rest/v1/analytics_daily_summary?select=*&order=day.desc&limit=14"),
    optionalRequest("/rest/v1/dashboard_admins?select=*&order=created_at.desc"),
    optionalRequest("/rest/v1/rpc/list_dashboard_logins", [], {
      method: "POST",
      body: "{}",
    }),
  ]);

  contactsCache = contacts || [];
  dailyCache = days || [];
  teamCache = members || [];
  loginEventsCache = loginEvents || [];
  renderContacts();
  renderDailyChart(dailyCache);
  renderKpis(contactsCache, dailyCache);
  renderTeam();
  showDashboard();
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  if (!hasConfig()) {
    loginMessage.textContent = "Preencha supabase-config.js antes de entrar.";
    return;
  }

  const button = loginForm.querySelector("button");
  const data = new FormData(loginForm);
  button.disabled = true;
  button.textContent = "Entrando...";
  showLoading();

  try {
    const session = await login(data.get("email"), data.get("password"));
    saveSession(session);
    await recordLoginEvent("login");
    await loadDashboard();
    loginForm.reset();
  } catch (error) {
    showLogin(error.message);
    loginMessage.textContent = error.message;
  } finally {
    await hideLoading();
    button.disabled = false;
    button.textContent = "Entrar";
  }
});

contactsTable?.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-contact-status]");
  if (!select) return;

  const id = select.dataset.contactStatus;
  await request("/rest/v1/rpc/update_contact_status", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ contact_id: id, next_status: select.value }),
  });

  const contact = contactsCache.find((item) => item.id === id);
  if (contact) contact.status = select.value;
  renderKpis(contactsCache, dailyCache);
});

statusFilter?.addEventListener("change", renderContacts);
teamForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  teamMessage.textContent = "";

  const button = teamForm.querySelector("button");
  const data = new FormData(teamForm);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const fullName = String(data.get("name") || "").trim() || null;

  if (!email) {
    teamMessage.textContent = "Informe o email do usuario ja criado no Supabase Auth.";
    return;
  }

  button.disabled = true;
  button.textContent = "Autorizando...";

  try {
    await authorizeDashboardMember(email, fullName);
    teamMessage.textContent = "Usuario existente autorizado com sucesso.";
    teamForm.reset();
    await loadDashboard();
  } catch (error) {
    teamMessage.textContent = "Nao foi possivel autorizar. Crie o usuario no Supabase Auth e confirme que sua conta tem perfil proprietario.";
  } finally {
    button.disabled = false;
    button.textContent = "Autorizar acesso";
  }
});

teamList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-toggle-member]");
  if (!button) return;

  const email = button.dataset.toggleMember;
  const member = teamCache.find((item) => item.email === email);
  if (!member) return;

  button.disabled = true;
  await request(`/rest/v1/dashboard_admins?email=eq.${encodeURIComponent(email)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_active: !member.is_active }),
  });
  await loadDashboard();
});

themeToggle?.addEventListener("click", () => {
  applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark", true);
});
refreshButton?.addEventListener("click", async () => {
  showLoading();
  try {
    await loadDashboard();
  } finally {
    await hideLoading();
  }
});
logoutButton?.addEventListener("click", async () => {
  showLoading();
  try {
    await recordLoginEvent("logout");
    await logout();
  } catch {
  } finally {
    clearSession();
    showLogin("");
    await hideLoading();
  }
});

applyTheme(preferredTheme());

["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
  document.addEventListener(eventName, resetIdleTimer, { passive: true });
});

showLogin(hasConfig() ? "" : "Preencha supabase-config.js com URL e anon key.");
