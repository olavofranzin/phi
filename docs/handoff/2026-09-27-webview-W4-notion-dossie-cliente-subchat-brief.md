# Brief de execução — W4: ligar os campos do Notion ao PHI Dashboard (webview)

| | |
|---|---|
| **Frente** | Webview (PHI Dashboard) — lote **W4, Backend Notion** |
| **Estado do lote** | 🟡 **INICIADO em 08/2026, parado pela metade.** Nomes de campanha e cliente já vêm do Notion; **o dossiê do cliente ainda é mock** |
| **O que esta etapa entrega** | a **Visão Cliente lendo dados REAIS** da DB Clientes do Notion, no lugar do mock |
| **Pedido do Olavo** | 2026-09-27 — *"as ligações dos campos do Notion com o projeto do Lovable, o PHI Dashboard. Do Notion tem que ir inclusive o db Clients."* |
| **Quem executa** | sub-chat de execução (Claude Code ou Codex) |
| **Quem revisa** | o chat-mãe, pelos critérios do §6 — **escritos antes** (R9) |
| **Limite** | **3 voltas.** Na terceira, o problema é o plano, não a execução |

---

## 0. 🔴 AS DUAS BRANCHES — leia antes de qualquer `git`

**Esta etapa mexe em DOIS repositórios.** Errar a branch já custou caro a esta casa em 26/09.

