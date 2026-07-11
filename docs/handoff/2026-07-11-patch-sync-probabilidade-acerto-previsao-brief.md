# [BRIEF sub-chat] Patch do sync + backup off-file no Drive (Comercial)

> **Cole como 1ª mensagem.** Frente: Comercial. Runtime: **n8n** (MCP). **Dois lotes independentes**, ambos
> em produção: **Lote 1** — patch no Code node "Derivar Campos de Aprendizado" do sync
> `WRFU2NM8rLJU7bRT`. **Lote 2** — backup off-file no Google Drive no guarda-schema `vUI0pPlDASf64Htn`.
> Escopo estrito por lote (não tocar em nada além do descrito). Verificado por análise da execução real `16160`.

## Contexto (o que está errado)
O sync grava 2 campos incorretos na aba `leads` a cada 6h:
1. **`probabilidade`** = `hs_deal_stage_probability` cru → sai como float com lixo de precisão
   (`0.1000000000000000055511151231257827021181583404541015625`, 60 dígitos). É a probabilidade **do estágio**
   (Prospectado = 0,1), não do lead.
2. **`acerto_previsao`** dispara em deal **não pontuado/legado**: um deal de 2023 (`closedate` antes de
   `createdate`, `dias_no_funil = -63`, `potencial_comercial` ≈ 0) gerou um `"errou (baixo->venceu)"` **falso**.
   A fonte está OK — `potencial_comercial`/`oferta_recomendada`/`score_tecnico`/`ipc` **existem como propriedades
   do Deal no HubSpot** (o motor grava). O bug é o guard: `!== ''` deixa passar `0`.

## Lote 1 — Patch no nó "Derivar Campos de Aprendizado" (`WRFU2NM8rLJU7bRT`)
Escopo estrito: SÓ este Code node. No `jsCode`, dentro do `.map(...)`:

**a) probabilidade** — trocar
```js
probabilidade: p.hs_deal_stage_probability || '',
```
por (normaliza para inteiro 0–100, sem lixo de float):
```js
probabilidade: (p.hs_deal_stage_probability != null && p.hs_deal_stage_probability !== '')
  ? Math.round(Number(p.hs_deal_stage_probability) * 100) : '',
```

**b) acerto_previsao** — trocar o cálculo do potencial
```js
const temPotencial = p.potencial_comercial !== null && p.potencial_comercial !== undefined && p.potencial_comercial !== '';
const potencial = temPotencial ? Number(p.potencial_comercial) : NaN;
```
por (só pontua deal realmente scoreado; `0`/vazio/NaN = não pontuado → acerto fica `''`):
```js
const potencial = Number(p.potencial_comercial);
const temPotencial = Number.isFinite(potencial) && potencial > 0;
```

**c) dias_no_funil** — clampar negativo (dado legado com `closedate < createdate`): trocar
```js
const diasNoFunil = created ? Math.round((end.getTime() - created.getTime()) / 86400000) : '';
```
por
```js
let diasNoFunil = created ? Math.round((end.getTime() - created.getTime()) / 86400000) : '';
if (diasNoFunil !== '' && diasNoFunil < 0) diasNoFunil = '';
```

## Lote 2 — Backup OFF-FILE no Google Drive (`vUI0pPlDASf64Htn`)
**Problema:** hoje o backup duplica a aba `leads` na **mesma** planilha (`backup_leads_AAAA-MM-DD`) — protege
contra apagar COLUNA, mas não contra perder/corromper o ARQUIVO, e polui a planilha com N abas. **Já existe
credencial Google Drive no n8n:** `7YDwXhsbVGkrlV5p` (tipo `googleDriveOAuth2Api`, "Google Drive account").

**Mudança (adicionar ao guarda-schema, sem mexer no diff de schema/alerta Telegram):**
- Nó **Google Drive → Copy file**: copiar o arquivo inteiro `1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM`
  para uma pasta de backups, nome `backup_leads_AAAA-MM-DD`. Copiar o arquivo **todo** (não só a aba) preserva
  todas as abas + formatação = disaster recovery real. Credencial `7YDwXhsbVGkrlV5p`.
- **Pasta:** criar/usar uma pasta Drive "PHI - Backups Planilha Leads" (Drive node `create folder` na 1ª vez,
  ou confirmar com o Olavo um folderId existente) e guardar o `folderId`.
- **Retenção Drive 30 dias:** listar `backup_leads_*` na pasta → deletar os com data > 30 dias (gate para não
  chamar delete com lista vazia).
- **Reduzir o backup in-file para 7 dias** (restauração rápida) — o Drive passa a ser a cópia durável de 30 dias.
  Evita o bloat de 30 abas. (Remover o in-file de vez fica a critério do Olavo.)

## Método e guardrails
- n8n SDK: `get_sdk_reference` → editar → `validate_workflow` **antes** de publicar cada workflow.
- **Lote 1:** não alterar mapeamento do Google Sheets, cursor nem schedule. **Lote 2:** não alterar o diff de
  schema nem o alerta Telegram; só adicionar a cópia p/ Drive + retenção.
- HubSpot: continua **só leitura** (nenhuma escrita no CRM). Escrita no Drive só na pasta de backup.
- Manter os dois workflows **ativos** após publicar.

## Teste de aceitação
- **Lote 1:** rodar 1 execução **manual** do sync (upsert idempotente). No output do "Derivar Campos de
  Aprendizado": `probabilidade` = inteiro (ex.: `10`, `100`), sem decimais longos; deals `Aberto` seguem com
  `acerto_previsao=''`; nenhum deal não-pontuado com "errou/acertou"; `dias_no_funil` sem negativos. Conferir a
  linha 3 real na planilha depois: `probabilidade` legível.
- **Lote 2:** rodar 1 execução **manual** do guarda-schema → confirmar que surge `backup_leads_AAAA-MM-DD` **na
  pasta do Drive** (não só na planilha) e que a retenção não apaga nada < 30 dias.

## Âncoras
- Contrato de Dados (watch-items 2026-07-11): `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md` §5b.
- Workflow: `WRFU2NM8rLJU7bRT` · execução analisada: `16160` · nó: "Derivar Campos de Aprendizado".
