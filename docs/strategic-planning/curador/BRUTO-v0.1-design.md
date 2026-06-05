# [BRUTO v0.2] Curador — Meta-agente do pilar Procedimentos da Operação

> **STATUS:** Strawman v0.2. v0.1 red-lined por Olavo em 2026-06-03;
> §8 (formato A+B híbrido) e §13 (status) atualizados.
> Pronto pra Lote 0 após OK do Olavo nas ações canônicas em §14.
> Nada aqui tocou Notion canônico nem código (Codex). Doc é artefato de
> revisão. Cada premissa de domínio marcada `[PRESUMIDO]` — risque,
> corrija ou confirme.
>
> **FONTE DE VERDADE:** Notion (estado), BigQuery (analytics futuro).
> Este `.md` é espelho versionado de design, não fonte canônica.
>
> **Origem desta frente:** red-line do Olavo no BRUTO v0.2 da Execução de
> Demandas (`../execucao-demandas/BRUTO-v0.1-design.md` §16).

---

## 0. Decisões travadas antes deste strawman

Conversa Olavo ↔ Claude em 2026-06-03:

| Dim | Decisão |
|---|---|
| D1 — Aplica vs Propõe | **Propõe.** Nunca aplica direto. |
| D2 — Disparo | **Trigger explícito.** Olavo abre "Mudança de Escopo" no Notion. |
| D3 — Timing | **Ambos modos.** ANTES (hipotético) + DEPOIS (retroativo). |
| D4 — Mora | **Documentação e Ferramentas** (Tronco 4 Miro). *(Reposicionado de "Procedimentos da Operação" via ME-20260604 aplicada 2026-06-04.)* |
| Nome | **Curador.** |
| Tier | Gemini Pro. |
| Janela | 1-2 meses (entrada de Sites/Agentes IA). |

---

## 1. Posicionamento

**Curador = meta-agente da área Documentação e Ferramentas (Tronco 4 do
Miro), operando sobre artefatos das demais áreas operacionais.**

*Reposicionado de "Procedimentos da Operação" para "Documentação e
Ferramentas" via ME-20260604 aprovada e aplicada 2026-06-04.*

**Função primária:** governança de documentação + padronização (SOPs,
DBs, prompts, ADRs, SLAs, templates DoD, páginas âncora) — não
procedimento operacional em si.

Escopo coberto (artefatos a vigiar):
- ✅ Onboarding (SOPs, DBs, prompts, ADRs, SLAs)
- ✅ Execução de Demandas (idem)
- ✅ Priorização (idem)
- ✅ Área Comercial futura (idem)
- ✅ Documentação e Ferramentas (meta-artefatos da própria área)

Escopo NÃO coberto:
- ❌ PHI Score / Decision Engine / lógica de cálculo do produto
- ❌ Dashboard de produto (Lovable, BQ, Supabase)
- ❌ Stack de infraestrutura (credentials, deploy do n8n, etc.)

Não é 3º agente da Execução. É **peer** do Orquestrador e do Padronizador,
mas em escopo superior — orquestra os procedimentos que os outros agentes
seguem, não as demandas em si.

---

## 2. Princípios herdados (PHI Fase 1→3 + Lote 1 Onboarding)

1. **`tenant_id` + `client_id` lógicos** em toda Mudança de Escopo e todo evento.
2. **Notion = interface humana, NUNCA cálculo.** Análise de impacto roda no
   n8n/Gemini; Notion guarda registro.
3. **BigQuery sink futuro.** Schema de evento (§10) nasce compatível.
4. **Versionamento explícito** de tudo que o Curador toca (cada artefato
   modificado registra `versao_anterior` → `versao_nova`).
5. **Modular:** detecção / análise / proposição / aplicação separados.
6. **Padrões inegociáveis do Lote 1 Onboarding:**
   `X-Onb-Secret` no webhook, jsCode ASCII-safe, idempotência em side
   effect, Telegram string única HTML, guardrails na suíte, re-export
   sanitizado, registro Notion por lote.

---

## 3. Capacidades

1. **Detectar** mudança via trigger explícito (Mudança de Escopo aberta).
2. **Consultar** o Catálogo de Artefatos Operacionais (§7) pra mapear
   artefatos vivos por área/serviço/escopo.
3. **Analisar** impacto multi-artefato (qual SOP, DB, prompt, ADR, SLA
   é afetado e como).
