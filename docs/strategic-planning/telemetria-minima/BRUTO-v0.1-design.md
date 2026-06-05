# [BRUTO v0.2] Telemetria Mínima da Operação Interna

> **STATUS:** Strawman v0.2. v0.1 red-lined por Olavo em 2026-06-04;
> #1 resolvido (15 originais + B = 16 métricas), #3 chave-valor, #4
> preparar campos. #2/5/6/7 marcados defaults. DB Snapshots já criado
> no Notion canônico.
>
> **FONTE DE VERDADE:** Notion (estado), BigQuery (sink futuro).
>
> **Origem desta frente:** gap T6 do `ESTADO-DO-PROJETO.md` v0.1
> (severidade Alta). Onboarding em produção desde 2026-05-29 sem
> visibilidade do que está rodando. Bate com Tronco 6 do Miro
> (Indicadores de Sucesso).

---

## 0. Como cheguei aqui

Em 2026-06-04, Olavo autorizou `OK A` para abrir T6 (Telemetria Mínima)
como Lote paralelo. Tronco 6 do Miro (Indicadores de Sucesso) é
dimensão transversal — não vira área formal. **Telemetria Mínima vive
como artefato cross-cutting dentro de Documentação e Ferramentas
(Tronco 4)**, servindo todas as áreas operacionais.

---

## 1. Posicionamento

**Telemetria Mínima = workflow + DB cross-cutting da Operação Interna.**

Escopo coberto (v0.1):
- ✅ Métricas operacionais do Onboarding (em produção há 9 dias)
- ✅ Métricas do Curador (Mudanças de Escopo, Catálogo)
- ✅ Métricas globais (ADRs, Aprendizados, agentes)

Escopo NÃO coberto (v0.1):
- ❌ Métricas do produto PHI (PHI Score já tem instrumentação própria)
- ❌ Métricas da Execução de Demandas (área ainda não em produção)
- ❌ Métricas da Priorização/Comercial (idem)

Não é área formal — é entrega cross-cutting de Documentação e Ferramentas.

---

## 2. Princípios herdados (PHI Fase 1→3 + Lote 1 Onboarding)

Aplicados sem exceção:

1. **`tenant_id` + `client_id` lógicos** em todo snapshot.
2. **Notion = guarda; cálculo no n8n.**
3. **BigQuery sink futuro.** Schema dos snapshots compatível com sink BQ.
4. **Versionamento explícito** da regra de cálculo (`versao_consulta` em cada snapshot).
5. **Padrões inegociáveis do Lote 1 Onboarding** valem todos.
6. **Reuso do padrão A2.7** (Schedule + Telegram digest) — sem reinventar.

---

## 3. Estado 0 (onde estamos sem isso)

- **Onboarding em produção desde 2026-05-29 (9 dias):** 5 workflows
  Lote 1 + 3 workflows Lote 2 (A2.3, A2.7, A2.10).
- **Zero visibilidade** do que rodou: quantos briefings, quantos
  Aprovados vs Rejeitados, quantas falhas Telegram, quantas etapas
  vencidas.
- **A2.7 (Digest Diário Onboarding)** já existe mas é narrativo
  (Flash summarize), não estruturado pra auditoria nem persistente
  em DB.
- **Curador acabou de nascer** (Lote 0 concluído 2026-06-04): 1 ME
  aberta (dogfood ME-20260604). Sem instrumentação.
- **Catálogo populado** (39 artefatos + 2 novos = 41) — pode virar
  fonte de métricas globais.

---

## 4. O que medir — escopo v0.1 `[PRESUMIDO — red-line]`

### 4.1. Onboarding
| # | Métrica | Janelas | Fonte |
|---|---|---|---|
| O1 | Briefings entrados (intake A2.1) | D-1, D-7, D-30 | DB Clientes (data_criacao) |
| O2 | Classificação A2.3: # Aprovado vs # Rejeitado | D-7, D-30 | DB Clientes (campo Classificação) |
| O3 | # Etapas concluídas vs # abertas | Acumulado | DB Etapas (Status) |
| O4 | # Etapas em atraso (vencimento < hoje, Status ≠ Concluído) | Snapshot | DB Etapas |
| O5 | Falhas Telegram (`Observações contains "Status telegram: falhou"`) | D-7 | DB Etapas |
| O6 | Falhas Evolution | D-7 | DB Etapas |
| O7 | Gate A2.10 PASS vs FAIL | D-7, D-30 | DB Clientes (campo Gate) |
| **O8** | **Tempo médio A2.1 cliente criado → A2.10 gate concluído (onboarding ponta a ponta)** | **D-30** | **DB Clientes (data_criacao + data_gate)** |

