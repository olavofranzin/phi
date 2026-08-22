# Spec — Card estratégico GBP no record do Deal (HubSpot)

> **Entregável #3** do brief `docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md`.
> Define **campo → coluna → card/aba** para (A) aplicar o layout **nativo** em produção e (B) construir o
> **App Card (extension)** como protótipo. **Fundamentada em recon read-only de 2026-08-17** (não é hipótese).
> **Mockup de validação (Claude Design):** artifact `e2c97b96-eaf2-41de-b9d2-5237771eed1b`.
> **Guardrail-mãe:** o card e a aba **EXIBEM** dados — nunca escrevem propriedade nem movem o deal.

---

## 0. Estado confirmado (recon read-only 2026-08-17)

- **Portal** `5633277` · accountType **STANDARD** · moeda **BRL** · fuso `America/Sao_Paulo`.
- **Tier Free** (confirmado por Olavo 2026-07-13) → **não re-verificar**. Consequência fixa: App Card de
  private app não roda; App Card de public app **não renderiza em produção Free** → Camada B é protótipo no
  Developer Test Account até upgrade p/ Starter+.
- **1 pipeline** `default`; estágio de entrada `Prospectado` = `70807682-148b-4914-acd0-97aad8c2a000`;
  fechados = `closedwon` / `closedlost` (a IA **nunca** escreve nesses dois).
- **As 21 propriedades do card JÁ EXISTEM** em `deals` (`propertiesNotFound: []`). Nada a criar para o card.

---

## 1. Mapa mestre — campo → tipo → destino → como renderiza

Legenda de destino: **[C]** card GBP (coluna central, Camada B) · **[H]** Destaques de dados (topo central,
Camada A) · **[T]** aba "IA/Diagnóstico" (Camada A) · **[R]** coluna direita (métricas secundárias).

| Propriedade (internal) | Tipo (confirmado) | Label | Destino | Renderização |
|---|---|---|---|---|
| `potencial_comercial` | number 0–100 | Potencial Comercial (GBP) | **[C][H]** | Número grande + barra (o que decide) |
| `oferta_recomendada` | enum `SVC-GBP\|SVC-SITE\|SVC-ADS` | Oferta Recomendada (GBP) | **[C][H]** | Badge colorido por serviço |
| `ipc` | number 0–100 | IPC – Índice de Potencial Comercial (GBP) | **[C]** | Métrica "oportunidade de venda" |
| `score_tecnico` | number 0–100 | Score Técnico (GBP) | **[C]** | Métrica "quão otimizado já está" |
| `dim_saude` | number 0–100 | Dimensão: Saúde do Perfil (GBP) | **[C]** | Barra com banda de status + valor |
| `dim_seo` | number 0–100 | Dimensão: SEO Local (GBP) | **[C]** | idem |
| `dim_autoridade` | number 0–100 | Dimensão: Autoridade (GBP) | **[C]** | idem |
| `dim_conversao` | number 0–100 | Dimensão: Conversão (GBP) | **[C]** | idem |
| `dim_engajamento` | number 0–100 | Dimensão: Engajamento (GBP) | **[C]** | idem |
| `dim_conteudo` | number 0–100 | Dimensão: Conteúdo (GBP) | **[C]** | idem |
| `nao_reivindicado` | bool | GBP Não Reivindicado | **[C]** | Chip "sinal de ouro" (só se `true`) |
| `site_tipo` | enum `site\|social\|none` | Tipo de Site (GBP) | **[C][R]** | Chip: Site próprio / Rede social / Sem site |
| `flags_score` | string (lista curta) | Flags do Score (GBP) | **[C]** | 1 chip por flag (ex.: `site=rede`) |
| `proxima_acao_aceite` | enum `pendente\|aceita\|rejeitada` | NBA – Aceite | **[C]** | Chip NBA |
| `analise_gbp_ia` | string longa | Analise GBP (IA) | **[T]** | Bloco de texto (render com `[CERTEZA]`/`[HIPOTESE]`) |
| `analise_site_ia` | string longa | Analise site (IA) | **[T]** | Bloco de texto |
| `analise_instagram_ia` | string longa | Analise Instagram (IA) | **[T]** | Bloco de texto |
| `abordagem_sugerida_ia` | string longa | Abordagem sugerida (IA) | **[T]** | Bloco de texto |
| `proxima_acao_recomendada` | string longa | Próxima Ação Recomendada | **[T]** | Bloco de texto (a NBA por extenso) |
| `dados_enriquecimento` | string (JSON) | Dados Enriquecimento | **[T]** | Lista chave→valor (parse do JSON) |
| `followup` | string | Follow-up | **[T]** | Bloco de texto (input humano) |

