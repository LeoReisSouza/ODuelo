/**
 * O Duelo — renderização das seções a partir de js/data.js.
 * Nenhum conteúdo de evento fica fixo no HTML: tudo vem dos dados.
 */
window.ODuelo = window.ODuelo || {};

window.ODuelo.render = (function (data, eventos, utils) {
  "use strict";

  const { html, renderInto, dateParts, pad, $$ } = utils;

  const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

  const icon = (name, className) =>
    html`<svg class="${className}" aria-hidden="true"><use href="#${name}"/></svg>`;

  const externalHint = html`<span class="visually-hidden"> (abre em nova aba)</span>`;

  const statusTag = (edicao) =>
    html`<span class="status status--${eventos.statusChave(edicao)}">${eventos.rotuloStatus(edicao)}</span>`;

  function ctaInscricao(comp, edicao, extraClass = "") {
    if (!comp.inscricao || !eventos.aceitaInscricao(edicao)) return "";
    const nomeCurto = comp.nome.replace(/^O\s+/, "");
    return html`
      <a class="btn btn--primary ${extraClass}" href="#inscricao" data-inscricao="${comp.id}" data-edicao="${edicao.id}">
        Inscreva-se no ${nomeCurto} ${icon("i-arrow", "btn__icon")}
      </a>`;
  }

  /** Datas de um grupo de edições em formatos curto e por extenso. */
  function resumoDatas(grupo) {
    const datas = [...new Set(grupo.map(({ edicao }) => edicao.data))];
    const partes = datas.map(dateParts);
    const primeira = partes[0];
    const ultima = partes[partes.length - 1];
    const mesmoMes = primeira.mes === ultima.mes && primeira.ano === ultima.ano;

    return {
      dias: partes.length === 1 ? primeira.dia : `${primeira.dia}–${ultima.dia}`,
      mesAno: mesmoMes ? `${primeira.mes} ${primeira.ano}` : `${primeira.mesCurto}–${ultima.mesCurto} ${ultima.ano}`,
      semanas: capitalize(utils.joinList(partes.map((p) => p.semana.toLowerCase()))),
      extenso: mesmoMes
        ? `${utils.joinList(partes.map((p) => String(Number(p.dia))))} de ${primeira.mes.toLowerCase()} de ${primeira.ano}`
        : `${utils.joinList(partes.map((p) => `${Number(p.dia)} de ${p.mes.toLowerCase()}`))} de ${ultima.ano}`,
    };
  }

  /* ------------------------------------------------------------- */

  function renderRedes() {
    renderInto("social", data.marca.redes.map((rede) => html`
      <li>
        <a class="social-link" href="${rede.url}" target="_blank" rel="noopener noreferrer">
          ${icon("i-instagram", "social-link__icon")}<span>${rede.usuario}</span>
          <span class="visually-hidden"> — ${rede.rede}</span>${externalHint}
        </a>
      </li>`));
    renderInto("year", new Date().getFullYear());
  }

  function renderHero(grupo) {
    if (grupo.length === 0) {
      renderInto("hero-status", html`<span class="status-dot status-dot--idle" aria-hidden="true"></span>Novas edições em breve`);
      return;
    }

    const primeira = grupo[0].edicao;
    const abertas = grupo.some(({ edicao }) => eventos.aceitaInscricao(edicao));
    const resumo = resumoDatas(grupo);

    renderInto("hero-status", html`
      <span class="status-dot${abertas ? "" : " status-dot--idle"}" aria-hidden="true"></span>
      ${abertas ? "Inscrições abertas" : eventos.rotuloStatus(primeira)}`);
    renderInto("hero-city", `${primeira.local.cidade} · ${primeira.local.uf}`);
    renderInto("hero-date", html`
      <p class="hero__date-days">${resumo.dias}</p>
      <p class="hero__date-meta"><span>${resumo.mesAno}</span><span>${resumo.semanas}</span></p>`);
  }

  function renderCountdown(grupo) {
    if (grupo.length === 0) return;
    const dias = utils.daysUntil(grupo[0].edicao.data);

    renderInto("countdown", dias === 0
      ? html`<p class="countdown__label">Contagem</p>
             <p class="countdown__value"><span class="countdown__number">Hoje</span></p>`
      : html`<p class="countdown__label">Faltam</p>
             <p class="countdown__value">
               <span class="countdown__number" data-count-to="${dias}">${dias}</span>
               <span class="countdown__unit">${dias === 1 ? "dia" : "dias"}</span>
             </p>`);
  }

  function eventCard({ edicao, competicao }, opcoes, index) {
    const p = dateParts(edicao.data);
    const fatos = [
      ["Horário", edicao.horario || "A confirmar"],
      ["Categorias", edicao.categorias],
      ["Lutas", edicao.lutas],
      ["Premiação", edicao.premiacao],
      ["Absoluto", edicao.absoluto],
      opcoes.mostrarLocal && ["Local", `${edicao.local.nome} · ${eventos.cidadeUf(edicao.local)}`],
      opcoes.mostrarEntrada && ["Convidados", edicao.entradaConvidados],
    ].filter((fato) => fato && fato[1]);

    return html`
      <article class="event-card" data-reveal style="--reveal-delay: ${index * 120}ms">
        <header class="event-card__head">
          <p class="event-card__date">
            <span class="event-card__day">${p.dia}</span>
            <span class="event-card__when">
              <span class="event-card__month">${p.mes}</span>
              <span class="event-card__weekday">${p.semana}</span>
            </span>
          </p>
          ${statusTag(edicao)}
        </header>
        <h3 class="event-card__title">${competicao.nome}</h3>
        <p class="event-card__subtitle">${competicao.chamada ? `${competicao.chamada} · ` : ""}${eventos.rotuloEdicao(edicao)}</p>
        <dl class="event-card__facts">
          ${fatos.map(([termo, valor]) => html`<div class="event-card__fact"><dt>${termo}</dt><dd>${valor}</dd></div>`)}
        </dl>
        ${ctaInscricao(competicao, edicao, "btn--block")}
      </article>`;
  }

  function venue(local, entrada) {
    const kg = entrada && entrada.match(/^([\d.,]+\s*kg)\s+(.*)$/i);
    const endereco = [local.endereco, local.bairro, eventos.cidadeUf(local)].filter(Boolean).join(" · ");

    return html`
      <div class="venue" data-reveal>
        <div class="venue__place">
          ${icon("i-pin", "venue__icon")}
          <div>
            <p class="label">Local</p>
            <p class="venue__name">${local.nome}</p>
            <p class="venue__address">${endereco}</p>
            <a class="link-arrow" href="${eventos.mapaUrl(local)}" target="_blank" rel="noopener noreferrer">
              Abrir no mapa ${icon("i-arrow-up-right", "link-arrow__icon")}${externalHint}
            </a>
          </div>
        </div>
        ${entrada ? html`
          <div class="venue__guests">
            <p class="label">Entrada para convidados</p>
            <p class="venue__guests-value">${kg ? html`<strong>${kg[1]}</strong> ${kg[2]}` : entrada}</p>
          </div>` : ""}
      </div>`;
  }

  function renderProximoEvento(grupo) {
    if (grupo.length === 0) {
      const rede = data.marca.redes[0];
      renderInto("next-event-summary", "Novas edições serão anunciadas em breve nos canais oficiais.");
      renderInto("next-event", rede ? html`
        <a class="btn btn--ghost btn--light" href="${rede.url}" target="_blank" rel="noopener noreferrer">
          ${icon("i-instagram", "btn__icon")} Acompanhe ${rede.usuario}${externalHint}
        </a>` : "");
      return;
    }

    const base = grupo[0].edicao;
    const localUnico = grupo.every(({ edicao }) => eventos.mesmoLocal(edicao.local, base.local));
    const entradaUnica = grupo.every(({ edicao }) => edicao.entradaConvidados === base.entradaConvidados);
    const resumo = resumoDatas(grupo);

    renderInto("next-event-summary", localUnico
      ? `${capitalize(resumo.extenso)} · ${base.local.nome}, ${eventos.cidadeUf(base.local)}`
      : capitalize(resumo.extenso));

    const opcoes = { mostrarLocal: !localUnico, mostrarEntrada: !(localUnico && entradaUnica) };
    renderInto("next-event", html`
      <div class="event-grid${grupo.length > 1 ? " event-grid--multi" : ""}">
        ${grupo.map((item, i) => eventCard(item, opcoes, i))}
      </div>
      ${localUnico ? venue(base.local, entradaUnica ? base.entradaConvidados : null) : ""}`);
  }

  /* ---------------------------- Modalidades ---------------------------- */

  function escalaPesos(pesos) {
    return html`
      <ol class="weights">
        ${pesos.map((rotulo) => {
          const partes = rotulo.match(/^(.*?)\s*(\d+)\s*kg$/i);
          return html`<li class="weights__item">${partes
            ? html`<span class="weights__prefix">${partes[1]}</span><span class="weights__value">${partes[2]}</span><span class="weights__unit">kg</span>`
            : html`<span class="weights__value">${rotulo}</span>`}</li>`;
        })}
      </ol>`;
  }

  function quadroCategorias(comp) {
    const { faixas, pesos, divisoes, toleranciaPesoKg } = comp.inscricao;

    return html`
      <div class="board" data-reveal>
        <div class="board__block">
          <h3 class="label">Faixas</h3>
          <ul class="belts">
            ${faixas.map((id) => {
              const faixa = data.faixas[id];
              return html`<li class="belt" style="--belt: ${faixa.cor}; --belt-tip: ${faixa.ponteira}"><span class="belt__name">${faixa.nome}</span></li>`;
            })}
          </ul>
        </div>
        <div class="board__block">
          <h3 class="label">${pesos.length ? "Categorias de peso" : "Peso"}</h3>
          ${pesos.length
            ? escalaPesos(pesos)
            : html`<p class="weight-free"><span class="weight-free__value">±${toleranciaPesoKg}</span><span class="weight-free__unit">kg</span></p>
                   <p class="board__note">Sem tabela fixa: as lutas são casadas pelo peso informado na inscrição.</p>`}
          <h3 class="label">Divisões</h3>
          <ul class="divisions">${divisoes.map((divisao) => html`<li>${divisao}</li>`)}</ul>
        </div>
      </div>`;
  }

  const listaPilares = (pilares) => html`
    <ul class="pillars" data-reveal>
      ${pilares.map((pilar, i) => html`<li class="pillars__item"><span class="pillars__index">${pad(i + 1)}</span>${pilar}</li>`)}
    </ul>`;

  function fatosEdicao(edicao) {
    const itens = [["Lutas", edicao.lutas], ["Premiação", edicao.premiacao], ["Absoluto", edicao.absoluto]]
      .filter(([, valor]) => valor);
    return html`
      <dl class="facts" data-reveal>
        ${itens.map(([termo, valor]) => html`<div class="facts__item"><dt class="label">${termo}</dt><dd>${valor}</dd></div>`)}
      </dl>`;
  }

  function itemEdicao(comp, edicao) {
    const p = dateParts(edicao.data);
    const rotulo = eventos.rotuloEdicao(edicao);
    const aberta = comp.inscricao && eventos.aceitaInscricao(edicao);

    return html`
      <li class="edition">
        <p class="edition__date"><span class="edition__day">${p.dia}</span><span class="edition__month">${p.mesCurto} ${p.ano}</span></p>
        <div class="edition__info">
          <p class="edition__name">${rotulo}</p>
          <p class="edition__place">${p.semana} · ${edicao.local.nome} · ${eventos.cidadeUf(edicao.local)}</p>
        </div>
        ${statusTag(edicao)}
        ${aberta ? html`
          <a class="edition__cta" href="#inscricao" data-inscricao="${comp.id}" data-edicao="${edicao.id}">
            Inscrever<span class="visually-hidden">: ${comp.nome}, ${rotulo}</span> ${icon("i-arrow", "edition__cta-icon")}
          </a>` : ""}
      </li>`;
  }

  function listaEdicoes(comp, futuras) {
    const passadas = eventos.edicoesPassadas(comp);
    return html`
      <div class="editions" data-reveal>
        <div class="editions__head">
          <h3 class="label">Próximas edições</h3>
          <span class="editions__count" aria-hidden="true">${pad(futuras.length)}</span>
        </div>
        ${futuras.length
          ? html`<ol class="editions__list">${futuras.map((ed) => itemEdicao(comp, ed))}</ol>`
          : html`<p class="editions__empty">Nenhuma edição agendada no momento.</p>`}
        ${passadas.length ? html`
          <details class="editions__past">
            <summary>Edições anteriores (${passadas.length})</summary>
            <ol class="editions__list">${passadas.map((ed) => itemEdicao(comp, ed))}</ol>
          </details>` : ""}
      </div>`;
  }

  function emBreve() {
    const rede = data.marca.redes[0];
    return html`
      <div class="soon" data-reveal>
        <p class="soon__word" aria-hidden="true">Em breve</p>
        <p class="status status--em-breve">Próxima edição em breve</p>
        <dl class="soon__slots">
          ${["Data", "Local", "Categorias"].map((termo) => html`<div class="soon__slot"><dt class="label">${termo}</dt><dd>A definir</dd></div>`)}
        </dl>
        ${rede ? html`
          <a class="btn btn--ghost btn--light" href="${rede.url}" target="_blank" rel="noopener noreferrer">
            ${icon("i-instagram", "btn__icon")} Acompanhe ${rede.usuario}${externalHint}
          </a>` : ""}
      </div>`;
  }

  function renderCompeticoes() {
    $$("[data-competition]").forEach((section) => {
      const comp = eventos.competicao(section.dataset.competition);
      if (!comp) return;

      const futuras = eventos.edicoesFuturas(comp);
      const atual = futuras[0] || null;
      const numero = pad(data.competicoes.indexOf(comp) + 1);

      section.innerHTML = html`
        <div class="container competition__grid">
          <header class="competition__head" data-reveal>
            <p class="eyebrow"><span class="eyebrow__index">${numero}</span>Modalidade</p>
            <h2 class="competition__title" id="${comp.id}-titulo">${comp.nome}</h2>
            ${comp.chamada ? html`<p class="competition__tagline">${comp.chamada}</p>` : ""}
            <p class="competition__desc">${comp.descricao}</p>
            ${comp.inscricao && comp.inscricao.responsavelLegal ? html`
              <p class="competition__note">${icon("i-alert", "competition__note-icon")} Inscrição realizada pelo responsável legal do atleta.</p>` : ""}
            ${atual ? ctaInscricao(comp, atual) : ""}
          </header>
          <div class="competition__body">
            ${comp.inscricao ? quadroCategorias(comp) : ""}
            ${comp.pilares ? listaPilares(comp.pilares) : ""}
            ${atual ? fatosEdicao(atual) : ""}
            ${comp.edicoes.length ? listaEdicoes(comp, futuras) : emBreve()}
          </div>
        </div>`;
    });
  }

  /* ----------------------------- Comparativo ----------------------------- */

  function renderVersus() {
    const comps = data.competicoes.filter((comp) => comp.inscricao);
    if (comps.length < 2) return;

    const atuais = comps.map((comp) => eventos.edicoesFuturas(comp)[0] || null);
    const quando = (ed) => {
      if (!ed) return "A definir";
      const p = dateParts(ed.data);
      return `${p.semanaCurta} · ${p.dia} ${p.mesCurto}`;
    };
    const linhas = [
      ["Público", (comp) => comp.publico],
      ["Data", (comp, ed) => quando(ed)],
      ["Categorias", (comp, ed) => (ed && ed.categorias) || "A definir"],
      ["Peso", (comp) => comp.inscricao.pesos.length
        ? `${comp.inscricao.pesos.length} categorias de peso`
        : `Casado pelo peso (±${comp.inscricao.toleranciaPesoKg} kg)`],
      ["Absoluto", (comp, ed) => (ed && ed.absoluto) || "A definir"],
      ["Inscrição", (comp) => (comp.inscricao.responsavelLegal ? "Feita pelo responsável legal" : "Feita pelo próprio atleta")],
    ];

    renderInto("versus", html`
      <div class="versus__table${comps.length === 2 ? " versus__table--duo" : ""}" role="table"
           aria-label="Comparativo entre as competições" style="--cols: ${comps.length}" data-reveal>
        <div class="versus__row versus__row--head" role="row">
          <span class="versus__corner" role="columnheader"><span class="visually-hidden">Característica</span></span>
          ${comps.map((comp) => html`<span class="versus__name" role="columnheader">${comp.nome}<small>${comp.publico}</small></span>`)}
        </div>
        ${linhas.map(([rotulo, valor]) => html`
          <div class="versus__row" role="row">
            <span class="versus__label" role="rowheader">${rotulo}</span>
            ${comps.map((comp, i) => html`<span class="versus__cell" role="cell">${valor(comp, atuais[i])}</span>`)}
          </div>`)}
      </div>`);
  }

  function init() {
    const grupo = eventos.proximoEvento();
    renderRedes();
    renderHero(grupo);
    renderCountdown(grupo);
    renderProximoEvento(grupo);
    renderCompeticoes();
    renderVersus();
  }

  return { init, icon };
})(window.ODuelo.data, window.ODuelo.eventos, window.ODuelo.utils);