4. **Questionar** Olavo via Telegram quando há ambiguidade — loop de Q&A.
5. **Propor** diff legível (subpágina da Mudança de Escopo).
6. (após aprovação humana) **Orquestrar** aplicação via Codex (PR no repo)
   ou MCP Notion (DBs/páginas) — multi-canal.
7. **Validar** consistência pós-aplicação (smoke leve) e fechar Mudança.

---

## 4. Modelo de operação (3 dimensões travadas, combinadas)

- **Modo PROPÕE** (D1): output é sempre proposta versionada. Aplicação
  exige aprovação humana. Sem exceção.
- **Disparo EXPLÍCITO** (D2): Olavo abre registro "Mudança de Escopo".
  Não há detecção automática nesta fase (drift detection = fase 2).
- **Timing AMBOS** (D3): a Mudança de Escopo tem campo `modo` (ANTES /
  DEPOIS). O Curador trata diferente:
  - ANTES → propõe integração + roadmap de quando aplicar
  - DEPOIS → propõe reorganização + valida consistência retroativa

---

## 5. Loop end-to-end (passo a passo)

```
[Olavo] cria Mudança de Escopo no Notion
    │  campos: titulo, modo (ANTES/DEPOIS), tipo, descrição,
    │          justificativa, áreas afetadas (chute), tenant_id
    ▼
[Webhook n8n] dispara Curador
    │  hardening X-Curador-Secret (padrão Lote 1)
    ▼
[Curador — Gemini Pro]
  1. Consulta Catálogo de Artefatos Operacionais (snapshot atual)
  2. Classifica impacto:
       - áreas afetadas (Onboarding/Execução/Priorização/Comercial)
       - artefatos: SOPs, DBs, prompts, ADRs, SLAs
       - conflitos / ambiguidades
  3. Se há ambiguidade → emite pergunta via Telegram
       │
       ▼
[Olavo responde Telegram] → atualiza Mudança de Escopo
       (loop volta ao Curador até clareza — máximo N rodadas [PRESUMIDO: N=3])
  4. Gera DIFF PROPOSTO em subpágina da Mudança de Escopo
  5. Emite evento `mudanca_escopo.diff_proposto`
  6. Notifica Olavo via Telegram com link
    ▼
[Olavo revisa diff] → aprova / edita / rejeita
    │
    ├─ Rejeitado → estado Arquivado, evento emitido, fim
    │
    └─ Aprovado:
         ▼
       [Curador]
         7. Por artefato afetado, escolhe canal:
              - arquivo do repo → Codex (PR)
              - DB Notion / página Notion → MCP Notion direto
         8. Aplica em ordem (dependências primeiro)
         9. Smoke leve pós-aplicação (existe? schema OK? link válido?)
        10. Atualiza Catálogo (versões novas, artefatos novos)
        11. Fecha Mudança de Escopo
        12. Evento `mudanca_escopo.aplicada` (ou .falhou)
```

---

## 6. Entidade "Mudança de Escopo" — modelo de dados `[PRESUMIDO]`

**DB Notion novo:** `PHI - Mudanças de Escopo`

| Campo | Tipo | Nota |
|---|---|---|
| `titulo` | title | ex: "Adicionar serviço Sites" |
| `tenant_id` | text | produto-ready |
| `modo` | select | `ANTES` (planejamento) \| `DEPOIS` (retroativo) |
| `tipo_mudanca` | select | `Novo serviço` \| `Nova regra` \| `Nova fronteira de área` \| `Nova ferramenta` \| `Outro` |
| `estado` | select | `Aberta` \| `Em análise` \| `Q&A com humano` \| `Diff proposto` \| `Aprovada` \| `Aplicando` \| `Aplicada` \| `Rejeitada` \| `Arquivada` |
| `areas_afetadas_chute` | multi-select | preenchido pelo humano; o Curador valida/expande |
| `descricao_humana` | text | o que mudou |
| `justificativa` | text | por que |
| `artefatos_impactados` | relation | → Catálogo de Artefatos (§7) |
| `diff_subpage_url` | text | link pra subpágina com diff renderizado |
| `aprovacao` | select | `Pendente` \| `Aprovado` \| `Editado por humano` \| `Rejeitado` |
| `aplicacao_estado` | select | `Não iniciado` \| `Em curso` \| `Concluído` \| `Falhou` |
| `versao_catalogo_lida` | text | snapshot do Catálogo analisado (auditoria) |
| `rodadas_qa` | number | quantas Q&A com humano (limite §5) |
| `observacoes` | text | auditoria, `Status <canal>: ok\|falhou` |

