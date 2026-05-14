(function () {
  const data = window.PORTFOLIO_DATA;
  const state = { lang: "en" };
  const menuToggle = document.querySelector(".menu-toggle");
  const navSide = document.querySelector(".nav-side");
  const themeToggle = document.querySelector("#theme-toggle");
  const themeLabel = document.querySelector("#theme-label");
  const themeState = {
    value: localStorage.getItem("portfolio-theme") || "dark"
  };

  const $ = (selector) => document.querySelector(selector);
  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };

  const escapeHtml = (value = "") =>
    value.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

  function getLangPack() {
    return data.languages[state.lang];
  }

  function setMeta(langPack) {
    document.title = langPack.metaTitle;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", langPack.metaDescription);
    document.documentElement.lang = state.lang;
  }

  function setActiveLangButtons() {
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === state.lang);
    });
  }

  function applyTheme() {
    const isLight = themeState.value === "light";
    document.documentElement.dataset.theme = themeState.value;
    themeToggle?.setAttribute("aria-pressed", String(isLight));
    themeToggle?.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    if (themeLabel) themeLabel.textContent = isLight ? "🔆" : "🌙";
  }

  function renderNav(langPack) {
    $("#brand-text").textContent = langPack.brand;
    $("#nav-about").textContent = langPack.nav.about;
    $("#nav-experience").textContent = langPack.nav.experience;
    $("#nav-skills").textContent = langPack.nav.skills;
    $("#nav-projects").textContent = langPack.nav.projects;
    $("#nav-certifications").textContent = langPack.nav.certifications;
    $("#nav-contact").textContent = langPack.nav.contact;
  }

  function renderHero(langPack) {
    $("#hero-title").innerHTML = escapeHtml(langPack.hero.title).replace(
      escapeHtml(langPack.hero.titleAccent),
      `<span>${escapeHtml(langPack.hero.titleAccent)}</span>`
    );
    $("#hero-text").textContent = langPack.hero.text;
    $("#hero-primary").textContent = langPack.hero.primaryBtn;
    $("#hero-secondary").textContent = langPack.hero.secondaryBtn;
    $("#hero-cv").textContent = langPack.hero.cvBtn;

    $("#summary-role").textContent = langPack.hero.sideRole;

    const tagWrap = $("#hero-tags");
    tagWrap.innerHTML = "";
    langPack.hero.tags.forEach((tag) => {
      tagWrap.appendChild(el("span", "tag", escapeHtml(tag)));
    });

    const cvPath = state.lang === "en" ? data.config.cv.en : data.config.cv.ru;
    $("#hero-cv").setAttribute("href", cvPath);
  }

  function renderStats() {
    const wrap = $("#stats");
    wrap.innerHTML = "";
    data.stats.forEach((item) => {
      const card = el("div", "stat");
      const value = typeof item.value === "object" ? item.value[state.lang] : item.value;
      card.innerHTML = `<strong>${escapeHtml(value)}</strong><span>${escapeHtml(item.label[state.lang])}</span>`;
      wrap.appendChild(card);
    });
  }

  function renderListCard(rootId, section) {
    const root = $(rootId);
    root.querySelector("h2").textContent = section.title;
    const text = root.querySelector("p");
    if (text) text.textContent = section.text || "";
    const list = root.querySelector("ul");
    list.innerHTML = "";
    section.points.forEach((point) => list.appendChild(el("li", "", escapeHtml(point))));
  }

  function renderExperience(langPack) {
    $("#experience-title").textContent = langPack.experience.title;
    const wrap = $("#experience-list");
    wrap.innerHTML = "";
    langPack.experience.items.forEach((item) => {
      const article = el("article", "timeline-item");
      article.innerHTML = `
        <div class="timeline-date">${escapeHtml(item.date)}</div>
        <div class="timeline-body">
          <h3>${escapeHtml(item.role)}</h3>
          <div class="sub">${escapeHtml(item.company)}</div>
          <p>${escapeHtml(item.description)}</p>
        </div>
      `;
      wrap.appendChild(article);
    });
  }

  function renderSkills(langPack) {
    $("#skills-title").textContent = langPack.skills.title;
    const wrap = $("#skills-list");
    wrap.innerHTML = "";
    langPack.skills.groups.forEach((group) => {
      const box = el("article", "skill-box");
      const chips = group.items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("");
      box.innerHTML = `<h3>${escapeHtml(group.title)}</h3><div class="chip-wrap">${chips}</div>`;
      wrap.appendChild(box);
    });
  }

  function renderProjects(langPack) {
    $("#projects-title").textContent = langPack.projects.title;
    const wrap = $("#projects-list");
    wrap.innerHTML = "";
    langPack.projects.items.forEach((item) => {
      const card = el("article", "project-card");
      card.innerHTML = `
        <div class="project-top">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="badge">${escapeHtml(item.badge)}</span>
        </div>
        <p>${escapeHtml(item.text)}</p>
      `;
      wrap.appendChild(card);
    });
  }

  function renderCerts(langPack) {
    $("#certs-title").textContent = langPack.certifications.title;
    const wrap = $("#certs-list");
    wrap.innerHTML = "";
    langPack.certifications.items.forEach((item) => {
      const card = el("article", "cert-card");
      const imageHtml = item.image
        ? `<img class="cert-media" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />`
        : `<div class="empty-state">Add certificate image to <strong>assets/images/</strong> and set its path in <strong>content.js</strong>.</div>`;
      card.innerHTML = `
        ${imageHtml}
        <div class="cert-top">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="badge">${escapeHtml(item.badge)}</span>
        </div>
        <p>${escapeHtml(item.text)}</p>
      `;
      wrap.appendChild(card);
    });
  }

  function renderContact(langPack) {
    $("#contact-title").textContent = langPack.contact.title;

    const labels = langPack.contact.labels;
    $("#contact-email-label").textContent = labels.email;
    $("#contact-phone-label").textContent = labels.phone;
    $("#contact-location-label").textContent = labels.location;
    $("#contact-telegram-label").textContent = labels.telegram;
    $("#contact-linkedin-label").textContent = labels.linkedin;
    $("#contact-github-label").textContent = labels.github;

    $("#contact-email-value").textContent = data.config.email;
    $("#contact-phone-value").textContent = data.config.phone;
    $("#contact-location-value").textContent = data.config.location;

    setContactLink("#contact-telegram-value", data.config.telegram);
    setContactLink("#contact-linkedin-value", data.config.linkedin);
    setContactLink("#contact-github-value", data.config.github);

    $("#label-name").textContent = labels.formName;
    $("#label-email").textContent = labels.formEmail;
    $("#label-message").textContent = labels.formMessage;
    $("#send-btn").textContent = labels.formButton;
    $("#form-note").textContent = labels.note || "";

    const form = $("#contact-form");
    form.action = data.config.formAction || "";
    form.dataset.lang = state.lang;
  }

  function setContactLink(selector, value) {
    const node = $(selector);
    if (!value) {
      node.textContent = "-";
      node.removeAttribute("href");
      node.classList.remove("contact-link");
      return;
    }
    node.textContent = value;
    node.setAttribute("href", value);
    node.classList.add("contact-link");
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }

  function renderFooter(langPack) {
    $("#footer-text").textContent = `©️ ${langPack.brand}. ${langPack.footer}05/2026`;
  }

  function renderEverything() {
    const langPack = getLangPack();
    setMeta(langPack);
    setActiveLangButtons();
    renderNav(langPack);
    renderHero(langPack);
    renderStats();
    renderListCard("#about-card", langPack.about);
    renderListCard("#value-card", langPack.value);
    renderExperience(langPack);
    renderSkills(langPack);
    renderProjects(langPack);
    renderCerts(langPack);
    renderContact(langPack);
    renderFooter(langPack);
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }

  menuToggle?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  themeToggle?.addEventListener("click", () => {
    themeState.value = themeState.value === "dark" ? "light" : "dark";
    localStorage.setItem("portfolio-theme", themeState.value);
    applyTheme();
  });

  navSide?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lang = btn.dataset.lang;
      renderEverything();
      closeMenu();
    });
  });

  $("#contact-form").addEventListener("submit", (event) => {
    if (data.config.formAction) return;
    event.preventDefault();
    const langPack = getLangPack();
    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const message = $("#message").value.trim();

    const subject = encodeURIComponent(`Portfolio contact from ${name || "website visitor"}`);
    const body = encodeURIComponent(`${langPack.contact.labels.formName}: ${name}\n${langPack.contact.labels.formEmail}: ${email}\n\n${message}`);
    window.location.href = `mailto:${data.config.email}?subject=${subject}&body=${body}`;
  });

  const profileImage = $("#profile-photo");
  profileImage.addEventListener("error", () => {
    profileImage.src =
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'><rect width='800' height='800' fill='#edf3fb'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' font-size='44' fill='#4b5563' font-family='Arial, sans-serif'>Add your photo</text><text x='50%' y='56%' dominant-baseline='middle' text-anchor='middle' font-size='26' fill='#64748b' font-family='Arial, sans-serif'>assets/images/profile.jpg</text></svg>`);
  });
  profileImage.src = data.config.profileImage;

  applyTheme();
  renderEverything();
})();
