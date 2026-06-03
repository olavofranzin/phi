# [BRUTO v0.1] Curador — Meta-agente do pilar Procedimentos da Operação

> **STATUS:** Strawman v0.1. Aguardando red-line do Olavo.
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
| D4 — Mora | **(B) Procedimentos da Operação.** |
| Nome | **Curador.** |
| Tier | Gemini Pro. |
| Janela | 1-2 meses (entrada de Sites/Agentes IA). |

---

## 1. Posicionamento

**Curador = meta-agente do pilar Procedimentos da Operação.**

Escopo coberto:
- ✅ Onboarding (SOPs, DBs, prompts, ADRs, SLAs)
- ✅ Execução de Demandas (idem)
- ✅ Priorização (idem)
- ✅ Área Comercial futura (idem)

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

## 8. Diff renderizado — formato do output `[PRESUMIDO]`

Subpágina da Mudança de Escopo, formato Markdown legível:

```
# DIFF PROPOSTO — Mudança de Escopo #ID

## Resumo executivo
[1-2 parágrafos do impacto geral]

## Áreas afetadas
- Onboarding: 2 artefatos
- Execução: 4 artefatos
- Comercial: 0 artefatos

## Artefatos modificados

### 1. [SOP Execução de Demandas v1.3 → v1.4]
LOCALIZAÇÃO: Notion / docs/strategic-planning/execucao-demandas/SOP.md
AÇÃO: editar §4 — adicionar tipo "Criação de site"
JUSTIFICATIVA: novo serviço; demanda Site cabe em ad-hoc
CANAL DE APLICAÇÃO: MCP Notion + Codex (espelho)

ANTES:
  [bloco atual]
DEPOIS:
  [bloco proposto]

### 2. [DB PHI - Demandas v1.0 → v1.1]
LOCALIZAÇÃO: Notion DB
AÇÃO: adicionar opção "Site" no select `tipo`
CANAL: MCP Notion (update_data_source)
...

## Artefatos NOVOS a criar
### A. [Prompt do Agente de Diagnóstico de Site]
LOCALIZAÇÃO: Notion (página)
JUSTIFICATIVA: novo agente exigido pelo serviço
CONTEÚDO PROPOSTO:
  [bloco]

## Perguntas pendentes (Q&A com humano)
- [resolvidas na thread Telegram]

## Roadmap de aplicação (modo ANTES)
- Sem 1: aprovar artefatos universais (SOP + DB)
- Sem 2: registrar 1ª demanda piloto do tipo Site
- Sem 3+: rolar pra produção

## Ordem de aplicação (resolução de dependências)
1. Criar Prompt do Agente de Diagnóstico de Site
2. Atualizar DB PHI - Demandas (novo tipo)
3. Atualizar SOP Execução (referência ao tipo)
4. ...
```

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

## 13. Red-line — o que preciso que confirme/corrija

1. **Modelo da Mudança de Escopo (§6)** — campos batem? Falta algum
   tipo no select `tipo_mudanca`?
2. **Catálogo de Artefatos (§7)** — os 8 tipos cobrem o que existe
   hoje? Falta algum? Algum sobra?
3. **Diff renderizado (§8)** — o formato apresentado é bom pra você
   revisar e aprovar? Ou prefere algo mais visual (tabela? diff colorido?
   resumo em bullets?)
4. **Canais de aplicação (§9)** — Codex + MCP Notion cobrem tudo? E a
   decisão de **não** atualizar workflows n8n em produção
   automaticamente faz sentido?
5. **Limite de Q&A (§5)** — propus 3 rodadas máximo. OK? Maior/menor?
6. **Sequência de lotes (§12)** — janela 1-2 meses bate com sua
   urgência? Algum lote deveria adiantar/atrasar?
7. **Métricas (§10)** — as 5 métricas propostas cobrem o que você
   quer medir sobre o próprio Curador?

---

## 14. Próximos passos

1. Você red-line a v0.1.
2. Incorporo correções → v0.2.
3. Em paralelo à v0.3 da Execução, abro:
   - DB `PHI - Mudanças de Escopo` no Notion canônico
   - DB `PHI - Catálogo de Artefatos Operacionais` no Notion canônico
   - Âncora da área Curador no Notion (espelhando Priorização e Execução)
4. **Lote 0 do Curador:** descoberta inicial do Catálogo — varro repo +
   Notion e registro os artefatos vivos. Esse trabalho serve double-duty:
   (a) destrava o Curador, (b) me dá mapa pra eu mesmo navegar melhor o
   chassi nas próximas conversas.
5. ADR — Curador / Mudanças de Escopo / Catálogo (entra como ADR-011
   provisório, com 3 itens consolidados).
6. Brifo Codex pro Lote 1 do Curador (engine mínimo) só depois que
   Lote 1 da Execução estiver em produção, pra evitar paralelismo
   demais e respeitar o sequenciamento de §15 da Execução.

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
