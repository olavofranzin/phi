# [BRIEF sub-chat] Build — Restaurar planilha de leads + loops de sync/guarda (Comercial)

> **Cole como 1ª mensagem de uma sessão nova.** Frente: Comercial. Runtime: **n8n** (MCP conectado; alcança
> HubSpot, Google Sheets, Telegram). Repo `phi`, branch `claude/agentic-agency-planning-KwJEw` (`git pull`).
> **Contexto:** por um erro, colunas de aprendizado da planilha de prospecção foram apagadas — perdemos os
> **rótulos de resultado** (andamento no HubSpot, motivo de rejeição) que ensinam os agentes comerciais.
> Este build **restaura** as colunas E instala os **dois loops** que impedem a recorrência.

## 0. Leia primeiro (fonte de verdade — não redesenhar)
1. `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md` — **o Contrato de Dados** (propósito, dicionário completo, governança, os 2 loops). **É a fonte de verdade.**
2. `docs/comercial/planilha-leads-schema.json` — **schema legível por máquina** (lista canônica de colunas; o loop guarda-schema compara contra ela).
3. `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md` + `scripts/gbp_scoring_prototype.py` — o motor de scoring que consome as features brutas.

## 1. Alvos fixos (já verificados)
- **Planilha:** Google Sheets `1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM` · aba `leads` (gid 0) · aba `qtd leads mes` (gid 624786381).
- **HubSpot:** portal 5633277 · pipeline `default` ("Pipeline de Vendas"). Estágios (`dealstage`): `70807682-148b-4914-acd0-97aad8c2a000`=Prospectado → `qualifiedtobuy`=Interação Instagram → `17222650`=Contato Realizado → `presentationscheduled`=Reunião Agendada → `decisionmakerboughtin`=Tomada de Decisão → `contractsent`=Contrato Enviado → `closedwon`=Vencido → `closedlost`=Perdido.
- **Workflows Apify existentes:** n8n `5L3SyzDkZqf1N6vW` (16 nós) e `google_maps_updated.json` (repo). **Habilitar acesso MCP** deles pela workflow card se preciso.
- **Credenciais:** usar as já existentes no cofre (Google Sheets, HubSpot, Apify, Telegram) — `list_credentials`. Nunca hardcodar.

## 2. Lotes

### R1 — Restaurar colunas na aba `leads`
Criar os cabeçalhos com `add: true` do `planilha-leads-schema.json`, preservando os existentes. Grupos:
- **Features brutas (🔴 críticas p/ o scoring):** `Avaliação` (`totalScore`), `Quantidade fotos` (`imagesCount`), `Atributos` (`additionalInfo` — contagem de grupos + JSON bruto). **Altas:** `Horário` (`openingHours`), `Agendamento` (`bookingLinks`), `Posts` (`ownerUpdates`). **Média:** `Rua/Avenida` (`street`).
- **Bloco de aprendizado (HubSpot):** `hubspot_estagio`, `hubspot_status`, `motivo_perda`, `motivo_ganho`, `valor`, `via_aquisicao`, `num_interacoes`, `ultimo_contato`, `data_criacao_deal`, `data_fechamento`, `dias_no_funil`, `probabilidade`, `nba_recomendada`, `nba_aceite`, `abordagem_ia`, `acerto_previsao`, `data_sync_hubspot`.
- **Confirmar** com o Olavo se `id` guarda `place_id`; se não, criar `place_id`.

### R2 — Mapear as features brutas no workflow Apify
No nó de normalização (Set/Code) do workflow de extração, passar a mapear e gravar na planilha: `totalScore→Avaliação`, `imagesCount→Quantidade fotos`, `additionalInfo→Atributos`, `openingHours→Horário`, `bookingLinks→Agendamento`, `ownerUpdates→Posts`, `street→Rua/Avenida`. (Mesmos campos que o `02_normalizer` do protótipo já trata — coerção `null→0`, classificar website.)

