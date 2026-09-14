/**
 * O Duelo — utilitários genéricos (DOM, HTML seguro, datas, números).
 */
window.ODuelo = window.ODuelo || {};

window.ODuelo.utils = (function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* ---------------------------------------------------------------
   * Templates HTML com escape automático.
   * html`<p>${texto}</p>` escapa valores; arrays e outros templates
   * html`` são inseridos sem escape duplo.
   * ------------------------------------------------------------- */
  class SafeHtml {
    constructor(value) { this.value = value; }
    toString() { return this.value; }
  }

  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

  function toHtml(value) {
    if (value === null || value === undefined || value === false) return "";
    if (value instanceof SafeHtml) return value.value;
    if (Array.isArray(value)) return value.map(toHtml).join("");
    return escapeHtml(value);
  }

  function html(strings, ...values) {
    return new SafeHtml(strings.reduce((out, chunk, i) => out + toHtml(values[i - 1]) + chunk));
  }

  /** Preenche todos os elementos `[data-render="nome"]` com o conteúdo gerado. */
  function renderInto(name, content) {
    $$(`[data-render="${name}"]`).forEach((el) => { el.innerHTML = toHtml(content); });
  }

  /* ---------------------------------------------------------------
   * Datas (sempre no fuso local, a partir de strings "AAAA-MM-DD").
   * ------------------------------------------------------------- */
  const DAY_MS = 86400000;

  function parseDate(iso) {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const daysBetween = (from, to) => Math.round((to - from) / DAY_MS);
  const daysUntil = (iso) => daysBetween(today(), parseDate(iso));

  const format = (iso, options) => new Intl.DateTimeFormat("pt-BR", options).format(parseDate(iso));
  const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  const stripDot = (text) => text.replace(".", "");

  function dateParts(iso) {
    return {
      dia: format(iso, { day: "2-digit" }),
      mes: capitalize(format(iso, { month: "long" })),
      mesCurto: capitalize(stripDot(format(iso, { month: "short" }))),
      ano: format(iso, { year: "numeric" }),
      semana: capitalize(format(iso, { weekday: "long" })),
      semanaCurta: capitalize(stripDot(format(iso, { weekday: "short" }))),
    };
  }

  /** Idade completa (em anos) de quem nasceu em `birthIso` na data de hoje. */
  function ageFrom(birthIso) {
    const birth = parseDate(birthIso);
    const now = today();
    let age = now.getFullYear() - birth.getFullYear();
    const hadBirthday = now.getMonth() > birth.getMonth()
      || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hadBirthday) age -= 1;
    return age;
  }

  const listFormat = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });
  const joinList = (items) => listFormat.format(items);

  /* ---------------------------------------------------------------
   * Diversos
   * ------------------------------------------------------------- */
  const pad = (number) => String(number).padStart(2, "0");
  const onlyDigits = (value) => String(value).replace(/\D/g, "");
  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Anima um número inteiro de 0 até o valor final. */
  function countUp(el, target, duration = 900) {
    if (prefersReducedMotion() || target <= 0) {
      el.textContent = target;
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  return {
    $, $$, html, escapeHtml, renderInto,
    parseDate, today, daysBetween, daysUntil, dateParts, ageFrom, joinList,
    pad, onlyDigits, prefersReducedMotion, countUp,
  };
})();
