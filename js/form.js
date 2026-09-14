/**
 * O Duelo — formulário de inscrição.
 * Opções dinâmicas por evento, validação acessível e envio via ODuelo.api.
 * Nenhum dado é salvo no navegador; a senha só trafega no envio (HTTPS).
 */
window.ODuelo = window.ODuelo || {};

window.ODuelo.form = (function (data, eventos, utils, validation, api) {
  "use strict";

  const { $, $$, html, renderInto, dateParts } = utils;

  let form;
  let competicaoAtual = null;

  /* ------------------------------ Opções ------------------------------ */

  function fillSelect(select, options, placeholder = "Selecione") {
    const previous = select.value;
    select.innerHTML = html`
      <option value="">${placeholder}</option>
      ${options.map((option) => {
        const { valor, rotulo } = typeof option === "string" ? { valor: option, rotulo: option } : option;
        return html`<option value="${valor}">${rotulo || valor}</option>`;
      })}`.toString();
    if (Array.from(select.options).some((opt) => opt.value === previous)) select.value = previous;
  }

  function toggleField(wrapper, visible) {
    wrapper.hidden = !visible;
    $$("input, select, textarea", wrapper).forEach((control) => { control.disabled = !visible; });
  }

  function renderEventOptions() {
    renderInto("event-options", data.competicoes.map((comp) => {
      const abertas = eventos.edicoesAbertas(comp);
      const disponivel = abertas.length > 0;
      let meta = "Em breve · inscrições indisponíveis";
      if (disponivel) {
        const p = dateParts(abertas[0].data);
        meta = `${p.dia} ${p.mesCurto} · ${comp.publico}`;
      }
      return html`
        <label class="event-option${disponivel ? "" : " is-disabled"}">
          <input class="event-option__input" type="radio" name="competicao" value="${comp.id}"
                 aria-describedby="competicao-erro" ${disponivel ? "" : "disabled"}>
          <span class="event-option__name">${comp.nome}</span>
          <span class="event-option__meta">${meta}</span>
        </label>`;
    }));
  }

  function renderTermos() {
    renderInto("terms", html`
      ${data.termos.responsabilidade.map((paragrafo, i) => html`<p><strong>${i + 1}.</strong> ${paragrafo}</p>`)}
      <p class="terms__version">Versão ${data.termos.versao}</p>`);
    renderInto("guardian-consent", data.termos.responsavelLegal);
    renderInto("lgpd-consent", data.termos.lgpd);
  }

  function fillAbsoluto() {
    if (!competicaoAtual) return;
    const sexo = form.elements.sexo.value;
    const opcoes = competicaoAtual.inscricao.absoluto
      .filter((opcao) => !opcao.sexo || !sexo || opcao.sexo === sexo)
      .map((opcao) => opcao.valor);
    fillSelect(form.elements.categoria_absoluto, opcoes);
  }

  function renderResumo() {
    const encontrada = form.elements.edicao.value && eventos.edicao(form.elements.edicao.value);
    if (!competicaoAtual || !encontrada) {
      renderInto("signup-summary", html`<p class="summary__empty">Selecione um evento para ver o resumo da inscrição.</p>`);
      return;
    }
    const { edicao } = encontrada;
    const p = dateParts(edicao.data);
    renderInto("signup-summary", html`
      <p class="label">Inscrição para</p>
      <p class="summary__name">${competicaoAtual.nome}</p>
      <p class="summary__meta">${competicaoAtual.chamada} · ${eventos.rotuloEdicao(edicao)}</p>
      <dl class="summary__facts">
        <div><dt>Data</dt><dd>${p.semana}, ${Number(p.dia)} de ${p.mes.toLowerCase()} de ${p.ano}</dd></div>
        <div><dt>Horário</dt><dd>${edicao.horario || "A confirmar"}</dd></div>
        <div><dt>Local</dt><dd>${edicao.local.nome} · ${eventos.cidadeUf(edicao.local)}</dd></div>
      </dl>`);
  }

  /** Reconfigura o formulário para a modalidade escolhida. */
  function aplicarCompeticao(comp, edicaoId) {
    competicaoAtual = comp;
    const config = comp.inscricao;
    const abertas = eventos.edicoesAbertas(comp);

    ["edicao", "faixa", "divisao", "categoria_absoluto"].forEach((name) => { form.elements[name].disabled = false; });
    fillSelect(form.elements.edicao, abertas.map((ed) => ({
      valor: ed.id,
      rotulo: `${eventos.rotuloEdicao(ed)} — ${dateParts(ed.data).dia}/${ed.data.slice(5, 7)}`,
    })));
    form.elements.edicao.value = abertas.some((ed) => ed.id === edicaoId) ? edicaoId : abertas[0].id;
    $("[data-edition-field]", form).hidden = abertas.length < 2;

    fillSelect(form.elements.faixa, config.faixas.map((id) => data.faixas[id].nome));
    fillSelect(form.elements.divisao, config.divisoes);
    fillSelect(form.elements.categoria_peso, config.pesos);
    toggleField($("[data-weight-field]", form), config.pesos.length > 0);
    fillAbsoluto();

    $("#peso_kg-dica", form).textContent =
      `Usado para casar as lutas (diferença de até ${config.toleranciaPesoKg} kg).`;

    const guardian = $("[data-guardian]", form);
    guardian.hidden = !config.responsavelLegal;
    guardian.disabled = !config.responsavelLegal;
    toggleField($("[data-guardian-consent]", form), config.responsavelLegal);
    $("[data-guardian-hint]", form).hidden = !config.responsavelLegal;

    setError("competicao", "");
    renderResumo();
  }

  /** Estado sem evento escolhido: campos dependentes bloqueados até a seleção. */
  function estadoInicial() {
    competicaoAtual = null;
    ["faixa", "divisao", "categoria_peso", "categoria_absoluto"].forEach((name) => {
      fillSelect(form.elements[name], [], "Escolha o evento primeiro");
      form.elements[name].disabled = true;
    });
    fillSelect(form.elements.edicao, []);
    form.elements.edicao.disabled = true;
    form.elements.pais.value = "Brasil";

    $("[data-edition-field]", form).hidden = true;
    $("[data-weight-field]", form).hidden = false;
    const guardian = $("[data-guardian]", form);
    guardian.hidden = true;
    guardian.disabled = true;
    toggleField($("[data-guardian-consent]", form), false);
    $("[data-guardian-hint]", form).hidden = true;
    $("[data-age-hint]", form).textContent = "";
    renderResumo();
  }

  /** Seleciona uma modalidade (usado pelos botões "Inscreva-se" da página). */
  function selecionar(compId, edicaoId) {
    const radio = $$('input[name="competicao"]', form).find((input) => input.value === compId && !input.disabled);
    if (!radio) return;
    radio.checked = true;
    aplicarCompeticao(eventos.competicao(compId), edicaoId);
  }

  /* ----------------------------- Validação ----------------------------- */

  const required = (message) => (value) => (value ? "" : message);
  const checked = (message) => (value) => (value ? "" : message);

  const rules = {
    competicao: () => (competicaoAtual ? "" : "Selecione o evento em que deseja se inscrever."),
    edicao: (value) => {
      const encontrada = value && eventos.edicao(value);
      return encontrada && eventos.aceitaInscricao(encontrada.edicao) ? "" : "Selecione uma edição com inscrições abertas.";
    },
    responsavel_nome: (value) => (validation.isFullName(value) ? "" : "Informe o nome completo do responsável."),
    responsavel_cpf: (value) => (validation.isCpf(value) ? "" : "Informe um CPF válido para o responsável."),
    responsavel_parentesco: required("Selecione o parentesco com o atleta."),
    nome_completo: (value) => (validation.isFullName(value) ? "" : "Informe nome e sobrenome do atleta."),
    data_nascimento: (value) => {
      if (!value) return "Informe a data de nascimento.";
      const idade = utils.ageFrom(value);
      if (utils.daysUntil(value) > 0 || idade > 100) return "Informe uma data de nascimento válida.";
      if (competicaoAtual && competicaoAtual.inscricao.responsavelLegal && idade >= 18) {
        return `${competicaoAtual.nome} é para atletas menores de idade. Para adultos, escolha outro evento.`;
      }
      return "";
    },
    sexo: required("Selecione o sexo."),
    documento_tipo: required("Selecione o tipo de documento."),
    cpf_rg: (value) => {
      const tipo = form.elements.documento_tipo.value;
      if (!value.trim()) return "Informe o número do documento.";
      if (validation.isDocument(tipo, value)) return "";
      return tipo === "CPF" ? "CPF inválido. Confira os números digitados." : "Número de documento inválido.";
    },
    pais: required("Selecione o país."),
    endereco: (value) => (value.trim().length >= 10 ? "" : "Informe o endereço completo: rua, número, bairro e cidade."),
    email: (value) => (validation.isEmail(value) ? "" : "Informe um e-mail válido, como nome@exemplo.com."),
    telefone: (value) => (validation.isPhone(value, form.elements.pais.value) ? "" : "Informe um telefone válido com DDD."),
    senha: (value) => (validation.isStrongPassword(value) ? "" : "A senha precisa ter ao menos 8 caracteres, com letras e números."),
    senha_confirmacao: (value) => (value && value === form.elements.senha.value ? "" : "As senhas não conferem."),
    equipe: (value) => (value.trim().length >= 2 ? "" : "Informe a equipe ou academia."),
    professor: (value) => (value.trim().length >= 3 ? "" : "Informe o nome do professor responsável."),
    faixa: required("Selecione a faixa."),
    divisao: required("Selecione a divisão."),
    peso_kg: (value) => {
      const peso = Number(value);
      return value !== "" && peso >= 10 && peso <= 250 ? "" : "Informe o peso em kg, por exemplo 72.5.";
    },
    categoria_peso: required("Selecione a categoria de peso."),
    categoria_absoluto: required("Selecione uma opção de absoluto."),
    filiacao_federacao: (value) => (value.length <= 40 ? "" : "Número de filiação muito longo."),
    aceite_termos: checked("É necessário aceitar o termo de responsabilidade."),
    aceite_responsavel: checked("Confirme que você é o responsável legal pelo atleta."),
    aceite_lgpd: checked("É necessário autorizar o uso dos dados para concluir a inscrição."),
  };

  const controlsOf = (name) =>
    (name === "competicao" ? $$('input[name="competicao"]', form) : [form.elements[name]]);

  const isActive = (name) => name === "competicao" || (form.elements[name] && !form.elements[name].disabled);

  function setError(name, message) {
    controlsOf(name).forEach((control) => {
      if (message) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
      const wrapper = control.closest(".field, .check");
      if (wrapper) wrapper.classList.toggle("is-invalid", Boolean(message));
    });
    const errorEl = document.getElementById(`${name}-erro`);
    if (errorEl) errorEl.textContent = message;
  }

  function validateField(name) {
    if (!rules[name] || !isActive(name)) return true;
    const control = form.elements[name];
    const value = name === "competicao" ? null : control.type === "checkbox" ? control.checked : control.value;
    const message = rules[name](value);
    setError(name, message);
    return !message;
  }

  function validateAll() {
    const invalid = Object.keys(rules).filter((name) => !validateField(name));
    if (invalid.length) controlsOf(invalid[0])[0].focus();
    return invalid.length === 0;
  }

  /* ------------------------------- Envio ------------------------------- */

  function buildPayload() {
    const payload = {};
    new FormData(form).forEach((value, key) => { payload[key] = String(value).trim(); });

    const config = competicaoAtual.inscricao;
    delete payload.competicao;
    delete payload.senha_confirmacao;

    return {
      ...payload,
      evento: competicaoAtual.id,
      senha: form.elements.senha.value,
      peso_kg: Number(form.elements.peso_kg.value),
      categoria_peso: config.pesos.length ? payload.categoria_peso : "Casada pelo peso informado",
      aceite_termos: form.elements.aceite_termos.checked,
      aceite_responsavel: config.responsavelLegal ? form.elements.aceite_responsavel.checked : null,
      aceite_lgpd: form.elements.aceite_lgpd.checked,
      versao_termos: data.termos.versao,
    };
  }

  function setStatus(message, type = "") {
    const status = $("[data-form-status]", form);
    status.textContent = message;
    status.className = `form__status${type ? ` is-${type}` : ""}`;
  }

  function setSubmitting(active) {
    const button = $("[data-submit]", form);
    button.disabled = active;
    button.setAttribute("aria-busy", String(active));
    $("[data-submit-label]", form).textContent = active ? "Enviando…" : "Confirmar inscrição";
  }

  function showSuccess(resultado, nomeEvento) {
    const box = $("[data-form-success]");
    box.innerHTML = html`
      <svg class="form-success__icon" aria-hidden="true"><use href="#i-check"/></svg>
      <h3 class="form-success__title">${resultado.demonstracao ? "Inscrição validada" : "Inscrição enviada"}</h3>
      ${resultado.demonstracao
        ? html`<p class="form-success__text">Modo demonstração: os dados foram validados, mas <strong>nada foi enviado ou armazenado</strong>. Configure <code>config.api.endpoint</code> em <code>js/data.js</code> para ativar o envio.</p>`
        : html`<p class="form-success__text">Sua inscrição no ${nomeEvento} foi registrada.${resultado.protocolo ? html` Protocolo: <strong>${resultado.protocolo}</strong>.` : ""} Guarde este número para qualquer contato com a organização.</p>`}
      <button class="btn btn--ghost" type="button" data-new-signup>Fazer outra inscrição</button>`.toString();
    form.hidden = true;
    box.hidden = false;
    box.focus();
  }

  function resetForm() {
    form.reset();
    Object.keys(rules).forEach((name) => { if (form.elements[name] || name === "competicao") setError(name, ""); });
    setStatus("");
    estadoInicial();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    // Campo armadilha preenchido = robô. Finge sucesso sem enviar nada.
    if (form.elements.website.value) {
      resetForm();
      return;
    }

    if (!validateAll()) {
      setStatus("Revise os campos destacados para continuar.", "error");
      return;
    }

    const nomeEvento = competicaoAtual.nome;
    setSubmitting(true);
    try {
      const resultado = await api.enviarInscricao(buildPayload());
      resetForm();
      showSuccess(resultado, nomeEvento);
    } catch (error) {
      setStatus(error instanceof api.ApiError ? error.message : "Erro inesperado. Tente novamente.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------------------- Interações ---------------------------- */

  function applyMasks(target) {
    if (target.name === "responsavel_cpf" || (target.name === "cpf_rg" && form.elements.documento_tipo.value === "CPF")) {
      target.value = validation.formatCpf(target.value);
    }
    if (target.name === "telefone" && form.elements.pais.value === "Brasil") {
      target.value = validation.formatPhoneBr(target.value);
    }
  }

  function updateDocumentField() {
    const tipo = form.elements.documento_tipo.value;
    const input = form.elements.cpf_rg;
    input.placeholder = tipo === "CPF" ? "000.000.000-00" : "";
    input.inputMode = tipo === "CPF" ? "numeric" : "text";
    if (tipo === "CPF") input.value = validation.formatCpf(input.value);
  }

  function updateAgeHint() {
    const value = form.elements.data_nascimento.value;
    const idade = value && utils.daysUntil(value) <= 0 ? utils.ageFrom(value) : null;
    $("[data-age-hint]", form).textContent = idade !== null && idade <= 100 ? `Idade atual: ${idade} ${idade === 1 ? "ano" : "anos"}.` : "";
  }

  function bindEvents() {
    form.addEventListener("submit", handleSubmit);

    form.addEventListener("change", (event) => {
      const { name } = event.target;
      if (name === "competicao") aplicarCompeticao(eventos.competicao(event.target.value));
      if (name === "edicao") renderResumo();
      if (name === "sexo") fillAbsoluto();
      if (name === "documento_tipo") updateDocumentField();
      if (name === "data_nascimento") updateAgeHint();
      if (event.target.type === "checkbox" || event.target.tagName === "SELECT") validateField(name);
    });

    form.addEventListener("input", (event) => {
      applyMasks(event.target);
      if (event.target.getAttribute("aria-invalid") === "true") validateField(event.target.name);
    });

    form.addEventListener("focusout", (event) => {
      const { name, value } = event.target;
      if (name && name !== "competicao" && (value || event.target.getAttribute("aria-invalid") === "true")) {
        validateField(name);
      }
    });

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-inscricao]");
      if (trigger && trigger.dataset.inscricao) selecionar(trigger.dataset.inscricao, trigger.dataset.edicao);

      if (event.target.closest("[data-new-signup]")) {
        $("[data-form-success]").hidden = true;
        form.hidden = false;
        form.querySelector("input:not([disabled])").focus();
      }
    });
  }

  function init() {
    form = $("[data-form]");
    if (!form) return;

    renderEventOptions();
    renderTermos();
    $$("[data-options]", form).forEach((select) => fillSelect(select, data.formulario[select.dataset.options]));
    estadoInicial();

    if (api.modoDemonstracao()) {
      const notice = $("[data-form-notice]", form);
      notice.textContent = "Modo demonstração: o formulário valida os dados, mas ainda não está conectado ao sistema de inscrições.";
      notice.hidden = false;
    }

    const eventoUrl = new URLSearchParams(window.location.search).get("evento");
    if (eventoUrl) selecionar(eventoUrl);

    bindEvents();
  }

  return { init, selecionar };
})(window.ODuelo.data, window.ODuelo.eventos, window.ODuelo.utils, window.ODuelo.validation, window.ODuelo.api);