### R3 — Loop de SINCRONIZAÇÃO HubSpot → planilha (o gatilho que salva o resultado)
Workflow n8n novo. **Schedule** (recomendo a cada 6 h).
- **Fonte (decisão recomendada — confirmar):** puxar **todos os deals com `hs_lastmodifieddate` desde a última sync** (mais eficiente e pega deals criados fora do fluxo Maps), em vez de varrer a planilha por `id_hubspot`.
- Para cada deal: ler `dealstage, hs_is_closed, hs_is_closed_won, closed_lost_reason, closed_won_reason, amount, hs_analytics_source, num_contacted_notes, notes_last_contacted, createdate, closedate, hs_deal_stage_probability, proxima_acao_recomendada, proxima_acao_aceite, abordagem_sugerida_ia`.
- **Derivar:** `hubspot_status` (Aberto/Vencido/Perdido), `dias_no_funil`, `acerto_previsao` (compara `potencial_comercial`/`oferta_recomendada` da linha × desfecho).
- **Upsert** na aba `leads` por **`id_hubspot`** (appendOrUpdate). Carimbar `data_sync_hubspot`. Idempotente.
- ⚠️ **Produção:** este loop **só LÊ** o deal e **escreve na planilha** — **nunca** altera o CRM.
- Guardar o cursor da última sync (Data Table n8n ou aba de controle).

### R4 — Loop GUARDA-SCHEMA + BACKUP (impede perder de novo)
Workflow n8n novo. **Schedule diário.**
- Ler a **linha de cabeçalho** da aba `leads`.
- Buscar a lista canônica em `planilha-leads-schema.json` (HTTP GET no raw do GitHub da branch, ou n8n Data Table espelhando o schema) → **diff**.
- **Coluna do schema ausente → alerta imediato (Telegram)** com os nomes faltantes + data.
- **Snapshot:** exportar a aba `leads` (CSV) para backup versionado (commit em `backups/leads/AAAA-MM-DD.csv` via GitHub, ou Drive `backups/leads/`), retenção ≥30 dias. → apagamento detectado em ≤24 h e sempre restaurável.
- Opcional (fase 2): auto-recriar cabeçalho ausente.

### R5 — Governança (fecha o buraco de documentação)
- Registrar a planilha na DB **`PHI — Fontes de Conhecimento`** (Camada de Conhecimento §2): `{nome, tipo=google-sheet, file_id, dono=Comercial, domínio=comercial, schema_hash, contrato=docs/comercial/planilha-quantidade-leads-por-mes-colunas.md}`.
- Registrar o **ADR**: "Todo artefato de dados operacional tem Contrato de Dados versionado + guarda-schema + backup automático." (Notion, padrão da casa.)

## 3. Método de build n8n (obrigatório)
`get_sdk_reference` → `get_workflow_best_practices` (técnicas: "scheduling", "data pipeline"/ETL, "error handling") → `search_nodes` (Google Sheets, HubSpot, Schedule Trigger, Telegram, HTTP Request, Code, If) → `get_node_types` (todos) → `explore_node_resources` p/ pickers (sheet/aba, pipeline) com `credentialId` de `list_credentials`. Só então escrever. Validar com `validate_workflow` antes de publicar.

## 4. Guardrails
- HubSpot é **produção**: R3 só lê deal / escreve planilha. Nunca escrever no CRM neste build.
- Credenciais só do cofre. Idempotência em R3 (upsert por `id_hubspot`). Sem PII além do já existente.
- **Contrato manda:** se criar/renomear coluna, atualizar `planilha-quantidade-leads-por-mes-colunas.md` **e** `planilha-leads-schema.json` no mesmo PR.

## 5. Testes de aceitação
- **R1:** os cabeçalhos do schema (`add:true`) existem na aba `leads`, na ordem, sem quebrar os existentes.
- **R2:** rodar a extração p/ 1 lead → `Avaliação/Quantidade fotos/Atributos/Horário/Agendamento/Posts` preenchidos.
- **R3:** um deal movido de estágio no HubSpot aparece na planilha (estágio, motivo se perdido, valor, dias) na sync seguinte; re-rodar não duplica.
- **R4:** apagar 1 coluna de teste → alerta no Telegram no ciclo diário + CSV de backup gerado.

## 6. Âncoras
- Contrato: `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md` · Schema: `docs/comercial/planilha-leads-schema.json`.
- Motor de scoring: `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md` · `scripts/gbp_scoring_prototype.py`.
- Camada de Conhecimento (Fontes): `docs/strategic-planning/camada-conhecimento/BRUTO-v0.1-design.md` §2.
- Análise do workflow Maps (Notion): `350b65e5-c72b-817f-ae19-f07f8a332549`.
