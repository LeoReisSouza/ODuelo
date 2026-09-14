/**
 * O Duelo — validadores e máscaras reutilizáveis (sem dependência de DOM).
 * A validação no navegador melhora a experiência, mas NÃO substitui a
 * validação no servidor (ver backend/google-apps-script/Code.gs).
 */
window.ODuelo = window.ODuelo || {};

window.ODuelo.validation = (function (utils) {
  "use strict";

  const { onlyDigits } = utils;

  function isCpf(value) {
    const cpf = onlyDigits(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const digit = (length) => {
      let sum = 0;
      for (let i = 0; i < length; i += 1) sum += Number(cpf[i]) * (length + 1 - i);
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
  }

  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  const isFullName = (value) => value.trim().split(/\s+/).filter((part) => part.length >= 2).length >= 2;

  function isPhone(value, pais) {
    const digits = onlyDigits(value).length;
    return pais === "Brasil" ? digits >= 10 && digits <= 13 : digits >= 8 && digits <= 15;
  }

  const isStrongPassword = (value) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

  function isDocument(tipo, value) {
    if (tipo === "CPF") return isCpf(value);
    return /^[0-9A-Za-z./\- ]{5,20}$/.test(value.trim());
  }

  function formatCpf(value) {
    return onlyDigits(value).slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatPhoneBr(value) {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  return { isCpf, isEmail, isFullName, isPhone, isStrongPassword, isDocument, formatCpf, formatPhoneBr };
})(window.ODuelo.utils);
