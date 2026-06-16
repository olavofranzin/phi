# ADR-rascunho — Eventos canônicos da Operação Interna + Sink BigQuery futuro

> **Status:** Rascunho (git canônico para design — ADR-012). Vai pra Notion `PHI™ — Decisões (ADR)`
> como `Aceito` após aprovação Olavo.
>
> **Data origem:** 2026-06-14
> **Origem:** §10 do strawman v0.2/v0.3 de Execução de Demandas. Aplicável transversalmente a todas
> as áreas operacionais (Onboarding, Priorização, Comercial, Curador).

---

## Contexto

Operação Interna gera **estado** em DBs Notion (Demandas, Etapas, Clientes, etc.). Estado é "como as coisas estão **agora**". Pra dashboards e métricas — lead time, % SLA cumprido, throughput, taxa de PASS no quality-gate — precisamos do **histórico imutável de transições**: eventos.

Notion não é log: campos são editáveis, `Última edição` é genérica, sem schema de evento. Tentar usar Notion como log gera dívida (drift entre estado e histórico) e impossibilidade analítica em escala.

**ADR-010 (Aceito 2026-06-04)** já estabelece BigQuery como camada canônica analítica e Notion como camada de estado operacional. **Falta cristalizar o modelo de evento** que conecta os dois:
- Fase atual: emitir evento como log Notion (em DB dedicado, NÃO em campo `observacoes` solto).
- Fase 2+: replicar pra BQ via sink (per ADR-010).

Sem este ADR, cada workflow inventa formato próprio de evento → impossível agregar; Curador (Lote 5+) não detecta drift via análise de eventos faltantes.

---

## Decisão proposta

**Modelo de evento canônico transversal:**

### Nomenclatura

`<entidade>.<estado>` em minúsculas, snake_case. Exemplos pra Execução de Demandas:

| Evento | Quando |
|---|---|
| `demanda.criada` | Demanda nasce no intake |
| `demanda.priorizada` | Orquestrador atribui prioridade pela 1ª vez |
| `demanda.roteada` | Orquestrador inclui na sequência do dia |
| `demanda.iniciada` | Estado muda pra `Em execução` |
| `demanda.sla_quebrada` | Prazo passou sem entrega |
| `demanda.em_revisao` | Estado muda pra `Em revisão` |
| `demanda.quality_gate` | Quality-gate roda — payload tem `resultado=pass\|fail` |
| `demanda.entregue` | Estado final `Entregue` |
| `demanda.reaberta` | Volta a `Em execução` após FALHA |

**Padrão extensível pra outras áreas:**
- Onboarding: `etapa.criada`, `etapa.concluida`, `cliente.classificado`, `cliente.aprovado`, etc.
- Priorização: `projeto_setup.aberto`, `projeto_setup.concluido`, `score.calculado`, etc.
- Curador: `mudanca_escopo.proposta`, `mudanca_escopo.aprovada`, `mudanca_escopo.aplicada`, etc.

### Payload comum (obrigatório em todo evento)

```json
{
  "tenant_id": "phi-agencia",
  "client_id": "<relation ou null>",
  "entidade_id": "<id da demanda/etapa/etc>",
  "tipo": "<tipo do evento, ex: demanda.iniciada>",
  "timestamp": "<ISO-8601 UTC>",
  "execution_id": "<EXEC-AREA-id_n8n>",
  "tier_agente": "pro|flash|n/a",
  "versao_sop_aplicada": "<id da SOP vigente; null se workflow não usa SOP versionado>"
}
```

### Payload específico por tipo

Cada evento pode estender o payload comum com campos próprios. Ex: `demanda.quality_gate` carrega `{resultado, motivo, dod_checklist}`.

### Storage (2 fases)

**Fase 1 (Lote 1 Execução):** evento gravado num **DB Notion dedicado `PHI - Eventos`** (não no campo `observacoes` da Demanda, que vira poluído rápido). Schema simples:

| Campo | Tipo |
|---|---|
| `tipo` | title |
| `entidade_id` | text (ou relation) |
| `entidade_area` | select (Execução / Onboarding / etc.) |
| `payload_json` | text (JSON inteiro) |
| `timestamp` | date (datetime) |
| `execution_id` | text |
| `tenant_id` | text |
| `tier_agente` | select |
| `versao_sop_aplicada` | relation → DB SOPs |

**Fase 2 (Lote 4 Execução / Telemetria Lote 4):** sink BQ. 2 opções equivalentes:
- (a) Workflow n8n agregador lê `PHI - Eventos` em batch (diário/horário) e escreve em `phi_prod.eventos_operacao`
- (b) Cada workflow emite evento simultaneamente em Notion + BQ (HTTP node)

