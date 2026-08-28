# Panorama dos Workflows de Prospecção — o que manter, fundir e arquivar

> **Data:** 2026-08-27 · **Método:** partir das 63 colunas da planilha `leads` (a única saída que
> importa) e perguntar, para cada workflow, *qual coluna ele preenche*. Workflow que não preenche
> coluna nenhuma — nem produz decisão — não tem razão de existir.
> **Base:** `docs/comercial/planilha-leads-schema.json` (AS-BUILT) + inspeção do n8n.

---

## 0. O diagnóstico em uma linha

**7 funções reais. 19 workflows.** Duas funções estão bem resolvidas (1 workflow cada); as outras
cinco têm de 2 a 4 implementações concorrentes, várias delas ativas ao mesmo tempo.

---

## 1. A planilha define as funções

As 63 colunas se agrupam em 6 blocos. Cada bloco deveria ter **um** dono:

| Bloco | Colunas | Quem deveria escrever |
|---|---|---|
| Chave | `id` (place_id), `id_hubspot` | descoberta + criação de deal |
| Identidade / Endereço | nome, setor, contato, site, cidade… | **descoberta** |
| Métricas GBP | `Avaliação`, `Quantidade reviews`, `Quantidade fotos`, `Horário`… | **descoberta** |
| Scoring | `score_tecnico`, `potencial_comercial`, `oferta_recomendada`, `site_tipo`, 6 `dim_*` | **motor de regras** |
| Enriquecimento | `enriquecimento`, `enriquecimento_site`, `analise_gbp_ia` | **enriquecimento** |
| Aprendizado (17) | `hubspot_status`, `motivo_perda`, `dias_no_funil`, `acerto_previsao`… | **sync HubSpot→planilha** |

Isso dá **6 funções de dado** + 1 de zeladoria (schema/backup) = **7**.

---

## 2. Inventário e veredicto

### ✅ Funções bem resolvidas — não mexer

| Workflow | ID | Estado | Veredicto |
|---|---|---|---|
| **Comercial - Sync HubSpot → Planilha (loop de aprendizado)** | `WRFU2NM8rLJU7bRT` | ativo, 6/6h, 9 nós | **MANTER.** Ver §3 — é o melhor artefato da frente |
| **Comercial - Guarda-Schema + Backup Planilha Leads** | `vUI0pPlDASf64Htn` | ativo | **MANTER.** Produz o backup diário que viabiliza o eixo Intent |

### 🔴 Intake — 4 workflows, 3 ativos simultaneamente

| Workflow | ID | Estado |
|---|---|---|
| WPP Intake - Evolution API | `tDdJIhFLyyDqqSNE` | **ativo** |
| WPP Intake - Evolution API **copy 2** | `ZV1fFFrRTRQX2dik` | **ativo** |
| Intake - Telegram API | `kmsaomlIzj48YnCL` | **ativo** |
| Intake - db's apify | `GUQkIWnMZEH32PXH` | inativo |

