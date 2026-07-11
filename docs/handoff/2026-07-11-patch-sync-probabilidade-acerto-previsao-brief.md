# [BRIEF sub-chat] Patch — 2 correções no loop de sync (probabilidade + acerto_previsao)

> **Cole como 1ª mensagem.** Frente: Comercial. Runtime: **n8n** (MCP). Alvo: **1 nó** do workflow
> **`Comercial - Sync HubSpot -> Planilha (loop de aprendizado)`** (`WRFU2NM8rLJU7bRT`, ativo, 6h).
> **Escopo estrito:** editar SÓ o Code node **"Derivar Campos de Aprendizado"**. Nada mais. Não tocar em
> outros nós, no schedule, nem no upsert. Verificado por análise da execução real `16160` (13 deals).

## Contexto (o que está errado)
O sync grava 2 campos incorretos na aba `leads` a cada 6h:
1. **`probabilidade`** = `hs_deal_stage_probability` cru → sai como float com lixo de precisão
   (`0.1000000000000000055511151231257827021181583404541015625`, 60 dígitos). É a probabilidade **do estágio**
   (Prospectado = 0,1), não do lead.
2. **`acerto_previsao`** dispara em deal **não pontuado/legado**: um deal de 2023 (`closedate` antes de
   `createdate`, `dias_no_funil = -63`, `potencial_comercial` ≈ 0) gerou um `"errou (baixo->venceu)"` **falso**.
   A fonte está OK — `potencial_comercial`/`oferta_recomendada`/`score_tecnico`/`ipc` **existem como propriedades
   do Deal no HubSpot** (o motor grava). O bug é o guard: `!== ''` deixa passar `0`.

## Patch (no node "Derivar Campos de Aprendizado")
No `jsCode`, dentro do `.map(...)`:

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

## Método e guardrails
- n8n SDK: `get_sdk_reference` → editar só o Code node → `validate_workflow` **antes** de publicar.
- **Não** alterar o mapeamento do Google Sheets (as colunas já existem), nem o cursor, nem o schedule.
- HubSpot: continua **só leitura** (nenhuma escrita no CRM).
- Manter o workflow **ativo** após publicar.

## Teste de aceitação
- Rodar 1 execução **manual** (`executionMode: manual`) — não avança nada de errado (upsert idempotente).
- No output do node "Derivar Campos de Aprendizado": `probabilidade` = inteiro (ex.: `10`, `100`), sem
  decimais longos; deals `Aberto` seguem com `acerto_previsao=''`; nenhum deal não-pontuado com "errou/acertou";
  `dias_no_funil` sem negativos.
- Conferir 1 linha real na planilha (ex.: linha 3) depois do run: `probabilidade` legível.

## Âncoras
- Contrato de Dados (watch-items 2026-07-11): `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md` §5b.
- Workflow: `WRFU2NM8rLJU7bRT` · execução analisada: `16160` · nó: "Derivar Campos de Aprendizado".