> **Regra de limpeza (brief §1):** **nenhuma string longa no card [C]** — todo texto extenso vai para a aba [T].
> O card carrega só número/enum/bool.

---

## 2. Camada A — NATIVO (vai para produção agora, funciona em Free)

Aplicada por **Olavo na UI** (Configurações → Objetos → **Negócios** → *Personalizar a experiência de registro*).
Não precisa de dev/CLI. Carrega ~80% do valor (página limpa e hierárquica).

### 2.1. Aba "IA / Diagnóstico" (coluna central)
Nova aba com **cards de propriedade** contendo, nesta ordem, os campos **[T]**:
`analise_gbp_ia` · `proxima_acao_recomendada` · `abordagem_sugerida_ia` · `analise_site_ia` ·
`analise_instagram_ia` · `dados_enriquecimento` · `followup`.
Objetivo: leitura sob demanda, **fora** da visão geral.

### 2.2. "Destaques de dados" (topo central, ~3 campos)
Trocar para os 3 mais estratégicos **[H]**: `potencial_comercial` · `oferta_recomendada` · `dealstage` (Etapa do negócio).

### 2.3. Grupo de propriedades
Manter os campos GBP/IA agrupados no grupo existente (**`ia_enriquecimento`** / scoring GBP) para leitura coerente no CRM.

### 2.4. Coluna esquerda (manter enxuta)
Nome, telefone, pipeline/etapa, botões de ação. **Não** poluir com métricas de IA.

### 2.5. Layout do record — as 3 colunas (DECIDIDO — aplicar, não redecidir)

> Fonte: §1 (mapa campo→coluna) + brief `2026-07-11` §1/§6 + brief de finalização
> `docs/handoff/2026-08-18-hubspot-cards-finalizacao-subchat-brief.md` §1.1 + mockup `e2c97b96`.
> Internal names reais (confirmados no recon). O sub-chat **aplica** este layout, não o redecide.

**Coluna ESQUERDA — enxuta (regra: ZERO métrica de IA/GBP aqui).**
`dealname` · contato (nome / telefone / e-mail) · **pipeline + etapa** (`dealstage`) · botões de ação
(Ligar / E-mail / Tarefa). Só a identificação do negócio — nenhum scoring, dimensão ou texto de IA.

**Coluna CENTRAL — onde mora o diagnóstico. 3 blocos, de cima para baixo:**
1. **Destaques de dados** (topo, 3 campos): `potencial_comercial` · `oferta_recomendada` ·
   `dealstage` (Etapa do negócio). [ver §2.2]
2. **Card "Diagnóstico GBP"** (Camada B App Card, ou o card nativo) — os **14 campos compactos** na
   hierarquia (a)–(e) definida em **§3.1**. **Regra de ouro: NENHUM texto longo no card.**
3. **Aba "IA / Diagnóstico"** (Camada A, nativo) — os **7 textões** na ordem de **§2.1**.

**Coluna DIREITA — apoio:** associações (Contato / Empresa) + métricas secundárias
`createdate` · última modificação · `nao_reivindicado` · `site_tipo`.

> Resumo: **esquerda = quem é o negócio** (sem IA) · **central = o diagnóstico** (Destaques → card
> compacto → aba com os textões) · **direita = apoio / associações**. Campos compactos no card;
> textos longos só na aba.

**Guardrail A:** tudo aqui é **exibição** — nenhuma automação escreve a partir do card/aba.

---

## 3. Camada B — APP CARD (extension) — protótipo no Developer Test Account

**Não instalar em produção enquanto Free.** Construir/testar no Developer Test Account (renderiza lá independe do
tier de produção); ficar pronto para promover no upgrade. Legacy: usar **App Card (UI extension)**, não CRM card clássico.

### 3.1. Estrutura do card (hierarquia do brief §1)
1. **Topo:** `potencial_comercial` (número grande + barra) · `oferta_recomendada` (badge por serviço).
2. **Linha 2:** `ipc` (rótulo *oportunidade de venda*) · `score_tecnico` (rótulo *quão otimizado*) + 1 linha
   explicando a diferença.
3. **Dimensões:** os 6 `dim_*` como barras (ordem: saúde, seo, autoridade, conversão, engajamento, conteúdo).
4. **Sinais de ouro:** chip `nao_reivindicado` (só se true) · chip `site_tipo` · 1 chip por `flags_score`.
5. **NBA:** chip `proxima_acao_aceite`.

