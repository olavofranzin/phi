# Onb - Disparar CSAT NPS (A2.11)

## Status

DoD CLOSED em 2026-05-28. Workflow entregue em sandbox, inativo e nao publicado em producao.

## Workflow sandbox

- Workflow ID: `xoFU3G3xfEm0Zfjl`
- Nome: `Onb - Disparar CSAT NPS`
- Estado: inativo / sandbox-only
- Export: `workflow.json` e `sandbox_export.json` em UTF-8 sem BOM, sanitizados.

## Diagrama textual dos nodes

`[Onb A2.11] Schedule Trigger`
-> `[Onb A2.11] Buscar Clientes Concluidos`
-> `[Onb A2.11] Filtrar Clientes Elegiveis`
-> `[Onb A2.11] Montar Mensagem e Links`
-> `[Onb A2.11] Enviar via Evolution`
-> `[Onb A2.11] Preparar Update Observacoes`
-> `[Onb A2.11] Atualizar Observacoes Cliente`
-> `[Onb A2.11] Consolidar Resultado`

## Credenciais referenciadas

- `Phi Notion`: credencial Notion do n8n, ID sanitizado no export.
- `Evolution API`: credencial HTTP Header Auth do n8n, ID sanitizado no export.

## Config ADR-19

A2.11 usa injecao build-time de configuracao no workflow, porque `$env` nao funciona no runtime do n8n para este lote.

- `CSAT_FORM_URL`: sanitizado como `<CSAT_FORM_URL_redacted>` no commit.
- `NPS_FORM_URL`: sanitizado como `<NPS_FORM_URL_redacted>` no commit.
- `OLAVO_PHONE`: sanitizado como `<OLAVO_PHONE_redacted>` no commit.

Os links Typeform foram montados com fragmento (`#cliente=`), nao query string (`?cliente=`).

## Setup do teste E2E

Cliente sintetico criado no DB `PHI - Onboarding de Clientes`:

- Nome: `Cliente Sandbox A2.11 Test`
- Page ID: `36eb65e5-c72b-81b0-92d3-e70b4613e2a6`
- Status inicial: `Concluido`
- Observacoes iniciais: `Texto anterior A2.11 - preservar no append`

Esse cliente e dado sintetico de sandbox e deve entrar na limpeza final do lote antes de promocao a producao.

## Teste E2E sandbox

| Execucao | Arquivo | Resultado |
| --- | --- | --- |
| `6810` | `runs/exec_6810.json` | Encontrou 1 cliente elegivel, montou CSAT/NPS com `#cliente=`, Evolution retornou falha de servico, e o workflow seguiu com `continueOnFail`; Observacoes do cliente foram atualizadas com `Status Evolution: falhou`. |
| `6811` | `runs/exec_6811.json` | Idempotencia validada: 0 clientes elegiveis; o cliente ja continha `A2.11 disparada em` e nao foi reprocessado. |

## Validação semântica via Notion API

Fetch direto via Notion API do cliente `36eb65e5-c72b-81b0-92d3-e70b4613e2a6` apos `exec_6810`:

- Status PRESERVADO = "Concluído".
- `archived = false`.
- Observacoes preservaram o texto anterior: `Texto anterior A2.11 - preservar no append`.
- Observacoes contem `A2.11 disparada em 2026-05-28T15:04:56-03:00`.
- Observacoes contem `CSAT:` com `<CSAT_FORM_URL_redacted>#cliente=36eb65e5-c72b-81b0-92d3-e70b4613e2a6&cliente_nome=Cliente%20Sandbox%20A2.11%20Test`.
- Observacoes contem `NPS:` com `<NPS_FORM_URL_redacted>#cliente=36eb65e5-c72b-81b0-92d3-e70b4613e2a6&cliente_nome=Cliente%20Sandbox%20A2.11%20Test`.
- Observacoes contem `Status Evolution: falhou (erro sem status HTTP)`.
- Confirmado: nao contem `?cliente=`.
- Confirmado: nao contem `<br>`.

## Observacoes finais

- O workflow varre o DB de Clientes (`04e34a62624b484cbda546604564b88c`), nao o DB de Etapas.
- O filtro de elegibilidade exige `Status = Concluído`, pagina nao arquivada e ausencia de `A2.11 disparada em` nas Observacoes.
- O update atua somente em `Observações`; o Status do cliente nao e alterado.
- O workflow permanece inativo e nao foi publicado em producao.
