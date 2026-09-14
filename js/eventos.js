/**
 * O Duelo — consultas sobre modalidades e edições.
 * Toda regra de "qual edição mostrar / aceita inscrição" fica aqui.
 */
window.ODuelo = window.ODuelo || {};

window.ODuelo.eventos = (function (data, utils) {
  "use strict";

  const byDate = (a, b) => a.data.localeCompare(b.data);

  const competicao = (id) => data.competicoes.find((item) => item.id === id) || null;

  const estaFutura = (edicao) => utils.daysUntil(edicao.data) >= 0;

  const statusChave = (edicao) => (estaFutura(edicao) ? edicao.status : "realizado");

  const rotuloStatus = (edicao) => data.status[statusChave(edicao)].rotulo;

  const aceitaInscricao = (edicao) => estaFutura(edicao) && Boolean(data.status[edicao.status].aceitaInscricao);

  const edicoesFuturas = (comp) => comp.edicoes.filter(estaFutura).sort(byDate);

  const edicoesPassadas = (comp) => comp.edicoes.filter((e) => !estaFutura(e)).sort(byDate).reverse();

  const edicoesAbertas = (comp) => (comp.inscricao ? comp.edicoes.filter(aceitaInscricao).sort(byDate) : []);

  /** Modalidades que possuem formulário configurado e ao menos uma edição aberta. */
  const competicoesComInscricao = () => data.competicoes.filter((comp) => edicoesAbertas(comp).length > 0);

  /** Encontra a edição pelo id, junto da modalidade. */
  function edicao(id) {
    for (const comp of data.competicoes) {
      const found = comp.edicoes.find((item) => item.id === id);
      if (found) return { edicao: found, competicao: comp };
    }
    return null;
  }

  /**
   * Próximo evento: a edição futura mais próxima (de qualquer modalidade)
   * e as que acontecem até `janelaProximoEventoDias` depois dela.
   * Retorna [{ edicao, competicao }] em ordem de data.
   */
  function proximoEvento() {
    const futuras = data.competicoes
      .flatMap((comp) => edicoesFuturas(comp).map((ed) => ({ edicao: ed, competicao: comp })))
      .sort((a, b) => byDate(a.edicao, b.edicao));

    if (futuras.length === 0) return [];

    const inicio = utils.parseDate(futuras[0].edicao.data);
    return futuras.filter(({ edicao: ed }) =>
      utils.daysBetween(inicio, utils.parseDate(ed.data)) <= data.config.janelaProximoEventoDias);
  }

  function rotuloEdicao(ed) {
    if (ed.numero) return `Edição ${utils.pad(ed.numero)}`;
    const partes = utils.dateParts(ed.data);
    return `Edição ${partes.mesCurto}/${partes.ano}`;
  }

  const cidadeUf = (local) => `${local.cidade}/${local.uf}`;

  const mesmoLocal = (a, b) => a.nome === b.nome && a.endereco === b.endereco;

  const mapaUrl = (local) =>
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${local.nome}, ${local.endereco}, ${local.cidade} - ${local.uf}`);

  return {
    competicao, edicao, estaFutura, statusChave, rotuloStatus, aceitaInscricao,
    edicoesFuturas, edicoesPassadas, edicoesAbertas, competicoesComInscricao,
    proximoEvento, rotuloEdicao, cidadeUf, mesmoLocal, mapaUrl,
  };
})(window.ODuelo.data, window.ODuelo.utils);
