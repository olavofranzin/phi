# [BRUTO v0.3] Execução das Demandas — delta v0.2→v0.3

> **STATUS:** v0.3 travada 2026-06-14. 4 decisões confirmadas pelo Olavo via
> rodada curta de Q&A. Próximo: ADRs aceitos no Notion → DB `PHI - Demandas` +
> DB `PHI - SOPs` + âncora `[HANDOFF] Execução de Demandas` → SOP v1.0 enxuto →
> brief Codex pro Lote 1 (Pacing/verba E2E).
>
> **PRÉ-LEITURA OBRIGATÓRIA:** `docs/strategic-planning/execucao-demandas/BRUTO-v0.1-design.md`
> (nome do arquivo é `v0.1` mas conteúdo é canônico v0.2 — discrepância de
> nomenclatura, não-bloqueante; este v0.3 é delta sobre aquele).
>
> **FONTE DE VERDADE:** Notion (estado), BigQuery (analítico). Git canônico
> para design (ADR-012).

---

## 1. Decisões travadas 2026-06-14

| # | Item | Decisão | Origem |
|---|---|---|---|
| 1 | Ciclo de vida (§5 do v0.2) | Aceito como está: `Aberta → Priorizada → Em execução → Em revisão → Entregue → Arquivada` + `Bloqueada` lateral (pausa SLA); `FALHA` no quality-gate volta a `Em execução` | confirmação direta |
| 2 | Tipo recorrente do Lote 1 | **Pacing/verba diário** (alto valor, depende de `phi_subworkflow_ads_operational` que já roda) | escolha (b) |
| 3 | Mecanismo de versionamento de SOP | **DB `PHI - SOPs` no Notion** — workflow lê SOP `Estado=Vigente` da área antes de processar, grava `versao_sop_aplicada` na Demanda | escolha (b) |
| 4 | Classe SLA do Pacing/verba (Lote 1) | **Crítica** (mesmo dia) — não Recorrente diária; verba estourando = anomalia operacional grave | escolha (b) |

Aceitos sem revisitação (consequência direta de princípios PHI Fase 1→3 e do padrão Onboarding):
- §6 Tiering de Agentes (vira ADR — ver §6 abaixo)
- §8 DoD por tipo + quality-gate Flash
- §10 Eventos canônicos (vira ADR — ver §6 abaixo)

---

## 2. Δ §7 SLA — Pacing/verba (Lote 1) ascende à classe Crítica

Reescreve apenas a linha do Pacing na tabela §7 do v0.2:

| Classe | Exemplos | Prazo | Atrasado = |
|---|---|---|---|
| **Crítica** | Anomalia PHI Score, verba estourando, **Pacing/verba (Lote 1)** | Mesmo dia | > janela do dia |
| Recorrente diária | Daily entry, leads | Dentro do dia | vira o dia |
| Recorrente semanal | Relatório por cliente | Dentro da semana | vira a semana |
| Ad-hoc padrão | Ajuste verba pontual, criativo | 48h úteis | > 48h |

Justificativa: a v0.2 tinha "Checagem de pacing/verba por campanha" classificada como Recorrente diária. Após confirmação Olavo, ela ascende à Crítica — alerta de pacing que dispara já é evento crítico, e a demanda gerada hereda essa criticidade. Pacing rotineiro (sem alerta) permanece Recorrente diária.

---

## 3. Δ §9 Modelo de dados — campo novo `versao_sop_aplicada`

Adicionado ao schema do DB `PHI - Demandas`:

| Campo | Tipo | Nota |
|---|---|---|
| `versao_sop_aplicada` | relation → DB `PHI - SOPs` | rastreia qual versão do SOP estava `Vigente` quando a demanda rodou. Habilita Curador (Lote 4+) detectar drift retroativo: comparar `versao_sop_aplicada` da demanda × `Vigente` atual. Se SOP mudou, demandas antigas ficam marcadas como "executadas sob regra anterior". |

Demais campos do §9 inalterados.

---

## 4. Novo DB canônico — `PHI - SOPs`

Mecanismo central pro versionamento de SOPs (decisão 3). Schema:

| Campo | Tipo | Nota |
|---|---|---|
| `titulo` | title | ex: "SOP Execução de Demandas v1.0" |
| `area` | select | Onboarding · Execução · Priorização · Comercial · Curador · Documentação e Ferramentas |
| `versao` | text | semver simples: `v1.0`, `v1.1`, `v2.0` |
| `estado` | select | `Rascunho` · `Vigente` · `Substituida` |
| `data_vigencia` | date | quando virou `Vigente` |
| `substitui` | relation → self | versão anterior (linhagem) |
| `link_documento` | url | git path canônico ou Notion page |
| `tenant_id` | text | default `phi-agencia` |
| `observacoes` | text | mudanças vs versão anterior |

