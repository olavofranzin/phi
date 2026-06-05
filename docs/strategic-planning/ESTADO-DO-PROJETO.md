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

## 2. Onde estamos AGORA (snapshot 2026-06-04)

Resumo de 1 parágrafo: Produto PHI está estável em produção interna
(últimas correções A.0/A.5/A.7 aprovadas 2026-05-09). Operação Interna:
**Onboarding** com Lote 1 em produção (5 workflows desde 2026-05-29) +
Lote 2 entregue 2026-06-03 (A2.3 Classificação + A2.10 Gate) pendente
re-smoke A2.3 Aprovado. **Execução de Demandas** com strawman v0.2
fechado, aguardando autorização pra v0.3 + Notion canônico. **Curador**
com Lote 0 concluído 2026-06-04 (2 DBs + âncora + 39 artefatos
catalogados). **Priorização** com L1 brief travado, pendente Codex.
**Comercial** vestigial. **Documentação e Ferramentas** acabou de ser
aberta (este doc). **Dashboard de produto** (Lovable) em scoping —
aguardando acesso aos protótipos.

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
| Lote 0 (Fundação — SOP, modelo, ADRs) | Em design (strawman v0.2 em git) | Sem 1-2 |
| Lote 1 (Engine mínimo — 1 tipo recorrente E2E) | Backlog | Sem 2-4 |
| Lote 2 (Padronizador / quality-gate) | Backlog | Sem 4-6 |
| Lote 3+ (Tickets ad-hoc + expansão) | Backlog | Sem 6-8 |

### 3.4. Curador (Documentação e Ferramentas)

| Lote | Status | Notas |
|---|---|---|
| Lote 0 (Catálogo) | Concluído (2026-06-04) | 39 artefatos catalogados |
| Lote 1 (Engine mínimo — 1 Mudança de Escopo simulada, aplicação manual) | Backlog | Sem 4-6 |
| Lote 2 (Aplicação via Codex) | Backlog | Sem 6-7 |
| Lote 3 (Aplicação via MCP Notion) | Backlog | Sem 7-8 |
| Lote 4 (Modo Retroativo + validação consistência) | Backlog | Sem 8+ |
| Lote 5+ (Drift detection automática) | Backlog (fase 2) | Fora da janela atual |

### 3.5. Priorização (Operação Interna)

| Lote | Status |
|---|---|
| Lote 0 (Framework + Inventário) | Concluído |
| L1 — Abertura de Projeto Técnico/Setup | Em execução (brief travado 2026-06-02, pendente Codex) |
| L2 — Passagem de Bastão entre Áreas | Backlog |
| L3 — Atendimento de Solicitações | Backlog |

### 3.6. Comercial (Operação Interna)

| Lote | Status |
|---|---|
| Único workflow (Deduplicar Leads HubSpot) | Em produção (legado) |
| Área formal | Não aberta — vestigial |

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
| Lote 1 (workflow WF-DOC-Telemetria-Diaria — Onboarding+Curador+Global) | **Brief entregue ao Codex (2026-06-04)** — `docs/handoff/2026-06-04-telemetria-lote1-codex-brief.md` |
| Lote 2 (expansão Execução quando entrar em prod) | Backlog |
| Lote 3 (Flash summarize tendências) | Backlog |
| Lote 4 (sink BigQuery — após ADR-010) | Backlog |

---

## 4. Decisões travadas (links + datas)

### 4.1. ADRs vigentes (no Notion: PHI™ — Decisões)

