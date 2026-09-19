# Onb - Cobrar Form D+1 (A2.2)

## Status

DoD fechado. Workflow entregue em sandbox/inativo e sub-entrega pronta para aceite.

## Arquivos entregues

- `workflow.json`
- `sandbox_export.json`
- `runs/exec_6778.json`
- `runs/exec_6779.json`
- `tests.ps1`

## Workflow sandbox

- Workflow ID: `7lQ3AuNMtt4NXYZZ`
- Nome: `Onb - Cobrar Form D+1`
- Estado: inativo; nao publicado em producao
- Schedule configurado: diario as 09:00 em `America/Sao_Paulo`

## Diagrama textual dos nodes

1. `[Onb A2.2] Schedule Trigger`
   - Dispara o ciclo diario de cobranca.
2. `[Onb A2.2] Buscar Etapas Cobranca`
   - Le paginas do DB `PHI - Etapas de Onboarding`.
3. `[Onb A2.2] Filtrar Etapas Elegiveis`
   - Mantem apenas `Cobrar briefing nao respondido`, `Status=Pendente`, `Data prevista <= hoje`, com relation `Cliente` preenchida.
4. `[Onb A2.2] Obter Cliente da Etapa`
   - Le a pagina do cliente pela relation `Cliente`.
5. `[Onb A2.2] Montar Mensagem`
   - Descarta clientes fora dos status ativos e monta payload para Olavo.
6. `[Onb A2.2] Enviar Cobranca Evolution`
   - Envia WhatsApp via Evolution API com `continueOnFail=true`.
7. `[Onb A2.2] Preparar Update Etapa`
   - Define timestamp BR e `Status Evolution: ok|falhou`.
8. `[Onb A2.2] Atualizar Status Etapa`
   - Atualiza a etapa para `Status = "Em andamento"` e preenche `Observações`.
9. `[Onb A2.2] Consolidar Resultado`
   - Consolida contagens do processamento.

## Credenciais referenciadas

- `Notion account`
  - Tipo: `notionApi`
  - Uso: leitura de etapas, leitura de cliente e update da etapa.
- `Evolution API Header Auth`
  - Tipo: `httpHeaderAuth`
  - Uso: envio da cobranca para Olavo via Evolution API.

IDs de credenciais e segredos foram redigidos nos exports e logs.

## Licao obrigatoria herdada do A2.1

A2.2 nao altera relations, mas a validacao semantica inclui fetch via Notion API da etapa atualizada para confirmar que a relation `Cliente` permanece populada. Isso evita regressao do bug da A2.1, em que o sucesso sintatico do workflow nao garantia integridade semantica no banco.

## Teste E2E sandbox

Cliente usado: `Cliente Sandbox A2.1 Bugfix B` (`36db65e5-c72b-81cf-aa85-f011e36b15d1`).

Etapa usada: `Cobrar briefing nao respondido` (`36db65e5-c72b-81d6-8b29-de14ca93c420`).

| Execucao | Resultado |
| --- | --- |
| `exec_6778` | Processou 1 etapa elegivel. Evolution retornou falha, mas `continueOnFail=true` permitiu degradacao graciosa. Etapa atualizada para `Em andamento` com `Status Evolution: falhou`. |
| `exec_6779` | Reexecucao idempotente. O filtro encontrou 0 etapas elegiveis porque a etapa ja estava em `Em andamento`; nada foi reprocessado. |

## Validação semântica via Notion API

Fetch direto da pagina `36db65e5-c72b-81d6-8b29-de14ca93c420` apos `exec_6778`:

- HTTP status: `200`.
- Status = "Em andamento".
- Observações = `Cobrança A2.2 disparada em 2026-05-27T21:18:21-03:00. Status Evolution: falhou (erro sem status HTTP).`
- Cliente relation count: `1`.
- Cliente relation: `36db65e5-c72b-81cf-aa85-f011e36b15d1`.
- Cliente relation continua populada: `true`.

## Resultado final

- Workflow exportado e sanitizado.
- Workflow permanece sandbox/inativo.
- Notificacao Evolution usa caminho de degradacao graciosa.
- Idempotencia validada por reexecucao.
- Relation `Cliente` validada via Notion API apos update da etapa.
