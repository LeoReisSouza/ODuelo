/**
 * O Duelo — camada de envio das inscrições.
 * -----------------------------------------------------------------
 * Único ponto do frontend que conversa com a persistência. Para trocar
 * o backend (Google Apps Script, API própria, etc.) basta alterar
 * `config.api.endpoint` em js/data.js, mantendo o contrato:
 *
 *   POST <endpoint>   body: JSON da inscrição (ver README)
 *   resposta 200      { "ok": true, "protocolo": "OD-..." }
 *   resposta de erro  { "ok": false, "erro": "mensagem legível" }
 *
 * Este módulo não guarda nada no navegador (sem localStorage/cookies).
 */
window.ODuelo = window.ODuelo || {};

window.ODuelo.api = (function (config) {
  "use strict";

  class ApiError extends Error {}

  const modoDemonstracao = () => !config.api.endpoint;

  function endpointSeguro(url) {
    try {
      const { protocol, hostname } = new URL(url);
      return protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
      return false;
    }
  }

  async function enviarInscricao(payload) {
    if (modoDemonstracao()) {
      return { demonstracao: true, protocolo: null };
    }

    const { endpoint, timeoutMs } = config.api;
    if (!endpointSeguro(endpoint)) {
      throw new ApiError("Envio bloqueado: o endereço de inscrições precisa usar HTTPS.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        // text/plain evita a requisição de preflight (compatível com Google Apps Script).
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body || body.ok !== true) {
        throw new ApiError((body && body.erro) || "Não foi possível registrar a inscrição. Tente novamente em instantes.");
      }
      return { demonstracao: false, protocolo: body.protocolo || null };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === "AbortError") {
        throw new ApiError("O servidor demorou para responder. Verifique sua conexão e tente novamente.");
      }
      throw new ApiError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      clearTimeout(timer);
    }
  }

  return { enviarInscricao, modoDemonstracao, ApiError };
})(window.ODuelo.data.config);
