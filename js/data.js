/**
 * O Duelo — dados do site
 * -----------------------------------------------------------------
 * Fonte única de conteúdo: modalidades, edições, categorias, termos
 * e configurações. Para publicar uma nova edição, adicione um objeto
 * em `edicoes` da modalidade correspondente — o site e o formulário
 * se atualizam sozinhos.
 *
 * ATENÇÃO: este arquivo é público (vai para o navegador).
 * Nunca coloque aqui dados de inscritos, senhas ou chaves secretas.
 *
 * Campos com `null` não constam no material de divulgação e devem
 * ser preenchidos pela organização quando forem confirmados.
 */
window.ODuelo = window.ODuelo || {};

window.ODuelo.data = (function () {
  "use strict";

  /** Locais reutilizáveis entre edições. */
  const locais = {
    redeOlimpicaJoseBonifacio: {
      nome: "Rede Olímpica José Bonifácio",
      endereco: "Rua Felipi Lauri, 43 — Conj. José Bonifácio",
      bairro: "Cohab II",
      cidade: "Itaquera",
      uf: "SP",
    },
  };

  /** Graduações e as cores usadas nos elementos visuais. */
  const faixas = {
    branca: { nome: "Branca", cor: "#F4F3EF", ponteira: "#171717" },
    cinza: { nome: "Cinza", cor: "#8C8C8C", ponteira: "#171717" },
    amarela: { nome: "Amarela", cor: "#E3B21F", ponteira: "#171717" },
    laranja: { nome: "Laranja", cor: "#E2701F", ponteira: "#171717" },
    verde: { nome: "Verde", cor: "#2F8A48", ponteira: "#171717" },
    azul: { nome: "Azul", cor: "#0039B5", ponteira: "#171717" },
    roxa: { nome: "Roxa", cor: "#5E2B8C", ponteira: "#171717" },
    marrom: { nome: "Marrom", cor: "#5E3B22", ponteira: "#171717" },
    preta: { nome: "Preta", cor: "#171717", ponteira: "#C8102E" },
  };

  /** Status possíveis de uma edição. Só `aceitaInscricao: true` libera o formulário. */
  const status = {
    "inscricoes-abertas": { rotulo: "Inscrições abertas", aceitaInscricao: true },
    "em-breve": { rotulo: "Em breve", aceitaInscricao: false },
    "inscricoes-encerradas": { rotulo: "Inscrições encerradas", aceitaInscricao: false },
    realizado: { rotulo: "Evento realizado", aceitaInscricao: false },
  };

  const regraLutasCasadas =
    "Casadas por biotipo, com agrupamento de faixas e diferença de até 3 kg para cima ou para baixo.";

  const competicoes = [
    {
      id: "duelo",
      nome: "O Duelo",
      publico: "Adulto e Master",
      chamada: "Campeonato Adulto e Master",
      descricao:
        "A competição principal da marca. Atletas adultos e master, da faixa branca à preta, frente a frente em lutas casadas por biotipo. Técnica, estratégia e disciplina no tatame.",
      inscricao: {
        responsavelLegal: false,
        toleranciaPesoKg: 3,
        divisoes: ["Adulto", "Master"],
        faixas: ["branca", "azul", "roxa", "marrom", "preta"],
        pesos: ["Até 65 kg", "Até 75 kg", "Até 85 kg", "Até 95 kg", "Acima de 95 kg"],
        absoluto: [
          { valor: "Não vou disputar o absoluto", sexo: null },
          { valor: "Absoluto Masculino — Adulto", sexo: "Masculino" },
          { valor: "Absoluto Masculino — Master", sexo: "Masculino" },
          { valor: "Absoluto Feminino — Adulto", sexo: "Feminino" },
          { valor: "Absoluto Feminino — Master", sexo: "Feminino" },
        ],
      },
      edicoes: [
        {
          id: "duelo-2026-10",
          numero: null,
          data: "2026-10-18",
          horario: null,
          local: locais.redeOlimpicaJoseBonifacio,
          status: "inscricoes-abertas",
          categorias: "Faixas branca, azul, roxa, marrom e preta",
          lutas: regraLutasCasadas,
          premiacao: "1º, 2º e 3º lugar — medalhas para todos os pódios.",
          absoluto: "Masculino e feminino, adulto e master. Valores sob consulta.",
          entradaConvidados: "2 kg de alimento não perecível",
        },
      ],
    },
    {
      id: "duelinho",
      nome: "O Duelinho",
      publico: "Kids e Juvenil",
      chamada: "Campeonato Kids e Juvenil",
      descricao:
        "A versão kids e juvenil do O Duelo. Incentivo ao esporte desde cedo, com a mesma organização da competição principal e lutas casadas pensadas para a segurança dos atletas.",
      pilares: ["Disciplina", "Foco", "Respeito", "Superação"],
      inscricao: {
        responsavelLegal: true,
        toleranciaPesoKg: 3,
        // Nomenclatura de divisões conforme o cartaz ("do infantil ao juvenil").
        // Faixas etárias exatas devem ser confirmadas no regulamento.
        divisoes: ["Infantil", "Infanto-Juvenil", "Juvenil"],
        faixas: ["branca", "cinza", "amarela", "laranja", "verde", "azul", "roxa"],
        // Sem tabela de pesos: lutas casadas pelo peso informado na inscrição.
        pesos: [],
        absoluto: [
          { valor: "Não vou disputar o absoluto", sexo: null },
          { valor: "Absoluto Masculino", sexo: "Masculino" },
          { valor: "Absoluto Feminino", sexo: "Feminino" },
        ],
      },
      edicoes: [
        {
          id: "duelinho-2026-10",
          numero: null,
          data: "2026-10-17",
          horario: null,
          local: locais.redeOlimpicaJoseBonifacio,
          status: "inscricoes-abertas",
          categorias: "Do infantil ao juvenil",
          lutas: regraLutasCasadas,
          premiacao: "1º, 2º e 3º lugar — medalhas para todos os pódios.",
          absoluto: "Masculino e feminino. Valores sob consulta.",
          entradaConvidados: "2 kg de alimento não perecível",
        },
      ],
    },
    {
      id: "fantastic",
      nome: "Fantastic Duelo",
      publico: null,
      chamada: null,
      descricao:
        "Mais um formato da marca O Duelo. Data, local e regras da próxima edição serão anunciados nos canais oficiais.",
      inscricao: null,
      edicoes: [],
    },
  ];

  const marca = {
    nome: "O Duelo",
    slogan: "Um só propósito: fazer história.",
    redes: [
      { rede: "Instagram", usuario: "@oduelojj", url: "https://www.instagram.com/oduelojj/" },
      { rede: "Instagram", usuario: "@campeonatooduelo", url: "https://www.instagram.com/campeonatooduelo/" },
    ],
  };

  /** Opções gerais do formulário. */
  const formulario = {
    sexos: ["Masculino", "Feminino"],
    documentos: [
      { valor: "CPF", rotulo: "CPF" },
      { valor: "RG", rotulo: "RG" },
      { valor: "Passaporte", rotulo: "Passaporte / doc. estrangeiro" },
    ],
    paises: [
      "Brasil", "Argentina", "Bolívia", "Chile", "Colômbia", "Estados Unidos",
      "Japão", "Paraguai", "Peru", "Portugal", "Uruguai", "Outro",
    ],
    parentescos: ["Mãe", "Pai", "Tutor(a) legal", "Outro responsável legal"],
  };

  /**
   * Termos exibidos no formulário. Texto-base: revise com a organização
   * e assessoria jurídica antes de publicar. Ao alterar, atualize `versao`
   * (ela é gravada junto de cada inscrição).
   */
  const termos = {
    versao: "2026-09",
    responsabilidade: [
      "Declaro que o(a) atleta inscrito(a) está em plenas condições de saúde para a prática de Jiu-Jitsu em competição e não possui impedimento médico para participar do evento.",
      "Estou ciente de que o Jiu-Jitsu é um esporte de contato e que a participação envolve riscos inerentes, inclusive de lesões. Reconheço que a organização adota medidas de segurança, mas não pode eliminar esses riscos.",
      "Comprometo-me a respeitar o regulamento, as decisões da arbitragem e as orientações da organização, mantendo conduta esportiva durante todo o evento. Atitudes antidesportivas podem resultar em desclassificação.",
      "Declaro que as informações desta inscrição são verdadeiras — incluindo idade, faixa e peso — e estou ciente de que dados incorretos podem levar ao remanejamento da luta ou à desclassificação.",
      "Autorizo o uso da imagem e da voz do(a) atleta em fotos e vídeos do evento para divulgação nos canais oficiais do O Duelo.",
    ],
    responsavelLegal:
      "Declaro ser mãe, pai ou responsável legal pelo(a) atleta menor de idade e autorizo sua participação no evento, assumindo as responsabilidades descritas no termo.",
    lgpd:
      "Autorizo o tratamento dos meus dados pessoais exclusivamente para gestão da inscrição, organização das lutas e comunicação sobre o evento, conforme a Lei nº 13.709/2018 (LGPD).",
  };

  const config = {
    api: {
      // URL do Web App (Google Apps Script) ou da sua própria API.
      // Vazio = modo demonstração: o formulário valida, mas nada é enviado.
      endpoint: "",
      timeoutMs: 20000,
    },
    // Edições a até N dias da mais próxima aparecem juntas em "Próximo evento".
    janelaProximoEventoDias: 3,
  };

  return { marca, competicoes, faixas, status, formulario, termos, config };
})();
