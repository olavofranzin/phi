# Onb - Cobrar Acessos Pos-Kickoff (A2.9)

## Status

DoD fechado em sandbox. Workflow entregue inativo e nao publicado em producao.

## Workflow sandbox

- Workflow ID: `Vqxb3G0KLeKerdCy`
- Nome: `Onb - Cobrar Acessos Pos-Kickoff`
- Estado: inativo
- Schedule: diario as 09:00 em `America/Sao_Paulo`

## Diagrama textual dos nodes

1. `[Onb A2.9] Schedule Trigger`
   - Dispara diariamente as 09:00 BR.
2. `[Onb A2.9] Buscar Etapas Kickoff Concluidas`
   - Le paginas do DB `PHI - Etapas de Onboarding`.
3. `[Onb A2.9] Filtrar Etapas Elegiveis`
   - Filtra a etapa `Conduzir call de kickoff e preencher ata`, `Status=Concluído`, `Observações` contendo `Acessos pendentes:`, sem `A2.9 disparada em`, com `Cliente` populado.
4. `[Onb A2.9] Extrair Acessos Pendentes`
   - Extrai por regex a lista apos `Acessos pendentes:` ate linha em branco ou EOF.
5. `[Onb A2.9] Obter Cliente da Etapa`
   - Le a pagina do cliente pela relation `Cliente`.
6. `[Onb A2.9] Montar Mensagem`
   - Monta mensagem notify-the-AM com a lista extraida de acessos.
7. `[Onb A2.9] Enviar Cobranca Evolution`
   - Envia WhatsApp via Evolution API com `continueOnFail=true`.
8. `[Onb A2.9] Preparar Update Observacoes`
   - Faz APPEND usando newline real `\n`, preservando texto anterior e adicionando `A2.9 disparada em ... Status Evolution: ok|falhou`.
9. `[Onb A2.9] Atualizar Observacoes Etapa`
   - Atualiza somente `Observações`. Nao altera `Status` nem `Cliente`.
10. `[Onb A2.9] Consolidar Resultado`
   - Consolida contagens e acessos extraidos.

## Credenciais referenciadas

- `Notion account` (`notionApi`)
- `Evolution API Header Auth` (`httpHeaderAuth`)

IDs de credenciais, URL Evolution e `OLAVO_PHONE` foram redigidos nos exports e logs.

## Simplificacao v1 / tech debt

O SOP descreve gatilho event-driven via ata estruturada pelo A2.8. Como A2.8 pertence ao Lote 2 e ainda nao existe, A2.9 v1 usa Schedule + regex em `Observações` preenchida manualmente. Quando A2.8 entrar, refatorar A2.9 para gatilho event-driven.

## Nota sobre OLAVO_PHONE

Assim como A2.5, o estado final exportado usa `$env.OLAVO_PHONE`, mas o runtime sandbox bloqueia `$env` em Code node. Para concluir o E2E, `OLAVO_PHONE` foi carregado do `.env` local e aplicado temporariamente; apos o teste, o workflow sandbox foi revertido para `$env.OLAVO_PHONE`. Checklist de promocao: habilitar env vars no runtime n8n ou provisionar mecanismo rotacionavel equivalente.

## Setup do dado de teste

Cliente: `Cliente Sandbox A2.1 Bugfix B` (`36db65e5-c72b-81cf-aa85-f011e36b15d1`).

Etapa modificada para teste: `Conduzir call de kickoff e preencher ata` (`36db65e5-c72b-816b-95c7-df37d49e658d`), sequencia 13.

Observações preparadas:

```text
Ata da kickoff registrada em 2026-05-28.
Acessos pendentes:
- Google Ads MCC
- Meta Business Manager
- GTM site cliente
```

Alteracoes mantidas para evidencia viva e cleanup futuro:

- `Status = Concluído`
- `Observações` com ata, acessos pendentes e append A2.9

## Teste E2E sandbox

| Execucao | Resultado |
| --- | --- |
| `exec_6801` | Processou 1 etapa elegivel. Extraiu os 3 acessos (`Google Ads MCC`, `Meta Business Manager`, `GTM site cliente`), enviou mensagem com a lista, Evolution falhou com degradacao graciosa e fez APPEND em `Observações` com newline real `\n`. `Status` permaneceu `Concluído`. |
| `exec_6802` | Reexecucao idempotente. O filtro retornou 0 etapas elegiveis porque `Observações` ja continha `A2.9 disparada em`. |

## Validação semântica via Notion API

Fetch direto da etapa `36db65e5-c72b-816b-95c7-df37d49e658d` apos `exec_6801`:

- HTTP status: `200`.
- Status PRESERVADO = "Concluído".
- Observações contem `Acessos pendentes:`: `true`.
- Observações contem lista intacta: `Google Ads MCC`, `Meta Business Manager`, `GTM site cliente`.
- Observações contem `A2.9 disparada em`: `true`.
- Observações final usa newline real, nao `<br>`.
- Cliente relation count: `1`.
- Cliente relation: `36db65e5-c72b-81cf-aa85-f011e36b15d1`.
- Cliente relation preservada: `true`.

## Resultado final

- Workflow exportado e sanitizado.
- Workflow permanece sandbox/inativo.
- A2.9 nao move `Status`.
- A2.9 faz APPEND em `Observações` com `\n`, nao `<br>`.
- Idempotencia validada pela string `A2.9 disparada em`.
- Cliente relation preservada via validação semântica da Notion API.
