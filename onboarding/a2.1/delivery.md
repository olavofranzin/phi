# Onb - Briefing to Client (A2.1)

## Status

DoD CLOSED.

## Arquivos entregues

- `workflow.json`
- `sandbox_export.json`
- `test_payload.json`
- `tests.ps1`
- `runs/exec_6715.json`
- `runs/exec_6716.json`
- `runs/exec_6719.json`
- `runs/exec_6738.json`
- `runs/exec_6739.json`
- `runs/exec_6769.json`
- `runs/exec_6770.json`
- `cleanup_synthetic_clients.ps1`

## Diagrama textual dos nodes

1. `[Onb A2.1] Webhook Briefing`
   - Recebe `POST` com o payload do Google Form.
2. `[Onb A2.1] Validar Payload`
   - Valida obrigatórios do v1 e o contrato mínimo.
3. `[Onb A2.1] Payload Valido?`
   - Se inválido, desvia para resposta `400`.
4. `[Onb A2.1] Responder 400`
   - Retorna erro ao caller sem tocar Notion.
5. `[Onb A2.1] Normalizar Contexto`
   - Normaliza nome, CNPJ, email e serviço.
6. `[Onb A2.1] Buscar Clientes Ativos`
   - Lê `PHI - Onboarding de Clientes`.
7. `[Onb A2.1] Detectar Duplicidade`
   - Compara onboarding ativo por nome normalizado.
8. `[Onb A2.1] Duplicado?`
   - Se houver onboarding ativo, segue para notificação e `409`.
9. `[Onb A2.1] Notificar Duplicidade Olavo`
   - Tenta alertar via Evolution API.
   - Usa `continueOnFail` para não bloquear a resposta HTTP ao webhook.
10. `[Onb A2.1] Responder 409`
    - Retorna conflito para duplicidade.
11. `[Onb A2.1] Buscar Usuarios Workspace`
    - Lista usuários do workspace Notion.
12. `[Onb A2.1] Resolver Responsavel Geral`
    - Faz match do email com usuário existente.
13. `[Onb A2.1] Criar Cliente`
    - Cria página em `PHI - Onboarding de Clientes`.
14. `[Onb A2.1] Ler Etapas A1`
    - No export final de sandbox, carrega o dataset embarcado das 31 etapas.
15. `[Onb A2.1] Binario para JSON Etapas`
    - No export final de sandbox, repassa os itens para o próximo node.
16. `[Onb A2.1] Montar Itens Etapas`
    - Gera as 31 etapas com `Data prevista = data_inicio + prazo_dias`.
    - O node assume `data_inicio` como date-only sem timezone e soma dias em UTC intencionalmente.
17. `[Onb A2.1] Criar Etapa`
    - Cria páginas em `PHI - Etapas de Onboarding` com relation para o cliente.
18. `[Onb A2.1] Consolidar Resultado`
    - Conta sucessos e falhas.
19. `[Onb A2.1] Falha Parcial Etapas?`
    - Se houver falha parcial, segue para bloqueio do cliente.
20. `[Onb A2.1] Atualizar Cliente Bloqueado`
    - Marca `Status=Bloqueado` e preenche `Bloqueios ativos`.
21. `[Onb A2.1] Notificar Falha Etapas Olavo`
    - Tenta alertar via Evolution API.
    - Usa `continueOnFail` para não bloquear a resposta HTTP ao webhook.
22. `[Onb A2.1] Responder 201`
    - Retorna resumo da execução ao caller.

## Credenciais referenciadas

- `Notion account`
  - Tipo esperado: `notionApi`
  - Uso: leitura de clientes, leitura de usuários, criação e atualização de páginas.
- `Evolution API Header Auth`
  - Tipo esperado: `httpHeaderAuth`
  - Uso: notificações internas para Olavo.

## Correção de IDs dos DBs Notion

