# Estado do Projeto PHI

> **PARA QUEM CHEGA AGORA.** Este é o **doc mestre** do projeto PHI. Cobre
> tanto o **Produto PHI** (o que se vende) quanto a **Operação Interna**
> (o que faz a agência rodar e viabiliza o produto). Se você está
> retomando depois de tempo, ou é alguém/algum agente novo: leia este
> doc primeiro — ele aponta os caminhos. Não duplica conteúdo; aponta.
>
> **FONTE DE VERDADE.** Notion é canônico para **estado operacional**
> (DBs, registros, execução). Git (`docs/strategic-planning/`) é canônico
> para **design e governança** (este doc, strawmans, ADRs em rascunho).
> Mudar essa divisão exige ADR aprovado pelo Olavo antes.
>
> **VERSÃO.** v0.1 (2026-06-04). Atualizado ao final de cada lote
> entregue + em auditoria quinzenal proposta + qualquer atualização
> proposta pelo Curador depois que ele estiver vivo.

---

## 1. Visão geral

O **PHI** é projeto de inteligência operacional para gestão de marketing
digital (tráfego pago hoje; Sites e Agentes IA em 1-2 meses). Estratégia
em 3 fases:

1. **Fase 1 (HOJE):** Produto PHI roda dentro da própria agência como
   diferencial operacional invisível. Operação Interna apoia.
2. **Fase 2:** empacotar o que funciona como produto separado (relatórios,
   score, ranking, inteligência).
3. **Fase 3:** plataforma SaaS white-label.

Princípio central: **operar como interno, construir como produto.**
Toda arquitetura nasce modular, multi-tenant lógico e versionada — para
não bloquear evolução depois.

### 1.1. Os dois grandes blocos do projeto

| Bloco | Função | Status macro |
|---|---|---|
| **Produto PHI** | Decision Engine + PHI Score + governança. O ativo vendável. | Em produção uso interno; 5 entregas A.X concluídas (A.0, A.5, A.7); A.6/A.7b em backlog. |
| **Operação Interna** *(termo canônico — antes chamado de "chassi")* | Áreas, processos, agentes, SOPs e workflows que fazem a agência rodar. Não é vendável; viabiliza a evolução do produto. | 6 áreas mapeadas; Onboarding em produção; demais em design/scoping. |

### 1.2. Tronco do Miro → áreas formais

Mapeamento dos **10 troncos** do Miro de Onboarding/governança original.
Lista completa fornecida por Olavo em 2026-06-04.

| # | Tronco Miro | Natureza | Status no projeto |
|---|---|---|---|
| 1 | Procedimentos da Área de Atendimento | **Área operacional** | Não aberto ainda |
| 2 | Procedimentos da Área de Operações | **Área operacional** (subdividida em Onboarding · Execução de Demandas · Priorização · Comercial) | Onboarding em produção; outras em design |
| 3 | Integração Entre Áreas | Transversal | Implícito nas áreas; sem âncora |
| 4 | Documentação e Ferramentas | Transversal | **Aberto formalmente em 2026-06-04** (com âncora própria) |
| 5 | Treinamento e Implantação | Transversal | Implicitamente tocado nos Lotes 0/1 de cada área |
| 6 | Indicadores de Sucesso | Transversal | Implicitamente tocado (§10 strawman Curador, §10 strawman Execução, PHI Score) — gap T6 (Telemetria Mínima) endereça parte |
| 7 | Governança e Melhoria Contínua | Transversal | Tocado via ADRs, PHI™ — Aprendizados, Curador, este doc mestre |
| 8 | Estrutura Padrão dos Procedimentos | Transversal | Tocado via strawmans BRUTO vX.Y + padrões inegociáveis do Lote 1 |
| 9 | Etapas para Criação dos Procedimentos | Transversal | Implícito na sequência Lote 0 → Lote 1 → Lote N+ usada em todas as áreas |
| 10 | Papéis e Responsabilidades | Transversal | Tocado via §3 (Governança) de cada âncora (Cérebro Estratégico / Codex / Antigravity / Olavo) |

> **Releitura importante:** dos 10 troncos do Miro, **2 são áreas
> operacionais** (Atendimento + Operações) e **8 são dimensões
> transversais** que governam como as áreas operacionais são executadas.
> Por isso "já entramos na maioria" (Olavo 2026-06-04) — não são áreas
> independentes a abrir formalmente, são lentes que emergem dentro de
> cada área operacional.
>
> **Implicação operacional:** NÃO criar âncora separada pra cada tronco
> transversal. Documentar via este doc mestre (§7 glossário) + ADRs +
> seções dedicadas dentro dos strawmans das áreas operacionais. Os
> troncos transversais ganham visibilidade explícita aqui pra outsider
> entender, sem fragmentar a estrutura.

---

## 2. Onde estamos AGORA (snapshot 2026-06-18)

Resumo de 1 parágrafo: Produto PHI estável em produção interna (A.0/A.5/A.7
aprovadas 2026-05-09). Operação Interna: **Onboarding** Lote 1 em produção
(5 WFs desde 2026-05-29) + Lote 2 entregue 2026-06-03 pendente re-smoke A2.3.
**Execução de Demandas**: Lote 0 Concluído 2026-06-14; **Lote 1 CONCLUÍDO
2026-06-18** — os 3 workflows do engine mínimo Pacing/verba E2E ATIVOS em
produção: `WF-EXEC-QualityGate-Pacing` (16/06), `WF-EXEC-Intake-Pacing`
(17/06) e `WF-EXEC-Orquestrador` (18/06). Refactor completo HTTP→Notion
native v2.2 em 3 entregas escopadas (a04-qg + a04-qg-fix-1 + a04-intake +
a04-orq) — 9 HTTPs Notion eliminados. Smokes reais E2E em cada workflow.
Pendência menor: configurar credencial Gemini Pro no Orq (warning
recorrente em prod, não bloqueia operação — Gemini é decorativo no Lote 1
per ADR Tiering). **Curador** Lote 0 concluído estruturalmente 2026-06-04
(Catálogo populado parcialmente; backlog retroativo em aberto, ver §5).
**Priorização** L1 ATIVO em produção desde 2026-06-04 (n8n
`cgw7ozJ7Zk9jBrj1`, E2E validado 2×); pendência: timezone do cron (UTC vs
BRT). **Comercial** WF-Deduplicar em execução REAL desde 2026-06-05
(DRY_RUN=false após smoke ENT-20; manual, sem schedule); área formal
vestigial — 4 débitos técnicos legados. **Telemetria Mínima** Lote 1 EM
PRODUÇÃO desde 2026-06-13 (`a05`, smoke verde 19+0); T6 RESOLVIDO.
**Documentação e Ferramentas** aberta 2026-06-04 (este doc). **Dashboard de
produto** (Lovable) em scoping — aguardando acesso aos protótipos.

---

## 3. Roadmap por área (status por lote)

Estados: `Backlog` · `Em design` · `Em execução` · `Em smoke` ·
`Concluído` · `Bloqueado`.

### 3.1. Produto PHI

| Entrega | Status | Notas |
|---|---|---|
| A.0 — Correção upstream cost_3d/7d Google | Concluído (2026-05-09) | Antigravity validou |
| A.5 — Sub-auditoria execution_id FALLBACK | Concluído (2026-05-09) | |
| A.7 — Refactor descoberta tabelas PHI | Concluído (2026-05-09) | Viúrou A.7b (DDL real) |
| A.7b — DDL nas 2 base tables + VIEW phi_score_current | Backlog | |
| A.6 — Fix seletor execution_id no Pipeline_v2 (Opção 2) | Bloqueado por A.7b | |

### 3.2. Onboarding (Operação Interna)

| Lote | Status | Notas |
|---|---|---|
| Lote 1 (A2.1, A2.2, A2.5, A2.9, A2.11) | Concluído / Em produção (desde 2026-05-29) | 5 workflows |
| Lote 2 (A2.3, A2.7, A2.10) | Concluído (2026-06-02/03) | Pendente re-smoke A2.3 caminho Aprovado |
| Lote 3+ | Backlog | Indefinido |

### 3.3. Execução de Demandas (Operação Interna)

| Lote | Status | Janela teórica |
|---|---|---|
| Lote 0 (Fundação — SOP, modelo, ADRs) | **Concluído (2026-06-14)** — v0.3 fechada em git + 2 ADRs `Aceito` no Notion + 2 DBs Notion criados (`PHI - Demandas` + `PHI - SOPs`) + âncora `[HANDOFF] Execução de Demandas` + SOP v1.0 `Vigente` no DB SOPs | Sem 1-2 |
| Lote 1 (Engine mínimo — Pacing/verba E2E classe Crítica) | **CONCLUÍDO 2026-06-18** — 3 workflows ATIVOS em produção: (a) `WF-EXEC-QualityGate-Pacing` (16/06, `a04-qg-fix-1` commit `72b4086`); (b) `WF-EXEC-Intake-Pacing` (17/06, `a04-intake` commit `91143f9`); (c) `WF-EXEC-Orquestrador` (18/06, `a04-orq` commit `2452b1c`). Refactor completo HTTP→Notion native v2.2 em 3 entregas escopadas — 9 HTTPs Notion eliminados. Smokes reais E2E em cada workflow: QG (2 demandas PASS=Entregue + FAIL=Em execucao + 4 eventos canônicos + Telegram + idempotência), Intake (POST webhook → +1 Demanda + 1 evento `demanda.criada` + Telegram + Responder 201), Orq (Manual Trigger → Demanda virou Priorizada + 1 evento `demanda.priorizada`, pareamento `.all().find()` por `demanda_id` validado E2E). Aprendizado novo cristalizado: **Notion native v2.2 substitui `$json` em update/create — pairedItem quebra downstream**; consumers usam `.first()` (1 item por exec) ou `.all().find()` por chave de negócio (N items). Pendência menor: configurar credencial Gemini Pro no Orq (Gemini decorativo no Lote 1; `continueOnFail:true` evita bloqueio). | Sem 2-4 (concluído) |
| Lote 2 (Padronizador como agente Flash dedicado + relations no DB Demandas) | Backlog | Sem 4-6 |
| Lote 3+ (Tickets ad-hoc + espelho Miro + expansão de tipos) | Backlog | Sem 6-8 |

### 3.4. Curador (Documentação e Ferramentas)

| Lote | Status | Notas |
|---|---|---|
| Lote 0 (Catálogo) | Concluído estruturalmente (2026-06-04) — populado parcialmente | DB + schema + âncora prontos. Catalogados em 2026-06-11: 3 artefatos (WF-DOC-Telemetria, WF-PRIOR-L1, WF-COM-Deduplicar). **Backlog de catalogação retroativa**: 5 WFs Lote 1 Onboarding + 3 WFs Lote 2 Onboarding + PHI-Pipeline_v2 + Daily Entry + SOP v1.0 Onboarding + 8 DBs Notion vivos + 4 âncoras [HANDOFF] + 8 ADRs aceitos. Estimado ~30 entradas a criar. Ver §5. |
| Lote 1 (Engine mínimo — 1 Mudança de Escopo simulada, aplicação manual) | Backlog | Sem 4-6 |
| Lote 2 (Aplicação via Codex) | Backlog | Sem 6-7 |
| Lote 3 (Aplicação via MCP Notion) | Backlog | Sem 7-8 |
| Lote 4 (Modo Retroativo + validação consistência) | Backlog | Sem 8+ |
| Lote 5+ (Drift detection automática) | Backlog (fase 2) | Fora da janela atual |

### 3.5. Priorização (Operação Interna)

| Lote | Status |
|---|---|
| Lote 0 (Framework + Inventário) | Concluído |
| L1 — Abertura de Projeto Técnico/Setup | **ATIVO em produção (2026-06-04)** — workflow n8n `cgw7ozJ7Zk9jBrj1`, E2E validado 2×. Cria projeto setup + 6 itens de checklist por cliente ATIVO sem setup, com alerta Telegram e log callout Notion, idempotência confirmada. Resíduo: timezone do cron (ver §5). JSONs em branch separada `claude/lucid-tesla-ZWcbr`. |
| L2 — Passagem de Bastão entre Áreas | Backlog (sem evolução) |
| L3 — Atendimento de Solicitações | Backlog (sem evolução) |

> **Nota fronteira (T4 revisitada):** L1 é, na prática, tooling executor (cria projeto + checklist + alerta). Mesmo com a fronteira "Execução = consumidora da Priorização" travada (2026-06-03), vale registrar que o L1 implementado tem natureza executora — não produz contrato de handoff, executa abertura. Não invalida a fronteira; é nuance pra revisitar quando L2 (Passagem de Bastão) for desenhado.

### 3.6. Comercial (Operação Interna)

| Lote | Status |
|---|---|
| WF-COM-Deduplicar-Leads-HubSpot | **Em execução REAL desde 2026-06-05** — DRY_RUN=false após smoke ENT-20 aprovado por Olavo (cleanup confirmado: Smoke Sintetico 2026-05-29 + 31 etapas). Gatilho MANUAL (sem schedule), intencional. Stage HubSpot alvo `70807682-148b-4914-acd0-97aad8c2a000` (Prospectado) hardcoded sem ADR. n8n `izimrLm19H4i6LOq`. |
| Área formal (strawman + âncora Notion + DB dedicado) | Backlog — sem data — bloqueada por priorização |
| Lote 0 (SOP + modelo de dados Comercial) | Backlog |
| Lote 1+ | Backlog (indefinido) |

