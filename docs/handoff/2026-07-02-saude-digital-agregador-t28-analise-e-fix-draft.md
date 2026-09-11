# [REPORT] Agregador T28 — análise do dump + fixes em DRAFT (ctx-por-campanha e leitura defensiva do raw)

> **Data:** 2026-07-02 · **Executor:** Claude Code (branch `claude/saude-digital-phi-midia-score-0ko12c`).
> **Objeto:** `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) — dump analisado:
> `docs/audits/PHI — Agregador de Métricas Multi-fonte.json` (62 nós, versão ativa `a46d5a6a`).
> **Status:** análise completa + itens 1 e 5 (delegados pelo Olavo) **aplicados em DRAFT `cbd3568d`
> com read-back byte a byte**. Ativo em produção NÃO tocado. **Smoke pendente antes de publicar.**

---

## 1. Sumário da análise do workflow

**Pontos fortes (o artefato mais maduro da plataforma de dados):** contrato T28 explícito nos builders
(SCHEMA + chaves de negócio), MERGE idempotente, bloco de auditoria por linha (`execution_id EXEC-T28-*`,
`source_execution_id`, versões de contract/SOP, `source_status` JSON, `ingested_at`), leitura BQ
**parametrizada**, degradação graciosa (`readOrThrow` core / `optionalSource` demais fontes), guarda D5
(nenhum search term bruto persiste; LLM só destila 4 features). **Insight-chave:** o T28 calcula janelas
por agregação SQL sobre o raw diário — não depende das colunas `cost_7d/3d` que quebram o Pipeline_v2.
O padrão T28 é o candidato natural para refundar o cálculo do PHI·Mídia.

**Problemas identificados:** (1) contexto de negócio da campanha 1 vazava para todas (nó Adaptador ancorado
no primeiro item — Task 3 do ESTADO); (2) `volume_suficiente` modela fase de aprendizado, não volume da
janela; (3) features `pct_*` de search terms persistidas com `brand_info` placeholder; (4) ambiguidade
métrica-mãe/meta (CPA×CPL×ROAS colapsados num FLOAT); (5) leitura do raw herda a guerra de writers
(GADS_INSERT × DAILY_ENTRY). Menores: feedback do Loop atravessa 5 nós desabilitados da era antiga
(cadeia morta — L2.5); triggers na timezone da instância; `Authorization` hardcoded no nó Clarity
(achado do validador — mover para credential); developer token Google em texto plano no `Set dados` (ADR-20).

## 2. Decisões do Olavo (2026-07-02) — registradas

| Item | Decisão |
|---|---|
| 2 · `volume_suficiente` | **Manter como está por ora.** A lógica implementa a orientação Meta de fase de aprendizado (7–14 dias / ~50 conversões/semana; alterações vitais resetam o aprendizado). Mudar sem critério é arriscado. **Proposta registrada para decisão futura:** separar em duas flags — `fase_aprendizado` (idade+conversões, semântica atual) e `volume_janela_suficiente` (mínimos de cliques/conversões na janela, guarda ADR-21) — com limiares em config (`model_config`), não hardcoded. |
| 3 · Brand info / `pct_*` | Campos ainda não configurados no Notion. **Proposta registrada:** enquanto não existirem, persistir `pct_* = NULL` (ausência honesta) em vez de 0; criar as 3 propriedades no DB Clientes quando priorizar. |
| 4 · Métrica-mãe | É unificação de nomenclatura: **métrica-mãe** (tipo: CPA/CPL/ROAS/...; nome aberto a renomear) + **meta da métrica-mãe** (valor numérico) + métricas secundárias continuam monitoradas (a mãe não "cancela" as demais). Visão: agente de planejamento de campanha automatiza esses campos no futuro. **Implicação de schema a travar:** persistir sempre o par (tipo, valor) — nunca só o valor — em t28, raw e score. |
| 1 e 5 | Delegados ao Claude ("deixo para seu entendimento") → aplicados em draft (§3). |
| Triggers | Confirmado: semanal toda segunda + dia 1 do mês (consolidado). Config atual já corresponde (`weeks/triggerAtDay=[1]/9h` e `months/9h` = dia 1 default). Ressalva: hora é na timezone da instância (mesmo caveat UTC da Priorização). Quando o dia 1 cai numa segunda, ambos rodam — sem colisão de chave (`janela` D-7 ≠ D-30 está na chave do MERGE). |

## 3. Fixes aplicados em DRAFT (itens 1 e 5)

**Draft `cbd3568d-d5f5-473e-88a2-825ba7bf3eda`** · ativo permanece `a46d5a6a` · aplicado via MCP
`update_workflow` (3 operações) · **read-back via `get_workflow_details`: SQL e parâmetros idênticos;
jsCode do Adaptador idêntico exceto newline final** (cosmético).

### 3.1 Item 1 — contexto por campanha (Task 3 resolvida na raiz)

- **`[T28] BQ Read raw_campaign_data`:** novo parâmetro `@campaign_id` = `GADS-{{ $('Set dados').item.json.id_google_campanha }}`
  (resolução por item pareado dentro do Loop — mesmo mecanismo já usado por `@client_id`). Cada iteração
  agora lê **apenas a campanha do item atual**, alinhando o dado ao contexto.
- **`Adaptador Input T28`:** âncoras corrigidas — `ids` passa a vir do item da **iteração atual** do Loop
  (antes: primeiro item global do `Set dados`); `campProps`/`cliProps` resolvidos por chave de negócio
  (`notion_id_camp`/`id_client` do item atual) com fallback ao primeiro; `landing_page` prioriza o campo
  `Landing Page` do item. Efeito: `objetivo`, `metrica_mae`, `meta_metrica_mae`, `landing_page` corretos
  por campanha nas linhas t28. Nota: iterações por anúncio da mesma campanha reprocessam a campanha —
  idempotente (mesmos valores, mesma chave), sem duplicação; otimização de iteração fica para depois.

### 3.2 Item 5 — leitura defensiva do raw (guerra de writers)

Query reescrita com dedup canônico: `ROW_NUMBER() OVER (PARTITION BY client_id, campaign_id, date ORDER BY
CASE WHEN ingestion_step='DAILY_ENTRY' THEN 0 ELSE 1 END)` e `WHERE rn=1` — se os dois writers algum dia
gravarem linhas distintas para a mesma chave, o T28 **prefere DAILY_ENTRY** em vez de somar em dobro.
O `SUM/ANY_VALUE` anterior (que mascararia dupla contagem) foi removido; `ingestion_step` agora é
propagado como `source_ingestion_step` (linhagem de qual writer alimentou a linha).

### 3.3 Antes de publicar (processo da casa)

1. Smoke manual (1 cliente, 2 campanhas — CLI-4): conferir que `t28_campaign` sai com contexto correto
   por campanha e counts idênticos ao padrão (12/0/2/x/x/0), e que `source_ingestion_step` aparece.
2. Comparar 1 linha antes/depois (meta_metrica_mae da campanha Barbearia ≠ Salão é o teste decisivo).
3. OK do Olavo → `publish_workflow`.

## 4. Quem salva, quem consome — matriz writer/consumer (análise pedida)

**Sobre o custo de armazenamento:** no volume atual (centenas de linhas), o custo BQ é desprezível
(~$0,02/GB·mês; o dataset inteiro é da ordem de MBs). O custo real da sobreposição não é armazenamento —
é **semântico**: dois workflows computando "a mesma" métrica por caminhos diferentes produzem dois números
diferentes, e a confiança no sistema morre aí. O princípio a travar é: **um writer por tabela, uma tabela
por semântica, janelas calculadas na leitura (não pré-armazenadas), consumidores leem — nunca reescrevem.**

| Camada | Tabela/superfície | Writer ÚNICO (proposto) | Papel | Consumidores |
|---|---|---|---|---|
| Fato diário | `raw_campaign_data` | **Daily Entry / operador único (04:00)** — pendente decisão keystone: Subworkflow Campanhas (GADS_INSERT) **para de escrever** | Operacional — fato bruto por campanha/dia | Pipeline_v2 (score) · Agregador T28 |
| Janela consolidada | `t28_*` | **Agregador** (seg + dia 1) | Estratégico — janela + contexto de negócio + qualidade | Orquestrador/Analise L3 · futuro índice PHI (6 pilares) |
| Score | `phi_score_history` / VIEW `_current` | **Pipeline_v2** (07:00) | Operacional — detecta desvio, dispara loop O.D.A.E. | Loop Alerta · Sync Notion · L3 (leitura canônica, ADR-003) |
| Erros | `t28_errors` | WF-T28-Error-Handler | Observabilidade | humanos/telemetria |
| Notion (Campanhas, ANÁLISES...) | páginas/DBs | workflows de sync/entrega | Superfície humana operacional | pessoas — **nunca fonte de métrica** |

**Sobreposições legítimas vs. ilegítimas:**
- ✅ Raw diário → duas agregações (7d diária no score; D-7/D-30 no T28): **não é duplicação** se ambas
  agregarem NA LEITURA a partir do raw (padrão T28). Grãos e cadências diferentes, mesma fonte.
- ✅ T28 semanal × mensal: distinguidos por `janela` na chave do MERGE — por design.
- ❌ Colunas `cost_3d/7d/conversions_3d/7d` pré-computadas no raw: é aqui que mora a duplicação semântica
  (ninguém as escreve corretamente hoje; o Pipeline_v2 depende delas e por isso emite 50). Direção
  recomendada: o score calcula suas janelas em SQL (como o T28 faz) e essas colunas são aposentadas.
- ❌ Dois writers no raw (GADS_INSERT × DAILY_ENTRY): a decisão 6 do report do keystone. O fix 3.2 protege
  o T28, mas não resolve a causa.

**Papéis:** operacional = diário, detecta e aciona (Daily Entry, Pipeline_v2, Loop Alerta); estratégico =
janelado, analisa e recomenda (Agregador, Orquestrador L3, índice PHI). O Notion é entrega; o BQ é verdade
analítica (ADR-010); nenhum consumidor estratégico deve escrever nas tabelas operacionais.

## 5. Pendências que este report abre/atualiza

1. Smoke do draft `cbd3568d` + OK do Olavo → publicar (item 3.3).
2. Decisão futura: duas flags de volume (fase_aprendizado × volume_janela) com limiares em config.
3. Criar 3 propriedades de brand no DB Clientes; até lá, `pct_*` → NULL (proposta).
4. Padrão de plataforma (tipo, valor) para métrica-mãe — junto do ADR-008 (CPA×ROAS) do keystone.
5. L2.5 (cadeia morta que carrega o feedback do Loop) — subir prioridade: triggers ativos dependem dela.
6. Segurança: `Authorization` do Clarity → credential; developer token Google fora de texto plano.