---

## 7. Catálogo de Artefatos Operacionais (DEPENDÊNCIA CRÍTICA) `[PRESUMIDO]`

**DB Notion:** `PHI - Catálogo de Artefatos Operacionais`

Sem isso o Curador é cego. Cada linha = um artefato vivo do chassi.

| Campo | Tipo | Nota |
|---|---|---|
| `nome` | title | |
| `tipo` | select | `SOP` \| `DB Notion` \| `Workflow n8n` \| `Prompt de agente` \| `ADR` \| `SLA versionado` \| `Template DoD` \| `Página âncora` |
| `area` | select | `Onboarding` \| `Execução` \| `Priorização` \| `Comercial` \| `Procedimentos cross` |
| `localizacao` | url | link Notion ou path do repo (`docs/...`, `onboarding/a2.X/...`) |
| `versao` | text | semver ou data |
| `responsavel` | person | quem mantém |
| `escopo_servico` | multi-select | `Tráfego pago` \| `Sites` \| `Agentes IA` \| `Universal` |
| `depende_de` | relation | → outros artefatos |
| `mudancas_que_me_afetaram` | relation | ← Mudanças de Escopo |
| `ultimo_review` | date | |
| `estado` | select | `Vivo` \| `Deprecado` \| `Em revisão` |
| `tenant_id` | text | |

**Manutenção do Catálogo:**
- Lote 0 do Curador = **descoberta inicial** — varro repo + Notion e
  registro todos os artefatos vivos (~50-100 linhas estimado).
- Going-forward = workflows do Onboarding/Execução/etc. **registram
  automaticamente** novos artefatos que criam (padrão de cadastro).
  Cadastro manual fica como fallback.

**Escopo `[PRESUMIDO — confirme tipos]`:** os 8 tipos acima cobrem o que
existe hoje no chassi? Falta algum (ex: `Webhook secret`, `Credential`,
`Skill`)?

---

## 8. Diff renderizado — formato A+B híbrido (red-line Olavo)

Subpágina da Mudança de Escopo. Estrutura: **tabela overview** (Notion-table
block) no topo + **toggles colapsados** (Notion-toggle block) abaixo,
um por artefato. Diff dentro do toggle usa code block com syntax `diff`
pra coloração git-style.

### Estrutura visual (renderizada via MCP Notion API)