### 3.2. Mapa componente (`@hubspot/ui-extensions`)
| Elemento | Componente |
|---|---|
| Potencial / IPC / Score (números) | `Statistics` / `Text` |
| Oferta, site_tipo, não-reivindicado, NBA | `Tag` / `StatusTag` |
| 6 dimensões | `ProgressBar` (1 por dimensão) |
| Layout compacto | `Flex` / `Divider` |

### 3.3. Leitura de dados (SOMENTE leitura)
Ler as propriedades do Deal via `context` / `crm` property read (ou `hubspot.fetch` + runServerless).
O card **exibe**, **não** grava valor nem move o deal.

### 3.4. Colocação
Card primário na **coluna central**; avaliar card secundário menor na direita para métricas de apoio, se o placement permitir.

### 3.5. Degradação graciosa
Deal **sem** dados GBP (não veio do fluxo Maps) → estado vazio discreto ("sem diagnóstico GBP"), **nunca erro**.

### 3.6. Setup (pré-requisito, Olavo)
Conta de desenvolvedor + Developer Test Account + HubSpot CLI (`@hubspot/cli`, auth por **personal access key** da
dev account). ⚠️ A credencial n8n `nKntASZQRG3NzatW` é de **API**, **não serve** para o CLI. Projeto: `hs project create` (public app + App Card).

---

## 4. Regras de apresentação (valem para A e B)

- **Bandas de status das dimensões** (leitura "forte/fraco de 1 olhar): **forte ≥ 70** (verde) · **médio 40–69**
  (âmbar) · **fraco < 40** (vermelho). O **valor numérico é sempre exibido** — cor nunca é o único sinal.
- **IPC × Score Técnico — rotular a diferença:** IPC = *oportunidade de venda* (quanto há a ganhar); Score Técnico =
  *quão otimizado o perfil já está*. IPC baixo + Score alto = perfil forte, pouco gap a vender.
- **Paleta por serviço:** `SVC-ADS` azul · `SVC-SITE` violeta · `SVC-GBP` teal.
- **Render do texto IA (aba):** preservar quebras; destacar `[CERTEZA]` (verde) e `[HIPOTESE]` (âmbar); `**negrito**`.
- Estética: "simples mas preciso" — números grandes para o que decide, dimensões em barras.

---

## 5. Teste de aceitação (com os deals reais confirmados)

| Campo | 🦷 Niti Odontologia (`60040868935`) | Clínica Guerra (`60039196744`) |
|---|---|---|
| Potencial | **79** | **11** |
| Oferta | badge **SVC-ADS** (azul) | badge **SVC-SITE** (violeta) |
| IPC / Score | 11 / 75 | 11 / 74 |
| site_tipo | Site próprio | **Rede social** |
| dims (saúde/seo/aut/conv/eng/cont) | 97/95/81/100/**0**/70 | 97/75/92/45/60/70 |
| flags_score | — | chip **`site=rede`** |
| Aba IA | `analise_gbp_ia` real (aponta Engajamento=0 crítico) | `analise_gbp_ia` real (aponta site=rede / conversão) |

- **Niti:** o card mostra Potencial 79, badge SVC-ADS, IPC 11 / Score 75, 6 barras com **Engajamento em vermelho (0)**,
  chips de sinal; aba IA com o textão; visão geral **limpa** (sem texto longo solto).
- **Clínica Guerra:** Potencial 11, badge SVC-SITE, chip `site=rede`, Conversão 45 em âmbar.
- **Deal sem GBP:** card em estado vazio discreto, sem erro.

---

## 6. Guardrails (do brief §7)

- Portal de **produção**: card e aba **exibem**; **nunca** alteram propriedade nem movem o deal.
- **Nunca** escrever/atualizar em deals `closedwon` / `closedlost`.
- **Não** subir nada em produção sem Olavo ver o mockup.
- Se API/CLI/plano não permitir algo, **reportar e cair na Camada A nativa** — nunca contornar limitação de plano
  para forçar a extension no Free.

---

## 7. Âncoras

- Brief: `docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md`
- Motor de scoring (o que cada campo significa): `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md` · `scripts/gbp_scoring_prototype.py`
- Contrato da planilha (mesmos campos): `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md`
- Frente Comercial / campos IA: `docs/handoff/2026-07-05-comercial-hubspot-subchat-brief.md`
- Mockup de validação (Claude Design): artifact `e2c97b96-eaf2-41de-b9d2-5237771eed1b`
- Recon read-only: 2026-08-17 (portal `5633277`, 21 props confirmadas, deals Niti + Clínica Guerra).