Durante o retest, os IDs originais do brief não responderam no sandbox. A correção foi aplicada em:

- `workflow.json`
- `sandbox_export.json`
- workflow live do sandbox `0MfPA3Uqmj4TySiX`

IDs validados no sandbox:

- `PHI - Onboarding de Clientes`: `04e34a62624b484cbda546604564b88c`
- `PHI - Etapas de Onboarding`: `6eb4565b4f1d498c8b2978e0c80880fd`

## Tech debt registrado

- `[Onb A2.1] Buscar Clientes Ativos` usa `filterType:none` e faz filtro client-side por nome/status.
- O export final de sandbox embarca o dataset das 31 etapas dentro do workflow, porque o filesystem disponível ao n8n self-hosted não expôs o path esperado do repo durante o retest.

## Validação E2E em sandbox

Status: concluída com DoD fechado.

Workflow sandbox:

- Workflow ID: `0MfPA3Uqmj4TySiX`
- Nome: `Onb - Briefing to Client`
- Estado final: `inactive`

Evidências finais:

- `runs/exec_6738.json`
- `runs/exec_6739.json`
- `sandbox_export.json`

### POST 1

- Timestamp: `2026-05-26T23:22:13Z`
- Execução: `6738`
- Cliente de teste: `Cliente Sandbox A2.1 Retest E`
- HTTP observado pelo caller: `201`
- `cliente_page_id`: `36cb65e5-c72b-8105-9cd2-f37366abfdff`
- Resultado do workflow:
  - `etapas_criadas = 31`
  - `etapas_esperadas = 31`
  - `workflow_status = ok`

Confirmação operacional:

- 1 página de cliente criada no DB de onboarding.
- 31 páginas de etapa criadas no DB de etapas.
- Relation `Cliente` preenchida nas etapas.
- Datas previstas calculadas a partir de `data_inicio + prazo_dias`.

### POST 2

- Timestamp: `2026-05-26T23:22:58Z`
- Execução: `6739`
- Mesmo `cliente_nome` do POST 1
- HTTP observado pelo caller: `409`

Confirmação operacional:

- A regra de duplicidade por nome foi acionada.
- O segundo POST não criou novo onboarding.
- O webhook externo recebeu `409` mesmo com falha na notificação interna.

## Evolution API status

No momento do retest final, a instância `Whats Business` da Evolution API continuava indisponível server-side.

Diagnóstico isolado:

- A credencial do n8n enviou corretamente o header `Apikey`.
- A chamada direta para a Evolution API fora do n8n também retornou `HTTP 500`.
- Um payload mínimo também retornou `HTTP 500`.

Conclusão:

- O problema era da Evolution API, não do node n8n nem do payload de duplicidade.
- O ajuste de resiliência com `continueOnFail` nos nodes de notificação garantiu que a falha de notificação não bloqueasse a resposta `409` ao webhook externo.
- Olavo está investigando a Evolution em paralelo.

## Limpeza dos dados sintéticos

Não executei limpeza dos clientes sintéticos antes do fechamento desta entrega.

Ficaram registrados no ambiente de sandbox/Notion os clientes usados nas rodadas intermediárias e finais (`Retest C`, `Retest E` e variantes de diagnóstico). Se necessário, a limpeza pode ser feita manualmente depois da revisão dos logs.

## Bugfix 2026-05-27 - relation Cliente

O aceite de A2.1 foi revogado no mesmo dia porque o cleanup em dry-run retornou `0` etapas para clientes sintéticos que tinham etapas criadas no DB. A validação via Notion API confirmou a causa raiz: as páginas de etapa existiam, mas a property `Cliente` não estava populada.

Diagnóstico:

