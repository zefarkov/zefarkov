(function () {
  const data = window.PORTFOLIO_DATA;
  const state = { lang: localStorage.getItem("portfolio-lang") || "ru" };
  const $ = (selector) => document.querySelector(selector);
  const menuToggle = $(".menu-toggle");
  const navSide = $(".nav-side");

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

  function pack() {
    return data.languages[state.lang] || data.languages.ru;
  }

  function setMeta(lang) {
    document.title = lang.metaTitle;
    document.documentElement.lang = state.lang;
    const description = $('meta[name="description"]');
    if (description) description.content = lang.metaDescription;
  }

  function renderNav(lang) {
    $("#brand-text").textContent = lang.brand;
    $("#nav-experience").textContent = lang.nav.experience;
    $("#nav-skills").textContent = lang.nav.skills;
    $("#nav-certifications").textContent = lang.nav.certifications;
    $("#nav-contact").textContent = lang.nav.contact;
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === state.lang);
    });
  }

  function renderHero(lang) {
    $("#hero-title").textContent = lang.hero.title;
    $("#hero-text").textContent = lang.hero.text;
    $("#hero-cv").textContent = lang.hero.cv;
    $("#hero-cv").href = data.config.cv[state.lang] || data.config.cv.ru;
    $("#hero-telegram").href = data.config.telegram;
    $("#hero-linkedin").href = data.config.linkedin;
    $("#hero-email").href = `mailto:${data.config.email}`;

    const facts = $("#facts");
    facts.innerHTML = "";
    data.facts.forEach((item) => {
      const value = typeof item.value === "object" ? item.value[state.lang] : item.value;
      const label = typeof item.label === "object" ? item.label[state.lang] : item.label;
      const node = document.createElement("div");
      node.className = "fact";
      node.innerHTML = `<strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span>`;
      facts.appendChild(node);
    });
  }

  function renderExperience(lang) {
    $("#experience-title").textContent = lang.experience.title;
    const wrap = $("#experience-list");
    wrap.innerHTML = "";
    lang.experience.items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "timeline-item";
      article.innerHTML = `
        <div class="timeline-date">${escapeHtml(item.date)}</div>
        <div class="timeline-main">
          <div class="job-line"><h3>${escapeHtml(item.role)}</h3><span>${escapeHtml(item.company)}</span></div>
          <p>${escapeHtml(item.tech)}</p>
        </div>`;
      wrap.appendChild(article);
    });
  }

  function renderSkills(lang) {
    $("#skills-title").textContent = lang.skills.title;
    const wrap = $("#skills-list");
    wrap.innerHTML = "";
    lang.skills.groups.forEach((group) => {
      const row = document.createElement("div");
      row.className = "stack-row";
      row.innerHTML = `<strong>${escapeHtml(group.title)}</strong><span>${escapeHtml(group.value)}</span>`;
      wrap.appendChild(row);
    });
  }

  function renderCerts(lang) {
    $("#certs-title").textContent = lang.certifications.title;
    const wrap = $("#certs-list");
    wrap.innerHTML = "";
    lang.certifications.items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "cert-card";
      card.innerHTML = `
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />
        <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.issuer)}</p></div>`;
      wrap.appendChild(card);
    });
  }

  function renderContact(lang) {
    $("#contact-title").textContent = lang.contact.title;
    const items = [
      [lang.contact.labels.email, data.config.email, `mailto:${data.config.email}`],
      [lang.contact.labels.phone, data.config.phone, `tel:${data.config.phone.replace(/\s/g, "")}`],
      [lang.contact.labels.telegram, "@zefarkov", data.config.telegram],
      [lang.contact.labels.linkedin, "linkedin.com/in/zefarkov", data.config.linkedin],
      [lang.contact.labels.location, lang.contact.location, ""]
    ];
    const wrap = $("#contact-list");
    wrap.innerHTML = "";
    items.forEach(([label, value, href]) => {
      const row = document.createElement("div");
      row.className = "contact-row";
      row.innerHTML = href
        ? `<span>${escapeHtml(label)}</span><a href="${escapeHtml(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(value)}</a>`
        : `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
      wrap.appendChild(row);
    });
  }

  function renderFooter(lang) {
    $("#footer-text").textContent = `© ${lang.brand} · ${lang.footer}`;
  }

  function renderAll() {
    const lang = pack();
    setMeta(lang);
    renderNav(lang);
    renderHero(lang);
    renderExperience(lang);
    renderSkills(lang);
    renderCerts(lang);
    renderContact(lang);
    renderFooter(lang);
    localStorage.setItem("portfolio-lang", state.lang);
  }

  function normalizeProductionUrl() {
    const host = window.location.hostname.toLowerCase();
    if (host === "www.zefarkov.uz") {
      window.location.replace("https://zefarkov.uz/");
      return;
    }
    if (host === "zefarkov.uz" && (window.location.pathname !== "/" || window.location.search || window.location.hash)) {
      history.replaceState(null, "", "/");
    }
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lang = btn.dataset.lang;
      renderAll();
      closeMenu();
    });
  });

  document.querySelectorAll("[data-scroll-target]").forEach((node) => {
    node.addEventListener("click", () => {
      const target = document.getElementById(node.dataset.scrollTarget);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      normalizeProductionUrl();
      closeMenu();
    });
  });

  menuToggle?.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  const profile = $("#profile-photo");
  profile.src = data.config.profileImage;
  profile.alt = "Farrukh Abdurazzokov";

  normalizeProductionUrl();
  renderAll();
})();
