# O Duelo — Campeonato de Jiu-Jitsu

Site oficial (one-page) da marca **O Duelo**: competições de Jiu-Jitsu / BJJ com três formatos — **O Duelo** (adulto e master), **O Duelinho** (kids e juvenil) e **Fantastic Duelo** (em breve).

Feito em HTML, CSS e JavaScript puros. Sem frameworks e sem etapa de build.

---

## Sumário

1. [Como rodar](#como-rodar)
2. [Estrutura do projeto](#estrutura-do-projeto)
3. [Editando eventos e edições](#editando-eventos-e-edições)
4. [Formulário e categorias](#formulário-e-categorias)
5. [Armazenamento das inscrições](#armazenamento-das-inscrições)
6. [Segurança e LGPD](#segurança-e-lgpd)
7. [Identidade visual](#identidade-visual)
8. [Acessibilidade e responsividade](#acessibilidade-e-responsividade)
9. [Dados pendentes](#dados-pendentes)
10. [Checklist antes de publicar](#checklist-antes-de-publicar)

---

## Como rodar

Abra o `index.html` direto no navegador **ou** sirva a pasta localmente:

```bash
python -m http.server 5173
```

Depois acesse `http://localhost:5173`.

Para abrir o formulário já com um evento escolhido (útil no link da bio do Instagram):

```
https://seu-dominio/?evento=duelinho#inscricao
```

## Estrutura do projeto

```text
ODuelo/
├── index.html                 Estrutura da página única
├── css/
│   └── style.css              Estilos (tokens, componentes, seções, responsivo)
├── js/
│   ├── data.js                FONTE ÚNICA DE DADOS: modalidades, edições, categorias, termos, config
│   ├── utils.js               Utilitários (DOM, HTML seguro, datas, números)
│   ├── eventos.js             Regras: próxima edição, status, inscrições abertas
│   ├── render.js              Renderiza seções a partir de data.js
│   ├── validation.js          Validadores e máscaras (CPF, e-mail, telefone, senha)
│   ├── api.js                 Camada de envio — único ponto que fala com o backend
│   ├── form.js                Formulário: opções dinâmicas, validação, envio
│   └── main.js                Header, menu mobile, scrollspy, marquee, animações
├── assets/
│   ├── logo/
│   │   ├── oduelo-logo.svg    Logo redesenhada (textura de concreto + corte diagonal)
│   │   └── favicon.svg
│   └── images/referencias/    Materiais originais usados como referência
└── backend/                   NÃO faz parte do site estático
    ├── google-apps-script/
    │   └── Code.gs            Recebe inscrições e grava na planilha (Google Sheets)
    └── data/
        └── inscricoes.csv     Modelo de colunas (somente cabeçalho, sem registros)
```

Separação de responsabilidades:

| Camada      | Onde                          |
|-------------|-------------------------------|
| Estrutura   | `index.html`                  |
| Estilos     | `css/style.css`               |
| Dados       | `js/data.js`                  |
| Lógica      | `js/*.js`                     |
| Persistência| `backend/` (fora do navegador) |
| Assets      | `assets/`                     |

Os scripts são clássicos (`defer`) com um namespace global `ODuelo`, para funcionar inclusive abrindo o arquivo direto do disco (módulos ES exigem servidor).

## Editando eventos e edições

Tudo fica em **`js/data.js`**. Nenhuma edição tem página própria: a página inteira é gerada a partir dos dados.

### Adicionar uma nova edição

Inclua um objeto em `edicoes` da modalidade:

```js
{
  id: "duelo-2027-03",            // único e estável (vai para a planilha)
  numero: 2,                      // opcional — exibe "Edição 02"
  data: "2027-03-14",             // AAAA-MM-DD
  horario: "09h",                 // null = "A confirmar"
  local: locais.redeOlimpicaJoseBonifacio,
  status: "inscricoes-abertas",
  categorias: "Faixas branca, azul, roxa, marrom e preta",
  lutas: regraLutasCasadas,
  premiacao: "1º, 2º e 3º lugar — medalhas para todos os pódios.",
  absoluto: "Masculino e feminino, adulto e master. Valores sob consulta.",
  entradaConvidados: "2 kg de alimento não perecível",
}
```

Isso atualiza automaticamente: hero, "Próximo evento", contagem regressiva, lista de edições da modalidade, comparativo e opções do formulário.

> Lembre-se de liberar a mesma edição no backend (`CONFIG.EDICOES` em `Code.gs`).

### Status disponíveis

| Status                  | Aparece como          | Aceita inscrição |
|-------------------------|-----------------------|------------------|
| `inscricoes-abertas`    | Inscrições abertas    | Sim              |
| `em-breve`              | Em breve              | Não              |
| `inscricoes-encerradas` | Inscrições encerradas | Não              |
| `realizado`             | Evento realizado      | Não              |

Edições com data passada viram "Evento realizado" automaticamente e vão para "Edições anteriores".

### Próximo evento

A seção mostra a edição futura mais próxima **e** as que acontecem até `config.janelaProximoEventoDias` (3) dias depois — por isso Duelinho (17/10) e Duelo (18/10) aparecem juntos, como no cartaz.

### Fantastic Duelo

Hoje está com `edicoes: []` e `inscricao: null`, então aparece como "Em breve" e fica desabilitado no formulário. Para abrir inscrições:

1. adicione uma edição em `edicoes`;
2. preencha `inscricao` (faixas, divisões, pesos, absoluto) no mesmo formato das outras modalidades.

## Formulário e categorias

As opções dependem do evento selecionado e vêm de `competicoes[].inscricao`:

```js
inscricao: {
  responsavelLegal: false,        // true = mostra "Dados do responsável" (Duelinho)
  toleranciaPesoKg: 3,
  divisoes: ["Adulto", "Master"],
  faixas: ["branca", "azul", "roxa", "marrom", "preta"],  // ids de `faixas`
  pesos: ["Até 65 kg", "Até 75 kg", "Até 85 kg", "Até 95 kg", "Acima de 95 kg"],
  absoluto: [{ valor: "Absoluto Feminino — Adulto", sexo: "Feminino" }, ...],
}
```

- `pesos: []` esconde a categoria de peso (lutas casadas pelo peso informado).
- As opções de absoluto são filtradas pelo sexo escolhido.
- País, documentos, parentesco e textos dos termos também ficam em `data.js`.

Validações: campos obrigatórios, nome e sobrenome, CPF com dígito verificador, e-mail, telefone, senha (8+ caracteres com letras e números), confirmação de senha, peso, aceite obrigatório dos termos e da LGPD, e — no Duelinho — confirmação do responsável legal e atleta menor de 18 anos. Mensagens aparecem junto de cada campo e o foco vai para o primeiro erro.

## Armazenamento das inscrições

### A limitação

Um site estático (HTML + CSS + JS no navegador) **não consegue gravar com segurança em um arquivo CSV/Excel no servidor**. Qualquer "gravação" feita pelo navegador ficaria só na máquina do visitante — ou exigiria expor credenciais no código público. Por isso:

- o `backend/data/inscricoes.csv` do repositório é **apenas o modelo de colunas**;
- nenhum dado de inscrito é salvo no navegador (sem localStorage, cookies ou arquivos públicos);
- enquanto `config.api.endpoint` estiver vazio, o site roda em **modo demonstração**: valida tudo, avisa na tela e **não envia nada**.

### Arquitetura recomendada (gratuita e sem servidor próprio)

```text
Navegador (site estático)
   │  POST JSON via HTTPS  (js/api.js)
   ▼
Google Apps Script — Web App  (backend/google-apps-script/Code.gs)
   │  valida de novo · hash da senha · anti-duplicidade · anti-spam
   ▼
Google Sheets (planilha privada da organização)
   │
   └── Arquivo → Fazer download → inscricoes.csv  ou  inscricoes.xlsx
```

Vantagens: custo zero, planilha privada com controle de acesso do Google, exportação direta para CSV/XLSX e nenhuma alteração no frontend se um dia houver API própria.

### Passo a passo

1. Crie uma planilha no Google Sheets (conta da organização).
2. Menu **Extensões → Apps Script**. Apague o conteúdo e cole `backend/google-apps-script/Code.gs`.
3. Confira `CONFIG.EDICOES` (mesmos ids de `js/data.js`).
4. Selecione a função **`setup`** e clique em **Executar** (autorize quando solicitado). A aba `inscricoes` é criada com o cabeçalho.
5. **Implantar → Nova implantação → Tipo: App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a URL gerada (`https://script.google.com/macros/s/.../exec`) e cole em `js/data.js`:

   ```js
   config: { api: { endpoint: "https://script.google.com/macros/s/.../exec", timeoutMs: 20000 } }
   ```

7. Publique o site e faça uma inscrição de teste. A linha aparece na planilha com o protocolo `OD-AAMMDD-XXXXXX`.

Ao alterar o `Code.gs`, use **Implantar → Gerenciar implantações → Editar → Nova versão** para manter a mesma URL.

### Exportar para CSV / XLSX

- Na planilha: **Arquivo → Fazer download → Valores separados por vírgula (.csv)** ou **Microsoft Excel (.xlsx)**.
- Ou execute `exportarCsv()` no Apps Script: gera `inscricoes-AAAA-MM-DD_HHmm.csv` no Google Drive **sem** a coluna `senha_hash`.

### Contrato da API (para trocar de backend no futuro)

`js/api.js` envia:

```http
POST <endpoint>
Content-Type: text/plain;charset=utf-8
```

```json
{
  "evento": "duelinho",
  "edicao": "duelinho-2026-10",
  "responsavel_nome": "Maria Souza",
  "responsavel_cpf": "000.000.000-00",
  "responsavel_parentesco": "Mãe",
  "nome_completo": "João Souza",
  "data_nascimento": "2014-05-20",
  "sexo": "Masculino",
  "documento_tipo": "CPF",
  "cpf_rg": "000.000.000-00",
  "pais": "Brasil",
  "endereco": "Rua Exemplo, 10 — Itaquera, São Paulo/SP",
  "email": "maria@exemplo.com",
  "telefone": "(11) 90000-0000",
  "senha": "(texto; o servidor guarda somente o hash)",
  "equipe": "Equipe Exemplo",
  "professor": "Professor Exemplo",
  "faixa": "Cinza",
  "divisao": "Infantil",
  "peso_kg": 38.5,
  "categoria_peso": "Casada pelo peso informado",
  "categoria_absoluto": "Não vou disputar o absoluto",
  "filiacao_federacao": "",
  "aceite_termos": true,
  "aceite_responsavel": true,
  "aceite_lgpd": true,
  "versao_termos": "2026-09",
  "website": ""
}
```

Resposta esperada: `{ "ok": true, "protocolo": "OD-..." }` ou `{ "ok": false, "erro": "mensagem" }`.

Qualquer backend (Node, PHP, Supabase Edge Function, etc.) que respeite esse contrato funciona sem mudar o frontend. Os nomes dos campos são os mesmos das colunas do CSV.

## Segurança e LGPD

- **Nada de dados pessoais no frontend**: o site só envia; não guarda nem lê inscrições.
- **Senha nunca em texto puro**: o Apps Script grava `pbkdf2_sha256$iterações$salt$hash` (PBKDF2-HMAC-SHA256 com salt aleatório). Se o projeto evoluir para login de atletas, prefira um serviço de autenticação dedicado (ex.: Firebase Auth, Supabase Auth).
- **Validação dupla**: o navegador valida para ajudar o usuário; o servidor valida de novo e só aceita edições liberadas em `CONFIG.EDICOES`.
- **Anti-spam**: campo armadilha (honeypot) + limite de 1 envio por minuto por e-mail.
- **Anti-duplicidade**: mesmo documento na mesma edição é recusado.
- **Injeção de fórmulas**: valores iniciados por `= + - @` são gravados como texto.
- **HTTPS obrigatório**: `api.js` bloqueia envio para endpoints sem HTTPS.
- **Planilha privada**: compartilhe apenas com quem precisa. Exportações em CSV contêm dados pessoais — não publique nem versione (o `.gitignore` já bloqueia `backend/data/*` e `*.xlsx`).
- **Termos e LGPD**: os textos em `data.js → termos` são uma base; revise com a organização/assessoria jurídica. A `versao_termos` é gravada em cada inscrição.

## Identidade visual

| Token            | Valor     | Uso |
|------------------|-----------|-----|
| Preto            | `#171717` | Texto, seções escuras, rodapé |
| Azul             | `#0039B5` | Destaque, CTAs, números sobre fundo claro |
| Azul elétrico    | `#2F66FF` | Números grandes sobre fundo escuro |
| Azul suave       | `#7FA2FF` | Textos pequenos sobre fundo escuro (contraste AA) |
| Concreto         | `#E4E3DF` | Fundo principal com textura sutil (SVG noise) |
| Off-white        | `#F0EFEB` / `#FBFBF9` | Seções e painéis |

- **Tipografia**: Barlow Condensed (títulos, números, datas), Barlow (textos), JetBrains Mono (etiquetas técnicas).
- **Logo**: redesenhada em SVG a partir da original — mesmas proporções condensadas, textura de concreto com riscos horizontais de velocidade e um **corte diagonal azul** que divide "O DU / ELO" em dois lados (o duelo). No site ela fica inline (sprite no `index.html`) para herdar cores; `assets/logo/oduelo-logo.svg` é a versão para uso externo.
- **Elementos**: grade de tatame no hero, faixas com ponteira, escala de pesos em números grandes, comparativo "VS", marquee.
- **Animações**: entrada do wordmark (os dois lados se encontram no corte), revelação ao rolar (IntersectionObserver), contagem regressiva, marquee e microinterações. Tudo respeita `prefers-reduced-motion`.

## Acessibilidade e responsividade

- HTML semântico, link "Pular para o conteúdo", `aria-current` na navegação, menu mobile com `aria-expanded`, `Esc` e `inert` no conteúdo de fundo.
- Todos os campos com `label`, obrigatórios marcados, erros ligados por `aria-describedby`, `aria-invalid` e região `aria-live` para status.
- Foco visível em todos os elementos interativos; contraste AA nas combinações de cor.
- Layout mobile-first com composição própria para celular (testado de 360px a 1920px), alvos de toque ≥ 44px e sem rolagem horizontal.

## Dados pendentes

Informações que **não constam no cartaz** e foram deixadas preparadas (`null` ou "A confirmar") em vez de inventadas:

- horário das lutas (`horario`);
- número da edição (`numero`) — hoje exibido como "Edição Out/2026";
- valores de inscrição e do absoluto ("valores em off" no cartaz);
- faixas etárias exatas das divisões do Duelinho;
- telefone/e-mail oficial de contato (hoje o contato é pelo Instagram).

## Checklist antes de publicar

- [ ] Revisar textos dos termos e da LGPD.
- [ ] Preencher horário e demais dados pendentes em `js/data.js`.
- [ ] Implantar o Apps Script e configurar `config.api.endpoint`.
- [ ] Conferir `CONFIG.EDICOES` no `Code.gs`.
- [ ] Fazer uma inscrição de teste e baixar o CSV.
- [ ] Publicar apenas os arquivos do site (a pasta `backend/` não precisa ir para a hospedagem).
