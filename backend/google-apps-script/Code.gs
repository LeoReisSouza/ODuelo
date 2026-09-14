/**
 * O Duelo — backend de inscrições (Google Apps Script + Google Sheets)
 * -----------------------------------------------------------------
 * Recebe o POST do formulário, valida os dados no servidor, gera o hash
 * da senha e grava uma linha na aba "inscricoes" da planilha.
 * A planilha pode ser baixada a qualquer momento em .csv ou .xlsx.
 *
 * Instalação: veja README.md → "Armazenamento das inscrições".
 */

const CONFIG = {
  ABA: "inscricoes",

  // Edições que aceitam inscrição. Espelhe os ids de js/data.js.
  // O servidor não confia no navegador: edição fora desta lista é recusada.
  EDICOES: {
    "duelo-2026-10": { evento: "duelo", responsavelLegal: false },
    "duelinho-2026-10": { evento: "duelinho", responsavelLegal: true },
  },

  PBKDF2_ITERACOES: 10000,
  INTERVALO_MINIMO_SEGUNDOS: 60,
  TAMANHO_MAXIMO_CAMPO: 300,
  FUSO: "America/Sao_Paulo",

  // Mesma ordem de backend/data/inscricoes.csv
  COLUNAS: [
    "id", "data_inscricao", "evento", "edicao", "nome_completo", "data_nascimento", "sexo",
    "documento_tipo", "cpf_rg", "endereco", "pais", "email", "senha_hash", "telefone",
    "equipe", "professor", "faixa", "divisao", "peso_kg", "categoria_peso", "categoria_absoluto",
    "filiacao_federacao", "responsavel_nome", "responsavel_cpf", "responsavel_parentesco",
    "aceite_termos", "aceite_responsavel", "aceite_lgpd", "versao_termos",
  ],
};

/** Execute uma vez pelo editor para criar a aba e o cabeçalho. */
function setup() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(CONFIG.ABA) || planilha.insertSheet(CONFIG.ABA);
  aba.getRange(1, 1, 1, CONFIG.COLUNAS.length).setValues([CONFIG.COLUNAS]).setFontWeight("bold");
  aba.setFrozenRows(1);
}

