# Execution log — Restaurar planilha de leads + loops de sync/guarda (Comercial)

> Executa o brief `[BRIEF sub-chat] Build — Restaurar planilha de leads + loops de sync/guarda
> (Comercial)`, originalmente escrito para a branch `claude/agentic-agency-planning-KwJEw`. Por
> pedido do Olavo, foi executado nesta sessão/branch (`claude/gbp-scoring-motor-n8n-0zri0i`), que já
> tinha contexto vivo do runtime n8n de produção (workflows, credenciais, planilha real). Antes de
> executar, revisei o brief e o comparei com o que já estava construído aqui — ver seção "Verificação
> prévia" abaixo.

## Verificação prévia (antes de qualquer escrita)

- **Sem colisão de coluna:** o schema canônico (`docs/comercial/planilha-leads-schema.json` na
  branch do brief) já lista os 14 campos de scoring do motor GBP (`score_tecnico`...
  `data_processamento_score`) com `"add": false` e `dedup_key: "id"` / `join_key: "id_hubspot"` —
  exatamente o que já tínhamos validado em produção. Nenhuma sobreposição de nomes com o que essa
  sessão já tinha criado.
- **Cabeçalho real lido antes de escrever** (lição do incidente anterior de colunas apagadas):
  `leads!A1:BZ1` via HTTP direto (Sheets API) confirmou 36 colunas reais (`A`→`AJ`, terminando em
  `id_hubspot`) — nenhuma das 24 colunas do brief existia ainda. Escrita 100% aditiva.
- **Duas pipelines de extração distintas descobertas:** `Enriquecimento GBP e Site`
  (`5L3SyzDkZqf1N6vW`, 21 nós, **inativo**) parece uma versão anterior/abandonada — seu nó "Agente
  GBP" referencia `$('Normalizar campos do lead')`, nó que só existe no OUTRO workflow. A pipeline
  **real de produção** é `HubSpot - Atualizar status e disparar extracao` (`kED2AlXJjIYgvHXH`, 43
  nós, **ativo**, aciona a extração Apify quando uma vaga de "Prospectado" abre). O R2 foi aplicado
  neste workflow, não no `5L3SyzDkZqf1N6vW`.
- **Propriedades HubSpot do R3 já existiam** (`closed_lost_reason`, `hs_analytics_source`,
  `proxima_acao_recomendada`, `proxima_acao_aceite`, `abordagem_sugerida_ia`, etc.) — nada para criar.

## R1 — Restaurar colunas na aba `leads`

Escrita direta via Sheets API (`values.update`, `valueInputOption=RAW`) no range `leads!AK1:BH1`
(24 colunas novas, logo após `id_hubspot` em `AJ`), sem tocar nas 36 colunas existentes:
`Rua/Avenida`, `Avaliação`, `Quantidade fotos`, `Atributos`, `Horário`, `Agendamento`, `Posts`
(features brutas) + `hubspot_estagio`, `hubspot_status`, `motivo_perda`, `motivo_ganho`, `valor`,
`via_aquisicao`, `num_interacoes`, `ultimo_contato`, `data_criacao_deal`, `data_fechamento`,
`dias_no_funil`, `probabilidade`, `nba_recomendada`, `nba_aceite`, `abordagem_ia`, `acerto_previsao`,
`data_sync_hubspot` (bloco de aprendizado). Verificado relendo o cabeçalho inteiro depois: 60
colunas, `A`→`BH`, nada perdido.

## R2 — Mapear features brutas no workflow Apify real

Editado `HubSpot - Atualizar status e disparar extracao` (`kED2AlXJjIYgvHXH`), nó **"Normalizar
campos do lead"** (o que processa o output cru do Apify): adicionados 5 campos novos —
`images_count` (`imagesCount`), `atributos` (contagem de grupos + JSON bruto de `additionalInfo`),
`horario` (`openingHours` serializado), `agendamento` (`bookingLinks` serializado), `posts`
(`ownerUpdates` serializado) — mesmos nomes de campo Apify já usados no Motor de Regras GBP
(`scripts/gbp_scoring_core.js`), pra evitar duas implementações divergentes de normalização.
`rating` (`totalScore`) já existia calculado mas nunca era escrito na planilha — agora é.

Nó **"Salvar lead bruto na planilha"**: adicionado o mapeamento das 7 colunas novas (`Avaliação`,
`Quantidade fotos`, `Atributos`, `Horário`, `Agendamento`, `Posts`, `Rua/Avenida`) — edição
puramente aditiva, nenhuma assignment/mapeamento existente foi removido ou alterado. Verificado
relendo os dois nós depois da escrita.

Não testado end-to-end (rodar o workflow completo dispararia Apify real + criação de Deal real);
verificação foi por leitura de parâmetros, não execução.

## R3 — Loop de sincronização HubSpot → Planilha