> **Débitos técnicos do WF-COM-Deduplicar** (legado pré-padrões-inegociáveis,
> a sanar antes de qualquer expansão): (a) emojis literais em 2 nós jsCode
> (viola ASCII-safe); (b) `[ComAb] Telegram Relatorio` aplica escape HTML
> APÓS construir tags `<b>` (bold quebrado); (c) sem idempotência por marca
> em DB (OK enquanto manual, risco se receber schedule); (d) stage ID
> hardcoded sem config externalizada (se HubSpot reorganizar pipeline,
> precisa edit manual no jsCode). Registrados em §5.

### 3.7. Documentação e Ferramentas (Tronco 4 — Operação Interna)

| Lote | Status |
|---|---|
| Lote 0 (este doc + nomenclatura + glossário) | **Concluído (2026-06-04)** |
| Lote 1 (âncora Notion + Aprendizado #16 + 1ª ME dogfood) | **Concluído (2026-06-04)** — âncora [HANDOFF] Doc&Ferramentas + Aprendizado #16 (bus factor) + ME-20260604-reposicionar-curador |
| Lote 2 (ADR-012 + workflow Telegram digest semanal de checkpoint) | Backlog |
| Lote 3+ (sync git↔Notion automatizado via Curador) | Backlog (fase 2) |

**Sub-entrega: Telemetria Mínima** (cross-cutting, cobre Tronco 6 Indicadores de Sucesso)

| Lote | Status |
|---|---|
| Lote 0 (strawman v0.2 + DB Snapshots no Notion + brief Codex) | **Concluído (2026-06-04)** — 16 métricas, modelo chave-valor, DB preparado pra 7 áreas |
| Lote 1 (workflow WF-DOC-Telemetria-Diaria — Onboarding+Curador+Global) | **Concluído (prod 2026-06-13)** — `a05` (`dddb84f`) APROVADO Antigravity rodada 3; **smoke real verde**: 1ª execução criou exatas 19 linhas, 2ª criou 0 (idempotência confirmada), digest Telegram 2×, zero estranhezas. Workflow `VubalOUaoBteCyC6` em produção, schedule diário 08:30 America/Sao_Paulo. Catálogo Notion: Estado `Vivo`. Aprendizado "Multi-fan-in para Code node em n8n" passou a `Aplicado`. Padrão inegociável consolidado: (a) multi-fan-in pra Code/Function node EXIGE Merge antes; (b) Merge consolidador DEVE declarar `numberInputs` = nº exato de upstreams. G2 e G3 ficam pro Lote 2. |
| Lote 2 (expansão Execução + filtro de data no Buscar Snapshots Existentes + campo Data de aplicação no DB Mudanças) | Backlog |
| Lote 3 (Flash summarize tendências) | Backlog |
| Lote 4 (sink BigQuery — ADR-010) | Backlog |

---

## 4. Decisões travadas (links + datas)

### 4.1. ADRs vigentes (no Notion: PHI™ — Decisões)

| # | Título | Status | Link |
|---|---|---|---|
| 001 | Supabase como Database Primário | Aceito (esclarecido por ADR-010) | [Notion](https://www.notion.so/357b65e5c72b81779c02f29d091fd924) |
| 002 | Free Tier Intencional Fase 0 | Aceito | [Notion](https://www.notion.so/358b65e5c72b8172ac90daf2a6846976) |
| 003 | Autoridade única do PHI Score | Aceito | [Notion](https://www.notion.so/359b65e5c72b81068959ce8615009166) |
| 004 v2 | Fórmula PHI Score (FIS, MAS, TSS, MIV) | Aceito | [Notion](https://www.notion.so/359b65e5c72b819c981cfc1eaf79555f) |
| 005 | Heterogeneidade Google × Meta | Aceito | [Notion](https://www.notion.so/35ab65e5c72b81d38157c81a9636d51e) |
| 009 | Semântica execution_id (Opção 2) | Aceito (2026-05-09) | [Notion](https://www.notion.so/35bb65e5c72b81f3a4e0e05ad9a82f04) |
| **010** | **Divisão BigQuery (analítico) × Supabase (transacional)** | **Aceito (2026-06-04)** | [Notion](https://www.notion.so/376b65e5c72b814a81fac10aaf50befc) |
| **012** | **Git canônico para design, Notion canônico para estado operacional** | **Aceito (2026-06-04)** | [Notion](https://www.notion.so/376b65e5c72b818a87e8d491f98be1fb) |
| **— (título canônico)** | **Tiering de Agentes IA: Denso (Pro) vs Barato (Flash)** | **Aceito (2026-06-14)** | [Notion](https://app.notion.com/p/37fb65e5c72b81f3b8a6de1a474d736c) — `Número ADR` auto-increment não antecipado |
| **— (título canônico)** | **Eventos canônicos da Operação Interna + Sink BigQuery futuro** | **Aceito (2026-06-14)** | [Notion](https://app.notion.com/p/37fb65e5c72b8195b45feb33ef60ac08) — idem |

### 4.2. ADRs em planejamento ou rascunho

- ADR-006 (Log de Otimizações), ADR-007 (Onboarding), ADR-008
  (CPA-only vs polimórfico): backlog.
- ~~**ADR-010** — Divisão BQ ↔ Supabase: aprovado 2026-06-04 (ver §4.1).~~
- **ADR-011 — Curador + Mudanças de Escopo + Catálogo:** rascunho
  pendente. Curador formaliza.
- ~~**ADR-012** — Git canônico para design, Notion canônico para estado operacional: aprovado 2026-06-04 (ver §4.1).~~
- ~~**ADR-rascunho Tiering** + **ADR-rascunho Eventos**~~ → **Aceitos no Notion 2026-06-14** (ver §4.1). Rascunhos removidos do git em 2026-06-16 (convenção: git guarda só rascunhos vivos; ADR aceito vira estado operacional → mora no Notion. Histórico de design via `git log` — commit `c6053c0` preserva o conteúdo original).

### 4.3. Decisões fora de ADR (registradas em strawmans e nesta conversa)

| Data | Decisão | Onde |
|---|---|---|
| 2026-06-03 | Curador: Propõe (não aplica) / Trigger explícito / Modo Planejado+Retroativo / mora em Doc. e Ferramentas / Nome=Curador / Tier=Pro / janela 1-2 meses | `curador/BRUTO-v0.1-design.md` §0 |
| 2026-06-03 | Execução de Demandas = consumidora da Priorização (fronteira) | `execucao-demandas/BRUTO-v0.1-design.md` §2 |
| 2026-06-03 | Diff do Curador = formato A+B híbrido (tabela overview + toggles + diff git-style) | `curador/BRUTO-v0.1-design.md` §8 |
| 2026-06-04 | Dashboard = leitura sobre BQ/Supabase; **não substitui Notion**; coexiste como produto | Conversa atual |
| 2026-06-04 | Nomenclatura D1-D6 (chassi→Operação Interna, doc mestre cobre tudo, Lote mantido, ANTES/DEPOIS→Planejado/Retroativo, prefixos de tipo, doc. e ferramentas no Notion) | Este doc |

---

## 5. Pendências abertas (com data de origem)

| Origem | Pendência | Próxima ação | Bloqueia? |
|---|---|---|---|
| 2026-06-03 | Re-smoke A2.3 caminho Aprovado | Codex roda quando cota Gemini Pro recuperar | Fechamento do Lote 2 Onboarding |
| 2026-06-04 | Acesso ao protótipo `phi-dashboard-b3d8f919` | Olavo escolhe caminho: drag-drop / branch espelho / autorizar repo / prints | Decisão final do papel do Dashboard |
| 2026-06-04 | ADR-010 (BQ × Supabase) | ✅ **Aprovado 2026-06-04, `Aceito`.** [Notion](https://www.notion.so/376b65e5c72b814a81fac10aaf50befc). ADR-001 esclarecido como complementar. | Resolvido |
| 2026-06-03 | ADR-011 (Curador) | Rascunhar | Formaliza Curador |
| 2026-06-04 | ADR-012 (Git × Notion canônico) | ✅ **Aprovado 2026-06-04, `Aceito`.** [Notion](https://www.notion.so/376b65e5c72b818a87e8d491f98be1fb). | Resolvido |
| 2026-06-05/13 | ~~Telemetria Mínima Lote 1 — ciclo de correções~~ | ✅ Ciclo completo: `a01` → G1 fix → REJEITADO rodada 1 → `a03` → APROVADO rodada 2 → smoke revelou regressão → `a04` REJEITADO pré-revisão → `a05` (`dddb84f`) → APROVADO rodada 3 → ✅ **smoke real verde 2026-06-13** (19+0 linhas, digest 2×) → `active=true` → Catálogo `Vivo`. **T6 RESOLVIDO.** | Resolvido |
| 2026-06-04 | ~~v0.3 Execução + abertura SOP/DB Notion canônico~~ | ✅ **Concluído 2026-06-14.** Lote 0 da Execução de Demandas fechado E2E: v0.3 em git + 2 ADRs `Aceito` no Notion + 2 DBs criados (`PHI - Demandas` ds `cd1ab757...`; `PHI - SOPs` ds `bfeb1105...`) + âncora `[HANDOFF] Execução de Demandas` (`37fb65e5...5137`) + SOP v1.0 `Vigente` (`37fb65e5...ba50`) + brief Codex Lote 1. Catálogo +6 entradas. | Resolvido |
| 2026-06-14 | ~~Notion canônico Execução de Demandas~~ | ✅ Resolvido 2026-06-14 (acima). | Resolvido |
| 2026-06-14 | ~~ADRs rascunho (Tiering + Eventos) → Notion `Aceito`~~ | ✅ Resolvido 2026-06-14 (ambos `Aceito`). | Resolvido |
| 2026-06-14 | ~~Brief Codex Lote 1 Execução~~ | ✅ Entregue 2026-06-14 em `docs/handoff/2026-06-14-execucao-lote1-codex-brief.md`. Escopo: 3 workflows (Intake-Pacing webhook + Orquestrador Pro + QualityGate-Pacing Flash) + criar DB `PHI - Eventos` via MCP. Aguarda Codex implementar. | Resolvido — Codex próximo |
| 2026-06-14 | ~~Codex implementa Lote 1 Execução de Demandas~~ | ✅ Parcial — `a01` (`0f03469`) entregue mas REJEITADO pré-revisão Claude. Brief `a02` em curso (`docs/handoff/2026-06-14-execucao-lote1-codex-a02-brief.md`). | Próximo Codex `a02` |
| 2026-06-14 | ~~Codex `a02` Lote 1 (fix B1/B2/B3 + placeholder PHI_EVENTOS)~~ | ✅ Parcial — `a02` (`f581f89`) corrigiu B1+B3+placeholder mas regrediu B2 (`$env` viola ADR-19; culpa do brief Claude). Brief `a03` cirúrgico em curso. | Próximo Codex `a03` |
| 2026-06-14 | ~~Codex `a03` Lote 1 (reverter B2 pro padrão ADR-19 build-time injection)~~ | ✅ **APROVADO pré-revisão Claude 2026-06-14** (`6e49fda`). Cirurgia perfeita: orq/qg hash idêntico ao a02, intake só Validar Secret tocado. $env zero, build-time injection com check defensivo, ps1 com check ADR-19. | Resolvido |
| 2026-06-14 | ~~Brief Antigravity Execução Lote 1~~ | ⏭️ **PULADO por decisão Olavo (2026-06-15)** — ir direto ao smoke real. Brief permanece versionado (`docs/handoff/2026-06-14-execucao-lote1-antigravity-brief.md`) caso queira acionar depois. | Pulado |
| 2026-06-15 | ~~Smoke real Execução Lote 1 (Pacing E2E)~~ | ✅ **SMOKE VERDE 2026-06-16 (escopo QG isolado).** A decisão de refatorar HTTP→Notion native antes do smoke virou o piloto `a04-qg` (só `WF-EXEC-QualityGate-Pacing`), em vez do refactor dos 3 WFs de uma vez. Smoke real do QG verde: 2 demandas E2E (PASS=Entregue + FAIL=Em execucao+Telegram), 4 eventos canônicos, idempotência ok. `Intake-Pacing` e `Orquestrador-Pacing` rodam smoke próprio após `a04-intake`/`a04-orq`. | Resolvido para QG |
| 2026-06-15 | ~~Codex `a04` v2 Lote 1: refactor HTTP Notion → Notion native v2.2~~ | ✅ **PARTILHADO em 3 entregas escopadas após smoke do QG: `a04-qg` (`49cae25`) + `a04-qg-fix-1` (`72b4086`) ATIVO.** Decisão: piloto QG isolado em vez de refactor dos 3 WFs de uma vez — valida a cirurgia em produção antes de propagar. `a04-intake` e `a04-orq` substituem os 4 HTTPs restantes (2+2) no mesmo padrão. | Resolvido para QG; substituído por a04-intake/a04-orq |
| 2026-06-16 | ~~Smoke real do `WF-EXEC-QualityGate-Pacing` (piloto refactor `a04-qg`)~~ | ✅ **VERDE 2026-06-16.** Smoke runtime revelou 6 bugs latentes não estruturais: (1) `alwaysOutputData:true` em search node injetando item fantasma; (2) demanda manual com grafia incompatível com filtro; (3) Validar DoD lendo de `$input` (output do Notion create) em vez da fonte; (4) Notion native v2.2 substitui `$json` em update/create — pairedItem quebra downstream; (5) regex DoD frágil pegando palavras-chave em textos descritivos; (6) Telegram falhando com `text:''` quando lookup falha. Todos corrigidos inline + consolidados via `a04-qg-fix-1` (`72b4086`). | Resolvido |
| 2026-06-16 | ~~Brief Codex `a04-intake`: refactor 2 HTTPs Notion no Intake-Pacing~~ | ✅ **CONCLUÍDO 2026-06-17.** Brief `docs/handoff/2026-06-16-execucao-lote1-codex-a04-intake-brief.md` → Codex empurrou `91143f9` → pré-revisão Claude APROVADO → smoke real verde (POST webhook → +1 Demanda + 1 evento `demanda.criada` + Telegram + Responder 201). `WF-EXEC-Intake-Pacing` ATIVO em produção 2026-06-17. `EXEC_WEBHOOK_KEY` injetada inline (32 bytes hex) — guardada em `.env` local. | Resolvido |
| 2026-06-16 | ~~Brief Codex `a04-orq`: refactor 2 HTTPs Notion no Orquestrador-Pacing~~ | ✅ **CONCLUÍDO 2026-06-18.** Brief `docs/handoff/2026-06-16-execucao-lote1-codex-a04-orq-brief.md` → Codex empurrou `2452b1c` → pré-revisão Claude APROVADO (49/49 PASS) → smoke real verde (Manual Trigger → Demanda virou Priorizada + 1 evento `demanda.priorizada` + pareamento `.all().find()` por `demanda_id` validado E2E). `WF-EXEC-Orquestrador` ATIVO em produção 2026-06-18. **Lote 1 Execução FECHA.** | Resolvido |
| 2026-06-18 | **Configurar credencial Gemini Pro no `WF-EXEC-Orquestrador`** | Smoke do Orq mostrou erro "Node does not have any credentials set" no `[Exec Orq] Gemini Pro Sequencia do Dia`. `continueOnFail:true` evita bloqueio — Gemini é decorativo no Lote 1 per ADR Tiering (Orquestrador Pro é o tier; Flash Sequencia do Dia ainda não é decisão crítica). Olavo configura credencial pra eliminar warning recorrente nas execuções diárias 08h. | Não bloqueia operação |
| 2026-06-15 | **Industrializar build-time injection per ADR-19** — `generate_export.js` ler de `process.env` em vez de constantes literais hardcoded | Patch no gerador: cada constante sanitizada (`<EXEC_WEBHOOK_KEY_redacted>`, `<TELEGRAM_CHAT_ID_redacted>`, `<credential_id_redacted>`) lê de `process.env.NOME` antes de injetar; fallback pro placeholder redacted se var ausente; commit do JSON gerado continua sanitizado. Padrão de operação: operador exporta vars do `.env` local + roda `node generate_export.js` → workflow ativo tem valores; repo continua redacted. Aplicar primeiro à Execução Lote 1 (deploy real), depois Onboarding/Telemetria. Hoje a substituição é manual via sed/Node ad-hoc (fragmenta processo, fácil errar — exatamente o tipo de buraco que o ADR-19 deveria ter fechado mas ficou só no design). | Não bloqueia smoke; bloqueia disciplina ADR-19 |
| 2026-06-14 | **Reforçar pré-revisão Claude com check de ADR existentes** | Pre-revisar deve consultar ADRs Aceitos relevantes ANTES de marcar bug; este caso (B2 a01 → B4 a02) foi falha de processo, não de código. Próximas pré-revisões devem grep ADRs no DB Notion antes de classificar regressão. | Não bloqueia hoje; melhora processo |
| 2026-06-11 | ~~Aprendizados #16/#17/#18 não localizáveis por busca semântica~~ | ✅ Resolvido parcial 2026-06-14: **#16 achado** ("Protocolo de retomada de contexto + checkpoint cadenciado", `375b65e5-c72b-8145-b8be-f5409c40b7ab`) — não tinha `#16` no título, daí a busca semântica falhou. Convenção: aceitar que Aprendizados podem não ter `#N` no título. #17 e #18 ainda não localizados pelo mesmo motivo — auditoria via view "Todos os Aprendizados" do DB resolveria. Não bloqueia. | Resolvido parcial |
| 2026-06-04 | Mudança de Escopo PLANEJADA: reposicionar Curador → Documentação e Ferramentas | ✅ **APROVADA E APLICADA 2026-06-04** — 4 registros do Catálogo + âncora Curador (Notion) + 2 strawmans (git) + ESTADO já alinhado. Estado da ME: `Aplicada`. Serve de input de treino pro Lote 1 do Curador. | Resolvido |
| 2026-06-04 | Lista completa de troncos do Miro (§1.2) | ✅ Recebida 2026-06-04 — 10 troncos mapeados. 2 áreas operacionais + 8 transversais. Releitura registrada (transversais NÃO viram âncoras separadas). | Resolvido |
| 2026-06-04 | L1 Priorização — cron `0 9 * * *` em UTC, dispara 06:00 BRT se instância n8n for UTC (não 09:00 BR) | Olavo decide ajustar pra `TZ=America/Sao_Paulo` no schedule trigger | Não bloqueia; só desloca horário |
| 2026-06-04 | L1 Priorização — 1ª execução agendada vai processar TODOS os clientes ATIVOS sem setup de uma vez (rajada Telegram esperada) | Monitorar 1ª execução; sem ação preventiva | Não bloqueia; atenção operacional |
| 2026-06-04 | L1 Priorização — JSONs canônicos em branch `claude/lucid-tesla-ZWcbr`, separada do doc master (`claude/agentic-agency-planning-KwJEw`) | Olavo decide: mergear nas branches ou manter separadas (1 branch por entrega) | Não bloqueia; afeta protocolo de versionamento |
| 2026-06-11 | Status sub-chat Comercial | ✅ **Report recebido 2026-06-11.** Integrado: §3.6 atualizada (WF em execução real, 4 débitos técnicos), Catálogo +1 (WF-COM-Deduplicar-Leads-HubSpot, Vivo, débitos na Versão), §6 T4 expandida. | Resolvido |
| 2026-06-04 | Decisão técnica callout→HTTP (L1 Priorização, n8n-Notion v2.2) — candidata a ADR formal | Olavo decide rascunhar ADR formal ou manter como Aprendizado #21 (Notion) + Versão do Catálogo | Não bloqueia |
| 2026-06-05 | WF-COM-Deduplicar — frequência de execução indefinida (hoje manual) | Olavo decide quando definir schedule (e qual frequência) | Não bloqueia; impacta previsibilidade |
| 2026-06-05 | WF-COM-Deduplicar — débito técnico (a): emojis literais em 2 nós jsCode (viola ASCII-safe) | Refactor antes de qualquer expansão da área Comercial | Não bloqueia operação; bloqueia expansão |
| 2026-06-05 | WF-COM-Deduplicar — débito técnico (b): `[ComAb] Telegram Relatorio` escape HTML aplicado APÓS construir tags `<b>` (bold quebrado) | Inverter ordem (escape primeiro, depois compor HTML) | Não bloqueia; cosmético |
| 2026-06-05 | WF-COM-Deduplicar — débito técnico (c): sem idempotência por marca em DB | OK enquanto manual; obrigatório antes de schedule | Bloqueia introdução de schedule |
| 2026-06-05 | WF-COM-Deduplicar — débito técnico (d): stage ID `70807682-...` hardcoded sem config externa | Externalizar pra env/config se HubSpot for reorganizado | Não bloqueia; latent risk |
| 2026-06-05 | Área Comercial sem owner operacional claro (vestigial) | Definir owner ou abrir área formalmente | Não bloqueia hoje; afeta resposta a incidente do WF |
| 2026-06-11 | **Catálogo populado parcialmente** — auditoria 2026-06-11 revelou só 3 entradas reais (não 39 como ESTADO declarava); estado real ≠ promessa do Lote 0 Curador | Catalogação retroativa: ~30 entradas a criar (5 WFs Lote 1 Onb + 3 WFs Lote 2 Onb + PHI-Pipeline_v2 + Daily Entry + SOP v1.0 Onboarding + 8 DBs Notion vivos + 4 âncoras [HANDOFF] + 8 ADRs aceitos). Pode ser feito incrementalmente (1 sessão por categoria) ou batch único. Sugestão: começar pelos 8 ADRs aceitos (mais coesos, schema simples). | Não bloqueia hoje; bloqueia Curador Lote 1+ (drift detection precisa de Catálogo completo) |
| 2026-06-11 | **Numeração ADR-010/012 conflitante título × `Número ADR` auto-increment** — páginas com títulos "ADR-010" e "ADR-012" têm `Número ADR` = 23 e 22 no DB; já existe outro `ADR-010` no DB (Daily Entry/raw_campaign_data 2026-05-11) | Decisão: (a) renomear títulos pra `ADR-022` e `ADR-023` alinhando com auto-increment, ou (b) manter títulos e registrar no ESTADO que `Número ADR` é só ordem interna de criação | Não bloqueia; afeta clareza de busca |
| 2026-06-11 | **ADR-20 criado 2026-06-11 17:44** (Developer token Google Ads inserido diretamente no nó do workflow) não consta no ESTADO | Olavo confirma autoria + decide se integrar em §4 | Não bloqueia; ESTADO desatualizado por 1 ADR |
| 2026-06-11 | **Aprendizados #16/#17/#18 não localizáveis por busca semântica** | Auditoria manual no DB pra confirmar se existem (sem número no título) ou se nunca foram criados; se faltarem, criar | Não bloqueia; afeta rastreabilidade |
| 2026-06-13 | ~~Auditoria de workflows existentes pelo bug multi-fan-in~~ | ✅ **Resolvido 2026-06-14.** Codex auditou 10 WFs em prod via MCP n8n (relatório em `docs/audits/2026-06-14-multi-fan-in-audit-report.md`, commit `d398df2`): 7 NÃO AFETADOS, 3 marcados AFETADOS (A2.1 `Ler Etapas A1`, A2.3 `Preparar Atualizacoes Aprovado`, A2.10 `Restaurar Telegram PASS`). Validação Claude via MCP n8n `get_workflow_details`: TODOS os 3 são **falsos positivos** — upstreams são `n8n-nodes-base.if` (A2.1, A2.10) ou `n8n-nodes-base.switch` v3.4 (A2.3) com saídas mutually-exclusive, então só 1 branch dispara por execução → Code roda 1× → sem bug runtime. Padrão inegociável refinado: distinguir multi-fan-in PARALELO (EXIGE Merge) de CONVERGENTE (cleanup opcional). Aprendizado Notion atualizado com refinamento. **Sem fix necessário.** | Resolvido |
| 2026-06-14 | Fix defensivo opcional nos 3 falsos positivos (A2.1, A2.3, A2.10) | Adicionar Merge consolidador como cleanup arquitetural (previne bug se topologia mudar). Não bloqueia, não há ganho runtime hoje. | Não bloqueia; cosmético arquitetural |

---

## 6. Tensões / riscos centralizados

Compilação das tensões espalhadas pelos strawmans + novas.

| # | Tensão | Origem | Severidade | Próxima ação |
|---|---|---|---|---|
| T1 | Curador × Codex × Antigravity: quem revisa PRs do Curador? | Curador §15 | Média | Decidir junto do ADR-011 |
| T2 | Catálogo × ADRs vigentes: duplicação? | Curador §15 | Baixa | Convenção v0.1: Catálogo lista ADR como referência (id + url), conteúdo canônico segue na base de ADRs |
| T3 | Mudança de Escopo grande × ADR novo: quando virar ADR junto do diff? | Curador §15 | Média | Decidir junto do ADR-011 |
| T4 | "Prospecção" e "Reunião resultados" semanticamente Comerciais + L1 Priorização tem natureza executora apesar da fronteira "Execução=consumidora" + Comercial sem owner operacional | Execução §4 + report sub-chat Priorização 2026-06-11 + report sub-chat Comercial 2026-06-11 | Média (subiu de Baixa) | Re-examinar quando Comercial existir formalmente. Notas 2026-06-11: (a) L1 Priorização implementado é tooling executor (cria projeto + checklist + alerta) — não invalida fronteira travada 2026-06-03, mas vale revisitar quando L2 Passagem de Bastão (que deve ser onde a Priorização produz o contrato) for desenhado. (b) Comercial confirmado sem owner operacional — qualquer falha no WF-Deduplicar não tem dono claro. (c) Severidade subiu pra Média por causa de (b) — risco real, não só semântico. |
| T5 | Dashboard × Notion: duas superfícies de visualização | Conversa Dashboard | Baixa | Cada um pro seu uso (produto vs operação) |
| ~~T6~~ | ~~**Métricas operacionais não rastreadas** — Onboarding em prod há 9 dias, zero visibilidade~~ | Conversa 2026-06-04 | ✅ **Resolvido (2026-06-13)** | WF-DOC-Telemetria-Diaria em produção desde 2026-06-13 (`a05`/`dddb84f`, workflow `VubalOUaoBteCyC6`, schedule diário 08:30 BRT). Smoke real verde: 1ª execução 19 linhas, 2ª 0 (idempotência), digest Telegram 2×. Ciclo completo de 9 dias: 5 rodadas de revisão (Codex 4×, Claude 5×, Antigravity 3×, smoke 2×). Padrão inegociável consolidado: (a) multi-fan-in pra Code/Function node EXIGE Merge antes; (b) Merge consolidador DEVE declarar `numberInputs` = nº exato de upstreams. G2 (filtro de data no Buscar Snapshots) e G3 (campo Data de aplicação) ficam pro Lote 2. |
| ~~T7~~ | ~~ADR-001 (Supabase) × "BQ base de verdade" (docs estratégicos)~~ | Conversa 2026-06-04 | ✅ **Resolvido** | **ADR-010 Aceito 2026-06-04** ([link](https://www.notion.so/376b65e5c72b814a81fac10aaf50befc)). Divisão BigQuery (analítico) × Supabase (transacional) × Notion (estado operacional). ADR-001 esclarecido como complementar — não conflitante. |
| ~~T8~~ | ~~Sync git ↔ Notion: divergência potencial~~ | Conversa 2026-06-04 | ✅ **Resolvido** | **ADR-012 Aceito 2026-06-04** ([link](https://www.notion.so/376b65e5c72b818a87e8d491f98be1fb)). Git canônico para design, Notion canônico para estado operacional, sync via processo (manual hoje, Curador Lote 2/3 automatiza). |
| T9 | Proliferação de agentes sem mapa consolidado (6 hoje, ~10 em 3 meses) | Conversa atual | Média | Mapa de agentes (§9) deste doc |
| T10 | ~~Curador posicionado em "Procedimentos da Operação", mas faz mais sentido em "Documentação e Ferramentas"~~ | Conversa 2026-06-04 | ✅ Resolvido | **ME-20260604 aprovada e aplicada 2026-06-04** ([link](https://www.notion.so/375b65e5c72b8121834fd65d5395b481)). 1ª Mudança de Escopo completa do projeto — dogfood do Curador (Claude no papel de surrogate). Vira input de treino. |

---

## 7. Glossário canônico

Termos com definição inferível. Outsider/futuro Claude lê isso e
destrava o vocabulário.

| Termo | Significado | Nota |
|---|---|---|
| **PHI** | Nome do projeto inteiro. | Inclui Produto + Operação Interna. |
| **Produto PHI** | Decision Engine + PHI Score + governança. O ativo vendável. | Foco da Fase 2-3. |
| **Operação Interna** | Conjunto de áreas, processos, agentes, SOPs e workflows que fazem a agência rodar e viabilizam o produto. | Antes chamada de "chassi" — termo legado. |
| **Lote** | Unidade de entrega progressiva dentro de uma área. Lote 0 = fundação (design + entidades), Lote 1 = engine mínimo, Lote N+ = expansão. | Mantido. |
| **Planejado** *(modo Curador)* | Mudança de escopo **hipotética** a executar futuramente. | Antes chamado "ANTES" — substituído. |
| **Retroativo** *(modo Curador)* | Mudança de escopo **já ocorrida** que precisa ser refletida. | Antes chamado "DEPOIS" — substituído. |
| **Tier denso** | Agente Gemini Pro — decisões raras, caras, multi-artefato. | Curador, Orquestrador, A2.3. |
| **Tier barato** | Agente Gemini Flash — validações frequentes, repetitivas. | Padronizador, A2.7, A2.10. |
| **A2.X** | Codename dos workflows do Onboarding (numeração herdada do Apêndice A2 do SOP original). | **NÃO usar pra workflows novos** — usar prefixo `WF-` (§8). |
| **`{{BRAND}}`** | Variável de white-label. Default "PHI" hoje; configurável por workspace na Fase 3. | |
| **`tenant_id` / `client_id`** | Campos lógicos pra multi-tenant futuro. | Default hoje: `tenant_id = phi-agencia`. |
| **Padrões inegociáveis do Lote 1 Onboarding** | 10 regras herdadas (webhook secret antes do payload, jsCode ASCII-safe, idempotência, Telegram string única HTML, etc.) que se aplicam a todo trabalho da Operação Interna. | Detalhe na âncora [HANDOFF] Curador §5. |
| **Mudança de Escopo** | Entidade canônica do Curador. Representa entrada de novo serviço/regra/fronteira/ferramenta. | Modos Planejado/Retroativo. |
| **Catálogo (de Artefatos Operacionais)** | Inventário vivo dos artefatos da Operação Interna (SOPs, DBs, workflows, prompts, ADRs, SLAs, DoDs, páginas âncora). | Dependência crítica do Curador. |
| **Chassi** | **Termo legado** — substituído por "Operação Interna" em 2026-06-04. Aparece em commits antigos e strawmans. | Não usar daqui em diante. |
| **Tronco do Miro** | Eixo de organização do board Miro original do projeto. 10 troncos no total (§1.2). 2 são áreas operacionais, 8 são dimensões transversais. | Ver §1.2 para a lista. |
| **Tronco 5 — Treinamento e Implantação** *(transversal)* | Como procedimentos novos são treinados e implantados (operadores humanos + prompts de agentes IA). | Implícito em Lote 0/1 de cada área. |
| **Tronco 6 — Indicadores de Sucesso** *(transversal)* | Métricas de saúde de processos e produto. | PHI Score (produto), métricas §10 do Curador, métricas §10 da Execução, T6 Telemetria Mínima. |
| **Tronco 7 — Governança e Melhoria Contínua** *(transversal)* | Decisões arquiteturais, aprendizados versionados, drift detection. | Vivo via ADRs, PHI™ — Aprendizados, Curador, este doc mestre. |
| **Tronco 8 — Estrutura Padrão dos Procedimentos** *(transversal)* | Formato canônico dos procedimentos. | Vivo via strawmans BRUTO vX.Y + padrões inegociáveis do Lote 1. |
| **Tronco 9 — Etapas para Criação dos Procedimentos** *(transversal)* | Metodologia de criação: extração do tácito → BRUTO → red-line → SOP → DB → workflow → smoke. | Implícito na sequência Lote 0 → 1 → N+. |
| **Tronco 10 — Papéis e Responsabilidades** *(transversal)* | Quem faz o quê: Cérebro Estratégico (Claude) · Executor (Codex) · Revisor técnico (Antigravity) · Decisor (Olavo). | §3 (Governança) de cada âncora de área. |

---

## 8. Convenção de nomenclatura

### 8.1. Prefixos de tipo para artefatos (a partir de 2026-06-05)

| Prefixo | Tipo |
|---|---|
| `DB-` | Database Notion |
| `WF-` | Workflow n8n |
| `SOP-` | SOP |
| `PROMPT-` | Prompt de agente |
| `ADR-` | Decisão arquitetural |
| `SLA-` | SLA versionado |
| `DOD-` | Template de Definition of Done |
| `PAG-` | Página âncora |

**Regra de transição:** artefatos NOVOS criados a partir de 2026-06-05
seguem o padrão. Artefatos legados (`PHI - X`, `Onb - X`, `A2.X`)
mantêm nome mas têm `Tipo` no Catálogo coerente. **Renomeio gradual via
Mudança de Escopo no Curador. Sem big-bang.**

### 8.2. Convenções de nome (sugestões — não obrigatórias v0.1)

| Tipo | Padrão | Exemplo |
|---|---|---|
| Mudança de Escopo | `ME-YYYYMMDD-<slug>` | `ME-20260615-novo-servico-sites` |
| Lote | `<Área>.Lote.<seq>` | `Execução.Lote.0` |
| ADR | `ADR-NNN — <título descritivo>` (já é padrão) | `ADR-010 — Divisão BQ × Supabase` |

### 8.3. Convenções de área

Áreas formais usam **nome verboso e auto-explicativo**, não sigla, na
documentação. Siglas opcionais para nomes longos de artefatos:

| Nome canônico | Sigla (opcional) |
|---|---|
| Onboarding | ONB |
| Execução de Demandas | EXEC |
| Priorização | PRIOR |
| Comercial | COM |
| Documentação e Ferramentas | DOC |
| Produto PHI | PROD |

### 8.4. Termos canônicos vs legados

| Use | Não use |
|---|---|
| Operação Interna | Chassi |
| Planejado / Retroativo | ANTES / DEPOIS |
| Tier denso / Tier barato | Pro/Flash *(jargão Gemini, OK em contexto técnico)* |

---

## 9. Mapa de agentes

Visão consolidada — atualizada a cada novo agente.

| Agente | Área | Tier | Status | Função primária |
|---|---|---|---|---|
| Orquestrador | Execução de Demandas | Denso (Pro) | Em design | Sequencia fila do operador, monitora SLA, atualiza prioridade |
| Padronizador | Execução de Demandas | Barato (Flash) | Em design | Quality-gate PASS/FAIL por DoD |
| Curador | Documentação e Ferramentas *(re-posicionado — tensão T10)* | Denso (Pro) | Lote 0 concluído | Detecta + propõe + aplica mudanças de escopo no chassi |
| A2.3 | Onboarding | Denso (Pro) | Em produção (smoke Aprovado pendente) | Classifica briefing + resumo operacional |
| A2.7 | Onboarding | Barato (Flash) | Em produção | Digest diário do Onboarding |
| A2.10 | Onboarding | Barato (Flash) | Em produção | Gate Validação Final PASS/FAIL |
| *Agente Diagnóstico Site* | Sites (Fase 2) | TBD | Hipotético | A definir quando Sites entrar |
| *Agente IA Implementação* | Agentes IA (Fase 2) | TBD | Hipotético | A definir quando essa área entrar |

---

## 10. Como retomar contexto (protocolo bus-factor)

Cenários: Olavo voltando de férias · Claude substituído · pessoa
nova entrando no projeto.

**Tempo estimado de retomada: 10-15 minutos.**

Ordem de leitura:

1. **Este doc** (`docs/strategic-planning/ESTADO-DO-PROJETO.md`).
   Cobre 90% do contexto: roadmap, decisões, pendências, glossário,
   mapa de agentes.
2. **Último commit do branch ativo**: `git log -1 --stat`. Revela
   o que mudou na sessão mais recente.
3. **Âncora da área em foco** (linkadas nas seções 3.x acima). Detalhe
   por área.
4. **Catálogo de Artefatos** (DB Notion linkado em §3.4): detalhe
   estrutural — quem depende de quem. **NOTA (2026-06-11):** Catálogo
   populado parcialmente (3 entradas). Catalogação retroativa dos
   artefatos legados em backlog (ver §5).
5. **Strawmans em git** (`docs/strategic-planning/<area>/BRUTO-vX.Y-design.md`):
   detalhe de design por área.

**Se algo conflitar entre git e Notion**, git é canônico para
**design e governança**; Notion é canônico para **estado operacional**
(ADR-012 endurecerá).

---

## 11. Protocolo de checkpoint

Rotina humana até o Curador (drift detection) automatizar (Lote 5+).

### Imediato — convenção humana
- **Início de sessão Claude Code:** digite `/checkpoint` ou peça
  "leia o ESTADO-DO-PROJETO + último commit e diga onde paramos".
  Claude faz síntese em 1 parágrafo + próximo passo recomendado.
- **Fim de sessão:** Claude propõe diff deste doc + reporta gaps
  detectados.
- **Final de cada lote concluído:** atualização obrigatória das
  seções 2, 3 (área impactada), 4, 5.

### Médio prazo — n8n Schedule
Workflow tipo A2.7 (digest diário Onboarding) que varre o Catálogo +
DBs operacionais + emite digest no Telegram. **Lote paralelo
"Telemetria Mínima"** (proposto, ver §5).

### Longo prazo — Curador automatiza
A partir do Lote 5+ do Curador, drift detection (Schedule + Flash
varre artefatos buscando inconsistência entre Catálogo, áncoras,
estado de DBs e este doc). Quando detecta drift → abre Mudança de
Escopo Retroativa automaticamente.

---

## 12. Notas operacionais para colaboradores/agentes novos

- **Não edite workflows n8n em produção pela UI** sem re-importar a
  versão canônica do repo antes. Causa-raiz das emergências passo
  7d/7e/7f do Onboarding.
- **Use `tenant_id = phi-agencia`** como default em qualquer artefato
  novo enquanto single-tenant. Não deixe vazio.
- **Toda mudança estrutural** (área, fronteira, novo serviço, regra)
  vira **Mudança de Escopo** no DB canônico (não improvisar via
  commits avulsos).
- **Padrões inegociáveis do Lote 1 Onboarding** valem pra qualquer
  trabalho novo na Operação Interna — não negociáveis sem ADR.

---

## 13. Histórico de versões deste doc

| Versão | Data | Mudança |
|---|---|---|
| v0.1 | 2026-06-04 | Criação. Inclui nomenclatura D1-D6 travada, glossário, mapa de agentes, protocolo de checkpoint, abertura formal da área Documentação e Ferramentas (Tronco 4 Miro). |
| v0.1.1 | 2026-06-04 | Atualização in-place pós-OK P1.5 + T10. Adicionados: URLs reais da âncora Doc&Ferramentas + Aprendizado #16 + ME-20260604 dogfood. §1.2 marcado pendente (Olavo enviar lista completa de troncos do Miro). §3.7 reflete Lote 0 e Lote 1 concluídos. §6 T10 atualizada com ME criada. Nenhuma mudança estrutural. |
| v0.1.2 | 2026-06-04 | Lista completa dos 10 troncos do Miro recebida e incorporada (§1.2). Releitura registrada: 2 áreas operacionais + 8 dimensões transversais. Troncos transversais 5-10 adicionados ao glossário (§7). §5 pendência de troncos marcada como resolvida. Nenhuma mudança estrutural — confirma que estamos no caminho certo: já tocamos 8 dos 10 troncos implicitamente. |
| v0.1.3 | 2026-06-04 | Telemetria Mínima Lote 0 concluído. §3.7 ganha sub-entrega Telemetria. §5 pendência Telemetria reclassificada como "Brief Codex entregue, aguardando execução". §6 T6 reclassificada como "Em mitigação" (severidade Alta → status atualizado). Pacote em commit único: DB Snapshots criado no Notion + 2 artefatos no Catálogo (DB + strawman v0.2) + brief Codex em handoff. |
| v0.1.4 | 2026-06-04 | ME-20260604 (1ª Mudança de Escopo do projeto — dogfood) aprovada e aplicada. Curador reposicionado: Procedimentos da Operação → Documentação e Ferramentas (Tronco 4). 4 registros do Catálogo atualizados (Área) + âncora Curador editada (Notion §1, §2, §4 D4) + strawman Curador (§0 D4, §1) + strawman Execução (§16 título, D3 Planejado/Retroativo, D4 Mora) + ESTADO já alinhado preventivamente. §5 pendência ME e §6 T10 marcadas Resolvidas. Serve de input de treino pro Lote 1 do Curador. |
| v0.1.5 | 2026-06-04 | ADR-012 rascunhado (Status `Proposto`) + Aprendizados #17 e #18 criados. ADR-012 cristaliza regra híbrida Git ↔ Notion (resolve T8). #17 = dogfood manual de Mudança de Escopo antes do Curador estar vivo. #18 = fragilidade do MCP Notion `update_content` com tabelas/callouts (insumo pro Curador Lote 3). Catálogo +1 (ADR-012). §4.2, §5 pendência ADR-012, §6 T8 atualizadas. Aprendizados não vão pro Catálogo (não estão nos 8 tipos do §7 strawman Curador). |
| v0.1.6 | 2026-06-04 | ADR-010 e ADR-012 aprovados (Status `Aceito`). ADR-010 rascunhado e aprovado direto (Olavo autorizou junto). ADR-001 esclarecido (não conflita com BQ base de verdade — divisão por natureza). Tensões T7 e T8 marcadas Resolvidas. Catálogo +1 (ADR-010); ADR-001 e ADR-012 saem de "Em revisão" pra "Vivo". §4.1 ADRs vigentes ganha ADR-010 e ADR-012; §4.2 perde ambos (saem do planejamento). §5 pendências ADR-010 e ADR-012 marcadas Resolvidas. Mantém pendente: ADR-011 (Curador). |
| v0.1.7 | 2026-06-05 | Telemetria Lote 1 Codex entregue (`b15e8dd`, 1792 linhas). Pré-revisão Claude: G1 (linha residual `parse_mode=HTML` no digest jsCode) corrigido inline + regenerado workflow.json e sandbox_export.json + ajustado teste ps1; G2 (Buscar Snapshots Existentes sem filtro de data — escala mal) documentado pra Lote 2; G3 (campo `Data de aplicação` ausente no DB Mudanças — Codex acertou ao reportar) documentado pra ME futura. Catálogo +1 (WF-DOC-Telemetria-Diaria `Em revisão`). T6 severidade Alta → Em mitigação avançada. Aguarda Antigravity + smoke E2E pra fechar. §3.7 Sub-entrega Telemetria atualizada. |
| v0.1.8 | 2026-06-05 | Brief Antigravity para Telemetria Lote 1 entregue (`docs/handoff/2026-06-05-telemetria-lote1-antigravity-brief.md`). 10 seções: objetivo, pré-leitura (7 docs), arquivos a revisar (4), recursos Notion (7 DBs), checklist nó-a-nó (12 sub-seções com 50+ itens), gaps documentados (G1 corrigido, G2/G3 informativos), formato de retorno, sequência de smoke E2E em 9 passos, tensões relacionadas, convenções. §5 pendência Telemetria atualizada (Brief Antigravity entregue). |
| v0.1.9 | 2026-06-11 | **Retificação de Aprendizado #19 + brief Codex correções Telemetria.** Análise factual posterior ao veredito Antigravity REJEITADO mostrou que: (a) commits `327872d` e `ed3d4be` SEMPRE estiveram no remote — confusão anterior sobre "SHAs fantasmas" foi causada por cache de fetch local desatualizado, não por compactação de contexto nem drift de worktree. Aprendizado #19 retificado (título + conteúdo + implicação) — agora foco em "verificação pós-push exige `git fetch` fresh antes". (b) Veredito Antigravity B1 foi **falso positivo** — G1 já estava corrigido em `327872d`. Provavelmente Antigravity revisou estado de `b15e8dd` sem pegar commits posteriores. (c) B3 (sentinel) e B4 (acento Chave da métrica) confirmados como bugs reais via grep. (d) B2 (16 nodes IF+Merge) é sugestão arquitetural pra resolver B3. Brief Codex `a03` consolidado em `docs/handoff/2026-06-05-telemetria-lote1-codex-fix-brief.md` foca em B3+B4 com B2 como recomendado. Catálogo WF Versão atualizada refletindo realidade. §6 T6 atualizada (Em mitigação, não "Em mitigação avançada"). §3.7 sub-entrega Telemetria atualizada. |
| v0.1.10 | 2026-06-11 | **Integração do report sub-chat Priorização.** L1 Priorização saiu de "Em execução (brief travado)" → **ATIVO em produção 2026-06-04** (n8n `cgw7ozJ7Zk9jBrj1`, E2E 2×). §2 snapshot reescrito refletindo realidade atual. §3.5 atualizada com status real do L1 + nota fronteira T4 revisitada (L1 implementado é tooling executor). §5 ganha 5 pendências novas (timezone cron UTC vs BRT, rajada Telegram na 1ª execução, branch separada `claude/lucid-tesla-ZWcbr`, status sub-chat Comercial pedido 2026-06-11, decisão callout→HTTP candidata a ADR). §6 T4 expandida com nuance Priorização. Catálogo +1 (WF-PRIOR-L1-Abertura-Projeto-Setup, Vivo, Versão completa com IDs n8n + DBs Notion tocados + pendência cron). PHI™ Aprendizados +3 (Aplicados): runOnceForAllItems para Code nodes com filtro, callout→HTTP no n8n-Notion v2.2, share explícito por database. Prompts copy-paste pra Codex `a03` + sub-chats Comercial/Priorização versionados em `docs/handoff/2026-06-11-*` no commit `94a623e`. Sub-chat Comercial ainda não respondeu. |
| v0.1.31 | 2026-06-18 | **Lote 1 Execução de Demandas CONCLUÍDO — 3 WFs ATIVOS em produção; refactor HTTP→Notion native v2.2 completo.** Sequência fechada: (1) `WF-EXEC-QualityGate-Pacing` ATIVO 2026-06-16 (commit `72b4086`, `a04-qg` + `a04-qg-fix-1`); (2) `WF-EXEC-Intake-Pacing` ATIVO 2026-06-17 (commit `91143f9`, `a04-intake` — brief APROVADO + smoke real verde POST webhook→Demanda+evento+Telegram+201, com nota da config inline da `EXEC_WEBHOOK_KEY` real per ADR-19); (3) `WF-EXEC-Orquestrador` ATIVO 2026-06-18 (commit `2452b1c`, `a04-orq` — pré-revisão Claude 49/49 PASS + smoke real verde Manual Trigger→Demanda virou Priorizada + evento `demanda.priorizada` com pareamento `.all().find()` por `demanda_id` validado E2E). Total: 9 HTTPs Notion eliminados nos 3 workflows; 3 refactors escopados em vez de 1 monolítico (decisão arquitetural pós-bug `data_source × page_id` durante smoke do `a03`/`a04 v2` em 15/06 — escopo enxuto permitiu pegar 6 bugs latentes no QG sem propagar pra Intake/Orq, e aplicar os aprendizados desde o brief inicial). §2 snapshot reescrito (Lote 1 Concluído). §3.3 Lote 1 = Concluído. §5: 2 pendências de brief resolvidas, 1 nova menor (credencial Gemini Pro). Catálogo Notion +2 entradas (`WF-EXEC-Intake-Pacing` Vivo + `WF-EXEC-Orquestrador` Vivo; QG já estava). **Lição-processo cristalizada — vira Aprendizado novo no DB PHI Aprendizados (transversal, aplicável a Onboarding/Telemetria/Comercial futuro):** Notion native v2.2 (`databasePage.create`/`update`) **substitui `$json` em downstream** pelo response da API Notion — pairedItem chain quebra. Consumers de dados upstream que precisem do output original devem **resolver via `.first()` (1 item por execução — webhook trigger) ou `.all().find(o => o.json.<chave_negocio> === $json.id)` (N items por execução — Schedule trigger)**. Anti-pattern: assumir que `.item` propaga pairedItem após Notion native v2.2 — não propaga consistentemente em todos os casos. Padrão default novo pra futuros refactors envolvendo Notion native v2.2. Próximo: gap Comercial owner + débitos técnicos legados; backlog catalogação retroativa pra destravar Curador Lote 1+; re-smoke A2.3 quando cota Gemini Pro recuperar. |
| v0.1.30 | 2026-06-16 | **WF-EXEC-QualityGate-Pacing ATIVO em produção — piloto refactor `a04-qg` + consolidação `a04-qg-fix-1`.** Decisão de escopo escopado (em vez do refactor dos 3 WFs de uma vez): brief `a04-qg` (`docs/handoff/2026-06-16-execucao-lote1-codex-a04-qg-brief.md`) → Codex entregou `49cae25` (5 HTTPs → 3 Notion `databasePage.create` em Eventos + 2 `databasePage.update` em Demandas) → pré-revisão Claude APROVADO → smoke real revelou 6 bugs latentes não-estruturais: (1) `alwaysOutputData:true` em search node injetando item fantasma quando 0 matches; (2) demanda manual com grafia incompatível com filtro `Em revisao` (case-sensitive); (3) Validar DoD lendo de `$input` (output do Notion create) em vez da fonte (`Buscar Demandas Em Revisao`) — `page.id` era id do evento, não da demanda → updates falhavam com "estado is not a property that exists"; (4) Notion native v2.2 substitui `$json` em update/create — pairedItem quebra downstream → expressions resolvem `undefined`; (5) regex DoD frágil pegando palavras-chave em textos descritivos (`"sem acao tomada"` continha `"acao tomada"` literal → match TRUE → demanda FAIL virou PASS); (6) Telegram falhando com `text:''` quando lookup falha. Todos corrigidos inline + smoke real verde 2026-06-16 (2 demandas E2E: PASS=Entregue+2 eventos, FAIL=Em execucao+2 eventos+Telegram; idempotência confirmada na 2ª execução). Consolidação via brief `a04-qg-fix-1` (`docs/handoff/2026-06-16-execucao-lote1-codex-a04-qg-fix-1-brief.md`) → Codex entregou `72b4086` zerando drift n8n↔repo: 6 fixes inline + 4 cleanups defensivos (`alwaysOutputData:false`, guards `page.id`, remoção `...page`, ps1 com 11 checks novos). Pré-revisão Claude APROVADO. Re-import + activate confirmado. §2 snapshot reescrito (QG ativo, Intake/Orq pendentes). §3.3 Lote 1 = PARCIAL (QG ativo). §5: 3 pendências resolvidas (smoke, a04 v2, smoke QG), 2 novas (briefs `a04-intake` e `a04-orq`). **Lições-processo**: (a) **Notion native v2.2 substitui `$json` em update/create** — qualquer consumer downstream que precisa de dados do upstream antes do Notion node deve usar `.all().find()` pareando por chave de negócio, NÃO `.item` (pairedItem quebra). Padrão pra documentar como aprendizado transversal (relevante pra Onboarding e Telemetria também). (b) **`alwaysOutputData:true` é fallback silencioso** — Aprendizado #15 reforçado. Default deve ser `false`; ativar só quando há razão explícita. (c) **Smoke é juiz decisivo, pré-revisão Claude pega ~70%** — bugs não-estruturais (pairedItem broken, regex frágil) só aparecem em runtime. Confirma decisão de pular Antigravity quando smoke real é possível. (d) **Piloto escopado supera refactor monolítico** — fazer só o QG primeiro permitiu detectar e corrigir 6 bugs com blast radius isolado; aplicar mesmos aprendizados em Intake/Orq via `a04-intake`/`a04-orq` evita repetir os bugs. Próximo: escrever briefs `a04-intake` (2 HTTPs) e `a04-orq` (2 HTTPs) → smoke isolado de cada → Lote 1 Execução FECHA quando os 3 WFs ativos. |
| v0.1.29 | 2026-06-15 | **Decisão de refatorar HTTP→Notion native nos 3 workflows (a04 v2). Smoke postergado.** Olavo propôs (com base no aprendizado do bug de ID): "não é melhor substituir todos os HTTP Request por nodes Notion nativos?". Claude confirmou (consultando SDK Notion v2.2 via MCP n8n): arquiteturalmente correto — elimina classe inteira de bugs ID/version, simplifica jsCodes, libera de `Notion-Version` header, alinha com Buscar SOP que já é native. Detalhe técnico corrigido: o `mode: list` do Resource Locator do n8n **não aceita nome em runtime** — só `'list' \| 'url' \| 'id'` com `value: <UUID>`; `cachedResultName` é só label visual. Solução: `mode: list, value: <UUID page_id>, cachedResultName: '<Nome do DB>'`. AskUserQuestion ofereceu 3 timings (refactor agora postergando smoke / smoke agora com fix inline + refactor depois / só fix inline). **Olavo escolheu refatorar agora** pra evitar resmoke duplo + publicar versão definitiva. Mapeamento preciso: **9 HTTPs Notion** (não 7) — 2 Intake (Criar Demanda POST + Criar Evento demanda.criada POST) + 2 Orq (Atualizar Demanda Priorizada PATCH + Criar Evento demanda.priorizada POST) + 5 QG (em_revisao POST + Marcar Entregue PATCH + entregue POST + Reabrir Demanda PATCH + reaberta POST). Brief Codex `a04` v2 reescrito (sobrescreve v1) com escopo refactor completo: templates `databasePage.create` e `databasePage.update`, mapping de cada property (Demanda 13 props + Evento 9 props), refactor dos Code nodes upstream (produzem campos avulsos em vez de bodies), constantes `DB_DEMANDAS_PAGE`/`DB_EVENTOS_PAGE` em `generate_export.js`, ps1 ganha 4 checks novos (0 HTTP api.notion.com / UUID em databaseId.value / cachedResultName presente / EXEC_NOTION_TOKEN ausente). Confirmações úteis: HTTPs já usavam credencial Notion via `predefinedCredentialType` (não secret) → migração não altera fluxo de autenticação, só transporte. `EXEC_NOTION_TOKEN` **não existe** nos workflows (grep negativo) → ADR-19 só lida com `EXEC_WEBHOOK_KEY` (preservado). §3.3 Lote 1 ajusta nota (smoke pausado até a04 v2). §5 substitui pendência (a04 v1 → a04 v2 + smoke pausado). §13 v0.1.29. **Lição-processo reforçada:** sob pressão de "desbloquear smoke", quase entreguei band-aid (a04 v1: só trocar IDs em jsCodes que iam ser refeitos depois). Olavo refrescou perspectiva arquitetural — quando o protótipo expõe acoplamento mau, refatora antes de validar, não depois. |
| v0.1.28 | 2026-06-15 | **Smoke Execução Lote 1 em andamento — bug data_source_id × page_id capturado durante config inline.** Olavo importou os 3 INJECTED via SendUserFile e ao configurar credenciais Notion percebeu que o `Criar Demanda` (HTTP `POST /v1/pages`) usava `database_id: 'cd1ab757-...'` (data_source_id) enquanto a URL do DB no Notion mostrava `a5c6b6ae...` (page_id). Investigação Claude confirmou bug real: `Notion-Version: 2022-06-28` espera **page_id** no `parent.database_id`, não data_source_id. Origem da regressão: MCP Notion retorna data_source_id quando criamos DBs; Codex (e Claude na pré-revisão) usou esse ID em todos os jsCodes sem cruzar com qual ID a REST API direta espera por versão. Nodes Notion nativos (Buscar SOP / Buscar Demandas) continuam com data_source_id (n8n converte internamente — funciona); só HTTP direto afetado. Mapa: 7 nodes em 3 workflows usam IDs errados (3 Intake + 2 Orq + 2 QG). Olavo escolheu (AskUserQuestion) "fix inline pra desbloquear smoke + brief Codex a04 depois". Instruções de fix inline entregues (Find&Replace globais nos 3 nodes do Intake trocando `cd1ab757` → `a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b` e `3423df0d` → `c64f600e-4f46-4b2b-ac22-c1e425c8966e`). Brief Codex `a04` versionado em `docs/handoff/2026-06-15-execucao-lote1-codex-a04-brief.md`: cristaliza troca nos 3 workflows + `generate_export.js` ganha constantes `DB_*_PAGE` separadas das de Notion nativo + ps1 ganha 2 checks pra impedir regressão. §3.3 Lote 1 ganha nota sobre fix inline. §5 ganha 2 pendências (smoke em andamento + Codex a04 cristalizar). §13 v0.1.28. **Lição-processo:** quando criar DB via MCP Notion, capturar TANTO data_source_id quanto page_id no Catálogo, e classificar qual ID usar em qual contexto (Notion node nativo → data_source; HTTP direta `2022-06-28` → page_id). Hoje o Catálogo registra só um dos dois — gap a corrigir num próximo passe. |
| v0.1.27 | 2026-06-15 | **JSONs do Lote 1 injetados pra smoke + pendência meta industrializar ADR-19.** Olavo não tinha `EXEC_WEBHOOK_KEY` ("como obter?") — não é "obter", é "gerar" (shared secret novo). Claude gerou 32 bytes hex via `crypto.randomBytes(32)` em `/tmp/exec_webhook_key.txt`, injetou nos 3 workflows em `/tmp/exec-lote1-*-INJECTED.json` (Intake: 2 substituições no jsCode do Validar Secret + check defensivo; Orquestrador e QualityGate: 0 substituições, idênticos ao repo — inclusos pra simplificar import único do `/tmp/`), entregou via SendUserFile. Repo permanece sanitizado (`<EXEC_WEBHOOK_KEY_redacted>` intacto em todos os 3 workflows). Olavo deve guardar a chave no `.env` local (já protegido em `.gitignore`) e apagar `/tmp/*-INJECTED.json` + `/tmp/exec_webhook_key.txt` após smoke. Pendência meta nova em §5: **industrializar build-time injection per ADR-19** — `generate_export.js` ler de `process.env` em vez de constantes literais hardcoded. Hoje injeção é manual ad-hoc (sed/Node), fragmenta processo e contradiz parcialmente ADR-19 (que prevê fluxo build automatizado). Aplicar primeiro à Execução Lote 1 (deploy real), depois retroativamente em Onboarding/Telemetria. §13 v0.1.27. Buraco real do processo identificado: o ADR-19 foi escrito como ADR e usado retoricamente, mas a parte de "build-time" continua manual em todo workflow novo — pendência captura o gap. Próximo: Olavo importa os 3 INJECTED no n8n, configura credenciais Notion+Telegram+Gemini + share dos 3 DBs, roda smoke E2E (9 passos do brief Antigravity §"Após aprovação"). |
| v0.1.26 | 2026-06-15 | **Antigravity pulado por decisão Olavo — smoke real Execução Lote 1 autorizado.** Olavo optou por "continuar sem o report do Antigravity" — pular a etapa de revisão externa e ir direto ao smoke real (juiz decisivo, lição consolidada na Telemetria onde nem pré-revisão Claude nem Antigravity pegaram o bug multi-fan-in/runtime, só o smoke). Decisão registrada com transparência: rompe o fluxo "Codex faz, Antigravity avalia, Claude palavra final" que o próprio Olavo definiu na rodada a02; Claude sinalizou a ressalva de que sem Antigravity o smoke é a única rede externa restante e nesta saga o próprio Claude errou B2/B4 (falso positivo a01 → regressão a02). Palavra final Claude: APROVADO pra smoke baseado na pré-revisão do a03 (`6e49fda`). Brief Antigravity permanece versionado (`6bf4e7a`) caso Olavo queira acionar depois. §3.3 Lote 1: a03 APROVADO + Antigravity pulado + smoke autorizado. §5: pendência Antigravity → Pulado; nova pendência "smoke real Execução Lote 1" = último passo. §13 v0.1.26. Pós-smoke verde: publish (active:true) → Lote 1 Concluído → T (gap de Execução) fecha. Pré-req do smoke: build com `EXEC_WEBHOOK_KEY` real injetado per ADR-19 (workflow ativo tem valor, repo tem placeholder), credenciais Notion+Telegram+Gemini reais, share dos 3 DBs (Demandas/SOPs/Eventos) com a integração Notion. |
| v0.1.25 | 2026-06-14 | **Exec Lote 1 `a03` APROVADO pré-revisão Claude — liberado pra Antigravity.** Codex empurrou `a03` em `6e49fda` exatamente como o brief pedia. Pré-revisão Claude com lição aplicada (cruzar com ADRs ANTES de classificar): (a) **B4 corrigido**: `$env` zero em todos os 3 workflows + gerador (grep `\$env\.` retorna vazio); constante `EXEC_WEBHOOK_KEY = '<EXEC_WEBHOOK_KEY_redacted>'` restaurada em generate_export.js; jsCode do Validar Secret usa constante literal com check defensivo `EXEC_WEBHOOK_KEY !== '<EXEC_WEBHOOK_KEY_redacted>'` impedindo autorizar com placeholder não-injetado; header `x-pacing-secret` case-insensitive via `lower()`; ps1 ganhou check `$env` proibido com referência explícita ao ADR-19. (b) **Cirurgia perfeita**: hashes idênticos ao `a02` no Orquestrador (`ee44b37e...`) e QualityGate (`b6b5e59d...`) — não foram tocados, B1/B3 preservados byte-a-byte; só Intake mudou (`4112c076...`). (c) **a02 fixes preservados**: 0 ocorrências de `versao_sop_aplicada.*relation` (B1); 4 strings exatas do schema em `priorityFor` classe_sla (B3); PHI_EVENTOS `3423df0d-...` em todos os 3 workflows; Merge Triggers `numberInputs:2`; Gemini Pro no Orq, Flash no QG; DBs corretos. (d) **Cross-check com ADRs aprovado**: ADR-19 (build-time injection) ✓, ADR Tiering (Pro/Flash) ✓, ADR Eventos (formato) ✓. (e) **Segurança**: sandbox==workflow byte-a-byte nos 3; sem BOM nos 8 arquivos; sem chat_id raw, sem secrets, sem mojibake. Brief Antigravity (entregue ontem em `6bf4e7a`) **liberado pra usar agora** — antes não valia porque tinha regressão `$env` conhecida. §3.3 Lote 1: a03 APROVADO Claude, aguarda Antigravity. §5: pendência a03 Resolvida; pendência brief Antigravity passa de "Pronto; aguarda a03" pra "LIBERADO PRA USAR". §13 v0.1.25. Sequência: cole brief Antigravity → Antigravity avalia → Claude palavra final → Olavo roda smoke real (com `EXEC_WEBHOOK_KEY` injetado em build-time per ADR-19). |
| v0.1.24 | 2026-06-14 | **Exec Lote 1 `a02` REJEITADO por regressão B4 — culpa do brief Claude. Brief `a03` cirúrgico.** Codex empurrou `a02` em `f581f89`: B1 corrigido (`versao_sop_aplicada` agora `rich_text` nos 3 workflows; `relation` zerado via grep), B3 corrigido (`priorityFor` com único parâmetro `classe_sla` e nomes exatos do schema — `Critica`, `Recorrente diaria`, `Recorrente semanal`, `Ad-hoc padrao`; bug antigo `tipo === 'Semanal'` zerado), placeholder PHI_EVENTOS substituído pelo data source ID real (`3423df0d-77df-4834-bdda-c08ddbae40ff`) em todos os 6 arquivos onde aparecia, sandbox==workflow byte-a-byte nos 3 (hashes 92a2a91a, ee44b37e, b6b5e59d), sem BOM/secrets/mojibake/placeholder, ps1 ganhou 4 checks novos e passa verde. **MAS regrediu B2**: brief Claude `a02` pediu `$env.WEBHOOK_SECRET_EXECUCAO` no jsCode do `[Exec Intake] Validar Secret`, **violando ADR-19 Aceito 2026-05-28** (https://app.notion.com/p/36eb65e5c72b8136b400da8a8daf99d3). ADR-19: runtime n8n bloqueia `$env` em Code nodes (`N8N_BLOCK_ENV_ACCESS_IN_NODE`); `process.env` também falha; API `$vars` retornou 403. Decisão canônica é build-time injection com placeholder `<NOME_redacted>` no commit. Em prod, `$env.WEBHOOK_SECRET_EXECUCAO` seria sempre `''` → check falha → IF false → 401 em TODA requisição → webhook inútil. O `a01` ORIGINAL já estava conforme ADR-19 (constante literal `<EXEC_WEBHOOK_KEY_redacted>` injetada em build-time); pré-revisão Claude do `a01` olhou só `webhook.authentication=undefined` e não viu o secret check no jsCode, marcando B2 erradamente como "secret ausente". Brief `a02` então pediu fix que não era necessário e introduziu regressão. Falha minha de processo: deveria ter grep ADRs Aceitos relevantes antes de classificar. Brief Codex `a03` cirúrgico em `docs/handoff/2026-06-14-execucao-lote1-codex-a03-brief.md`: restaurar `EXEC_WEBHOOK_KEY` constante build-time em `generate_export.js`, jsCode usa constante literal sanitizada com check defensivo `EXEC_WEBHOOK_KEY !== '<EXEC_WEBHOOK_KEY_redacted>'` pra impedir auth com placeholder vazio, header padronizado `x-pacing-secret`, ps1 ganha check `$env` proibido + check placeholder `<EXEC_WEBHOOK_KEY_redacted>` presente. B1, B3, PHI_EVENTOS, Merge `numberInputs:2`, Gemini Pro/Flash, DBs corretos do `a02` **mantidos intactos**. §3.3 sub-entrega Lote 1: a02 REJEITADO + brief a03 em curso. §5: pendência Codex a02 → Parcial; nova pendência Codex a03; nova pendência meta "reforçar pré-revisão Claude com check de ADRs existentes antes de classificar bug" (processo, não código). §13 v0.1.24. Após a03: pré-revisão Claude → Antigravity → smoke real → publish. |
| v0.1.23 | 2026-06-14 | **Exec Lote 1 `a01` REJEITADO na pré-revisão Claude — brief Codex `a02`.** Codex empurrou `a01` em `0f03469`: 3 workflows (Intake-Pacing 18 nodes webhook+code+if+respond+notion+http+telegram; Orquestrador 11 nodes incluindo Gemini Pro `gemini-2.5-pro` + Merge Triggers `numberInputs:2`; QualityGate-Pacing 14 nodes incluindo Gemini Flash `gemini-2.5-flash`) + generate_export.js + ps1 + notion_phi_eventos_schema.md. Pré-revisão Claude validou estrutura via Node: sandbox==workflow byte-a-byte nos 3, sem BOM nos 8 arquivos, sem secrets/chat_id raw/mojibake, schedule 08:00 BRT America/Sao_Paulo, active:false, DBs corretos (SOPs `bfeb1105...`, Demandas `cd1ab757...`), SOP lookup correto (area=Execucao + estado=Vigente), idempotência Intake com existingKeys, eventos canônicos no formato do ADR (entidade.estado snake_case + payload comum + tier_agente + versao_sop_aplicada), tier Pro/Flash bate com ADR Tiering. **PORÉM REJEITADO** por 3 bugs bloqueantes: **B1** `versao_sop_aplicada` enviado como `relation` nos 3 updates mas schema do DB Demandas é `rich_text` (decisão Lote 0; relation viria Lote 2) → Notion API retorna 400 garantido em todos os updates de demanda; **B2** webhook `/pacing-alert` sem `authentication` e sem check de secret no jsCode → falha de segurança (qualquer pessoa pode criar demanda Crítica spam, polui fila + Telegram); **B3** função `priorityFor` no Orquestrador confunde parâmetro `tipo` (Pacing/Daily/etc.) com `classe_sla` (Crítica/Recorrente diária/etc.) E usa nomes que não existem no schema (`Semanal` em vez de `Recorrente semanal`; `Ad-hoc` em vez de `Ad-hoc padrao`) → toda classe não-Crítica cai no default 20, indistinguível. **Claude criou DB `PHI - Eventos`** via MCP durante a pré-revisão (page `c64f600e...8966e`, ds `3423df0d-77df-4834-bdda-c08ddbae40ff`) — placeholder `<PHI_EVENTOS_DATA_SOURCE_ID_pending_creation>` que Codex deixou (não tinha MCP Notion) precisa ser substituído pelo ds real. Catálogo +1 (DB Eventos). Brief Codex `a02` em `docs/handoff/2026-06-14-execucao-lote1-codex-a02-brief.md` com fixes B1 (relation→rich_text), B2 (Validar Secret padrão A2.1 + Secret Valido? + 401 branch), B3 (priorityFor com classe_sla e nomes do schema), substituição do placeholder e 4 checks novos na ps1. §3.3 sub-entrega Lote 1 atualizada (a01 REJEITADO + brief a02). §5 pendência Codex Lote 1 → Parcial + nova pendência Codex `a02`. §13 v0.1.23. Sequência pós-`a02`: pré-revisão Claude → Antigravity rodada 1 → smoke real → publish. Olavo escolheu (AskUserQuestion) Codex faz tudo + Antigravity avalia + Claude dá palavra final. |
| v0.1.22 | 2026-06-14 | **Lote 0 Execução de Demandas Concluído E2E + brief Codex Lote 1.** Olavo aprovou v0.3 e os 2 ADRs rascunho ("aprovado, continue"). Executado em 1 sessão Claude: (a) ADR Tiering e ADR Eventos criados como `Aceito` no DB `PHI™ — Decisões (ADR)` (URLs `37fb65e5...d736c` e `37fb65e5...60ac08`); (b) DB `PHI - SOPs` criado (page `7ebc98e0...e2ed5`, ds `bfeb1105...`) com schema completo (titulo, area select com 6 áreas, versao, estado, data_vigencia, link_documento, tenant_id, observacoes, substitui como text); (c) DB `PHI - Demandas` criado (page `a5c6b6ae...c25b`, ds `cd1ab757...`) com schema v0.3 completo (16 campos incluindo `versao_sop_aplicada`, tipo com 13 opções, classe_sla, ciclo de vida com 7 estados); (d) âncora `[HANDOFF] Execução de Demandas` criada (`37fb65e5...5137`) com conteúdo completo (status, fronteira, artefatos canônicos git/Notion, decisões 2026-06-14, padrões inegociáveis); (e) SOP v1.0 `Vigente` criada como entry no DB SOPs (`37fb65e5...ba50`) com 120+ linhas (objetivo, escopo, atores Pro/Flash/Olavo, procedimento por estado, tabela SLA com Pacing=Crítica, DoD Pacing detalhado, métricas habilitadas, padrões inegociáveis); (f) brief Codex Lote 1 em `docs/handoff/2026-06-14-execucao-lote1-codex-brief.md` (escopo 3 workflows: Intake-Pacing webhook + Orquestrador Pro + QualityGate-Pacing Flash + criar DB `PHI - Eventos` via MCP); (g) Catálogo +6 entradas (2 ADRs + 2 DBs + âncora + SOP) — Catálogo agora com 10 artefatos catalogados. **Achado bonus durante search:** Aprendizado #16 ("Protocolo de retomada de contexto + checkpoint cadenciado") existe no DB sem `#16` no título — confirma minha hipótese da auditoria 2026-06-11 (pendência §5 resolvida parcial). ESTADO: §2 snapshot 2026-06-14; §3.3 Lote 0 Concluído + Lote 1 brief entregue; §4.1 +2 ADRs Aceitos (com nota sobre divergência título × `Número ADR`); §4.2 rascunhos tachados; §5 cluster de pendências v0.3/Notion/ADRs/brief Codex tudo Resolvido; §13 v0.1.22. Próximo: Codex implementa Lote 1 Execução. |
| v0.1.21 | 2026-06-14 | **v0.3 Execução de Demandas fechada + 2 ADRs rascunho.** Olavo escolheu v0.3 como próxima frente após auditoria multi-fan-in. Rodada Q&A 4 perguntas, todas respondidas: (1) ciclo de vida aceito como está; (2) Pacing/verba diário escolhido como tipo recorrente do Lote 1; (3) DB `PHI - SOPs` no Notion escolhido como mecanismo de versionamento de SOP; (4) Pacing/verba do Lote 1 nasce já classificado como **Crítica** (mesmo dia), não Recorrente diária. Produzidos 3 docs em git: (a) `docs/strategic-planning/execucao-demandas/BRUTO-v0.3-design.md` — delta v0.2→v0.3 com decisões travadas, novo campo `versao_sop_aplicada` na Demanda, novo DB `PHI - SOPs` schema completo, Lote 1 Pacing E2E detalhado (intake alerta → Orquestrador → SLA Crítica → Telegram → quality-gate → digest); (b) `ADR-rascunho-tiering-agentes-ia.md` — cristaliza padrão Pro=denso/Flash=barato já aplicado em Onboarding (A2.3 Pro, A2.7/A2.10 Flash); (c) `ADR-rascunho-eventos-canonicos-sink-bq.md` — modelo de evento canônico transversal (todas áreas) com payload comum + storage Notion (Fase 1: novo DB `PHI - Eventos`) + sink BQ (Fase 2 via Telemetria Lote 4) per ADR-010. §3.3 atualizada (Lote 0 v0.3 fechada, Lote 1 escopo travado). §4.2 ganha 2 ADRs rascunho listados. §5: pendência v0.3 → Parcial (escrita concluída, Notion + SOP + brief Codex viram pendências novas). §13 v0.1.21. Próximo: Olavo revisa v0.3 + 2 ADRs em git → aprovação → eu abro Notion canônico (DBs, âncora, SOP, ADRs Aceitos) → brief Codex pro Lote 1. |
| v0.1.20 | 2026-06-14 | **Auditoria multi-fan-in retroativa — 10 WFs prod, 0 bugs ativos. Padrão inegociável refinado.** Codex executou auditoria (commit `d398df2`) via MCP n8n produção em 10 workflows: WF-PRIOR-L1, WF-COM-Deduplicar, 5 WFs Lote 1 Onboarding (A2.1/A2.2/A2.5/A2.9/A2.11), 3 WFs Lote 2 Onboarding (A2.3/A2.7/A2.10). Resultado: 7 NÃO AFETADOS, 3 marcados AFETADOS pelo detector estrutural (A2.1 `Ler Etapas A1`, A2.3 `Preparar Atualizacoes Aprovado`, A2.10 `Restaurar Telegram PASS`). Validação Claude via MCP n8n `get_workflow_details` consultou tipo dos upstreams: A2.1 upstream `Tem Servico?` = `n8n-nodes-base.if` (branch true → `Atualizar Servico Cliente` → `Ler Etapas A1`; branch false → `Ler Etapas A1` direto); A2.3 upstream `Roteador por Classe` = `n8n-nodes-base.switch` v3.4 (cases 0/1 → `Preparar Atualizacoes Aprovado`, case 2 → `Preparar Atualizacoes Insuficiente`); A2.10 upstream `Deve Destravar Seq 22?` = `n8n-nodes-base.if` (idêntico ao padrão A2.1 com HTTP `Destravar Seq 22 se Bloqueada` na branch true). Todos IF/Switch mutually-exclusive → apenas 1 branch dispara por execução → Code roda 1× → SEM BUG RUNTIME. Os 3 são **falsos positivos** do detector estrutural; brief de auditoria havia sido escrito sem distinguir paralelo de convergente. **Padrão inegociável REFINADO**: (a) multi-fan-in **PARALELO** (todos upstreams disparam: leituras DB, HTTP, Schedule) → EXIGE Merge consolidador (`numberInputs` exato); (b) multi-fan-in **CONVERGENTE** (upstreams mutually-exclusive: branches IF/Switch convergindo) → sem bug runtime; Merge recomendado só como cleanup defensivo opcional. Detector estrutural baseado em contagem de conexões NÃO distingue os 2 casos — precisa inspecionar tipo dos upstreams. Aprendizado Notion atualizado (Implicação + Ação Tomada) cobrindo refinamento + resultado auditoria. §5 pendência "Auditoria multi-fan-in" → Resolvido; nova pendência opcional "fix defensivo nos 3 falsos positivos" (não bloqueia, cosmético arquitetural). §13 v0.1.20. Telemetria Lote 1 permanece em prod sem ressalvas. |
| v0.1.19 | 2026-06-13 | **SMOKE REAL VERDE — Telemetria Lote 1 EM PRODUÇÃO. T6 RESOLVIDO.** Workflow `VubalOUaoBteCyC6` no n8n prod, `a05` (`dddb84f`), Olavo executou smoke E2E manual em 2026-06-13: 1ª execução criou **exatas 19 linhas** em DB Snapshots (vs 133 no smoke do `a03`); 2ª execução **0 linhas novas** (idempotência confirmada via `existingKeys` + sentinel B3 + IF false branch → Merge index 1 → bypassa Criar Snapshot); digest Telegram chegou 2× coerente; zero estranhezas. Olavo escolheu (AskUserQuestion) **publish imediato** — `active=true` aciona schedule diário 08:30 America/Sao_Paulo. Ações: §2 snapshot reescrito (Telemetria em produção, T6 resolvido); §3.7 sub-entrega Telemetria Lote 1 marcada **Concluído (prod 2026-06-13)**; §5 pendência Telemetria → Resolvido; §6 T6 → Resolvido (com tachado). Catálogo Notion WF-DOC-Telemetria-Diaria: Estado `Em revisão` → `Vivo`, Versão atualizada com ID workflow real + smoke verde + histórico do ciclo. Aprendizado "Multi-fan-in para Code node em n8n" Status `Em análise` → `Aplicado` com Ação Tomada expandida (fix validado por smoke real). Ciclo completo: 9 dias (2026-06-04 → 2026-06-13), 5 rodadas Codex (`a01`, `a03`, `a04`, `a05` + G1 fix Claude `327872d`), 5 pré-revisões Claude (119/119 a03, 115/115 a05, REJEITADO a04 por `numberInputs` e a01 por G1), 3 Antigravity (REJEITADO a01, APROVADO a03, APROVADO a05), 2 smokes (a03 regressão multi-fan-in, a05 verde). Padrão inegociável consolidado e ativo: multi-fan-in pra Code/Function node EXIGE Merge antes; Merge consolidador DEVE declarar `numberInputs`. Auditoria pendente (§5): 5 WFs Lote 1 Onboarding + L1 Priorização + WF-COM-Deduplicar podem ter o mesmo bug latent. |
| v0.1.18 | 2026-06-13 | **APROVADO Antigravity rodada 3 — smoke E2E real autorizado.** Veredito macro APROVADO ("o `a05` fecha cirurgicamente a única falha bloqueante do `a04`. A causa-raiz do smoke — 7× execução do metricCode por multi-fan-in — está endereçada de forma estruturalmente correta e agora protegida por teste"). Smoke E2E real autorizado: 1ª execução esperado 19 linhas, 2ª execução (mesmo dia) esperado 0 linhas novas (idempotência), digest Telegram coerente em ambas. Sem smoke verde, T6 não fecha e workflow não publica. §3.7 sub-entrega Telemetria atualizada (APROVADO rodada 3, smoke autorizado). §5 pendência Telemetria: smoke real é o último passo. §6 T6 reclassificada "Em mitigação final — só falta smoke real". Catálogo Notion atualizado (Versão = veredito rodada 3 + smoke autorizado). Próximo: Olavo roda smoke real → me reporta → fecho T6 + viro Catálogo pra Vivo + atualizo §3.7 pra Concluído. |
| v0.1.17 | 2026-06-13 | **Pré-revisão Claude do `a05` APROVADO + brief Antigravity rodada 3.** Codex empurrou `a05` (`dddb84f`) com fix cirúrgico: `parameters: { mode: 'append', numberInputs: 7 }` em generate_export.js + check `[int]$mergePre.parameters.numberInputs -ne 7` em ps1 + regenerou exports. Diff = 1 linha por arquivo. Pré-revisão Claude reproduziu suíte ps1 em Node (pwsh ausente; Codex confirmou ps1 verde em Windows PowerShell): **115 checks, 115 PASS, 0 FAIL**. Cobertura: `numberInputs === 7` ✓, fan-in das 7 leituras em inputs `[0,1,2,3,4,5,6]` distintos ✓, topologia (Merge Pre-Calcular → Calcular Metricas) preservada, **hashes preservados vs `a03`**: metricCode `85065f64cbdcbd66…` idêntico, digestCode `d6d72424ec17c8ca…` idêntico, sandbox==workflow byte-a-byte (`42c08612da011a8e…`), 17 nodes, 19 add(), sem BOM/secrets/mojibake/chat_id raw, schedule 08:30 America/Sao_Paulo, Set Contexto com EXEC-TELEMETRIA-, 7 leituras Notion com databaseId correto + returnAll, IF type if + linhas_novas gt 0, Criar Snapshot com Chave da métrica/Versão da consulta acentuados, Merge Pos-Snapshot mode append, digestCode sem `parse_mode=HTML`, Telegram HTML + chat_id redacted + text=digest_html, active:false. Brief Antigravity rodada 3 entregue (`docs/handoff/2026-06-13-telemetria-lote1-antigravity-rodada3-brief.md`) — addendum 2 ao original + rodada 2, foca só no que mudou em `a04`/`a05`. §3.7, §5, §6 T6 atualizadas. Catálogo Notion: Versão atualizada (a05 pré-revisão PASS, aguarda rodada 3). Próximo: Antigravity rodada 3 → **smoke real (decisivo: 19 linhas na 1ª, 0 na 2ª)** → publish → fecha T6. |
| v0.1.16 | 2026-06-13 | **Pré-revisão Claude do `a04` REJEITOU + brief Codex `a05`.** Codex implementou `a04` (`b579816`): adicionou `[Telemetria] Merge Pre-Calcular` (merge v3 mode append) com as 7 leituras em inputs distintos 0..6 → Calcular Metricas; 17 nodes; ps1 atualizada (passou no ambiente Codex). Pré-revisão Claude confirmou: topologia correta (índices 0..6 distintos validados via Node), `metricCode`/`digestCode` com hash idêntico ao a03 (`85065f64...`/`d6d72424...`), sandbox==workflow byte-a-byte (`76cc767b...`), sem BOM, 19 add(), active:false. **PORÉM REJEITADO**: o node Merge tem `parameters: { mode: 'append' }` sem `numberInputs`. Definição oficial do n8n Merge v3 (consultada via MCP n8n get_node_types): `numberInputs` default = 2, e "The node waits for all connected inputs to be executed" — só os inputs DECLARADOS. Com default 2, o Merge esperaria só Clientes (0) + Etapas (1); as outras 5 leituras (Mudanças, Catálogo, ADR, Aprendizados, e crucialmente Snapshots Existentes em input 6) não seriam esperadas → `Calcular Metricas` dispararia antes de Snapshots resolver → `existingKeys` vazio → idempotência quebra de novo (variante) + possíveis métricas Curador/Global zeradas. A ps1 do `a04` não detecta (não valida `numberInputs`) — mesmo gap de teste do a03. Olavo escolheu (AskUserQuestion) corrigir via Codex. Brief `a05` entregue em `docs/handoff/2026-06-13-telemetria-lote1-codex-a05-brief.md` (cirúrgico: `numberInputs: 7` + check ps1 `=== 7` + regenerar). §3.7, §5, §6 T6 atualizadas. Padrão inegociável NOVO reforçado: Merge consolidador DEVE declarar `numberInputs` = nº de upstreams. Catálogo Notion: Versão atualizada (a04 rejeitado, a05 em curso). Próximo: Codex `a05` → pré-revisão Claude → Antigravity rodada 3 → smoke real → publish. |
| v0.1.15 | 2026-06-13 | **Smoke E2E revelou regressão arquitetural — brief Codex `a04`.** Olavo rodou smoke do `a03` no n8n prod (workflow `VubalOUaoBteCyC6`, `active: false`): 1ª execução criou 133 linhas em vez de 19 (exatos 7×19); 2ª execução criou outras 133 em vez de 0 (idempotência zero). Causa-raiz: 7 leituras Notion conectam todas em `Calcular Metricas in[0]` — n8n dispara Code node 1× por upstream trigger mesmo em `runOnceForAllItems`, então jsCode rodou 7× e gerou 19 métricas a cada vez. Idempotência também quebrou porque em iterações triggadas por upstreams ≠ Snapshots Existentes, `$('Buscar Snapshots Existentes').all()` pode estar vazio. Nem pré-revisão Claude (119/119) nem Antigravity (APROVADO rodada 2) detectaram — bug não-estrutural, só smoke runtime captura. Cleanup: 266 linhas apagadas manualmente por Olavo. Workflow continua `active: false`. Ações tomadas nesta sessão: (a) Aprendizado novo criado no PHI™ Aprendizados (Status `Em análise`, Transversal, Categoria `Workflow n8n, Arquitetura, Processo`, Origem `Bug/Incidente`): "Multi-fan-in para Code node em n8n dispara N execuções do jsCode (1× por upstream trigger) — usar Merge mode append antes"; (b) Brief Codex `a04` entregue em `docs/handoff/2026-06-13-telemetria-lote1-codex-a04-brief.md` (adicionar `[Telemetria] Merge Pre-Calcular` typeVersion 3 mode append entre as 7 leituras e Calcular Metricas; 17 nodes total; ps1 atualizada; metricCode/digestCode/IF Tem Novas Linhas/Merge Pos-Snapshot intocados); (c) ESTADO §2 reescrito (smoke revelou regressão), §3.7 atualizada (REGRESSÃO + brief `a04`), §5 atualizada (ciclo `a01→a03→smoke→a04`), §6 T6 reclassificada "Em mitigação — smoke revelou regressão arquitetural". Padrão inegociável NOVO: multi-fan-in para Code/Function node EXIGE Merge antes. Implicação: auditar workflows existentes em prod em busca de mesmo padrão (5 WFs Lote 1 Onb + L1 Priorização + WF-COM-Deduplicar). Próximo: Codex `a04` → pré-revisão Claude → Antigravity rodada 3 → novo smoke real (decisivo) → publish → fechar T6. |
| v0.1.14 | 2026-06-11 | **Auditoria do Notion: divergências reais identificadas e registradas.** Pedido do Olavo "verifique se documentação no Notion está atualizada". 5 buscas semânticas variadas no Catálogo (queries: PHI, artefato, tenant_id, Vivo, phi-agencia) retornaram **sempre os mesmos 3 artefatos** — confirma que Catálogo tem 3 entradas reais, não 39 como ESTADO declarava (§2, §3.4, §10). §2 reescrito (3 artefatos, backlog catalogação). §3.4 expandida com inventário do que falta catalogar (~30 entradas: 8 WFs Onboarding + PHI-Pipeline_v2 + Daily Entry + SOP + 8 DBs + 4 âncoras + 8 ADRs). §10 ganha nota sobre Catálogo parcial. §5 ganha 4 pendências novas: (a) catalogação retroativa, (b) numeração ADR-010/012 conflitante título × `Número ADR` auto-increment (ADR-010 BQ × Supabase tem `Número ADR=23` no DB; ADR-012 Git × Notion tem `Número ADR=22`; já existe outro ADR-010 no Notion criado 2026-05-11 — Daily Entry), (c) ADR-20 criado hoje 2026-06-11 17:44 (Developer token Google Ads) não consta no ESTADO, (d) Aprendizados #16/#17/#18 não localizáveis por busca semântica (precisam auditoria manual). Pontos POSITIVOS confirmados: ADR-010 (BQ×Supabase) Aceito + ADR-012 (Git×Notion) Aceito com conteúdo bate ESTADO; Aprendizado #19 retificado existe; 3 Aprendizados novos da Priorização criados hoje; 3 entradas atuais do Catálogo (WF-DOC-Telemetria a03, WF-PRIOR-L1, WF-COM-Deduplicar) batem com ESTADO; ADR-001 a ADR-005 + ADR-009 batem com numeração canônica. Nada foi catalogado nesta sessão — só registro de gap. |
| v0.1.13 | 2026-06-11 | **APROVADO Antigravity rodada 2 — smoke E2E autorizado.** Veredito global APROVADO + B2 (topologia IF/Merge 16 nodes, isolamento da gravação Notion sem interromper fluxo Telegram), B3 (sentinel garante ≥1 item, digest lê `metricas_do_dia` do 1º item mesmo com `linhas_novas === 0`) e B4 (acentos `Chave da métrica` + `Versão da consulta` ASCII-safe via escape, leitura linha 70 coerente) todos aprovados individualmente. Antigravity rodou a suíte ps1 no ambiente dele: 119/119 PASS — confirma a pré-revisão Claude. Zero regressões. Checklist de padrões inegociáveis integral (nome WF, active:false, timezone, prefixos, schedule 08:30, Set Contexto, segurança/redação, sem mojibake). Riscos remanescentes: G2 (Buscar Snapshots sem filtro de data — latent, Lote 2) e G3 (`cur.tempo_medio_aplicacao_dias` retorna 0 com texto explicativo pela ausência do campo `Data de aplicação` — Codex agiu certo reportando em vez de mockar). §3.7, §5 e §6 T6 atualizadas (T6 agora "Em mitigação final — só falta smoke E2E"). Catálogo Notion: Versão atualizada com veredito; Estado mantém "Em revisão" até smoke + publish. Próximo: smoke E2E manual pelo Olavo (9 passos, §7 do brief original, n8n prod) → `active=true` → fechar T6. |
| v0.1.12 | 2026-06-11 | **Pré-revisão Claude `a03` PASS + brief Antigravity rodada 2.** Codex confirmou entrega `a03` em `6a9c745` (Windows PowerShell verde do lado dele). Pré-revisão Claude reproduziu a suíte ps1 em Node (pwsh ausente neste ambiente): **119 checks, 119 PASS, 0 FAIL**. Cobertura: BOM, sandbox==workflow (SHA `6fcdf65e...`), 19 add() preservadas, sem secrets/mojibake/chat_id raw, 16 nodes com prefixo correto, schedule 08:30 America/Sao_Paulo, Set Contexto com EXEC-TELEMETRIA-, 7 leituras Notion com databaseIds corretos + returnAll, metricCode com sentinel/itemsParaCriar/return itemsParaCriar e sem `return toCreate.map`, IF type if + linhas_novas gt 0, Criar Snapshot com Chave da métrica/Versão da consulta/execution_id/tenant_id, Merge type merge mode append, digestCode com escapes HTML e sem `parse_mode=HTML`, Telegram HTML + chat_id redacted + text=digest_html, wiring fan-out 7 paralelos + fan-in Calcular + IF→Criar/Merge + linear até Set Status Final. Brief Antigravity rodada 2 entregue em `docs/handoff/2026-06-11-telemetria-lote1-antigravity-rodada2-brief.md` (addendum curto ao brief original, foca só no que mudou entre `a01` e `a03`). §3.7 sub-entrega Telemetria atualizada (a03 PASS, aguarda rodada 2). §5 pendência Telemetria atualizada. §6 T6 status "Em mitigação avançada". Próximo: Antigravity rodada 2 → smoke E2E → publish → fechar T6. |
| v0.1.11 | 2026-06-11 | **Integração do report sub-chat Comercial + descoberta paralela: Codex empurrou `a03`.** Comercial: WF-Deduplicar saiu de "Em produção (legado)" → **execução REAL desde 2026-06-05** (DRY_RUN=false após smoke ENT-20 aprovado por Olavo, cleanup Smoke Sintetico confirmado). Gatilho manual intencional. Stage HubSpot `70807682-...` hardcoded. §2 snapshot atualizado. §3.6 expandida com status real + bloco de débitos técnicos. §5 ganha 6 pendências novas (frequência indefinida + 4 débitos técnicos do WF + área sem owner). §6 T4 ganha nuance Comercial sem owner; severidade sobe Baixa→Média. Catálogo +1 (WF-COM-Deduplicar-Leads-HubSpot, Vivo, débitos detalhados na Versão) — sub-chat alertou corretamente que não estava catalogado. NÃO foram criados Aprendizados — débitos são TODOs do workflow legado, não lições transversais. Em paralelo, durante a integração do report Priorização: descoberto via push rejected que Codex já tinha empurrado `a03` (commit `6a9c745`, 2026-06-11 09:25 -03) — telemetria-minima a03 com B3 sentinel + B4 acento + B2 IF/Merge 16 nodes; tocou os 4 arquivos esperados (`generate_export.js`, `sandbox_export.json`, `workflow.json`, `telemetria_tests.ps1`); rebase limpo. Próximo passo Telemetria: pré-revisão Claude do `a03` antes de Antigravity rodada 2. |
