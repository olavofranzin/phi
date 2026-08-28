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
| 1º Enriquecimento | `yrGOYuRQo9QJ6Zvm` | ativo | **INVESTIGAR** — descrição copiada do `kED2`, não descreve o que faz |
| Enriquecimento Site L4 | `5L3SyzDkZqf1N6vW` | ativo | **DESMEMBRAR ou ARQUIVAR** — a descrição diz que ele *também* extrai 500 leads e cria deals: três funções num workflow só |

`Enriquecimento Site L4` é o caso clássico de workflow que faz demais. Se a parte de site é útil,
extrair só ela; o resto duplica L2 e a criação de deal.

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

**Sinal empírico a conferir:** os backups diários mostram a planilha saindo de **1,44 MB (18/08)**
para **2,88 MB (27/08)** — dobrou em 9 dias. Foram ~141 deals criados em agosto, o que não explica
esse volume. Compatível com poluição por linhas órfãs, mas **não confirmei** abrindo a planilha.

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
| Manter | 6 |
| Promover (já existe, virar oficial) | 1 |
| Desmembrar | 1 (`kED2`) |
| Investigar antes de decidir | 2 (`1º Enriquecimento`, `Site L4`) |
| Arquivar | 8 |

---

## 6. Ordem — do que dá valor primeiro

| # | Ação | Por quê agora |
|---|---|---|
| 1 | Conferir linhas órfãs na planilha | Se houver, a base de treino já está contaminada e cresce a cada 6h |
| 2 | Corrigir o `appendOrUpdate` do R3 (filtrar deals sem match) | É o único workflow ativo que escreve aprendizado |
| 3 | Escolher 1 intake e desativar os outros 2 ativos | Risco de disparo duplicado, custo zero para resolver |
| 4 | Arquivar os 8 mortos | Reduz a superfície que precisa ser reentendida |
| 5 | Promover `5VRPLUB3` e aposentar o status do `kED2` | Elimina a duplicação com o R3 |
| 6 | Investigar `1º Enriquecimento` e `Site L4` | Ambos ativos e sem descrição fiel |

Os passos 3 e 4 não exigem entender nada — são decisão de arquivar. **É o caminho mais curto entre
onde estamos e parar de gastar energia reentendendo o conjunto.**

---

## 7. O que eu não verifiquei

Honestidade sobre o alcance desta análise:

- Abri **integralmente** apenas `kED2AlXJjIYgvHXH` e `WRFU2NM8rLJU7bRT`
- Os demais foram avaliados por **nome, descrição, estado ativo e data de atualização**
- **Não confirmei** se os 3 intakes ativos colidem em webhook
- **Não abri a planilha** — a suspeita de linhas órfãs é inferência a partir do crescimento dos
  backups, não observação direta
- `1º Enriquecimento` e `Site L4` estão **ativos** e receberam veredicto "investigar", não
  "arquivar", justamente porque não os abri

---

*Ponto de partida: a planilha. Critério: uma função, um dono, um contrato de escrita.*