function doGet() {
  return json({ ok: true, servico: "O Duelo — inscrições" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const dados = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Campo armadilha preenchido: responde como sucesso e descarta.
    if (dados.website) return json({ ok: true, protocolo: null });

    const erro = validar(dados);
    if (erro) return json({ ok: false, erro: erro });

    if (enviouRecentemente(dados.email)) {
      return json({ ok: false, erro: "Aguarde um minuto antes de enviar outra inscrição." });
    }

    const senhaHash = hashSenha(dados.senha);

    lock.waitLock(20000);
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ABA);
    if (jaInscrito(aba, dados)) {
      return json({ ok: false, erro: "Já existe uma inscrição com este documento nesta edição." });
    }

    const protocolo = gerarProtocolo();
    const registro = Object.assign({}, dados, {
      id: protocolo,
      data_inscricao: Utilities.formatDate(new Date(), CONFIG.FUSO, "yyyy-MM-dd HH:mm:ss"),
      senha_hash: senhaHash,
    });
    aba.appendRow(CONFIG.COLUNAS.map(function (coluna) { return celula(registro[coluna]); }));

    return json({ ok: true, protocolo: protocolo });
  } catch (err) {
    console.error(err);
    return json({ ok: false, erro: "Não foi possível registrar a inscrição agora. Tente novamente." });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

/* ------------------------------ Validação ------------------------------ */

function validar(d) {
  const edicao = CONFIG.EDICOES[d.edicao];
  if (!edicao || edicao.evento !== d.evento) return "Edição inválida ou com inscrições encerradas.";

  const obrigatorios = [
    "nome_completo", "data_nascimento", "sexo", "documento_tipo", "cpf_rg", "endereco", "pais",
    "email", "telefone", "equipe", "professor", "faixa", "divisao", "peso_kg",
    "categoria_peso", "categoria_absoluto",
  ];
  if (edicao.responsavelLegal) obrigatorios.push("responsavel_nome", "responsavel_cpf", "responsavel_parentesco");

  const faltando = obrigatorios.filter(function (campo) { return !preenchido(d[campo]); });
  if (faltando.length) return "Campos obrigatórios ausentes: " + faltando.join(", ") + ".";

  const longo = Object.keys(d).some(function (campo) {
    return typeof d[campo] === "string" && d[campo].length > CONFIG.TAMANHO_MAXIMO_CAMPO;
  });
  if (longo) return "Um dos campos excede o tamanho permitido.";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return "E-mail inválido.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data_nascimento)) return "Data de nascimento inválida.";
  if (d.documento_tipo === "CPF" && !cpfValido(d.cpf_rg)) return "CPF inválido.";
  if (edicao.responsavelLegal && !cpfValido(d.responsavel_cpf)) return "CPF do responsável inválido.";

  const peso = Number(d.peso_kg);
  if (!(peso >= 10 && peso <= 250)) return "Peso inválido.";

  const senha = d.senha;
  if (typeof senha !== "string" || senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
    return "A senha não atende ao padrão mínimo.";
  }

  if (d.aceite_termos !== true || d.aceite_lgpd !== true) return "É necessário aceitar os termos.";
  if (edicao.responsavelLegal && d.aceite_responsavel !== true) return "A confirmação do responsável legal é obrigatória.";

  return "";
}

function preenchido(valor) {
  return valor !== undefined && valor !== null && String(valor).trim() !== "";
}

function cpfValido(valor) {
  const cpf = String(valor).replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  function digito(tamanho) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

/* ------------------------------ Segurança ------------------------------ */

/**
 * PBKDF2-HMAC-SHA256 com salt aleatório. Formato armazenado:
 * pbkdf2_sha256$<iterações>$<salt>$<hash base64>
 */
function hashSenha(senha) {
  const salt = Utilities.getUuid().replace(/-/g, "");
  const chave = Utilities.newBlob(senha).getBytes();
  const hmac = function (valor) {
    return Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, valor, chave);
  };

  let bloco = hmac(Utilities.newBlob(salt).getBytes().concat([0, 0, 0, 1]));
  const resultado = bloco.slice();
  for (let i = 1; i < CONFIG.PBKDF2_ITERACOES; i++) {
    bloco = hmac(bloco);
    for (let j = 0; j < resultado.length; j++) resultado[j] ^= bloco[j];
  }
  return ["pbkdf2_sha256", CONFIG.PBKDF2_ITERACOES, salt, Utilities.base64Encode(resultado)].join("$");
}

/** Limite simples por e-mail para evitar envios repetidos. */
function enviouRecentemente(email) {
  const cache = CacheService.getScriptCache();
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(email).trim().toLowerCase());
  const chave = "envio_" + Utilities.base64EncodeWebSafe(digest);
  if (cache.get(chave)) return true;
  cache.put(chave, "1", CONFIG.INTERVALO_MINIMO_SEGUNDOS);
  return false;
}

function jaInscrito(aba, d) {
  const linhas = aba.getLastRow() - 1;
  if (linhas < 1) return false;

  const colEdicao = CONFIG.COLUNAS.indexOf("edicao") + 1;
  const colDocumento = CONFIG.COLUNAS.indexOf("cpf_rg") + 1;
  const edicoes = aba.getRange(2, colEdicao, linhas, 1).getValues();
  const documentos = aba.getRange(2, colDocumento, linhas, 1).getValues();
  const documento = normalizarDocumento(d.cpf_rg);

  return documentos.some(function (linha, i) {
    return edicoes[i][0] === d.edicao && normalizarDocumento(linha[0]) === documento;
  });
}

function normalizarDocumento(valor) {
  return String(valor).replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

/** Converte o valor para célula, bloqueando injeção de fórmulas (CSV/planilha). */
function celula(valor) {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "boolean") return valor ? "sim" : "nao";
  const texto = String(valor).trim();
  return /^[=+\-@\t\r]/.test(texto) ? "'" + texto : texto;
}

function gerarProtocolo() {
  const data = Utilities.formatDate(new Date(), CONFIG.FUSO, "yyMMdd");
  return "OD-" + data + "-" + Utilities.getUuid().slice(0, 6).toUpperCase();
}

function json(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------ Exportação ------------------------------ */

/**
 * Opcional: gera um inscricoes-AAAA-MM-DD.csv no Google Drive (sem a coluna
 * senha_hash). Também é possível usar Arquivo → Fazer download → .csv/.xlsx.
 */
function exportarCsv() {
  const valores = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.ABA).getDataRange().getDisplayValues();
  const colunaSenha = valores[0].indexOf("senha_hash");
  const csv = valores
    .map(function (linha) {
      return linha
        .filter(function (_, i) { return i !== colunaSenha; })
        .map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; })
        .join(",");
    })
    .join("\r\n");
  const nome = "inscricoes-" + Utilities.formatDate(new Date(), CONFIG.FUSO, "yyyy-MM-dd_HHmm") + ".csv";
  const arquivo = DriveApp.createFile(nome, "\uFEFF" + csv, MimeType.CSV);
  console.log("CSV criado: " + arquivo.getUrl());
}