| # | Título | Status | Link |
|---|---|---|---|
| 001 | Supabase como Database Primário | **Em revisão** (colide com "BQ base de verdade" — aguarda ADR-010) | [Notion](https://www.notion.so/357b65e5c72b81779c02f29d091fd924) |
| 002 | Free Tier Intencional Fase 0 | Aceito | [Notion](https://www.notion.so/358b65e5c72b8172ac90daf2a6846976) |
| 003 | Autoridade única do PHI Score | Aceito | [Notion](https://www.notion.so/359b65e5c72b81068959ce8615009166) |
| 004 v2 | Fórmula PHI Score (FIS, MAS, TSS, MIV) | Aceito | [Notion](https://www.notion.so/359b65e5c72b819c981cfc1eaf79555f) |
| 005 | Heterogeneidade Google × Meta | Aceito | [Notion](https://www.notion.so/35ab65e5c72b81d38157c81a9636d51e) |
| 009 | Semântica execution_id (Opção 2) | Aceito (2026-05-09) | [Notion](https://www.notion.so/35bb65e5c72b81f3a4e0e05ad9a82f04) |

### 4.2. ADRs em planejamento ou rascunho

- ADR-006 (Log de Otimizações), ADR-007 (Onboarding), ADR-008
  (CPA-only vs polimórfico): backlog.
- **ADR-010 — Divisão BQ ↔ Supabase** (BQ analytics, Supabase
  transacional): rascunho pendente. Resolve ambiguidade do ADR-001.
- **ADR-011 — Curador + Mudanças de Escopo + Catálogo:** rascunho
  pendente. Curador formaliza.
- **ADR-012 — Git canônico para design, Notion canônico para estado
  operacional, sync manual via PR:** rascunho pendente.

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
| 2026-06-04 | ADR-010 (BQ × Supabase) | Rascunhar | Destravar ADR-001 (`Em revisão`) |
| 2026-06-03 | ADR-011 (Curador) | Rascunhar | Formaliza Curador |
| 2026-06-04 | ADR-012 (Git × Notion canônico) | Rascunhar | Endurece governança de doc. |
| 2026-06-04 | Telemetria Mínima Lote 1 | ✅ Brief Codex entregue (`docs/handoff/2026-06-04-telemetria-lote1-codex-brief.md`); DB Snapshots criado no Notion | Codex executa, depois smoke E2E |
| 2026-06-04 | v0.3 Execução + abertura SOP/DB Notion canônico | Aguarda OK do Olavo | Lote 1 Execução |
| 2026-06-04 | Mudança de Escopo PLANEJADA: reposicionar Curador → Documentação e Ferramentas | **ME criada como dogfood ([ME-20260604-reposicionar-curador](https://www.notion.so/375b65e5c72b8121834fd65d5395b481))** — aprovação pendente | — |
| 2026-06-04 | Lista completa de troncos do Miro (§1.2) | ✅ Recebida 2026-06-04 — 10 troncos mapeados. 2 áreas operacionais + 8 transversais. Releitura registrada (transversais NÃO viram âncoras separadas). | Resolvido |

---

## 6. Tensões / riscos centralizados

Compilação das tensões espalhadas pelos strawmans + novas.

| # | Tensão | Origem | Severidade | Próxima ação |
|---|---|---|---|---|
| T1 | Curador × Codex × Antigravity: quem revisa PRs do Curador? | Curador §15 | Média | Decidir junto do ADR-011 |
| T2 | Catálogo × ADRs vigentes: duplicação? | Curador §15 | Baixa | Convenção v0.1: Catálogo lista ADR como referência (id + url), conteúdo canônico segue na base de ADRs |
| T3 | Mudança de Escopo grande × ADR novo: quando virar ADR junto do diff? | Curador §15 | Média | Decidir junto do ADR-011 |
| T4 | "Prospecção" e "Reunião resultados" semanticamente Comerciais | Execução §4 | Baixa | Re-examinar quando Comercial existir formalmente |
| T5 | Dashboard × Notion: duas superfícies de visualização | Conversa Dashboard | Baixa | Cada um pro seu uso (produto vs operação) |
| T6 | **Métricas operacionais não rastreadas** — Onboarding em prod há 9 dias, zero visibilidade | Conversa atual | **Alta → Em mitigação** | ✅ Telemetria Mínima Lote 0 concluído 2026-06-04 (DB Snapshots + brief Codex). Aguarda Codex executar Lote 1 + smoke E2E pra fechar. |
| T7 | ADR-001 (Supabase) × "BQ base de verdade" (docs estratégicos) | Conversa atual | Média | ADR-010 resolve |
| T8 | Sync git ↔ Notion: divergência potencial | Conversa atual | Média | ADR-012 endurece |
| T9 | Proliferação de agentes sem mapa consolidado (6 hoje, ~10 em 3 meses) | Conversa atual | Média | Mapa de agentes (§9) deste doc |
| T10 | Curador posicionado em "Procedimentos da Operação", mas faz mais sentido em "Documentação e Ferramentas" (Tronco 4) | Conversa atual | Baixa | **ME criada como dogfood 2026-06-04** ([ME-20260604](https://www.notion.so/375b65e5c72b8121834fd65d5395b481)) — `Estado=Diff proposto`, `Aprovação=Pendente`. ESTADO-DO-PROJETO já reflete reposicionamento preventivamente (única antecipação). |

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
   estrutural — quem depende de quem.
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