### 4.2. Curador
| # | Métrica | Janelas | Fonte |
|---|---|---|---|
| C1 | # MEs abertas (Estado ≠ Aplicada/Rejeitada/Arquivada) | Snapshot | DB Mudanças de Escopo |
| C2 | # MEs aprovadas / rejeitadas | D-30, Acumulado | DB Mudanças de Escopo |
| C3 | Tempo médio (data_criacao → data_aplicacao) | D-30 | DB Mudanças de Escopo |
| C4 | # Rodadas Q&A médias por ME | D-30 | DB Mudanças de Escopo |

### 4.3. Global
| # | Métrica | Janelas | Fonte |
|---|---|---|---|
| G1 | # artefatos no Catálogo por Estado (Vivo/Em revisão/Deprecado) | Snapshot | DB Catálogo |
| G2 | # ADRs por status (Aceito/Em planejamento/Em revisão) | Snapshot | DB Decisões |
| G3 | # Aprendizados por status (Aplicado/Em análise/Novo) | Snapshot | DB Aprendizados |
| G4 | # workflows n8n ativos por área | Snapshot | DB Catálogo (Tipo=Workflow n8n) |

**Total v0.2: 16 métricas** (15 originais + O8). Cobre Tronco 6
(Indicadores de Sucesso) sem inflar.

**DB Snapshots já preparado pra Execução, Priorização, Comercial,
Documentação e Ferramentas** (opções select adicionadas). Workflow
Lote 1 popula só Onboarding+Curador+Global. Codex adiciona as outras
quando entrarem em produção (Lote 2+) sem precisar mudar schema do DB.

---

## 5. Modelo de dados — DB `PHI - Snapshots de Telemetria` ✅

**Decisão travada (red-line #3):** modelo chave-valor (1 linha por
métrica por dia).