```
╔═══════════════════════════════════════════════════════════════╗
║ DIFF PROPOSTO #ID — "Adicionar serviço Sites"                 ║
║ Modo: ANTES · Áreas: Onboarding · Execução · Procedimentos    ║
║ Resumo: 3 mudanças (2 edições + 1 criação · 0 deprecações)    ║
╚═══════════════════════════════════════════════════════════════╝

┌──── OVERVIEW (Notion table block) ────────────────────────────┐
│ # │ Artefato                       │ Ação   │ Tipo   │ Canal      │ Impacto │
│ 1 │ SOP Execução de Demandas v1.3  │ EDITAR │ SOP    │ MCP Notion │ médio   │
│ 2 │ DB PHI - Demandas v1.0         │ EDITAR │ DB     │ MCP Notion │ baixo   │
│ 3 │ Prompt Diagnóstico Site        │ CRIAR  │ Prompt │ MCP Notion │ alto    │
└────────────────────────────────────────────────────────────────┘

──── DETALHE (Notion toggles, colapsados por padrão) ────────────

▸ 🔵 [EDITAR] SOP Execução v1.3 → v1.4 — impacto médio
   │ LOCALIZAÇÃO: Notion (page_id: ...) + docs/.../SOP.md (espelho)
   │ JUSTIFICATIVA: novo serviço; tipo "Site" cabe em ad-hoc
   │ CANAL: MCP Notion (update-page) + Codex PR (espelho repo)
   │ DEPENDÊNCIAS DE APLICAÇÃO: #2 (DB) deve aplicar antes
   │
   │ ```diff
   │   ### Ad-hoc
   │     - Ajuste de verba/orçamento
   │     - Subir ou pausar criativo
   │ + - Criação de site (NOVO — serviço adicionado 2026-06-03)
   │     - Investigar anomalia de métrica
   │ ```

▸ 🔵 [EDITAR] DB PHI - Demandas v1.0 → v1.1 — impacto baixo
   │ LOCALIZAÇÃO: Notion DB (data_source: ...)
   │ JUSTIFICATIVA: select `tipo` precisa nova opção "Site"
   │ CANAL: MCP Notion (update-data-source)
   │
   │ ```diff
   │   tipo (select):
   │     - Ajuste de verba/orçamento
   │     - Subir ou pausar criativo
   │ +   - Criação de site
   │     - Investigar anomalia de métrica
   │ ```

▸ 🟢 [CRIAR] Prompt Diagnóstico Site — impacto alto
   │ LOCALIZAÇÃO: Notion (página nova sob "Prompts dos Agentes")
   │ JUSTIFICATIVA: novo agente requisitado pelo serviço Site
   │ CANAL: MCP Notion (create-pages)
   │
   │ ```text
   │ [conteúdo proposto do prompt, ~30 linhas]
   │ ```

──── Q&A COM HUMANO (Notion toggle, histórico) ─────────────────

▸ 🗨️  Histórico de perguntas — 2 rodadas
   │ P1 (Curador): "Site vira tipo da Execução ou nova área?"
   │ R1 (Olavo via Telegram, 13:42): "Tipo da Execução por enquanto."
   │ P2 (Curador): "Agente de diagnóstico é Pro ou Flash?"
   │ R2 (Olavo via Telegram, 13:51): "Flash."

──── ROADMAP (Notion callout, só em modo ANTES) ────────────────

📅 Roadmap de aplicação:
  · Sem 1: aprovar artefatos universais (SOP + DB)
  · Sem 2: registrar 1ª demanda piloto do tipo Site
  · Sem 3+: rolar pra produção

──── ORDEM DE APLICAÇÃO (Notion numbered list) ─────────────────

1. Criar Prompt Diagnóstico Site (#3 — não tem dependência)
2. Atualizar DB PHI - Demandas (#2 — bloqueia SOP)
3. Atualizar SOP Execução (#1 — referencia tipo do DB)
```

### Por que A+B híbrido

- **Tabela (A)** = scan em 5 segundos do "o quê" e "quanto" — você decide
  se vale revisar a fundo.
- **Toggles (B)** = você abre só o que importa, evita rolagem linear quando
  há muitos artefatos.
- **Diff git-style** dentro dos toggles = padrão visual familiar; Notion
  renderiza code blocks com sintaxe `diff` (verde/vermelho).
- **Q&A histórico em toggle separado** = auditoria sem poluir a leitura
  principal.
- **Roadmap aparece só em modo ANTES** (planejamento). Modo DEPOIS pula
  esse bloco.

### Fallback se Mudança virar grande (10+ artefatos)

Engatilha **Opção C (kanban)** como view alternativa do mesmo conteúdo.
DB views do Notion permitem isso sem reescrita — cada toggle vira card,
agrupado por `Ação` (CRIAR/EDITAR/DEPRECAR) ou por `Impacto`.

---

## 9. Canais de aplicação

| Tipo de artefato | Canal | Mecanismo |
|---|---|---|
| Arquivo no repo (workflow JSON, scripts, `.md`) | **Codex** | PR com diff aprovado |
| Página Notion | **MCP Notion** | `notion-update-page` |
| Schema de DB Notion | **MCP Notion** | `notion-update-data-source` |
| Prompt de agente (que vive como página Notion) | **MCP Notion** | `notion-update-page` |
| Workflow n8n em produção | **NÃO automatizado v0.1** — gera PR pelo Codex, deploy manual |

**Decisão crítica `[PRESUMIDO]`:** workflows ativos em produção **não**
são atualizados automaticamente pelo Curador. Causa: padrão inegociável
do Lote 1 — "NÃO editar workflow de produção na UI sem re-importar a
versão canônica do repo antes". O Curador prepara o PR; deploy é manual.

---

## 10. Eventos canônicos (sink BQ futuro)

`mudanca_escopo.criada`, `mudanca_escopo.em_analise`,
`mudanca_escopo.pergunta_humano`, `mudanca_escopo.resposta_humano`,
`mudanca_escopo.diff_proposto`, `mudanca_escopo.aprovada`,
`mudanca_escopo.rejeitada`, `mudanca_escopo.aplicacao_iniciada`,
`mudanca_escopo.aplicada`, `mudanca_escopo.falhou`,
`catalogo.artefato_registrado`, `catalogo.artefato_versionado`,
`catalogo.artefato_deprecado`.