Regra operacional:
- Cada workflow de área operacional, antes de processar uma demanda, **consulta** o SOP `Estado=Vigente` da `area` correspondente.
- **Grava** o `link_documento` (ou ID da página) no campo `versao_sop_aplicada` da Demanda criada.
- Mudança de SOP = nova entrada no DB (Rascunho → Vigente; a anterior vira Substituida via `substitui`).

Cobre TODAS as áreas operacionais, não só Execução. Onboarding, Priorização e Comercial passam a poder versionar SOPs no mesmo DB — ganho transversal.

---

## 5. Δ §13 Plano de Lotes — Lote 1 = Pacing/verba E2E

Detalhamento Lote 1 (substitui descrição genérica do v0.2):

**Objetivo:** demonstrar o engine mínimo E2E rodando 1 tipo recorrente Crítico — Pacing/verba — desde intake até digest.

**Fluxo:**
```
Trigger (alerta pacing)  →  Intake (cria Demanda 'Pacing crítico — cliente X')
   ↓
Orquestrador (Pro)       →  Calcula prioridade (Crítica = topo da fila)
   ↓
Notion: Demanda 'Em execução'  →  Olavo recebe alerta Telegram imediato
   ↓
Olavo resolve (ajusta verba no Google Ads ou marca 'sem ação necessária')
   ↓
Quality-gate (Flash)     →  PASS/FAIL contra DoD do tipo Pacing
   ↓
Notion: Demanda 'Entregue'  →  Evento demanda.entregue → log
   ↓
Digest diário (futuro: A2.7 cresce, ou WF-EXEC-Digest novo)
```

**Critério de fechamento Lote 1:** 1 alerta de pacing real (ou simulado) percorre o fluxo completo sem intervenção manual; demanda nasce, é executada por Olavo, passa pelo quality-gate, fecha como Entregue, evento canônico emitido.

**Fora do Lote 1 (vai pra Lote 2+):**
- Padronizador como agente autônomo (Lote 1 só roda o quality-gate básico)
- Outros tipos de demanda (Daily Entry, Higiene de leads, Recorrentes semanais)
- Sink BQ (Lote 4)
- Espelho Miro (Lote 3)

---

## 6. ADRs derivados (rascunhos em git, depois Notion)

Dois ADRs derivam direto deste v0.3:

1. **ADR-rascunho — Tiering de Agentes IA: Denso (Pro) vs Barato (Flash)**
   `docs/strategic-planning/execucao-demandas/ADR-rascunho-tiering-agentes-ia.md`
   Cristaliza o critério §6. Aplicável a todos os agentes do projeto (Onboarding já segue de fato; falta formalizar).

2. **ADR-rascunho — Eventos canônicos da Operação Interna + Sink BigQuery futuro**
   `docs/strategic-planning/execucao-demandas/ADR-rascunho-eventos-canonicos-sink-bq.md`
   Cristaliza §10. Modelo de evento extensível pra todas as áreas operacionais. Complementa ADR-010 (BQ × Supabase).

Ambos têm Status `Rascunho` em git. Quando Olavo aprovar → viram páginas `Aceito` no DB `PHI™ — Decisões (ADR)`.

---

## 7. Próximos passos pós-v0.3 (sequência travada)

| # | Passo | Onde | Resp |
|---|---|---|---|
| 1 | Olavo revisa este v0.3 + 2 ADRs em git | git | Olavo |
| 2 | ADRs aprovados → criados no DB `PHI™ Decisões (ADR)` como `Aceito` | Notion | Claude |
| 3 | Criar DB `PHI - SOPs` no Notion (§4) | Notion | Claude |
| 4 | Criar DB `PHI - Demandas` no Notion (§9 v0.2 + `versao_sop_aplicada`) | Notion | Claude |
| 5 | Criar âncora `[HANDOFF] Execução de Demandas` no Notion | Notion | Claude |
| 6 | Escrever SOP v1.0 Execução de Demandas (página Notion + ponteiro git) → registrar em `PHI - SOPs` como `Vigente` | Notion | Claude |
| 7 | Brief Codex pro Lote 1 (Pacing/verba E2E) | git | Claude |
| 8 | Codex implementa Lote 1 → revisão Claude → Antigravity → smoke → publish | n8n | ciclo padrão |

Estimativa de janela: passos 2-7 cabem em 1 sessão Claude (~1-2h). Passo 8 (Codex) é janela separada.

---

## 8. Padrões inegociáveis herdados

Tudo do v0.2 §3 (princípios PHI Fase 1→3) + padrões do Lote 1 Onboarding continuam valendo. Adicionados/refinados nesta sessão:

- **Multi-fan-in PARALELO pra Code node EXIGE Merge consolidador** (Aprendizado aplicado pós-Telemetria a05). Merge consolidador DEVE declarar `numberInputs` exato. Brief Codex do Lote 1 deve enfatizar.
- **Multi-fan-in CONVERGENTE (IF/Switch mutually-exclusive)** não dispara o bug — Merge opcional como cleanup.
- **`versao_sop_aplicada` obrigatório** em toda demanda criada — sem rastreio, Curador não consegue detectar drift retroativo.
