/* ========================================================================== 
   AKRAM SANNOURI — interactions sobres, performantes et accessibles
   ========================================================================== */

(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Navigation ----------------------------------------------------------- */
  const nav = $("[data-nav]");
  const burger = $(".burger");
  const mobileMenu = $(".mobile-menu");
  const menuBackground = $$("body > .skip-link, body > main, body > footer");

  const setMenu = (open, restoreFocus = false) => {
    if (!nav || !burger || !mobileMenu) return;

    if (!open && (restoreFocus || mobileMenu.contains(document.activeElement))) {
      const focusTarget = window.innerWidth > 920 ? $(".logo", nav) : burger;
      focusTarget?.focus({ preventScroll: true });
    }

    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("is-menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.inert = !open;
    menuBackground.forEach((region) => { region.inert = open; });

    if (open) {
      window.setTimeout(() => $("a", mobileMenu)?.focus({ preventScroll: true }), 30);
    }
  };

  if (mobileMenu) mobileMenu.inert = true;
  burger?.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", mobileMenu || document.createElement("nav")).forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  let scrollTicking = false;
  const updateNavigation = () => {
    nav?.classList.toggle("is-scrolled", window.scrollY > 28);
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateNavigation);
      scrollTicking = true;
    }
  }, { passive: true });
  updateNavigation();

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920 && nav?.classList.contains("is-open")) setMenu(false);
  });

  /* Reveal progressif — le contenu reste visible sans JavaScript ---------- */
  let revealObserver = null;
  const observeReveals = (scope = document) => {
    const elements = $$(".reveal:not(.is-in)", scope);
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-in"));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -36px" });
    }
    elements.forEach((element) => revealObserver.observe(element));
  };

  /* Contact -------------------------------------------------------------- */
  const form = $("#contact-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const body = [
      `Nom : ${name}`,
      `Email : ${data.get("email") || "-"}`,
      `Projet : ${data.get("type") || "-"}`,
      `Date : ${data.get("date") || "À définir"}`,
      "",
      String(data.get("message") || "").trim(),
    ].join("\n");
    const subject = `Nouveau projet — ${name || "Demande de contact"}`;
    const email = form.dataset.email || "contact@akramsannouri.com";
    const note = $(".form-note", form);
    if (note) note.textContent = "Votre messagerie va s’ouvrir avec le message préparé.";
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  $$("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  /* Portfolio ------------------------------------------------------------ */
  const gallery = $("#gallery");
  const hasProjects = gallery && typeof PROJECTS !== "undefined" && typeof CATEGORIES !== "undefined";

  if (hasProjects) {
    const escapeHTML = (value) => String(value).replace(/[&<>"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    })[character]);

    gallery.innerHTML = PROJECTS.map((project, index) => `
      <article class="gallery-item gallery-item--${escapeHTML(project.ratio || "tall")} reveal" id="${escapeHTML(project.slug || `project-${index + 1}`)}" data-category="${escapeHTML(project.category)}" data-index="${index}">
        <button class="gallery-card" type="button" aria-label="Ouvrir ${escapeHTML(project.title)} en grand">
          <span class="gallery-card__media">
            <img src="${escapeHTML(project.image)}" alt="${escapeHTML(project.alt || project.title)}" loading="lazy" decoding="async">
            ${project.demo ? '<span class="demo-badge">Visuel démo</span>' : ""}
            ${project.videoUrl ? '<span class="gallery-card__play" aria-hidden="true">▶</span>' : ""}
          </span>
          <span class="gallery-card__copy">
            <span><strong>${escapeHTML(project.title)}</strong><small>${escapeHTML(project.format)} · ${escapeHTML(project.detail)}</small></span>
            <span class="gallery-card__arrow" aria-hidden="true">↗</span>
          </span>
        </button>
      </article>
    `).join("");

    const filters = $("#filters");
    const count = $("#count");
    const emptyState = $(".gallery__empty");
    const categoryCounts = PROJECTS.reduce((result, project) => {
      result[project.category] = (result[project.category] || 0) + 1;
      return result;
    }, {});

    filters.innerHTML = [
      `<button class="filter is-active" type="button" data-filter="all" aria-pressed="true">Tous <sup>${PROJECTS.length}</sup></button>`,
      ...Object.entries(CATEGORIES).map(([key, label]) =>
        `<button class="filter" type="button" data-filter="${escapeHTML(key)}" aria-pressed="false">${escapeHTML(label)} <sup>${categoryCounts[key] || 0}</sup></button>`
      ),
    ].join("");

    let visibleProjects = PROJECTS.map((_, index) => index);
    let filterTimer = 0;

    const updateCount = () => {
      if (count) count.textContent = String(visibleProjects.length).padStart(2, "0");
      if (emptyState) emptyState.hidden = visibleProjects.length > 0;
    };

    const applyFilter = (filter, onComplete) => {
      window.clearTimeout(filterTimer);
      gallery.classList.add("is-filtering");
      const update = () => {
        visibleProjects = [];
        $$(".gallery-item", gallery).forEach((item) => {
          const isVisible = filter === "all" || item.dataset.category === filter;
          item.hidden = !isVisible;
          if (isVisible) visibleProjects.push(Number(item.dataset.index));
        });
        gallery.classList.toggle("is-filtered", filter !== "all");
        gallery.classList.remove("is-filtering");
        updateCount();
        onComplete?.();
      };
      if (reducedMotion.matches) update();
      else filterTimer = window.setTimeout(update, 160);
    };

    filters?.addEventListener("click", (event) => {
      const button = event.target.closest(".filter");
      if (!button || button.classList.contains("is-active")) return;
      $$(".filter", filters).forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      applyFilter(button.dataset.filter);
    });

    $$(".view-toggle button").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".view-toggle button").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        gallery.classList.toggle("is-grid", button.dataset.view === "grid");
      });
    });

    updateCount();

    /* Lightbox avec navigation clavier et retour de focus ---------------- */
    const lightbox = $(".lightbox");
    const stage = $(".lightbox__stage");
    const closeButton = $(".lightbox__close");
    const previousButton = $("[data-lb-prev]");
    const nextButton = $("[data-lb-next]");
    let position = 0;
    let lastFocused = null;
    let closeTimer = 0;
    let touchStartX = 0;
    const backgroundRegions = $$("body > .skip-link, body > header, body > nav, body > main, body > footer");
    const previousInert = new Map();

    const showProject = () => {
      const project = PROJECTS[visibleProjects[position]];
      if (!project || !stage) return;

      if (project.videoUrl) {
        stage.innerHTML = `<iframe src="${escapeHTML(project.videoUrl)}" title="${escapeHTML(project.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      } else {
        stage.innerHTML = `<img src="${escapeHTML(project.image)}" alt="${escapeHTML(project.alt || project.title)}">`;
      }

      const title = $(".lightbox__title");
      const subtitle = $(".lightbox__sub");
      const positionLabel = $(".lightbox__count");
      const status = $(".lightbox__status");
      if (title) title.textContent = project.title;
      if (subtitle) subtitle.textContent = `${CATEGORIES[project.category]} · ${project.format} · ${project.detail}`;
      if (positionLabel) positionLabel.textContent = `${String(position + 1).padStart(2, "0")} / ${String(visibleProjects.length).padStart(2, "0")}`;
      if (status) status.textContent = `${project.title}, projet ${position + 1} sur ${visibleProjects.length}`;
      [previousButton, nextButton].forEach((button) => {
        if (button) button.disabled = visibleProjects.length < 2;
      });
    };

    const openLightbox = (projectIndex, opener) => {
      const nextPosition = visibleProjects.indexOf(projectIndex);
      if (!lightbox || nextPosition < 0) return;
      window.clearTimeout(closeTimer);
      position = nextPosition;
      lastFocused = opener;
      showProject();
      lightbox.hidden = false;
      lightbox.inert = false;
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-lightbox-open");
      backgroundRegions.forEach((region) => {
        previousInert.set(region, region.inert);
        region.inert = true;
      });
      requestAnimationFrame(() => {
        lightbox.classList.add("is-open");
        window.setTimeout(() => closeButton?.focus({ preventScroll: true }), 30);
      });
    };

    const closeLightbox = () => {
      if (!lightbox || !lightbox.classList.contains("is-open")) return;
      lightbox.classList.remove("is-open");
      backgroundRegions.forEach((region) => {
        region.inert = previousInert.get(region) || false;
      });
      previousInert.clear();
      lastFocused?.focus({ preventScroll: true });
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.inert = true;
      document.body.classList.remove("is-lightbox-open");
      closeTimer = window.setTimeout(() => {
        lightbox.hidden = true;
        if (stage) stage.innerHTML = "";
      }, reducedMotion.matches ? 0 : 320);
    };

    const step = (direction) => {
      if (visibleProjects.length < 2) return;
      position = (position + direction + visibleProjects.length) % visibleProjects.length;
      showProject();
    };

    gallery.addEventListener("click", (event) => {
      const card = event.target.closest(".gallery-card");
      if (!card) return;
      const item = card.closest(".gallery-item");
      openLightbox(Number(item.dataset.index), card);
    });
    closeButton?.addEventListener("click", closeLightbox);
    previousButton?.addEventListener("click", () => step(-1));
    nextButton?.addEventListener("click", () => step(1));
    stage?.addEventListener("click", (event) => {
      if (event.target === stage) closeLightbox();
    });
    stage?.addEventListener("touchstart", (event) => {
      touchStartX = event.touches[0].clientX;
    }, { passive: true });
    stage?.addEventListener("touchend", (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 55) step(distance < 0 ? 1 : -1);
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
      if (!lightbox || !lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
      if (event.key !== "Tab") return;

      const focusable = $$("button:not([disabled]), iframe, [href]", lightbox).filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const focusLinkedProject = () => {
      const linkedProject = decodeURIComponent(window.location.hash.slice(1));
      const linkedItem = linkedProject ? document.getElementById(linkedProject) : null;
      if (!linkedItem) return;

      const revealLinkedItem = () => requestAnimationFrame(() => {
        linkedItem.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
        $(".gallery-card", linkedItem)?.focus({ preventScroll: true });
      });

      if (linkedItem.hidden) {
        $$(".filter", filters).forEach((item) => {
          const active = item.dataset.filter === "all";
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        applyFilter("all", revealLinkedItem);
      } else {
        revealLinkedItem();
      }
    };

    focusLinkedProject();
    window.addEventListener("hashchange", focusLinkedProject);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("is-open")) setMenu(false, true);
  });

  observeReveals();
  window.clearTimeout(window.__revealFallback);
  document.documentElement.dataset.jsReady = "true";
})();