**DB criado em 2026-06-04:**
- URL: https://www.notion.so/0e1cffdef0654580828d5f1478c50077
- data_source_id: `32404398-6751-4bbd-be28-4ad591e22bf7`
- 11 campos
- Select `Área` preparado pra todas as 7 áreas (red-line #4)

| Campo | Tipo | Nota |
|---|---|---|
| `Título` | title | auto-gerado: `YYYY-MM-DD — <Área> — <chave_metrica>` |
| `tenant_id` | text | produto-ready |
| `Data` | date | data do snapshot (não do dado) |
| `Área` | select | Onboarding / Curador / Global / Execução / Priorização / Comercial / Documentação e Ferramentas |
| `Chave da métrica` | text | identificador estável (ex: `onb.briefings_intake.d7`) |
| `Janela` | select | `D-1` \| `D-7` \| `D-30` \| `Acumulado` \| `Snapshot` |
| `Valor número` | number | valor numérico (maioria das métricas) |
| `Valor texto` | text | valor textual quando aplicável (ex: agrupamentos) |
| `Fonte` | text | DB de origem + filtro aplicado |
| `Versão da consulta` | text | `v1.0` inicial; bump quando regra muda |
| `execution_id` | text | auditoria — qual execução n8n gerou |

### Convenção de chaves de métrica (auto-inferível)
- Prefixo área: `onb.`, `cur.`, `glb.`
- Snake_case: `briefings_intake`, `classificacao_aprovado`
- Sufixo janela (opcional, redundante com campo `Janela`): `_d7`, `_acc`

Exemplos: `onb.briefings_intake.d7`, `cur.mes_abertas.snap`,
`glb.artefatos_vivos.snap`.

---

## 6. Design do workflow

**Nome proposto:** `WF-DOC-Telemetria-Diaria` *(D5 nomenclatura)*

**Trigger:** Schedule diário às **08:30 BR** (30min antes do A2.7 às
09:00 — pra digest A2.7 poder citar métricas se quiser).

**Nodes (estimativa):**
1. **Schedule Trigger** — diário 08:30 BR
2. **Notion: query DBs** — Clientes / Etapas / Mudanças / Catálogo /
   Decisões / Aprendizados (filtros por data)
3. **Code: calcula 15 métricas** — jsCode ASCII-safe, retorna 15 objetos
4. **Notion: cria 15 linhas** no DB Snapshots (batch via create-pages)
5. **Code: monta texto digest** — string única HTML escaped
6. **Telegram: posta digest** — chat_id do Olavo (mesmo do A2.7)
7. **Code: emit log** — sink BQ futuro (NoOp por enquanto, prepara campo)

**Sem agente IA.** Cálculo é determinístico, não precisa Gemini.

**Hardening:**
- `X-Telemetria-Secret` se houver trigger HTTP (não há aqui; Schedule)
- Marca de idempotência por data (não criar 2 snapshots do mesmo dia)
- `Status telegram: ok|falhou` em Observações
- Re-export sanitizada

---

## 7. Conteúdo do Telegram digest `[PRESUMIDO]`

Formato — string única, HTML, ~12-15 linhas:

```
<b>PHI Telemetria — 2026-06-04 08:30</b>

<b>Onboarding</b> (prod há 9d)
- Briefings: D-1: 3 | D-7: 12 | D-30: 47
- A2.3 Class.: 38 Aprov | 9 Rej (D-30)
- Etapas: 412 concl | 89 abertas | 14 atrasadas
- Falhas Telegram: 0 (D-7)
- Falhas Evolution: 2 (D-7) ⚠️
- A2.10 Gate: 11 PASS | 1 FAIL (D-7)

<b>Curador</b>
- MEs: 1 aberta | 0 aplicadas

<b>Global</b>
- Catálogo: 38 Vivos | 3 Em revisão | 0 Deprecados
- ADRs: 6 Aceitos | 5 Em planej | 1 Em revisão
- Aprendizados: 14 Aplicados | 0 Em análise | 2 Novos

Snapshot: <a href="https://notion.so/.../snapshots">DB</a>
```

**Sinalização visual:** ⚠️ aparece quando alguma métrica de falha > 0.

---

## 8. Plano de lotes

| Lote | Entrega | Janela |
|---|---|---|
| **0 — Design + DB** | Este strawman v0.1 + (após red-line) DB Snapshots no Notion canônico | Imediato |
| **1 — Workflow básico (Onboarding+Curador+Global)** | Codex implementa as 15 métricas, smoke E2E | Sem 1 |
| **2 — Expansão Execução** | Quando Execução entrar em prod, adicionar métricas da Execução | Sem 4+ |
| **3 — Insights via Flash** | Gemini Flash summarize tendências semanais ("# Aprovados subiu 30% vs semana anterior"). Vira parte do digest | Sem 6+ |
| **4 — Sink BQ** | Workflow paralelo que joga snapshots no BQ via Supabase ou direto | Após ADR-010 |

---

## 9. Status do red-line v0.1 → v0.2 (resolvido 2026-06-04)

| # | Item | Status |
|---|---|---|
| 1 | Métricas (§4) | ✅ 15 originais + B (O8 tempo total onboarding) = 16 métricas |
| 2 | Horário 08:30 BR (§6) | ⚠️ Default assumido |
| 3 | Chave-valor (§5) | ✅ Confirmado |
| 4 | Preparar campos para outras áreas (§1, §5) | ✅ DB criado com select Área incluindo todas as 7 áreas |
| 5 | Chat Telegram = A2.7 (`930549271`) | ⚠️ Default assumido |
| 6 | Flash summarize no Lote 3 (§8) | ⚠️ Default assumido |
| 7 | Nome `WF-DOC-Telemetria-Diaria` (§6) | ⚠️ Default assumido |

**Defaults (⚠️):** podem ser corrigidos sem reescrita (são parâmetros
de configuração ou nomenclatura, não estrutura).

---

## 10. Status das ações canônicas (2026-06-04)

| # | Ação | Status |
|---|---|---|
| 10.1 | DB `PHI - Snapshots de Telemetria` no Notion | ✅ Criado |
| 10.2 | Catálogo atualizado (2 artefatos novos: DB + strawman v0.2) | ✅ Concluído |
| 10.3 | Brief Codex pro Lote 1 do workflow | ✅ Criado em `docs/handoff/2026-06-04-telemetria-lote1-codex-brief.md` |
| 10.4 | ESTADO-DO-PROJETO.md atualizado (§3.7, §5, §13) | ✅ Concluído |
| 10.5 | Codex executa Lote 1 (implementação do workflow) | ⏸ Aguardando Codex |
| 10.6 | Smoke test do workflow Lote 1 | ⏸ Após 10.5 |
| 10.7 | Cleanup + atualização do Registro Notion + Aprendizado se houver | ⏸ Após 10.6 |

---

## 11. Tensões registradas pra revisitar

- **T11 — Telemetria × A2.7:** A2.7 já faz digest do Onboarding.
  Sobreposição. Proposta v0.1: A2.7 vira digest narrativo (Flash,
  qualitativo); Telemetria vira digest quantitativo (Schedule, números).
  Coexistem. Mas vale revisitar quando ambos estiverem rodando — talvez
  A2.7 deveria CONSUMIR snapshots da Telemetria em vez de calcular do
  zero. `[ABERTO]`
- **T12 — Modelo chave-valor × query simplicidade:** Notion não tem
  GROUP BY nativo. Pra visualizar "evolução da métrica X ao longo do
  tempo" precisa de view filtrada + manual agregação. Quando virar
  dor, sink BQ resolve. `[ACEITÁVEL v0.1]`
- **T13 — Aprendizados sobre o próprio chassi:** as métricas globais
  (G2 ADRs, G3 Aprendizados) viram input pra o próprio Curador detectar
  drift. Loop interessante: Telemetria alimenta Curador, Curador
  governa Telemetria via Mudanças de Escopo. `[FEATURE futuro]`