Workflow novo: **`Comercial - Sync HubSpot -> Planilha (loop de aprendizado)`** —
`WRFU2NM8rLJU7bRT` (https://n8n-n8n-editor.1unqx7.easypanel.host/workflow/WRFU2NM8rLJU7bRT).
**Ativo**, Schedule a cada 6h.

- Cursor de sincronização em **n8n Data Table** (`gbp_sync_cursor`, id `zPnW2B39G0ovWjpA`) — evita
  reler deals já processados. Fallback: 30 dias se não houver cursor ainda.
- Busca deals HubSpot com `hs_lastmodifieddate > cursor` (HubSpot search, `filterGroupsUi`).
- Deriva `hubspot_estagio` (mapa de `dealstage`→label do pipeline), `hubspot_status`
  (Aberto/Vencido/Perdido), `dias_no_funil`, `acerto_previsao` (cruza `potencial_comercial` do
  próprio Deal × desfecho).
- **Upsert** na aba `leads` por `id_hubspot` (Google Sheets `appendOrUpdate`). **Só lê HubSpot,
  nunca escreve nele** (guardrail do brief).
- Atualiza o cursor no fim (max `hs_lastmodifieddate` visto).
- **Bug real pego em teste (dado real, não sintético):** `acerto_previsao` calculava incorretamente
  para deals sem `potencial_comercial` — `Number(null)` vira `0`, não `NaN`, então o guard
  `!Number.isNaN(potencial)` não pegava o caso de ausência de dado. Corrigido com um check explícito
  `potencial_comercial !== null/undefined/''` antes de converter.
- **Testado real:** rodou contra os deals reais de produção — 13 deals sincronizados na primeira
  execução (cursor vazio → fallback 30 dias), incluindo 1 deal `Vencido` real (`12850337977`) com
  `acerto_previsao` calculado corretamente após o fix. Cursor atualizado com sucesso.

## R4 — Loop guarda-schema + backup

Workflow novo: **`Comercial - Guarda-Schema + Backup Planilha Leads`** — `vUI0pPlDASf64Htn`
(https://n8n-n8n-editor.1unqx7.easypanel.host/workflow/vUI0pPlDASf64Htn). **Ativo**, Schedule diário
08:00.

- **Schema canônico espelhado em n8n Data Table** (`gbp_leads_schema_canonico`, id
  `QIrDCkhppfc0FfOH`, 60 linhas) em vez de HTTP GET no raw do GitHub — evita depender do estado de
  uma branch específica (a branch do schema pode ser mergeada/apagada).
- Lê cabeçalho real (`leads!A1:BZ1`) × schema canônico → diff → se faltar coluna, alerta Telegram
  (mesmo canal do workflow `Comercial - Deduplicar Leads HubSpot`, `chatId 930549271`).
- **Backup:** em vez de GitHub/Drive (nenhuma credencial dessas existe no cofre n8n desta instância),
  usa `duplicateSheet` da própria Sheets API — duplica a aba `leads` inteira (dados + formatação)
  como nova aba `backup_leads_AAAA-MM-DD`, com a MESMA credencial Google Sheets já existente. Sem
  necessidade de credencial nova.
- Retenção de 30 dias: lista as abas, identifica `backup_leads_*` mais antigas que 30 dias, exclui via
  `batchUpdate`/`deleteSheet`. Gate (`Tem Expirados?`) evita erro da API quando não há nada pra
  excluir (array de requests vazio).
- **Testado real:** guarda-schema rodou contra o cabeçalho real (60/60 colunas, sem alerta —
  esperado, acabamos de restaurar). Backup criou de fato `backup_leads_2026-07-10` (60 colunas, dados
  intactos), confirmado lendo a lista de abas depois.

## Decisão de guardrail mantida

R3 nunca escreve no HubSpot (só lê). R2 é estritamente aditivo no workflow de produção existente.
Nenhum node/coluna pré-existente foi removido ou renomeado em nenhum dos lotes.

## Pendências / não executado neste lote

- **R5 (governança):** registrar a planilha na DB "PHI — Fontes de Conhecimento" e o ADR de
  Contrato de Dados — não executado (não há MCP do Notion configurado para essa DB específica nesta
  sessão; requer ação manual ou brief separado).
- **Reconciliação de branch:** os arquivos-fonte do brief (`planilha-quantidade-leads-por-mes-colunas.md`,
  `planilha-leads-schema.json`) vivem na branch `claude/agentic-agency-planning-KwJEw`, não nesta.
  Quando as duas branches forem mergeadas, vale conferir que o schema JSON continua refletindo a
  realidade (ex.: nenhuma coluna nova foi adicionada por engano em paralelo).
- `Enriquecimento GBP e Site` (`5L3SyzDkZqf1N6vW`) permanece inativo e com uma referência quebrada
  (`$('Normalizar campos do lead')`) — não fizemos nada com ele; parece seguro arquivá-lo, mas isso
  não foi pedido neste lote.

## Âncoras

- Brief original: colado na conversa (não commitado como arquivo nesta branch).
- Workflow de produção editado (R2): `HubSpot - Atualizar status e disparar extracao` —
  `kED2AlXJjIYgvHXH`.
- Novo (R3): `Comercial - Sync HubSpot -> Planilha (loop de aprendizado)` — `WRFU2NM8rLJU7bRT`.
- Novo (R4): `Comercial - Guarda-Schema + Backup Planilha Leads` — `vUI0pPlDASf64Htn`.
- Data Tables novas: `gbp_sync_cursor` (`zPnW2B39G0ovWjpA`), `gbp_leads_schema_canonico`
  (`QIrDCkhppfc0FfOH`).
- Planilha: `1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM`, aba `leads` (gid 0).