- H1 descartada: em `runs/exec_6738.json`, `[Onb A2.1] Criar Cliente` retornou `id` no top-level e `[Onb A2.1] Montar Itens Etapas` propagou `cliente_page_id` corretamente para 31 itens.
- H2 confirmada: o node Notion v2.2 estava configurado com `relationValues`, parâmetro ignorado pelo node. A primeira tentativa com `relationValue` string falhou com `value.relationValue.filter is not a function`, confirmando que o runtime espera array.
- Correção aplicada: `Cliente|relation` passou para `relationValue: ={{ [$json.cliente_page_id] }}`.
- Guarda defensiva adicionada em `[Onb A2.1] Montar Itens Etapas`: se `cliente.id` estiver ausente, o workflow falha antes de criar etapas órfãs.

Evidências do reteste sandbox:

- Execução `6769`: `Cliente Sandbox A2.1 Bugfix B`, `cliente_page_id = 36db65e5-c72b-81cf-aa85-f011e36b15d1`, `etapas_criadas = 31`, `etapas_esperadas = 31`, `workflow_status = ok`.
- Validação Notion API por query no DB de Etapas: `31` páginas retornaram com `Cliente contains 36db65e5-c72b-81cf-aa85-f011e36b15d1`.
- Fetch paginado da property `Total de etapas` no cliente: `rollup.number = 31`. O fetch simples de página mostrou `25` porque a relation `Etapas de Onboarding` veio paginada com `has_more = true`.
- Fetch da etapa `36db65e5-c72b-8179-be81-ec64dafc7a28` (`Receber handoff do Comercial`): property `Cliente` presente com `Count = 1` e ID `36db65e5-c72b-81cf-aa85-f011e36b15d1`.
- Execução `6770`: POST 2 de duplicidade retornou `409`; `has_duplicate = true`, `duplicate_page_id = 36db65e5-c72b-81cf-aa85-f011e36b15d1`, `duplicate_status = Em andamento`.

Arquivos atualizados:

- `workflow.json`
- `sandbox_export.json`
- `runs/exec_6769.json`
- `runs/exec_6770.json`

## Cleanup 2026-05-27 - sandbox synthetic archived

Cleanup real executado após aprovação do Cérebro. O cliente `Cliente Sandbox A2.1 Bugfix B` (`36db65e5-c72b-81cf-aa85-f011e36b15d1`) foi preservado como evidência viva do bugfix, junto com suas 31 etapas vinculadas.

Tabela final:

| Alvo | Page ID | Itens arquivados | Status |
| --- | --- | ---: | --- |
| Cliente Sandbox A2.1 Retest | `36cb65e5-c72b-8161-bbf0-da0a4416e2aa` | 1 cliente | archived |
| Cliente Sandbox A2.1 Retest B | `36cb65e5-c72b-818b-ae4d-ee918908d49e` | 1 cliente | archived |
| Cliente Sandbox A2.1 Retest C | `36cb65e5-c72b-814c-808d-dd142f112a1e` | 1 cliente | archived |
| Cliente Sandbox A2.1 Retest E | `36cb65e5-c72b-8105-9cd2-f37366abfdff` | 1 cliente | archived |
| Etapas orfas conhecidas A2.1 | filtro `created_time >= 2026-05-26`, `Status = Pendente`, nome em `etapas-a1.json`, relation `Cliente` vazia | 62 etapas | archived |

Validação pós-cleanup via Notion API:

- Os 4 clientes Retest retornaram `archived = true`.
- Filtro de candidatas após cleanup: `ActiveKnownPending = 31`, `ActiveOrphans = 0`, `ActiveLinked = 31`.
- `Cliente Sandbox A2.1 Bugfix B` retornou `archived = false`.
- Query no DB de Etapas com `Cliente contains 36db65e5-c72b-81cf-aa85-f011e36b15d1` retornou `31` etapas.

## Teste estrutural local

Comando:

```powershell
powershell -ExecutionPolicy Bypass -File C:\tmp\phi_repo\onboarding\a2.1\tests.ps1
```

Resultado esperado:

```text
Onboarding briefing workflow structural tests passed.
```
