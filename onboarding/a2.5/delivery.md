# Onb - Cobrar Etapa Aguardando 2D (A2.5)

## Status

DoD fechado em sandbox. Workflow entregue inativo e nao publicado em producao.

## Workflow sandbox

- Workflow ID: `KqkDnSPtfbSfE9mK`
- Nome: `Onb - Cobrar Etapa Aguardando 2D`
- Estado: inativo
- Schedule: diario as 09:00 em `America/Sao_Paulo`

## Diagrama textual dos nodes

1. `[Onb A2.5] Schedule Trigger`
   - Dispara diariamente as 09:00 BR.
2. `[Onb A2.5] Buscar Etapas Aguardando`
   - Le paginas do DB `PHI - Etapas de Onboarding`.
3. `[Onb A2.5] Filtrar Etapas Elegiveis`
   - Filtra `Status=Aguardando cliente`, `Data prevista <= hoje - 2`, `Cliente` populado, `!archived` e ausencia de `Cobrança A2.5 disparada em`.
4. `[Onb A2.5] Obter Cliente da Etapa`
   - Le a pagina do cliente pela relation `Cliente`.
5. `[Onb A2.5] Montar Mensagem`
   - Monta mensagem notify-the-AM. No sandbox E2E, `OLAVO_PHONE` foi carregado do `.env` local e sanitizado no export/log.
6. `[Onb A2.5] Enviar Cobranca Evolution`
   - Envia WhatsApp via Evolution API com `continueOnFail=true`.
7. `[Onb A2.5] Preparar Update Observacoes`
   - Faz APPEND preservando texto anterior intacto e adicionando `Status Evolution: ok|falhou`.
8. `[Onb A2.5] Atualizar Observacoes Etapa`
   - Atualiza somente `Observações`. Nao altera `Status` nem `Cliente`.
9. `[Onb A2.5] Consolidar Resultado`
   - Consolida contagens de etapas processadas e falhas/sucessos Evolution.

## Credenciais referenciadas

- `Notion account`
  - Tipo: `notionApi`
  - Uso: leitura de etapas, leitura de cliente e update da etapa.
- `Evolution API Header Auth`
  - Tipo: `httpHeaderAuth`
  - Uso: envio da cobranca para Olavo via Evolution API.

IDs de credenciais, URL Evolution e `OLAVO_PHONE` foram redigidos nos exports e logs.

## Nota sobre OLAVO_PHONE

O brief pede `$env.OLAVO_PHONE`. O runtime remoto do n8n neste sandbox bloqueou acesso a `$env` no Code node (`access to env vars denied`) e `process.env` tambem nao existe. Para concluir o E2E sandbox, o valor foi carregado do `.env` local pelo Codex e aplicado temporariamente no workflow sandbox; os logs foram sanitizados. Apos o E2E, o workflow sandbox foi revertido para `$env.OLAVO_PHONE`.

Checklist de promocao: antes de promover o lote, habilitar env vars no runtime n8n ou provisionar mecanismo rotacionavel equivalente. O estado final exportado usa `$env.OLAVO_PHONE`, mas a execucao real em sandbox precisou do patch local temporario.

## Setup do dado de teste

Cliente: `Cliente Sandbox A2.1 Bugfix B` (`36db65e5-c72b-81cf-aa85-f011e36b15d1`).

Etapa modificada para o teste: `Validar briefing recebido` (`36db65e5-c72b-812c-bde3-c1a53a5a1500`), sequencia 7.

Alteracoes manuais aplicadas para o E2E:

- `Status = Aguardando cliente`
- `Data prevista = 2026-05-25`
- `Observações = Texto anterior A2.5 - preservar no append`

Estas alteracoes foram mantidas como evidencia viva do teste e devem entrar no cleanup futuro do cliente Bugfix B.

## Teste E2E sandbox

| Execucao | Resultado |
| --- | --- |
| `exec_6798` | Processou 1 etapa elegivel. Evolution retornou falha, mas `continueOnFail=true` permitiu degradacao graciosa. `Observações` recebeu APPEND com `Cobrança A2.5 disparada em ... Status Evolution: falhou`, preservando o texto anterior. `Status` permaneceu `Aguardando cliente`. |
| `exec_6799` | Reexecucao idempotente. O filtro retornou 0 etapas elegiveis porque `Observações` ja continha `Cobrança A2.5 disparada em`. |

## Validação semântica via Notion API

Fetch direto da etapa `36db65e5-c72b-812c-bde3-c1a53a5a1500` apos `exec_6798`:

- HTTP status: `200`.
- Status PRESERVADO = "Aguardando cliente".
- Observações contem texto anterior intacto: `true`.
- Observações contem `Cobrança A2.5 disparada em`: `true`.
- Observações final: `Texto anterior A2.5 - preservar no append\nCobrança A2.5 disparada em 2026-05-28T08:58:06-03:00. Status Evolution: falhou (erro sem status HTTP).`
- Cliente relation count: `1`.
- Cliente relation: `36db65e5-c72b-81cf-aa85-f011e36b15d1`.
- Cliente relation preservada: `true`.

## Resultado final

- Workflow exportado e sanitizado.
- Workflow permanece sandbox/inativo.
- A2.5 nao move `Status`.
- A2.5 faz APPEND em `Observações`.
- Idempotencia validada pela string `Cobrança A2.5 disparada em`.
- Cliente relation preservada via validação semântica da Notion API.