| Repositório | Branch | URL completa |
|---|---|---|
| 🔵 **Código do webview** (é onde você programa) | **`webview`** | `https://github.com/olavofranzin/phi-dashboard-webview/tree/webview` |
| ⚪ **Documentação do PHI** (é onde você registra) | **`claude/consolidacao-2026-08`** | `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |

```bash
git clone https://github.com/olavofranzin/phi-dashboard-webview
cd phi-dashboard-webview && git checkout webview
```

> ⚠️ **E um aviso sobre a documentação desta frente.** Os documentos do webview
> (`ADR-webview-001`, `ADR-webview-002`, `CHECKLIST-webview.md`, `GUIA-DEPLOY-VPS.md`,
> `PLANO-W3-backend-bigquery.md`) **existem em `docs/strategic-planning/webview/`, mas só na branch
> `claude/webview-metricas-clientes-lxps0l`** — **não estão na branch de consolidação.** Para lê-los:
> ```bash
> git show origin/claude/webview-metricas-clientes-lxps0l:docs/strategic-planning/webview/CHECKLIST-webview.md
> ```
> **Não os mova nesta etapa.** Traga-os para a branch de consolidação **apenas se o Olavo pedir** —
> é decisão de governança, não de execução.

---

## 1. 🔴 A restrição que não se negocia: NADA MUDA DE LUGAR

> ## ⚖️ CORREÇÃO DE 2026-09-28 — **esta seção estava errada, e o erro era meu**
>
> A volta 1 **parou aqui, corretamente**, e a premissa que caiu era minha: eu escrevi que o build
> usa `webview/Dockerfile` **porque um comentário dentro do `Dockerfile` da raiz diz isso.**
> **Comentário de artefato não é configuração de deploy** — tomei texto por fato, que é a mesma
> falha da R6 pela terceira vez nesta casa.
>
> ### O que eu medi em 28/09, no histórico do repositório
>
> | Fato medido | Prova |
> |---|---|
> | `webview/src` e `webview/server` **nunca existiram** | `git log --all -- 'webview/src/*'` e `'webview/server/*'` devolvem **vazio** |
> | a pasta `webview/` nasceu em **23/09** de uma série de commits *"Rename X to webview/X"* | `1789fbd` (package.json), `8916a24` (Dockerfile) |
> | o `webview/Dockerfile` **não pode construir** — ele faz `COPY webview/ .` e ali não há código | reproduzido pelo executor: *Rollup failed to resolve import "/src/main.tsx"* |
> | depois da tentativa, o **Dockerfile da raiz foi recriado e corrigido** para copiar da raiz | `3c401e6` → `5b5eabc` *"copy package.json from root"* → `60f17cb` |
> | o `index.html` da **raiz é mais novo** que o de `webview/` | fontes diferentes; a raiz tem `Plus Jakarta Sans`, aplicada no commit `fc0dc2c` |
>
> 🔴 **O que a pasta `webview/` é, então:** **resíduo de um rename começado e nunca terminado em
> 23/09.** Move-se os arquivos de configuração, **esquece-se do código**, o build quebra, e a solução
> foi recriar tudo na raiz — **deixando a metade antiga de pé.** Eu escrevi no brief da volta 1 que
> *"ela duplica configs, é assim de propósito"*. **Não é de propósito. É entulho — e entulho que
> mente.**
>
> ### 🟢 O build verdadeiro (usar este)
>
> ```
> Build Path  = /            (contexto = raiz do repositório)
> Dockerfile  = Dockerfile   (o da RAIZ, não o de webview/)
> ```
>
> ✅ **CONFIRMADO NO PAINEL DO EASYPANEL — Olavo, 2026-09-28.** Não é mais inferência:
>
> | Campo no EasyPanel | Valor |
> |---|---|
> | Repositório | `olavofranzin/phi-dashboard-webview` |
> | Ramo | **`webview`** |
> | Caminho de Build | **`/`** |
> | Construção | Dockerfile |
> | **Arquivo** | 🟢 **`Dockerfile`** — o da **raiz** |
>
> **O comentário da linha 7 do `Dockerfile` da raiz — *"Dockerfile = webview/Dockerfile"* — é falso,
> e foi ele que me enganou.** Um artefato que descreve errado a própria configuração é testemunha
> falsa (R13, regra 3): documentar a intenção no lugar do que está valendo.
>
> 🔴 **A armadilha que sobra, e que não é sua para consertar:** quem editar `webview/package.json`,
> `webview/vite.config.ts` ou `webview/index.html` **mexe em arquivo morto e não vê efeito nenhum.**
> Relatado ao Olavo; a limpeza é decisão dele.

| ❌ Proibido nesta etapa | Por quê |
|---|---|
| mover, renomear ou reorganizar **qualquer** arquivo ou pasta | o deploy quebra, e quebra **em produção**, não no seu terminal |
| mexer em `Dockerfile`, `webview/Dockerfile`, `package.json`, `vite.config.ts`, `tsconfig*` | são o caminho do build |
| "limpar" a pasta `webview/` — ela é **entulho de um rename inacabado de 23/09** (§1), mas remover é **decisão do Olavo** | mexer em pasta de repositório ligado a deploy sem confirmação é risco em produção, não faxina |
| apagar ou editar o `.env` da raiz | ver §7 |

✅ **Você pode criar arquivos novos** — desde que em pastas que já existem (`server/`, `src/lib/phi/`,
`src/hooks/`). **Criar é seguro; mover não é.**

---

## 2. O que JÁ EXISTE — leia antes de escrever uma linha (R7)

**Medido no código em 27/09.** Nada aqui é suposição.

| Peça | Onde | Estado |
|---|---|---|
| Backend Node/Express | `server/index.js` (414 linhas) | 🟢 vivo, no ar na VPS |
| Cliente Notion | `server/notion.js` (423 linhas) | 🟢 **já existe** — `queryAll`, `readProp`, `getClients`, `getNameMaps` |
| Rota de clientes | `GET /api/clients` (`server/index.js:368`) | 🟢 **já existe e já devolve 20 campos do Notion** |
| Leitor de propriedade | `readProp()` (`server/notion.js:48`) | 🟢 trata title, rich_text, email, url, phone, select, status, multi_select, number, date, unique_id, formula |
| As 9 seções do dossiê | `src/lib/phi/sections.ts` | 🟢 prontas — **não redesenhe** |
| O contrato de dados do dossiê | `src/lib/phi/clientTypes.ts` | 🟢 pronto (`ClientDossier.fields` = `Record<string,string>`) |
| 🔴 **A fonte do dossiê** | `src/hooks/useClientData.ts` | 🔴 **devolve `CLIENT_DOSSIERS` do mock.** É ISTO que muda |

> 💡 **O próprio código já diz o que fazer** — comentário em `useClientData.ts`:
> *"Tomorrow: swap the queryFn for a Notion/BigQuery-backed fetcher **with the same shape**."*
> **Mesma forma. Não invente contrato novo.**

### 🔴 2.1. Um defeito VIVO, achado ao ler o código em 27/09

`server/notion.js:111` lê **`x["Fone"]`**. **Essa propriedade não existe na DB Clientes.** O nome real é
**`Telefone/WhatsApp`**. Como `readProp` devolve `null` para propriedade ausente, **o telefone sai
vazio todo dia, sem erro nenhum.**

**É o modo de falha da casa (R11): verde fazendo o contrário do que o nome diz.** Corrija nesta etapa
e **conte quantos clientes passaram a ter telefone** — sem a contagem, não há prova.

---

## 3. O MAPA — cada campo do dossiê e a propriedade do Notion

**Medido em 27/09** contra o schema real da DB Clientes (`19fb65e5-c72b-8147-8aa3-c63aa273d205`).
**Use este mapa. Não adivinhe nomes de propriedade** — acento, `&` e barra fazem parte do nome.

### 01 · Presença Digital
| chave | Propriedade no Notion | tipo |
|---|---|---|
| `instagram` | `Instagram` | url |
| `site` | `Site` | url |
| `gmb` | `Google Meu Negócio` | url |
| `endereco` | `Endereço` | text |
| `whatsappGrupo` | `Grupo WhatsApp` | url |
| `drive` | `Pasta Google Drive` | url |

### 02 · Marca
| `nome` → `Nome da Marca` (text) · `tagline` → `Tagline` (text) · `proposito` → `Propósito` (text) · `valores` → `Valores` (text) · `personalidade` → `Personalidade` (text) |
|---|

### 03 · Comunicação
| `tomVoz` → `Tom de Voz` · `mensagensChave` → `Mensagens-chave` · `evitar` → `O que Evitar` · `referencias` → `Referências de Marcas` — todos text |
|---|

### 04 · Mercado
| `publicoAlvo` → `Público-alvo` · `personas` → `Personas` · `concorrentes` → `Concorrentes` · `diferenciais` → `Diferenciais Competitivos` — todos text |
|---|

### 05 · Contatos
| chave | Propriedade | tipo | ⚠️ |
|---|---|---|---|
| `responsavel` | `Responsável Principal` | text | |
| `email` | `Email` | email | |
| `telefone` | **`Telefone/WhatsApp`** | **text** | 🔴 hoje o código procura `Fone` — §2.1 |
| `financeiro` | `Contato Financeiro` | text | |
| `operacional` | `Contato Operacional` | text | |

### 06 · Comercial
| chave | Propriedade | tipo | ⚠️ |
|---|---|---|---|
| `produtos` | `Produtos & Serviços` | text | |
| `ticket` | `Ticket/LTV` | **number (R$)** | 🟡 formatar como moeda BRL na exibição |
| `funil` | `Funil de Vendas` | text | |
| `objecoes` | `Principais Objeções` | text | |
| `gatilhos` | `Gatilhos de Compra` | text | |

### 07 · Arquivos
| chave | Propriedade | tipo | ⚠️ |
|---|---|---|---|
| `logos` | `Pasta de Logos` | url | |
| `fotos` | `Banco de Fotos` | url | |
| `videos` | `Banco de Vídeos` | url | |
| `documentos` | `Documentos Legais` | 🔴 **file** | **o `readProp` NÃO trata `file` e devolve `null` calado.** Ou trata, ou declara sem fonte — §5 |

### 08 · Branding
| chave | Propriedade | tipo | ⚠️ |
|---|---|---|---|
| `paleta` | `Paleta de Cores` | text | |
| `tipografia` | `Tipografia` | text | |
| `grafismos` | `Grafismos & Elementos` | 🟡 **url no Notion** | o dossiê declara `textarea`. **Exiba como link** |
| `manualMarca` | `Manual da Marca` | url | |

### 09 · Metas
| chave | Propriedade | tipo | ⚠️ |
|---|---|---|---|
| `metaPrincipal` | `Meta Principal` | text | |
| `kpis` | `KPIs` | text | |
| `prazo` | `Prazo` | 🟡 **date** | formatar `DD/MM/AAAA` |
| `orcamento` | `Orçamento` | 🟡 **number (R$)** | formatar moeda |

### Cabeçalho do dossiê — 🔴 **aqui estão as duas armadilhas de verdade**

| campo | O que o código espera | O que o Notion tem | O que fazer |
|---|---|---|---|
| `client` | a sigla (`KIL`) | formula **`Sigla Cliente`** | usar a fórmula |
| `id` | slug da URL `/clientes/:client` | — | manter o que já se usa hoje. **Não mude rota** |
| `status` | `"Ativo" \| "Onboarding" \| "Pausado"` | 🔴 `Status` só tem **`ATIVO`** e **`INATIVO`** | **NÃO invente "Onboarding".** `ATIVO`→`Ativo`; `INATIVO`→ **precisa de decisão**, ver §5 |
| `niche` | `"Barbearia/Estética" \| "Moda/Varejo" \| "Saúde" \| "B2B"` | 🔴 `Segmento` só tem **`Negócio Local`**; existe a relação `Segmento Atução` | 🔴 **NÃO force o valor num dos 4.** Ver §5 |
| `tags` | `string[]` | `Serviços Prestados` (multi_select: AUTOMAÇÃO IA · CRIAÇÃO DE SITE · GOOGLE ADS · LANDING PAGE · META ADS · WEBSITE) | usar |
| `notionUrl` | link da página | `page.url` da API | usar |

> 🔴 **A chave que casa as duas fontes.** No Notion, `client_id` é **`auto_increment_id` (número)**;
> o PHI usa **`CLI-4` (texto)**. A função `clientNum()` já resolve isso — **reuse, não reescreva.**
>
> ⚠️ **E um detalhe que morde:** `Sigla Cliente`, `id_client`, `notion_id_cliente` e `Total Pago`
> estão marcados **`notAvailableInQuerySql`** no schema. **Fórmula e rollup você lê pela API de
> páginas** (que é o que o `queryAll` já faz) — **não por SQL.**

---

## 3.1. 🟢 O que a volta 1 MEDIU — e onde corrigiu o meu número

**Nada aqui é estimativa. Substitui o que eu escrevi de cabeça.**

| O que eu escrevi | O que foi medido (27/09) |
|---|---|
| *"~35 chaves"* | 🔧 **41 chaves** nas 9 seções |
| *"corrija o `Fone` e conte quantos ganharam telefone"* | 🟢 **a conta existe: 11 clientes casados, 6 com telefone no Notion, e o código acha 0.** O ganho do conserto é **0 → 6**, medido antes de consertar |

> ⚠️ **E um achado de governança da volta 1:** o ledger *"PHI — Registro de Execuções"* **não tem a
> opção `Frente = Webview`** — o executor registrou como `Produto PHI (core)` **sem alterar o schema,
> o que foi a atitude certa**. Criar a opção é decisão do Olavo (um clique no Notion).

## 4. O que fazer, em ordem

| # | Passo | Cuidado |
|---|---|---|
| **4.1** | Em `server/notion.js`, **estender `getClients()`** para ler as ~35 propriedades do §3, devolvendo o objeto `fields` já com as **chaves do dossiê** (`instagram`, `site`, …) | **estender, não reescrever.** O `/api/clients` já é consumido |
| **4.2** | Tratar `file` no `readProp` **ou** declarar `documentos` sem fonte (§5) | não deixe cair no `default: return null` |
| **4.3** | Corrigir o `Fone` → `Telefone/WhatsApp` e **contar** quantos clientes ganharam telefone | é o §2.1 |
| **4.4** | Em `useClientData.ts`, trocar a `queryFn` do mock para `fetch("/api/clients")`, **mantendo o tipo `ClientDossier[]`** | mesma forma. Sem contrato novo |
| **4.5** | Decidir o destino de `src/lib/phi/clientMock.ts`: vira **fixture de teste** (e alguém a importa) ou **sai** | ⚠️ **arquivo órfão que ninguém lê é o `raw_ad_data` em forma de código** |
| **4.6** | Campo sem valor ⇒ **N/D**. Campo sem mapeamento ⇒ **lista declarada** (§5) | 🔴 nunca `0`, nunca string vazia disfarçada |

---

## 5. 🔴 A regra do vazio, que vale mais que o mapa

Esta casa já perdeu semanas com três caras do vazio (**R11, regra 5**). No seu caso:

| Situação | ❌ O que NÃO fazer | ✅ O que fazer |
|---|---|---|
| cliente sem `Instagram` preenchido | mostrar em branco, ou `-` | **N/D** |
| propriedade que o `readProp` não sabe ler (`file`, `relation`, `rollup`) | devolver `null` calado | **entrar na lista de "sem fonte", visível** |
| `Status = INATIVO` | mapear para `"Pausado"` porque "parece" | **devolver o valor real e perguntar ao chat-mãe** |
| `niche` fora dos 4 do enum | escolher o mais próximo | **devolver o valor do Notion e declarar o enum desatualizado** |

> 🔴 **O relatório desta etapa TEM de trazer, por cliente e por seção: `<preenchidos> de <total>`.**
> Um dossiê que aparece bonito e vazio é indistinguível de um dossiê quebrado — **e essa distinção é
> a entrega, não um detalhe.**

---

## 6. Critérios de aceite — escritos ANTES (R9)

**Todos com prova medida. "Rodou aqui" não conta.**

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | `GET /api/clients` devolve, para o **KIL (`CLI-4`)**, o objeto `fields` com as chaves do §3 e valores reais do Notion | colar a resposta do KIL no relatório |
| **CA2** | A Visão Cliente no ar **não lê mais o mock** | `grep -r clientMock src/` — só pode aparecer onde o 4.5 decidiu |
| **CA3** | **Toda** chave das 9 seções tem destino: valor, **N/D**, ou **"sem fonte"** declarado | tabela chave × destino, as ~35 linhas |
| **CA4** | O telefone voltou | contagem: **N clientes com telefone antes → M depois** |
| **CA5** | Cobertura por seção, por cliente: `<preenchidos> de <total>` | tabela no relatório |
| **CA6** | 🔴 **Nada foi movido** | `git diff --stat` não mostra `rename`; `Dockerfile`, `webview/Dockerfile`, `package.json`, `vite.config.ts` e `tsconfig*` **intocados** |
| **CA7** | 🔴 **Nada escreve no Notion** | `grep -rn "method: *\"\(POST\|PATCH\|PUT\|DELETE\)\"" server/` — nenhuma chamada nova a `api.notion.com` |
| **CA8** | 🔴 **Nenhum segredo entrou no git** | `git diff` do `.env` da raiz = **vazio**. O `NOTION_TOKEN` mora **só** no `.env` da VPS |
| **CA9** | 🔧 **CORRIGIDO em 28/09** — o build passa como a VPS faz: **`docker build -f Dockerfile .` na raiz** (não `webview/Dockerfile`, ver §1) | se Docker não estiver no host, **`npm run build` na raiz** já prova o front, e o `server/` não tem etapa de build. Escreva qual dos dois usou |
| **CA10** | O `/api/phi-snapshot` (BigQuery) **continua igual** | comparar a resposta antes e depois. **Esta etapa não toca no caminho do score** |

---

## 7. ⚠️ Dois achados de segurança — RELATAR, não consertar sozinho

| # | O que eu vi em 27/09 | Por que não é seu para decidir |
|---|---|---|
| **1** | o **`.env` da raiz está versionado** (chaves `VITE_SUPABASE_*`) e o `.gitignore` **não ignora `.env`** | são chaves `VITE_` (vão para o navegador de qualquer jeito), mas **tirar o arquivo pode quebrar o build da VPS**. **Relate. Não apague.** |
| **2** | existe `src/integrations/supabase/` e `supabase/functions/` no repositório | **pode ser resto do Lovable** — ou pode estar em uso. **Não remova nada.** Diga o que achou |
| **3** | 🔴 **ACHADO NA VOLTA 2 (28/09): o `package-lock.json` está fora de sincronia com o `package.json`** — `npm ci` **falha** no repositório | **Não conserte nesta volta** (é fora do escopo do W4), mas **é dívida declarada, não curiosidade.** Ver abaixo |

> ### 🔴 Por que o lockfile dessincronizado importa mais do que parece
>
> O `Dockerfile` da raiz usa **`npm install`**, não `npm ci`. Isso significa que **o build da VPS
> resolve as dependências do zero a cada deploy** — e **o lockfile não está prendendo nada**.
>
> | | |
> |---|---|
> | **O que se perde** | duas builds do **mesmo commit** podem subir com **versões diferentes** de dependência transitiva |
> | **Como isso aparece** | 🔴 **não aparece.** A build passa verde, o site sobe, e o que mudou não está em commit nenhum |
> | **Por que é a doença da casa** | é **mudança silenciosa em produção sem autor** — a mesma família do `onError: continueRegularOutput` e do nó verde que não produz |
> | **O conserto** | sincronizar o lockfile e trocar para `npm ci` no Dockerfile — **tarefa própria, junto com a limpeza da pasta `webview/`** |
>
> ✅ **A conduta da volta 2 foi a certa:** reproduzir com `--package-lock=false`, **não atualizar o
> lockfile no meio de outra etapa**, e registrar a diferença.

---

## 8. Escopo — o que NÃO entra nesta volta

| Fora | Por quê |
|---|---|
| Projetos · Observações Diárias · PHI-ANÁLISES · `client_config` · `client_goal_history` | são o **W4b**. Uma volta, um destino — e o Clientes é o que o Olavo pediu nominalmente |
| qualquer escrita no Notion ou no BigQuery | **o webview exibe, não escreve.** É guardrail da frente |
| recalcular score | **ADR-003: o score é fato** |
| rodada paga de Lovable | **sem OK de budget do Olavo** |

---

## 9. Registro obrigatório (R3) — senão o digest diário mente

Ao **começar** e ao **encerrar**, crie/atualize linha na DB Notion
**"PHI — Registro de Execuções (Sub-chats)"** com: frente **Webview** · o que foi feito · estado ·
próximo passo · link do artefato.

**Ao terminar (R2):** atualize o `CHECKLIST-webview.md` (marcando o W4) **e diga em qual branch o fez** —
ele hoje vive só na `claude/webview-metricas-clientes-lxps0l`. Se não puder atualizar lá, **escreva
isso no relatório**; não deixe o checklist mentir.

---

## 10. O relatório de volta

1. Os **10 critérios**, um a um, com a prova ou o motivo de ter falhado
2. A tabela **chave × propriedade × destino** (as ~35 linhas)
3. A **cobertura por cliente e seção**
4. O que você **mediu e me desmentiu** — este brief foi escrito lendo o código, e leitura erra
5. Os dois achados do §7
6. O que ficou de fora e por quê

> 🔴 **Se uma premissa deste brief cair, PARE e devolva.** Em 26/09 um sub-chat parou antes do
> primeiro nó porque três das quatro premissas do brief eram falsas — **e isso foi o trabalho certo.**
> Premissa desmentida vale mais que etapa entregue em cima de mentira.