**Payload comum:** `tenant_id`, `mudanca_id`, `modo`, `tipo_mudanca`,
`tier_agente`, `timestamp`, `execution_id`.

**Métricas habilitadas pra produto futuro `[PRESUMIDO]`:**
- Tempo médio Mudança aberta → aplicada
- Taxa de aprovação humana (mede confiança no Curador)
- % de Mudanças que exigiram Q&A (mede clareza dos prompts iniciais)
- Drift acumulado (#artefatos modificados / período)
- Falhas pós-aplicação (mede robustez do canal de aplicação)

---

## 11. White-label

Padrão `{{BRAND}}` herdado:
- Persona neutra `Curador` (sem prefixo de marca no nome do agente).
- `{{BRAND}}` aparece nos prompts onde marca da agência é referenciada.
- DBs/SOPs com `tenant_id` permitem multi-workspace no futuro.

---

## 12. Plano de lotes do Curador

| Lote | Entrega | Janela teórica |
|---|---|---|
| **0** | Catálogo de Artefatos Operacionais (DB Notion + descoberta inicial dos ~50-100 artefatos vivos). Sem código pesado. | Sem 2-4 (paralelo ao Lote 1 Execução) |
| **1** | Engine mínimo: 1 Mudança de Escopo simulada (ANTES) → análise → Q&A → diff proposto. **Aplicação manual** nesta fase (Olavo aplica). | Sem 4-6 |
| **2** | Aplicação via **Codex** (PR no repo). | Sem 6-7 |
| **3** | Aplicação via **MCP Notion** (DBs/páginas). | Sem 7-8 |
| **4** | Modo DEPOIS (retroativo) + validação de consistência pós-aplicação. | Sem 8+ |
| **5+** | Drift detection (Schedule + Flash varre artefatos buscando inconsistência). Fase 2 — não bloqueia Sites/IA. | Fora da janela 1-2 meses |

**Fallback honesto:** se Sites/IA entram antes do Lote 1 do Curador
estar pronto, Olavo + Claude fazem a reorganização **manualmente**
documentando rigorosamente cada passo (vira input de treino do Curador).

---

## 13. Status do red-line v0.1 → v0.2 (resolvido 2026-06-03)

| # | Item | Status |
|---|---|---|
| 1 | Modelo Mudança de Escopo (§6) | ⚠️ Default assumido — Olavo não red-lined explicitamente. Corrigir em v0.3 se preciso. |
| 2 | Catálogo (§7) — 8 tipos | ✅ Cobrem o chassi (red-line Olavo). |
| 3 | Diff renderizado (§8) | ✅ Formato A+B híbrido (tabela overview + toggles com diff git-style). |
| 4 | Canais de aplicação (§9) | ✅ Codex + MCP cobrem tudo; decisão de **não** mexer em workflow produção automático faz sentido. |
| 5 | Limite Q&A (§5) — 3 rodadas | ⚠️ Default assumido. |
| 6 | Sequência de lotes (§12) | ⚠️ Default assumido — janela 1-2 meses. |
| 7 | 5 métricas (§10) | ⚠️ Default assumido. |

**Notas sobre os defaults (⚠️):**
- Itens #1, #5, #6, #7 não foram red-lined explicitamente — segui as
  propostas da v0.1 como aprovadas. Reversíveis: corrigir em v0.3 se
  Olavo discordar quando o Curador estiver vivo.
- Não bloqueia início do Lote 0 (descoberta do Catálogo) — esse trabalho
  independe desses 4 defaults.

---

## 14. Status das ações canônicas (autorizadas + executadas 2026-06-04)

Olavo autorizou `OK 14.1-14.4` em 2026-06-04. Execução:

### ✅ 14.1 — DB `PHI - Mudanças de Escopo`
- **Concluído.** Sob "Gerenciamento de Documentos" (não "Central de Operações"
  — corrigido por inspeção: lá moram os outros DBs canônicos PHI -*).
- URL: https://www.notion.so/507d18009622435ba3f17b24d191762d
- data_source_id: `bb56ddca-dfad-4aa5-9227-3cf86207bc40`
- Schema fechado: 15 campos (§6).

### ✅ 14.2 — DB `PHI - Catálogo de Artefatos Operacionais`
- **Concluído.** Sob "Gerenciamento de Documentos".
- URL: https://www.notion.so/bd8df5b982ad4f00a8ae56d687db819e
- data_source_id: `07623177-4d75-4870-bdc0-4ecd365392a7`
- Schema: 13 campos (§7) — incluindo self-relation `Depende de`/`Dependentes`
  + relation reversa `Mudanças que me afetaram` ligada ao DB 14.1.
- **Nota técnica:** primeira tentativa de self-relation criou 4 colunas
  (dobrei o DUAL); corrigido com DROP + ADD single. Lição: pra self-relation
  via `update_data_source`, passar APENAS um lado — DUAL auto-cria reverso.

### ✅ 14.3 — Âncora `[HANDOFF] Curador — Âncora da Área`
- **Concluído.** Sob "Gerenciamento de Documentos" (irmã da Priorização).
- URL: https://www.notion.so/375b65e5c72b810f8f4be50873daedbe
- Conteúdo: 9 seções espelhando padrão da Priorização (propósito,
  posicionamento, governança, decisões travadas, padrões inegociáveis
  herdados, plano de lotes, artefatos canônicos, refs cruzadas,
  checkpoints).

### ✅ 14.4 — Lote 0: descoberta inicial do Catálogo
- **Concluído.** 39 artefatos vivos registrados (estimativa original era
  50-100 — escopo enxuto porque tirei workflows do produto PHI/Decision
  Engine do escopo, conforme §1 do design).

**Distribuição por área:**
| Área | Artefatos | Status |
|---|---|---|
| Onboarding | 16 | Denso, área madura (Lote 1 em produção) |
| Procedimentos cross | 13 | Denso (DBs canônicos PHI + 6 ADRs) |
| Priorização | 4 | Esparso (em estruturação) |
| Curador | 4 | Recém-nascido (este mesmo) |
| Execução | 1 | Em design (só o strawman) |
| Comercial | 1 | Vestigial (só Deduplicar Leads HubSpot) |

**Gaps identificados (relatório de cobertura):**
1. **Nenhum SLA versionado registrado.** Tipo existe no schema, mas zero
   instâncias. Lote 1 Execução deveria criar o 1º (SLAs do §7 da Execução).
2. **Nenhum Template DoD registrado.** Mesma situação. Lote 2 Execução
   (Padronizador/quality-gate) deveria criar os primeiros.
3. **ADRs faltando:** 006 (Log de Otimizações), 007 (Onboarding), 008
   (CPA-only vs polimórfico), 010 (Divisão BQ ↔ Supabase — sugerido na
   conversa do dashboard), 011 (Curador — em rascunho).
4. **ADR-001 marcado `Em revisão`** porque colide com "BigQuery base de
   verdade" do contexto estratégico — pendente esclarecimento via ADR-010.
5. **Comercial vestigial:** quando a área Comercial for desenhada formalmente,
   precisa de SOP + DB + âncora + workflows. Demanda "Prospecção"
   (registrada na Execução §4) migrará pra cá.
6. **Execução em design:** quando Lote 1 entregar, surgem ~7 artefatos novos
   (SOP, DB Demandas, 2 prompts, 1 workflow, 1 SLA, 1 ADR).

### 14.5 — ADR-011 provisório (PENDENTE — não foi autorizado neste bloco)
- Cobre: Curador (papel + tier) + Mudanças de Escopo + Catálogo
- Entra como `Em planejamento` no DB PHI™ — Decisões (ADR)

### 14.6 — Codex pro Lote 1 (PENDENTE — engatilhado depois do Lote 1 Execução)

---

## 15. Tensões registradas pra revisitar

- **Curador × Codex × Antigravity:** ambos agora tocam o repo. Quando
  o Curador propõe diff de arquivo, abre PR via Codex — mas quem é o
  revisor? Hoje é Antigravity. Vale criar regra: PRs do Curador
  precisam de Antigravity igual PRs do Codex? `[ABERTO]`
- **Catálogo × ADRs vigentes:** ADRs já têm registro próprio (Notion).
  O Catálogo lista ADRs também? Risco de duplicação. Proposta v0.1:
  Catálogo lista o ADR como referência (id + url), o conteúdo
  canônico segue na base de ADRs. `[PRESUMIDO]`
- **Mudança de Escopo × Decisões (ADR):** uma Mudança de Escopo grande
  pode justificar um ADR novo. O Curador deveria propor o ADR junto
  com o diff? Acho que sim, mas vira lote separado. `[ABERTO]`