Os quatro têm **descrição idêntica** ("5-step conversational Q&A triggered by 'Iniciar
Prospecção'"). Três disparam ao mesmo tempo.

**Veredicto: escolher 1, arquivar 3.** Intake é a função mais barata de todas — recebe um pedido e
chama a descoberta. Não justifica quatro implementações. Ter três ativas é risco de disparo
duplicado, não redundância.

⚠️ *Não verifiquei node a node se os webhooks colidem — verificar antes de arquivar.*

### 🔴 Descoberta + scoring — 7 workflows

| Workflow | ID | Estado | Veredicto |
|---|---|---|---|
| GBP Scoring - L2 Discovery (Pipeline A) | `5j79f7oR8x1Nxs4q` | ativo | **MANTER** — é o de produção |
| GBP Scoring - L2b Discovery (Places API) | `n7Z0xwi1dCDioln1` | inativo | **MANTER** — substituto em validação |
| GBP Scoring - L2 Discovery (**ignora id hubspot**) | `Dr4hPO7DpsuBB6Kc` | inativo | **ARQUIVAR** — fork de debug |
| GBP Scoring - L1 Core Engine (teste) | `dtXFdLAHp7HmUh7o` | inativo | **ARQUIVAR** — teste de port já concluído |
| Automate Scrape Google Maps Business Leads | `4mwamlxOg5It49tl` | inativo | **ARQUIVAR** — legado, nunca atualizado |
| 💥 Automate Scrape… Apify - vide II | `nuEJi4WO8NFJjrUP` | inativo | **ARQUIVAR** — template importado |
| SCRATCH - schema real do actor reviews | `2BWz5V6MGK5IBaxa` | inativo | **ARQUIVAR** — scratch |

**7 → 2.** Cinco são fork, teste ou legado que ninguém roda.

### 🟡 Enriquecimento — 3 workflows, 2 ativos

| Workflow | ID | Estado | Veredicto |
|---|---|---|---|
| GBP Scoring - L3 Enriquecimento (Pipeline B/C2) | `EFD7Drr0LDMqfDXw` | ativo | **MANTER** — é o canônico |
| 1º Enriquecimento | `yrGOYuRQo9QJ6Zvm` | ativo, 15 nós | **MANTER + CORRIGIR** — ver §2.1 |
| Enriquecimento Site L4 | `5L3SyzDkZqf1N6vW` | ativo, 9 nós | **DESATIVAR HOJE** — ver §2.2 |

---

### 2.1 `1º Enriquecimento` — é o dono real da criação de deal

Abri: 15 nós, roda **9h e 21h**. A descrição está copiada do `kED2` e não descreve nada do que ele
faz. O que ele faz de verdade:

`lê leads sem enriquecimento` → `Gemini enriquece` → `grava enriquecimento` → `busca deal` →
`cria deal no HubSpot` → `grava id_hubspot na planilha`

**Correção ao panorama anterior:** eu classifiquei a criação de deal como função do `kED2` (inativo)
e do `5VRPLUB3` (inativo). Errado — **quem cria os deals em produção é este workflow.** Os 141 deals
de agosto vieram daqui.

#### 🔴 O bug que explica os deals órfãos

```
Nó: "Atualizar status prospectado na planilha"   →   executeOnce: true
```

Ele está **dentro do loop** e grava o `id_hubspot`. Com `executeOnce: true`, **só o primeiro lead
do lote recebe o `id_hubspot` na planilha.** Todos os demais têm deal criado no HubSpot e a linha
da planilha fica sem a chave.

É a explicação direta para a base de treino vazia: não é que o campo "nunca é populado" — é que ele
é populado **uma vez por execução**, não uma vez por lead.

#### Outros defeitos

| Defeito | Efeito |
|---|---|
| `Search deal por place_id` busca por `dealname` + `telefone`, não por place_id | Dedup frágil — explica por que existe um workflow só para deduplicar |
| `Ler watermark` calcula e **não é usado** no filtro seguinte | Código morto |
| `Normalizar campos do lead` lê `additionalInfo`, `openingHours`, `bookingLinks`, `ownerUpdates` | Campos do **Apify**, inexistentes numa linha lida da planilha → saem vazios |
| Grava `hubspot_status` e `hubspot_estagio` | Colunas que são território do R3 — duas fontes na mesma coluna |

**Veredicto: manter, corrigir o `executeOnce` primeiro.** É uma flag, e destrava o elo inteiro.

---

### 2.2 `Enriquecimento Site L4` — 🔴 desativar hoje

A descrição diz "extrai até 500 leads via Apify e cria deals". **Não faz nada disso.** São 9 nós:
lê a planilha → Gemini analisa o site → grava `enriquecimento_site`.

#### O problema destrutivo

O nó `Atualizar site enriquecido na planilha` grava:

```
enriquecimento_site : {{ $json.output }}     ← correto
enriquecimento      : "="                    ← 🔴
site_tipo           : "="                    ← 🔴
```

Ele **sobrescreve `enriquecimento` e `site_tipo`** com uma expressão vazia, em toda linha que
processa. São colunas de outros donos: `enriquecimento` é do `1º Enriquecimento`, `site_tipo` é do
motor de scoring e alimenta o roteamento de oferta.

O contrato da planilha nasceu de um apagamento de colunas
(*"este é o bloco cujo apagamento motivou este contrato"*). **Este é um mecanismo de apagamento
ainda ativo.**

#### Outros defeitos

| Defeito | Efeito |
|---|---|
| `Atualizar analise site` usa `operation: "get"` | **Não atualiza nada.** Lê o deal e descarta — a análise nunca chega ao HubSpot |
| `sameAsDraft: false` | Draft ≠ versão ativa; alguém editou sem publicar |
| No draft, `Analise site` está **sem filtro** | Se publicado, passa a ler a planilha inteira |
| `const lead = $json.nome` e depois `lead.nome` | `lead` é string → `undefined` no ramo sem site |

**Veredicto: desativar imediatamente.** `triggerCount: 0` — é sub-workflow e ninguém o chama hoje,
então desativar não quebra fluxo nenhum. Depois decidir se a análise de site vira um nó dentro do
L3 (é o lugar natural) ou é descartada.

### 🟡 CRM — criação de deal e status

| Workflow | ID | Estado | Veredicto |
|---|---|---|---|
| HubSpot - Atualizar status e disparar extracao | `kED2AlXJjIYgvHXH` | inativo, **48 nós** | **DESMEMBRAR** — ver §4 |
| Hubspot - Criar deal e atualizar id na planilha | `5VRPLUB3V3YmhjJ5` | inativo | **PROMOVER** — é o desmembramento certo, já começado |
| Comercial - Deduplicar Leads HubSpot | `izimrLm19H4i6LOq` | ativo | **MANTER** — função própria e bem delimitada |

---

## 3. O achado que muda o plano: o R3 existe e é bom

Eu vinha registrando que "o loop R3 não existe" e que isso bloqueava todo o aprendizado.
**Está errado.** `WRFU2NM8rLJU7bRT` está **ativo desde 2026-07-17**, roda a cada 6h, e:

- lê deals modificados desde um cursor persistido em Data Table (`gbp_sync_cursor`) — sem reler
- deriva e grava **as 17 colunas do bloco de aprendizado** + `data_sync_hubspot`
- calcula `acerto_previsao` comparando `potencial_comercial >= 60` com o desfecho real
- só lê o HubSpot e escreve na planilha — nunca altera o CRM
- é idempotente

**O corte 60 que você fixou ontem já está codificado ali dentro.** A infraestrutura de aprendizado
não precisa ser construída: precisa ser *alimentada* com desfechos.

### O defeito dele (o mesmo padrão de novo)

`appendOrUpdate` casando por `id_hubspot`. Quando o deal não tem correspondência na planilha, ele
**acrescenta linha** com as 18 colunas de aprendizado preenchidas e as outras 45 vazias.

Agravante: o nó busca **todos** os deals modificados do CRM, não só os de prospecção. Deal de
cliente ativo também entra e vira linha nova na planilha de leads.

### ❌ A hipótese das linhas órfãs está errada — verificado 2026-08-28

Eu suspeitei que o `appendOrUpdate` estivesse criando linhas órfãs, com base no crescimento dos
backups (1,44 MB em 18/08 → 2,88 MB em 27/08). **Abri a planilha e não é isso.**

| Medida | Resultado |
|---|---|
| Linhas com `place_id` | **353** |
| Dessas, com `nome` vazio | **0** |
| Linhas com dado de aprendizado e sem dado de lead | **0** |
| Linhas com `id_hubspot` preenchido | 289 |
| `data_sync_hubspot` preenchido | 220 |

**Nenhuma linha órfã encontrada.** O R3 não parece ter poluído a base — vem gravando aprendizado em
220 linhas legítimas. O crescimento dos backups é explicado pelos relatórios de enriquecimento
(texto longo do Gemini em `enriquecimento` e `enriquecimento_site`), não por linhas novas.

> ⚠️ **Limite deste método.** A leitura foi feita pela exportação do Google Drive, que renderiza a
> planilha como tabela markdown. Isso tem dois problemas confirmados:
> 1. **Nomes de lead contêm `|`** (ex.: `Niti Odontologia | Dra. Stella Guerra | Dentista em Rio
>    Preto`). O export quebra a linha nesses pipes e desloca as colunas à direita.
> 2. **O arquivo concatena as abas** — há duas tabelas com o schema de 63 colunas (125 e 265
>    linhas) mais uma aba-resumo de contagem mensal. Numeração de linha vinda do export não
>    corresponde à da planilha.
>
> Olavo relata que **a partir da linha 91 as colunas B, C, E e F (`nome`, `setor`, `contato`,
> `site`) estão vazias**. Procurei esse padrão nas duas abas: **zero ocorrências**. Não consegui
> reproduzir pelo export — mas a observação está **confirmada por outra via**, ver §7.

---

## 7. 🔴 Leads envenenados — diagnóstico fechado (2026-08-28)

Confirmado pelo próprio dado: nessas linhas a coluna A (`place_id`) está preenchida, B/C/E/F estão
vazias, e a coluna G (`enriquecimento`) contém **a recusa do Gemini**:

> *"Para realizar uma pesquisa e análise aprofundada do lead, as informações essenciais sobre a
> empresa (Nome, Site, Categoria) são **obrigatórias**. Sem esses dados, não é possível acessar as
> fontes e plataformas necessárias para cumprir as pesquisas solicitadas."*

Essa mensagem é a prova: **o agente recebeu os campos vazios.** Ou seja, a linha já estava sem
identidade *antes* do enriquecimento — não foi o enriquecimento que apagou.

### A cadeia

| # | O que acontece | Onde |
|---|---|---|
| 1 | Uma linha é criada só com `place_id`; `nome`/`setor`/`contato`/`site` vazios | origem a confirmar |
| 2 | O IF do `1º Enriquecimento` testa apenas `enriquecimento` vazio **e** `id` não vazio → a linha **passa** | `1º Enriquecimento` |
| 3 | `Normalizar campos do lead` mapeia valores vazios | idem |
| 4 | O prompt vai com `Nome:` , `Site:` , `Categoria:` vazios → **Gemini recusa** | idem |
| 5 | A recusa é gravada em `enriquecimento` | idem |
| 6 | 🔴 **A linha passa a contar como "enriquecida" e nunca mais é reprocessada** | idem |
| 7 | Deal não é criado (nome vazio) → linha fica sem `id_hubspot` | idem |
| 8 | Sem `id_hubspot`, o R3 não tem onde escrever → **fora da base de treino para sempre** | R3 |

**Verificado:** `SELECT ... FROM DEAL WHERE dealname IS NULL` → **0 resultados**. O estrago parou
antes do CRM; não há deals sem nome. O custo foi em **tokens de Gemini gastos para produzir
recusas** e em leads perdidos da base.

Isto liga as duas pontas: os **64 leads sem `id_hubspot`** da seção anterior são, provavelmente,
esses mesmos leads envenenados.

### Os três consertos

| | Ação | Onde | Efeito |
|---|---|---|---|
| **A** | Somar ao IF a condição `nome` **não vazio** (e idealmente `site` ou `Categoria 1`) | `1º Enriquecimento` | Para a produção de novas linhas envenenadas — 1 condição |
| **B** | Limpar `enriquecimento` nas linhas cujo conteúdo é a recusa | planilha | Devolve as linhas à fila; sem isso ficam marcadas como prontas para sempre |
| **C** | Achar quem cria linha só com `place_id` | a investigar | Corrige a origem |

**Ordem:** A antes de B. Limpar primeiro só faria o ciclo se repetir e gastar Gemini de novo.

**Sobre C — o suspeito, não confirmado:** o defeito 2 do brief do Codex descreve exatamente este
sintoma em `Salvar lead bruto na planilha` (`kED2`): *"perde os dados do lead novo — lê `$json` de
`Buscar lead por place_id` (lookup vazio p/ lead novo) e referencia cabeçalhos da planilha, não os
campos normalizados"*. Bate com o quadro, mas o `kED2` está inativo — confirmar se as linhas são
anteriores à desativação ou se há outra origem ativa (`L2 Discovery` também escreve).

A correção da §6.2 continua valendo como prevenção, mas o dano que eu supunha **não ocorreu**.

### 🔎 O que existe de verdade: 64 leads sem `id_hubspot`

| | |
|---|---|
| Leads com `place_id` mas **sem** `id_hubspot` | **64** (18% da base) |
| Campos preenchidos nessas linhas | ~19–23 de 63 |

São leads descobertos e pontuados que **nunca foram ligados a um deal**. Sem a chave, o R3 não
tem como escrever aprendizado neles — ficam permanentemente fora da base de treino.

**Causa provável:** o `executeOnce: true` do `1º Enriquecimento` (§2.1), que só grava `id_hubspot`
para o primeiro lead de cada lote. O caminho de backfill (`Get lead bruto sem id_deal` →
`Update id_deal`) recupera parte, e esses 64 são o passivo que ele ainda não alcançou.

**Ação:** depois de reativar o `1º Enriquecimento` já sem o `executeOnce`, rodar o backfill até
zerar esses 64.

---

## 4. O padrão que explica o desperdício

O mesmo defeito aparece em **três** workflows independentes:

| Workflow | Nó |
|---|---|
| `kED2AlXJjIYgvHXH` | `Atualizar status do lead na planilha` |
| `WRFU2NM8rLJU7bRT` | `Gravar Aprendizado na Planilha` |
| `kED2AlXJjIYgvHXH` | `Atualizar status prospectado na planilha` |

Todos fazem `appendOrUpdate` sem garantir que a chave existe. **Não é bug de workflow — é falta de
uma regra de escrita compartilhada.**

E é isso que responde ao seu ponto sobre gastar energia sem resultado: o problema não é *quantidade*
de workflow, é que **nenhum deles é dono de um contrato**. Cada um escreve na mesma planilha com sua
própria convenção, então toda descoberta obriga a reentender o conjunto inteiro.

### `kED2AlXJjIYgvHXH` — 48 nós é o sintoma

Ele faz, sozinho: ler contagem de vagas · rodar Apify · normalizar · salvar planilha · enriquecer com
IA · criar deal · buscar deal · backfill de id · mapear estágio · atualizar status · disparar
re-extração · chamar o L2. **Sete funções.** É por isso que ninguém consegue mexer nele sem quebrar
outra coisa — e por isso está `active: false` com 5 execuções manuais no total.

**Veredicto: desmembrar em 3**, aproveitando que `5VRPLUB3V3YmhjJ5` já é o primeiro pedaço:

1. `Criar deal + gravar id_hubspot` → já existe (`5VRPLUB3`), promover
2. `Backfill id_hubspot` (linhas antigas sem id) → extrair
3. ~~Atualizar status~~ → **apagar: o R3 já faz isso melhor**

O item 3 é o ponto: `kED2` e `WRFU2` fazem a mesma coisa, e a versão do `kED2` é a pior das duas.

---

## 5. Resultado

| | Hoje | Proposto |
|---|---|---|
| Workflows de prospecção | 19 | **7** |
| Ativos simultâneos na mesma função | até 3 | 1 |

| Ação | Quantidade |
|---|---|
| Manter | 5 |
| Manter com correção urgente | 1 (`1º Enriquecimento` — `executeOnce`) |
| Desativar hoje | 1 (`Site L4` — apaga colunas alheias) |
| Desmembrar | 1 (`kED2`) |
| Arquivar | 8 |

---

## 6. Ordem — do que dá valor primeiro

| # | Ação | Status |
|---|---|---|
| 1 | Desativar `Enriquecimento Site L4` | ✅ **feito** — `active: false`, `activeVersionId: null` |
| 2 | Tirar `executeOnce: true` do `1º Enriquecimento` | ✅ feito pelo Olavo (⚠️ ver §6.1) |
| 3 | Escolher 1 intake, desativar os outros | ✅ feito pelo Olavo |
| 4 | Conferir linhas órfãs na planilha | ✅ feito pelo Olavo |
| 5 | Corrigir o `appendOrUpdate` do R3 | ✅ **feito 2026-08-28** — ver §6.2 |
| 6 | Arquivar os 8 mortos | ⏳ agendado pelo Olavo para depois |
| 7 | Apagar a parte de status do `kED2`; promover `5VRPLUB3` ou absorver no `1º Enriquecimento` | ⬜ pendente |

### 6.1 ⚠️ `1º Enriquecimento` está `active: false`

Depois da correção do `executeOnce`, o workflow ficou **desativado** (`updatedAt` 2026-08-28 16:55).
Ele é **o único que cria deals no HubSpot** — enquanto estiver desligado, nenhum lead novo entra no
CRM. Se a desativação foi só para editar, reativar; se foi intencional, registrar o motivo.

### 6.2 O que foi alterado no R3 (`WRFU2NM8rLJU7bRT`)

| | Antes | Depois |
|---|---|---|
| Operação | `appendOrUpdate` | `update` |
| `onError` | *(padrão: derruba a execução)* | `continueRegularOutput` |
| Nome do nó | `…(upsert por id_hubspot)` | `…(update por id_hubspot)` |

`update` não cria linha quando não há correspondência — é o comportamento desejado. O `onError`
cobre o caso de o n8n lançar erro em vez de ignorar silenciosamente: o item é descartado sem
derrubar o run. Publicado (`activeVersionId 1015cbb3`).

**Verificação — parcial, e vale dizer:** a execução manual `33092` terminou com sucesso, mas
`Buscar Deals Modificados` devolveu **zero deals** (o cursor havia acabado de avançar às 15:00).
O caminho de "sem correspondência" **não foi exercitado**. Confirmar na próxima execução agendada
que traga deals: nenhuma linha nova deve aparecer na aba `leads`.

**Os passos 1, 2, 3 e 6 são cliques e flags — não exigem entender nada nem escrever código.**
Juntos eles param o apagamento de colunas, destravam a chave de junção e eliminam 10 dos 19
workflows. É o caminho mais curto entre onde estamos e parar de gastar energia reentendendo o
conjunto.

---

## 7. O que eu não verifiquei

Honestidade sobre o alcance desta análise:

- Abri **integralmente**: `kED2AlXJjIYgvHXH`, `WRFU2NM8rLJU7bRT`, `yrGOYuRQo9QJ6Zvm`, `5L3SyzDkZqf1N6vW`
- Os demais foram avaliados por **nome, descrição, estado ativo e data de atualização**
- **Não confirmei** se os 3 intakes ativos colidem em webhook
- **Não abri a planilha** — a suspeita de linhas órfãs é inferência a partir do crescimento dos
  backups, não observação direta
- **Não confirmei o efeito real** de gravar `"="` numa coluna do Google Sheets (se apaga o conteúdo
  ou grava o literal). Em qualquer um dos casos o dado anterior se perde, mas vale conferir numa
  linha que já tenha passado pelo L4

---

*Ponto de partida: a planilha. Critério: uma função, um dono, um contrato de escrita.*