Opção (a) ganha por simplicidade e ADR-010 (sink BQ centralizado). Notion = estado real-time, BQ = histórico analítico — paralelos, sem sync bidirecional.

### Métricas que isso habilita

- **Lead time médio por tipo de demanda** (timestamp `criada` → `entregue`)
- **% dentro de SLA** (comparar `entregue.timestamp` × `prazo` da Demanda)
- **Throughput por dia** (count `demanda.entregue` por janela)
- **Taxa de PASS no quality-gate** (% de `demanda.quality_gate.resultado=pass`)
- **Tempo em fila por classe** (timestamp `priorizada` → `iniciada`)
- **% de overrides humanos** (% de demandas onde `prioridade_origem` mudou de `agente` pra `humano`)
- **Drift de versão de SOP** (% de demandas executadas sob SOP `Substituida`)

---

## Alternativas consideradas

### Opção A — Sem eventos formais (só estado no Notion)
- **Prós:** zero código novo
- **Contras:** dashboards inviáveis (Notion não consulta histórico em escala); Curador Lote 5+ não detecta drift; análise de SLA exige scraping manual
- **Veredito:** Rejeitada — bloqueia Fase 2/3 do produto

### Opção B — Logs livres por workflow (cada um inventa)
- **Prós:** mais flexibilidade
- **Contras:** impossível agregar (cada workflow com formato diferente); drift garantido; Curador não consegue normalizar
- **Veredito:** Rejeitada

### Opção C — Cloud Logging direto pra GCP, pula Notion
- **Prós:** sink BQ trivial (mesma plataforma)
- **Contras:** perde audit-trail visual no Notion (operador humano não vê histórico); mais custo (GCP Logging escala caro); latência maior; gap com ADR-010 (Notion = estado)
- **Veredito:** Rejeitada

### Opção D — Híbrido Notion (Fase 1) + sink BQ batch (Fase 2) — RECOMENDADA
- **Prós:** respeita ADR-010 (estado em Notion, analítico em BQ); operador vê audit-trail no Notion; sink BQ centralizado em 1 workflow; Fase 1 entrega valor antes do BQ existir
- **Contras:** 2 storages; sink BQ vai ter latência (não real-time analytics)
- **Veredito:** Aceita

---

## Consequências

- **Dashboards de produto (Fase 3) materializados** a partir de BQ — Telemetria Mínima Lote 4 ganha alvo claro
- **Curador (Lote 5+) detecta drift** via eventos faltantes ou eventos sob versão de SOP antiga
- **Cada workflow gasta ~5 linhas extras por evento emitido** — custo trivial
- **BQ free tier provavelmente cobre por meses** (poucos workflows ativos hoje)
- **Padrão extensível:** áreas novas (Comercial, Priorização L2/L3) seguem o mesmo modelo sem reescrita
- **`versao_sop_aplicada` no payload comum** força a área a ter `PHI - SOPs` populado — efeito colateral positivo (governança)

---

## Reavaliar quando

- **Volume de eventos > 10k/dia** — BQ free tier pode apertar; avaliar particionamento ou retenção
- **Latência crítica** — se algum dashboard exigir near-real-time, sink batch não atende; avaliar Pub/Sub ou streaming
- **Multi-tenant ativar** (`tenant_id ≠ phi-agencia`) — `tenant_id` vira coluna de particionamento BQ obrigatória
- **Surgir necessidade de evento entre tenants** — modelo atual assume eventos por tenant
- **Vendor lock-in BQ virar problema** — sink genérico (BigQuery + um outro) pode ser uma opção

---

## Conexões

- **ADR-010** (BQ × Supabase) — esta ADR é o "como" do BQ canônico; complementar
- **ADR-012** (Git × Notion) — paralelo estrutural; eventos em Notion (operação) + BQ (histórico)
- **Strawman Telemetria** — Lote 4 sink BQ; consome este modelo
- **Strawman Curador** — Lote 5+ drift detection; consome estes eventos
- **Strawman Execução de Demandas v0.2/v0.3** — §10 cristalizado
- **Aprendizados PHI™**
  - "Anti-pattern de fallback silencioso" (#15) — eventos com `tier_agente` permitem detectar onde fallback rodou
  - "MCP de produção é canal de escrita" (#13) — sink BQ via MCP n8n consume eventos
- **Tronco 6 Miro** (Indicadores de Sucesso) — métricas habilitadas listadas acima
- **Tronco 7 Miro** (Governança e Melhoria Contínua) — eventos = trilha de auditoria operacional
