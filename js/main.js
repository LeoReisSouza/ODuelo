/**
 * O Duelo — inicialização e interações gerais da página
 * (header, menu mobile, scrollspy, marquee, animações de entrada).
 */
(function (ODuelo) {
  "use strict";

  const { $, $$, countUp, prefersReducedMotion } = ODuelo.utils;

  function initHeader() {
    const header = $("[data-header]");
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initMenu() {
    const toggle = $("[data-menu-toggle]");
    const nav = $("[data-nav]");
    const label = $("[data-menu-label]");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Fechar menu" : "Abrir menu";
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      $("main").inert = open;
      $(".site-footer").inert = open;
    }

    toggle.addEventListener("click", () => setOpen(!isOpen()));
    nav.addEventListener("click", (event) => { if (event.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });
    desktop.addEventListener("change", (event) => { if (event.matches) setOpen(false); });
  }

  function initScrollSpy() {
    const links = $$(".site-nav__link");
    const byId = new Map(links.map((link) => [link.hash.slice(1), link]));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = byId.get(entry.target.id);
        if (entry.isIntersecting) {
          links.forEach((item) => item.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    byId.forEach((link, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /** Duplica a faixa para um loop contínuo (a animação é feita em CSS). */
  function initMarquee() {
    $$("[data-marquee]").forEach((track) => {
      track.after(track.cloneNode(true));
    });
  }

  function initReveal() {
    const items = $$("[data-reveal]");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach((item) => observer.observe(item));
  }

  function initCounters() {
    if (prefersReducedMotion()) return;
    const counters = $$("[data-count-to]");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(entry.target, Number(entry.target.dataset.countTo));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach((counter) => {
      counter.textContent = "0";
      observer.observe(counter);
    });
  }

  ODuelo.render.init();
  ODuelo.form.init();
  initHeader();
  initMenu();
  initScrollSpy();
  initMarquee();
  initReveal();
  initCounters();
})(window.ODuelo);
