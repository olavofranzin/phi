# Execution log — Patch do sync (probabilidade/acerto_previsao) + backup off-file no Drive

> Executa `[BRIEF sub-chat] Patch do sync + backup off-file no Drive (Comercial)`, escrito na
> branch `claude/agentic-agency-planning-KwJEw`, executado nesta sessão/branch por já ter o
> contexto vivo dos workflows `WRFU2NM8rLJU7bRT` e `vUI0pPlDASf64Htn`.

## Lote 1 — Patch no nó "Derivar Campos de Aprendizado" (`WRFU2NM8rLJU7bRT`)

Escopo estrito: só o Code node, como pedido.

- **`probabilidade`**: era `hs_deal_stage_probability` cru (float com lixo de precisão, ex.:
  `0.1000000000000000055511151231257827021181583404541015625`). Agora normalizado para inteiro
  0–100 (`Math.round(Number(...) * 100)`).
- **`acerto_previsao`**: o guard `!== ''` deixava passar `potencial_comercial = 0` como "pontuado",
  gerando falso positivo em deals legados/não pontuados. Trocado para
  `Number.isFinite(potencial) && potencial > 0`.
- **`dias_no_funil`**: clampado para `''` quando negativo (dado legado com `closedate < createdate`).

**Publicado** (a edição de draft não reativa sozinha — é preciso `publish_workflow` depois de
`update_workflow`, lição já conhecida mas fácil de esquecer). **Testado com dado real**: resetei
o cursor via `test_workflow` (pin em "Ler Cursor Atual") pra forçar reprocessar os mesmos deals já
sincronizados — idempotente, sem duplicar linha. Confirmado no deal legado `12850337977`
(fechado 2023, `closedate` antes de `createdate`): antes `dias_no_funil=-63`,
`acerto_previsao="errou (baixo->venceu)"` (falso); depois `dias_no_funil=""`,
`acerto_previsao=""`, `probabilidade=100` (inteiro limpo). Escrita na planilha confirmada
(execução chegou até "Atualizar Cursor").

## Lote 2 — Backup off-file no Google Drive (`vUI0pPlDASf64Htn`)

Motivo: o backup in-file (duplicar aba na mesma planilha) protege contra apagar coluna, mas não
contra perder/corromper o arquivo inteiro, e acumula abas indefinidamente.

- Credencial `Google Drive account` (`7YDwXhsbVGkrlV5p`, `googleDriveOAuth2Api`) já existia no
  cofre n8n — não precisou criar nada novo.
- **Pasta criada:** "PHI - Backups Planilha Leads" (Drive, id `18FuTQi_CLfFN5AjMTXufr8srczSXddhO`)
  — não existia ainda, criada via `n8n-nodes-base.googleDrive` (`folder`/`create`).
- **3 nodes novos** no guarda-schema, em paralelo ao branch de schema-diff e ao branch in-file
  (mesmo Schedule Trigger, 3 branches independentes agora):
  - `Backup Drive: Copiar arquivo inteiro` — `googleDrive` `file`/`copy` do arquivo completo da
    planilha (`1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM`) pra dentro da pasta, nome
    `backup_leads_AAAA-MM-DD`. Copia dados + formatação + todas as abas (disaster recovery real).
  - `Listar Backups no Drive (retencao)` — `fileFolder`/`search` por nome (`backup_leads_`) dentro
    da pasta.
  - `Calcular Backups Drive Expirados (>30d)` (Code) — filtra por nome/data, retenção 30 dias.
  - `Excluir Backups Drive Expirados` — `file`/`deleteFile` (move pra lixeira, não permanente) por
    item; roda 0 vezes quando não há expirado (zero-item safety, sem precisar de gate extra, ao
    contrário do batchUpdate do Sheets que exige array não-vazio).
- **Retenção in-file reduzida de 30 para 7 dias** (`Calcular Backups Expirados In-File (>7d)`,
  renomeado) — Drive passa a ser a cópia durável de 30 dias, evitando acúmulo de abas na planilha.
- **Correção de robustez pega no teste:** o node de backup in-file (`Backup: Duplicar Aba leads`)
  falhava com "já existe uma aba com esse nome" ao rodar duas vezes no mesmo dia (esperado em
  teste manual) — e por padrão isso **travava a execução inteira**, impedindo o branch do Drive
  (independente) de rodar. Setei `onError: continueRegularOutput` nesse node — uma falha ali não
  deve impedir o backup no Drive de acontecer.
- **Testado real:** rodou com sucesso — `Backup Drive: Copiar arquivo inteiro` criou o arquivo
  `backup_leads_2026-07-11` na pasta do Drive (confirmado por `id` retornado), listagem encontrou
  1 backup, retenção não encontrou nada expirado (esperado, arquivo de hoje).

## Guardrails mantidos

Nenhuma mudança no diff de schema nem no alerta Telegram (Lote 2). Nenhuma mudança no mapeamento
Google Sheets, cursor ou schedule do sync (Lote 1). HubSpot continua só leitura. Ambos os
workflows seguem **ativos** após publicar.

## Âncoras

- Brief: `docs/handoff/2026-07-11-patch-sync-probabilidade-acerto-previsao-brief.md` (branch
  `claude/agentic-agency-planning-KwJEw`).
- Workflows: `WRFU2NM8rLJU7bRT` (sync), `vUI0pPlDASf64Htn` (guarda-schema + backup).
- Pasta Drive: `PHI - Backups Planilha Leads` — `18FuTQi_CLfFN5AjMTXufr8srczSXddhO`.
